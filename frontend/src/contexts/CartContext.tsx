import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import api from '@/lib/axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  weight: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  markCartConverted: () => Promise<void>;  // ✅ NEW — call after successful order
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = 'fow_cart';

// ─── How long to debounce the sync call (ms) ─────────────────────────────────
// Prevents spamming the backend on every keystroke / rapid add
const SYNC_DEBOUNCE_MS = 2000;

// ─── Provider ────────────────────────────────────────────────────────────────

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded]   = useState(false);

  // Debounce timer ref — so we don't fire a sync on every single add
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load from localStorage ──────────────────────────────────────────────
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_KEY);
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error loading cart:', e);
        localStorage.removeItem(CART_KEY);
      }
    }
    setIsLoaded(true);
  }, []);

  // ── Save to localStorage + sync to backend ──────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;

    // Always persist locally
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));

    // Debounced backend sync (only for logged-in users)
    if (syncTimer.current) clearTimeout(syncTimer.current);

    syncTimer.current = setTimeout(() => {
      syncCartToBackend(cartItems);
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [cartItems, isLoaded]);

  // ── Sync across tabs ────────────────────────────────────────────────────
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CART_KEY && e.newValue) {
        try {
          setCartItems(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Error syncing cart:', error);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ── Backend sync helper ─────────────────────────────────────────────────
  const syncCartToBackend = async (items: CartItem[]) => {
    // Only sync if user is authenticated (token exists)
    const token = localStorage.getItem('access');
    if (!token) return;

    const totalItems  = items.reduce((s, i) => s + i.quantity, 0);
    const totalAmount = items.reduce((s, i) => s + i.price * i.quantity, 0);

    try {
      await api.post('auth/cart/sync/', {
        items: items.map(i => ({
          id:       i.id,
          name:     i.name,
          price:    i.price,
          quantity: i.quantity,
          image:    i.image    || '',
          category: i.category || '',
        })),
        total_items:  totalItems,
        total_amount: parseFloat(totalAmount.toFixed(2)),
      });
    } catch (err) {
      // Silently fail — cart sync is best-effort, not critical
      console.warn('Cart sync failed (non-critical):', err);
    }
  };

  // ── Mark cart as converted (call after successful payment) ──────────────
  const markCartConverted = async () => {
    const token = localStorage.getItem('access');
    if (!token) return;

    try {
      await api.post('auth/cart/convert/');
    } catch (err) {
      console.warn('Cart convert call failed (non-critical):', err);
    }
  };

  // ── Cart operations ─────────────────────────────────────────────────────

  const addToCart = (item: MenuItem) => {
    setCartItems(prev => {
      const existingItem = prev.find(i => i.id === item.id);
      if (existingItem) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems(prev =>
      prev.map(item => item.id === id ? { ...item, quantity } : item)
    );
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem(CART_KEY);
    // Immediately sync the empty cart (no debounce needed)
    const token = localStorage.getItem('access');
    if (token) {
      api.post('auth/cart/sync/', {
        items: [],
        total_items: 0,
        total_amount: 0,
      }).catch(() => {}); // silent fail
    }
  };

  const getTotalItems = () =>
    cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const getTotalPrice = () =>
    cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        markCartConverted,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  is_staff?: boolean;
  // createdAt: string;
}

// Address type
export interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault?: boolean;
}

// Order types
export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentId?: string;
  deliveryAddress: Address;
  orderNotes?: string;
  createdAt: string;
  updatedAt: string;
}

import { useEffect, useState } from "react";
import axios from "axios";
import { cn } from "@/lib/utils";
import {
  Fish, Carrot, Beef, Wheat, Coffee, Apple, Egg,
  Salad, Soup, Sandwich, IceCream, ShoppingBasket,
  Milk, Flame, Leaf, Cookie, Pizza, Grape, Cherry,
  Citrus, Banana, Nut, Corn, Bean, LeafyGreen,       // Lettuce / leafy veg / cabbage
  Utensils,         // General food / restaurant
  UtensilsCrossed,  // No food / diet
  ChefHat,          // Chef / cooking
  CookingPot,       // Curries / stews / hot dishes
  Drumstick,        // Chicken / poultry
  Croissant,        // Bakery / bread
  Candy,            // Sweets / confectionery
  CandyOff,         // Sugar-free
  Wine,             // Alcohol / beverages
  Beer,             // Beer / beverages
  GlassWater,       // Water / hydration
  CupSoda,          // Soft drinks / beverages
  Martini,          // Cocktails / beverages (if available)
  Popcorn,          // Snacks
  Lollipop,         // Candy / kids
  Ham,              // Deli / cured meats
  Pipette,          // Oils / liquids
  Droplets,         // Oils / sauces / liquids
  ShoppingCart,     // General groceries
  Package,          // Packaged goods / dry food
  Box,              // Pantry / packaged items
  Sparkles,         // Premium / organic
  Star,             // Featured / bestsellers
  Tag,              // Offers / deals type LucideIcon,
  type LucideIcon,
} from "lucide-react";

/* ================================
   ICON MAP — string → Lucide component
   Add more as needed from your admin
================================ */
const ICON_MAP: Record<string, LucideIcon> = {
  Fish,
  Carrot,
  Beef,
  Wheat,
  Coffee,
  Apple,
  Egg,
  Salad,
  Soup,
  Sandwich,
  IceCream,
  ShoppingBasket,
  Milk,
  Flame,
  Leaf,
  Cookie,
  Pizza,
  Grape,
  Cherry,
  Citrus,
  Banana,
  Nut,
  Corn,
  Bean,
};

/* ================================
   TYPES
================================ */
interface Subcategory {
  id: number;
  name: string;
  slug: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;           // Lucide icon name from backend e.g. "Fish"
  subcategories: Subcategory[];
}

interface CategoryTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const API_URL = "https://api.asianbasket.ie/api/auth/categories/";

/* ================================
   SKELETON TAB
================================ */
const TabSkeleton = () => (
  <div className="flex items-center gap-2 py-4">
    <div className="w-4 h-4 rounded bg-gray-200 animate-pulse" />
    <div className="w-16 h-3 rounded bg-gray-200 animate-pulse" />
  </div>
);

/* ================================
   COMPONENT
================================ */
const CategoryTabs = ({ activeTab, setActiveTab }: CategoryTabsProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    axios
      .get(API_URL)
      .then((res) => {
        if (Array.isArray(res.data)) setCategories(res.data);
      })
      .catch((err) => console.error("CategoryTabs API error:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white sticky top-[60px] md:top-[132px] z-30 shadow-sm border-b border-border mb-8 overflow-x-auto scrollbar-hide">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1 md:gap-2 min-w-max">

          {/* ── ALL TAB ── */}
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-3 md:py-4 border-b-2 text-xs md:text-sm font-bold transition-all whitespace-nowrap",
              activeTab === "all"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {/* ShoppingBasket as default "All" icon */}
            <ShoppingBasket className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
            <span>All</span>
          </button>

          {/* ── LOADING SKELETONS ── */}
          {loading && (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="px-3">
                  <TabSkeleton />
                </div>
              ))}
            </>
          )}

          {/* ── DYNAMIC CATEGORY TABS ── */}
          {!loading && categories.map((category) => {
            // Resolve icon — fallback to ShoppingBasket if not found or empty
            const IconComponent: LucideIcon =
              category.icon && ICON_MAP[category.icon]
                ? ICON_MAP[category.icon]
                : ShoppingBasket;

            const isActive = activeTab === category.slug;

            return (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.slug)}
                className={cn(
                  // Stack icon + label vertically on mobile, row on desktop
                  "flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-3 md:py-4 border-b-2 text-xs md:text-sm font-bold transition-all whitespace-nowrap",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <IconComponent
                  className={cn(
                    "w-4 h-4 md:w-5 md:h-5 shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span>{category.name}</span>
              </button>
            );
          })}

        </div>
      </div>
    </div>
  );
};

export default CategoryTabs;

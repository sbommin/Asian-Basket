import { useEffect, useState } from "react";
import axios from "axios";
import { cn } from "@/lib/utils";
import {
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
  ShoppingCart,
  Milk,
  Flame,
  Leaf,
  Cookie,
  Pizza,
  Grape,
  Cherry,
  Bean,
  Utensils,
  UtensilsCrossed,
  ChefHat,
  CookingPot,
  Croissant,
  Candy,
  Wine,
  Beer,
  GlassWater,
  Droplets,
  Package,
  Box,
  Sparkles,
  Star,
  Tag,
  type LucideIcon,
} from "lucide-react";

/* ================================
   ICON MAP — admin types exact key
================================ */
const ICON_MAP: Record<string, LucideIcon> = {
  // Proteins
  Fish,
  Beef,
  Egg,

  // Vegetables & Fruits
  Carrot,
  Apple,
  Salad,
  Grape,
  Cherry,
  Bean,
  Leaf,

  // Grains & Pantry
  Wheat,
  Package,
  Box,

  // Dairy
  Milk,

  // Cooked / Ready Food
  Soup,
  Sandwich,
  Pizza,
  Croissant,
  CookingPot,
  Utensils,
  UtensilsCrossed,
  ChefHat,
  Flame,

  // Snacks & Sweets
  Cookie,
  IceCream,
  Candy,

  // Beverages
  Coffee,
  Wine,
  Beer,
  GlassWater,

  // Oils & Sauces
  Droplets,

  // General / Misc
  ShoppingBasket,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
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

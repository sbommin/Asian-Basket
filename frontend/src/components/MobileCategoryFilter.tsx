// import { useNavigate } from 'react-router-dom';
// import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
// import { RadioGroup } from '@/components/ui/radio-group';
// import { Label } from '@/components/ui/label';
// import { X } from 'lucide-react';

// interface MobileCategoryFilterProps {
//     open: boolean;
//     onOpenChange: (open: boolean) => void;
//     activeCategory: string;
// }

// const categories = [
//     { id: 'all', label: 'All', route: '/' },
//     { id: 'rice-bowls', label: 'Rice Bowls', route: '/category/rice-bowls' },
//     { id: 'korean-fried-chicken', label: 'Korean Fried Chicken', route: '/category/korean-fried-chicken' },
//     { id: 'korean-tacos', label: 'Korean Tacos', route: '/category/korean-tacos' },
//     { id: 'appetizers-sides', label: 'Appetizers/Sides', route: '/category/appetizers-sides' },
//     { id: 'kids-friendly', label: 'Kids Friendly', route: '/category/kids-friendly' },
//     { id: 'desserts', label: 'Desserts', route: '/category/desserts' },
//     { id: 'beverages', label: 'Beverages', route: '/category/beverages' },
// ];

// const MobileCategoryFilter = ({ open, onOpenChange, activeCategory }: MobileCategoryFilterProps) => {
//     const navigate = useNavigate();

//     // Determine the selected value for RadioGroup
//     const selectedValue = categories.find(c => c.id === activeCategory)?.id || 'all';

//     const handleCategoryChange = (value: string) => {
//         const category = categories.find((c) => c.id === value);
//         if (category) {
//             navigate(category.route);
//             onOpenChange(false);
//         }
//     };

//     return (
//         <Drawer open={open} onOpenChange={onOpenChange}>
//             <DrawerContent className="max-h-[85vh] rounded-t-[20px]">
//                 <DrawerHeader className="flex items-center justify-between border-b pb-4 px-5 pt-5">
//                     <DrawerTitle className="text-xl font-bold">Filter by Category</DrawerTitle>
//                     <DrawerClose asChild>
//                         <button className="rounded-full p-1 hover:bg-muted/50">
//                             <X className="h-5 w-5 opacity-70" />
//                         </button>
//                     </DrawerClose>
//                 </DrawerHeader>

//                 <div className="p-5 overflow-y-auto">
//                     <RadioGroup
//                         value={selectedValue}
//                         onValueChange={handleCategoryChange}
//                         className="gap-3"
//                     >
//                         {categories.map((category) => (
//                             <div
//                                 key={category.id}
//                                 className={`flex items-center space-x-3 p-4 rounded-xl border transition-colors cursor-pointer ${selectedValue === category.id
//                                     ? 'bg-[#FFC629] border-[#FFC629] text-black shadow-sm'
//                                     : 'bg-white border-gray-100 hover:bg-gray-50'
//                                     }`}
//                                 onClick={() => handleCategoryChange(category.id)}
//                             >
//                                 <div className={`flex items-center justify-center h-5 w-5 rounded-full border ${selectedValue === category.id
//                                     ? 'border-black bg-black text-white'
//                                     : 'border-gray-400'
//                                     }`}>
//                                     {selectedValue === category.id && <div className="h-2 w-2 rounded-full bg-white" />}
//                                 </div>
//                                 <span
//                                     className={`flex-1 text-base font-semibold cursor-pointer ${selectedValue === category.id ? 'text-black' : 'text-gray-700'
//                                         }`}
//                                 >
//                                     {category.label}
//                                 </span>
//                             </div>
//                         ))}
//                     </RadioGroup>
//                 </div>
//             </DrawerContent>
//         </Drawer>
//     );
// };

// export default MobileCategoryFilter;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { X, ChevronDown, ChevronRight, Loader2 } from "lucide-react";

/* ================================
   TYPES
================================ */
interface Subcategory {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  subcategories: Subcategory[];
}

interface MobileCategoryFilterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCategory: string;    // current category slug
  activeSubcategory?: string; // current subcategory slug (optional)
}

const BASE_URL = "https://api.asianbasket.ie/api/auth";

/* ================================
   COMPONENT
================================ */
const MobileCategoryFilter = ({
  open,
  onOpenChange,
  activeCategory,
  activeSubcategory,
}: MobileCategoryFilterProps) => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Track which category accordion is expanded
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    activeCategory !== "all" ? activeCategory : null
  );

  /* ================================
     FETCH CATEGORIES + SUBCATEGORIES
  ================================ */
  useEffect(() => {
    if (!open) return; // Only fetch when drawer opens
    setLoading(true);
    axios
      .get(`${BASE_URL}/categories/`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setCategories(res.data);
        }
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, [open]);

  // Sync expanded state when activeCategory changes
  useEffect(() => {
    if (activeCategory && activeCategory !== "all") {
      setExpandedCategory(activeCategory);
    }
  }, [activeCategory]);

  /* ================================
     HANDLERS
  ================================ */
  const handleSelectAll = () => {
    navigate("/");
    onOpenChange(false);
  };

  const handleSelectCategory = (slug: string) => {
    // Toggle accordion; navigate to category page
    setExpandedCategory((prev) => (prev === slug ? null : slug));
    navigate(`/category/${slug}`);
  };

  const handleSelectSubcategory = (catSlug: string, subSlug: string) => {
    navigate(`/category/${catSlug}?sub=${subSlug}`);
    onOpenChange(false);
  };

  /* ================================
     HELPERS
  ================================ */
  const isActiveCategory = (slug: string) => activeCategory === slug;
  const isActiveSubcategory = (slug: string) => activeSubcategory === slug;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] rounded-t-[20px]">

        {/* ── Header ── */}
        <DrawerHeader className="flex items-center justify-between border-b pb-4 px-5 pt-5">
          <DrawerTitle className="text-xl font-bold">
            Filter by Category
          </DrawerTitle>
          <DrawerClose asChild>
            <button className="rounded-full p-1 hover:bg-muted/50">
              <X className="h-5 w-5 opacity-70" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        {/* ── Body ── */}
        <div className="p-5 overflow-y-auto">

          {/* ── Loading ── */}
          {loading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading categories...</span>
            </div>
          )}

          {/* ── Categories List ── */}
          {!loading && (
            <div className="flex flex-col gap-2">

              {/* ALL option */}
              <div
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  activeCategory === "all" || !activeCategory
                    ? "bg-primary border-primary text-white shadow-sm"
                    : "bg-white border-gray-100 hover:bg-gray-50"
                }`}
                onClick={handleSelectAll}
              >
                {/* Custom radio dot */}
                <div className={`flex items-center justify-center h-5 w-5 rounded-full border-2 shrink-0 ${
                  activeCategory === "all" || !activeCategory
                    ? "border-white bg-white"
                    : "border-gray-400"
                }`}>
                  {(activeCategory === "all" || !activeCategory) && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <span className="flex-1 text-base font-semibold">All</span>
              </div>

              {/* Dynamic categories with subcategory accordion */}
              {categories.map((cat) => {
                const isActive     = isActiveCategory(cat.slug);
                const isExpanded   = expandedCategory === cat.slug;
                const hasSubs      = cat.subcategories?.filter(s => s.is_active).length > 0;

                return (
                  <div key={cat.id} className="flex flex-col">

                    {/* ── Category Row ── */}
                    <div
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                        isActive
                          ? "bg-primary border-primary text-white shadow-sm"
                          : "bg-white border-gray-100 hover:bg-gray-50"
                      }`}
                      onClick={() => handleSelectCategory(cat.slug)}
                    >
                      {/* Custom radio dot */}
                      <div className={`flex items-center justify-center h-5 w-5 rounded-full border-2 shrink-0 ${
                        isActive
                          ? "border-white bg-white"
                          : "border-gray-400"
                      }`}>
                        {isActive && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>

                      <span className="flex-1 text-base font-semibold">
                        {cat.name}
                      </span>

                      {/* Chevron for accordion — only if has subcategories */}
                      {hasSubs && (
                        <div className={isActive ? "text-white" : "text-gray-400"}>
                          {isExpanded
                            ? <ChevronDown className="h-4 w-4" />
                            : <ChevronRight className="h-4 w-4" />
                          }
                        </div>
                      )}
                    </div>

                    {/* ── Subcategory Accordion ── */}
                    {hasSubs && isExpanded && (
                      <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 border-primary/20 pl-3">
                        {cat.subcategories
                          .filter((s) => s.is_active)
                          .map((sub) => {
                            const isActiveSub = isActiveSubcategory(sub.slug);
                            return (
                              <div
                                key={sub.id}
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                  isActiveSub
                                    ? "bg-primary/10 text-primary font-semibold"
                                    : "hover:bg-gray-50 text-gray-600"
                                }`}
                                onClick={() =>
                                  handleSelectSubcategory(cat.slug, sub.slug)
                                }
                              >
                                <div className={`h-2 w-2 rounded-full shrink-0 ${
                                  isActiveSub ? "bg-primary" : "bg-gray-300"
                                }`} />
                                <span className="text-sm font-medium">
                                  {sub.name}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Empty state */}
              {!loading && categories.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No categories available
                </p>
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileCategoryFilter;

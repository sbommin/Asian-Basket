// import { Button } from '@/components/ui/button';
// import { cn } from '@/lib/utils';
// import { Wheat, Carrot, Beef, Fish, Coffee } from 'lucide-react';

// interface CategoryTabsProps {
//     activeTab: string;
//     setActiveTab: (tab: string) => void;
// }

// const tabs = [
//     { id: 'all', label: 'All', icon: null },
//     { id: 'pantry', label: 'Pantry', icon: Wheat },
//     { id: 'vegetables', label: 'Vegetables', icon: Carrot },
//     { id: 'meat', label: 'Meat & Chicken', icon: Beef },
//     { id: 'seafood', label: 'Seafood', icon: Fish },
//     { id: 'snacks', label: 'Snacks', icon: Coffee },
// ];

// const CategoryTabs = ({ activeTab, setActiveTab }: CategoryTabsProps) => {
//     return (
//         <div className="bg-white sticky top-[60px] md:top-[132px] z-30 shadow-sm border-b border-border mb-8 overflow-x-auto scrollbar-hide">
//             <div className="container mx-auto px-4">
//                 <div className="flex items-center gap-6 min-w-max">
//                     {tabs.map((tab) => (
//                         <button
//                             key={tab.id}
//                             onClick={() => setActiveTab(tab.id)}
//                             className={cn(
//                                 "flex items-center gap-2 py-4 border-b-2 text-sm font-bold transition-all",
//                                 activeTab === tab.id
//                                     ? "border-primary text-primary"
//                                     : "border-transparent text-muted-foreground hover:text-foreground"
//                             )}
//                         >
//                             {tab.icon && <tab.icon className="w-4 h-4" />}
//                             {tab.label}
//                         </button>
//                     ))}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default CategoryTabs;


import { useEffect, useState } from "react";
import axios from "axios";
import { cn } from "@/lib/utils";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface CategoryTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const API_URL = "https://api.asianbasket.ie/api/auth/categories/";

const CategoryTabs = ({ activeTab, setActiveTab }: CategoryTabsProps) => {
  const [categories, setCategories] = useState<Category[]>([]);

  /* ================================
     FETCH CATEGORIES FROM BACKEND
  ================================ */
  useEffect(() => {
    axios
      .get(API_URL)
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Category Tabs API error", err));
  }, []);

  return (
    <div className="bg-white sticky top-[60px] md:top-[132px] z-30 shadow-sm border-b border-border mb-8 overflow-x-auto scrollbar-hide">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-6 min-w-max">

          {/* ALL TAB */}
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "flex items-center gap-2 py-4 border-b-2 text-sm font-bold transition-all",
              activeTab === "all"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>

          {/* BACKEND CATEGORIES */}
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveTab(category.slug)}
              className={cn(
                "flex items-center gap-2 py-4 border-b-2 text-sm font-bold transition-all whitespace-nowrap",
                activeTab === category.slug
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {category.name}
            </button>
          ))}

        </div>
      </div>
    </div>
  );
};

export default CategoryTabs;

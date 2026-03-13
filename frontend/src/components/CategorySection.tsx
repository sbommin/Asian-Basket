// import { useRef, useState } from "react";
// import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { useCart } from "@/contexts/CartContext";
// import { useToast } from "@/hooks/use-toast";
// import { Link } from "react-router-dom";
// import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

// /* ================================
//    TYPES
// ================================ */
// interface WeightOption {
//   weight: string;
//   label: string;
// }

// interface Product {
//   id: string;
//   name: string;
//   price: number;
//   mrp?: number;
//   image: string;
//   category: string;

//   // ✅ IMPORTANT — backend weight
//   weight: number;

//   final_stock_status: boolean;
//   priority?: number;
//   pricePerKg?: number;
//   availableWeights?: WeightOption[];
// }

// interface CategorySectionProps {
//   title: string;
//   products: Product[];
//   bgColor?: string;
//   categorySlug: string;
// }

// /* ================================
//    CURRENCY FORMATTER
// ================================ */
// const formatCurrency = (amount: number) => {
//   return `€${amount.toFixed(2)}`;
// };

// const CategorySection = ({
//   title,
//   products,
//   bgColor = "bg-white",
//   categorySlug,
// }: CategorySectionProps) => {

//   const scrollRef = useRef<HTMLDivElement>(null);

//   const { addToCart } = useCart();

//   const { toast } = useToast();

//   const [selectedWeights, setSelectedWeights] = useState<Record<string, string>>({});

//   const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

//   /* ================================
//      SORT PRODUCTS BY PRIORITY
//   ================================ */
//   const sortedProducts = [...products].sort((a, b) => {

//     const pa = a.priority ?? 0;
//     const pb = b.priority ?? 0;

//     if (pa === 0 && pb === 0) return 0;
//     if (pa === 0) return 1;
//     if (pb === 0) return -1;

//     return pa - pb;

//   });

//   /* ================================
//      CALCULATE PRICE
//   ================================ */
//   const calculatePrice = (product: Product) => {

//     if (!product.pricePerKg || !product.availableWeights)
//       return product.price;

//     const selectedWeight =
//       selectedWeights[product.id] ||
//       product.availableWeights[0]?.weight ||
//       "1";

//     return product.pricePerKg * parseFloat(selectedWeight);

//   };

//   /* ================================
//      CALCULATE DISCOUNT
//   ================================ */
//   const calculateDiscount = (mrp?: number, price?: number) => {

//     if (!mrp || !price || mrp <= price)
//       return null;

//     return Math.round(((mrp - price) / mrp) * 100);

//   };

//   /* ================================
//      ADD TO CART — FIXED WEIGHT
//   ================================ */
//   const handleAddToCart = (product: Product) => {

//     if (!product.final_stock_status)
//       return;

//     addToCart({

//       id: product.id,

//       name: product.name,

//       image: product.image,

//       category: product.category,

//       price: calculatePrice(product),

//       // ✅ CRITICAL FIX — PASS BACKEND WEIGHT
//       weight: Number(product.weight),

//     });

//     toast({
//       title: "Added to cart",
//       description: `${product.name} added successfully`,
//     });

//   };

//   /* ================================
//      SCROLL FUNCTION
//   ================================ */
//   const scroll = (direction: "left" | "right") => {

//     if (!scrollRef.current)
//       return;

//     const scrollAmount = scrollRef.current.clientWidth * 0.8;

//     scrollRef.current.scrollBy({

//       left: direction === "left"
//         ? -scrollAmount
//         : scrollAmount,

//       behavior: "smooth",

//     });

//   };

//   /* ================================
//      UI
//   ================================ */
//   return (
//     <>

//       <section className={`py-12 ${bgColor}`}>

//         <div className="container mx-auto px-4">

//           {/* HEADER */}
//           <div className="flex items-center justify-between mb-6">

//             <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
//               {title}
//             </h2>

//             <div className="flex items-center gap-2">

//               <Link
//                 to={`/category/${categorySlug}`}
//                 className="text-sm font-semibold text-primary hover:underline mr-2 hidden sm:block"
//               >
//                 View All
//               </Link>

//               <Button
//                 variant="outline"
//                 size="icon"
//                 onClick={() => scroll("left")}
//               >
//                 <ChevronLeft className="h-4 w-4" />
//               </Button>

//               <Button
//                 variant="outline"
//                 size="icon"
//                 onClick={() => scroll("right")}
//               >
//                 <ChevronRight className="h-4 w-4" />
//               </Button>

//             </div>

//           </div>

//           {/* PRODUCTS */}
//           <div
//             ref={scrollRef}
//             className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x"
//           >

//             {sortedProducts.map((product) => {

//               const discount =
//                 calculateDiscount(product.mrp, product.price);

//               return (

//                 <div
//                   key={product.id}
//                   className={`min-w-[200px] w-[200px] md:min-w-[240px] md:w-[240px] snap-start bg-card rounded-xl border border-border p-3 transition-all group relative ${
//                     product.final_stock_status
//                       ? "hover:shadow-lg"
//                       : "opacity-70"
//                   }`}
//                 >

//                   {/* IMAGE */}
//                   <div
//                     className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-secondary/10 cursor-pointer"
//                     onClick={() => setQuickViewProduct(product)}
//                   >

//                     <img
//                       src={product.image}
//                       alt={product.name}
//                       className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
//                     />

//                     {discount && (
//                       <div className="absolute top-2 right-2 bg-red-600 text-white text-[11px] font-bold px-2 py-1 rounded-full">
//                         {discount}% OFF
//                       </div>
//                     )}

//                     {!product.final_stock_status && (
//                       <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
//                         <span className="bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-full">
//                           OUT OF STOCK
//                         </span>
//                       </div>
//                     )}

//                   </div>

//                   {/* NAME */}
//                   <h3 className="font-semibold text-sm line-clamp-2 min-h-[40px]">
//                     {product.name}
//                   </h3>

//                   {/* PRICE */}
//                   <div className="mt-2">

//                     {product.mrp && product.mrp > product.price && (
//                       <div className="text-xs text-muted-foreground line-through">
//                         {formatCurrency(product.mrp)}
//                       </div>
//                     )}

//                     <div className="font-bold text-lg text-primary">
//                       {formatCurrency(calculatePrice(product))}
//                     </div>

//                   </div>

//                   {/* ADD BUTTON */}
//                   <div className="flex justify-end mt-2">

//                     <Button
//                       size="icon"
//                       disabled={!product.final_stock_status}
//                       onClick={() => handleAddToCart(product)}
//                       className={`h-9 w-9 rounded-full shadow-sm border ${
//                         product.final_stock_status
//                           ? "bg-secondary hover:bg-primary hover:text-white"
//                           : "bg-muted cursor-not-allowed"
//                       }`}
//                     >
//                       <Plus className="h-5 w-5" />
//                     </Button>

//                   </div>

//                 </div>

//               );

//             })}

//           </div>

//         </div>

//       </section>

//       {/* QUICK VIEW */}
//       <Dialog
//         open={!!quickViewProduct}
//         onOpenChange={() => setQuickViewProduct(null)}
//       >

//         <DialogContent className="max-w-3xl p-0 overflow-hidden">

//           <DialogTitle className="sr-only">
//             {quickViewProduct?.name}
//           </DialogTitle>

//           {quickViewProduct && (
//             <>

//               <Button
//                 size="icon"
//                 variant="ghost"
//                 className="absolute top-2 right-2 z-10 bg-white/80"
//                 onClick={() => setQuickViewProduct(null)}
//               >
//                 <X className="h-5 w-5" />
//               </Button>

//               <div className="w-full aspect-square bg-secondary/10">

//                 <img
//                   src={quickViewProduct.image}
//                   alt={quickViewProduct.name}
//                   className="w-full h-full object-contain bg-white"
//                 />

//               </div>

//             </>
//           )}

//         </DialogContent>

//       </Dialog>

//     </>
//   );

// };

// export default CategorySection;

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/* ================================
   TYPES
================================ */
interface WeightOption {
  weight: string;
  label: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  mrp?: number;
  image: string;
  category: string;
  weight: number;                    // ✅ backend weight
  final_stock_status: boolean;       // ✅ backend stock
  priority?: number;                 // ✅ backend priority
  pricePerKg?: number;
  availableWeights?: WeightOption[];
}

interface CategorySectionProps {
  title: string;
  products: Product[];
  bgColor?: string;
  categorySlug: string;
}

/* ================================
   CURRENCY FORMATTER
================================ */
const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;

/* ================================
   COMPONENT
================================ */
const CategorySection = ({
  title,
  products,
  bgColor = "bg-white",
  categorySlug,
}: CategorySectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [selectedWeights, setSelectedWeights] = useState<Record<string, string>>({});
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  /* ================================
     SORT BY PRIORITY (V2)
  ================================ */
  const sortedProducts = [...products].sort((a, b) => {
    const pa = a.priority ?? 0;
    const pb = b.priority ?? 0;
    if (pa === 0 && pb === 0) return 0;
    if (pa === 0) return 1;
    if (pb === 0) return -1;
    return pa - pb;
  });

  /* ================================
     WEIGHT CHANGE HANDLER (V1)
  ================================ */
  const handleWeightChange = (productId: string, weight: string) => {
    setSelectedWeights((prev) => ({ ...prev, [productId]: weight }));
  };

  /* ================================
     CALCULATE PRICE
  ================================ */
  const calculatePrice = (product: Product) => {
    if (!product.pricePerKg || !product.availableWeights) return product.price;
    const selectedWeight =
      selectedWeights[product.id] || product.availableWeights[0]?.weight || "1";
    return product.pricePerKg * parseFloat(selectedWeight);
  };

  /* ================================
     CALCULATE DISCOUNT (V2)
  ================================ */
  const calculateDiscount = (mrp?: number, price?: number) => {
    if (!mrp || !price || mrp <= price) return null;
    return Math.round(((mrp - price) / mrp) * 100);
  };

  /* ================================
     ADD TO CART
  ================================ */
  const handleAddToCart = (product: Product) => {
    if (!product.final_stock_status) return;

    const selectedWeight = selectedWeights[product.id];
    const finalPrice = calculatePrice(product);
    const weightLabel =
      product.availableWeights?.find((w) => w.weight === selectedWeight)?.label || "";

    addToCart({
      id: product.id,
      name: weightLabel ? `${product.name} - ${weightLabel}` : product.name,
      image: product.image,
      category: product.category,
      price: finalPrice,
      weight: Number(product.weight),  // ✅ backend weight
    });

    toast({
      title: "Added to cart",
      description: `${product.name}${weightLabel ? ` (${weightLabel})` : ""} added successfully`,
    });
  };

  /* ================================
     SCROLL
  ================================ */
  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  /* ================================
     UI
  ================================ */
  return (
    <>
      <section className={`py-12 ${bgColor}`}>
        <div className="container mx-auto px-4">

          {/* ── HEADER ── */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {title}
            </h2>
            <div className="flex items-center gap-2">
              <Link
                to={`/category/${categorySlug}`}
                className="text-sm font-semibold text-primary hover:underline mr-2 hidden sm:block"
              >
                View All
              </Link>
              {/* ✅ V1 rounded scroll buttons */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-primary/20 hover:bg-primary hover:text-white transition-colors"
                onClick={() => scroll("left")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-primary/20 hover:bg-primary hover:text-white transition-colors"
                onClick={() => scroll("right")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* ── PRODUCT CARDS ── */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x"
          >
            {sortedProducts.map((product) => {
              const discount = calculateDiscount(product.mrp, product.price);

              return (
                <div
                  key={product.id}
                  className={`min-w-[200px] w-[200px] md:min-w-[240px] md:w-[240px] snap-start bg-card rounded-xl border border-border p-3 transition-all group relative ${
                    product.final_stock_status ? "hover:shadow-lg" : "opacity-70"
                  }`}
                >
                  {/* ── IMAGE ── */}
                  <div
                    className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-secondary/10 cursor-pointer"
                    onClick={() => setQuickViewProduct(product)}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      title={product.name}
                      //crossOrigin="anonymous"      // ✅ V1
                      loading="lazy"               // ✅ V1
                      onError={(e) => {            // ✅ V1 fallback
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "https://placehold.co/400x400/6B9B5A/white?text=Product+Image";
                      }}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* ✅ V1 Quick View Eye overlay on hover */}
                    {product.final_stock_status && (
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8 rounded-full shadow-md bg-white hover:bg-white text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickViewProduct(product);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {/* ✅ V2 Discount badge — top right */}
                    {discount && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white text-[11px] font-bold px-2 py-1 rounded-full">
                        {discount}% OFF
                      </div>
                    )}

                    {/* ✅ V2 Out of stock overlay */}
                    {!product.final_stock_status && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <span className="bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                          OUT OF STOCK
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ── PRODUCT INFO ── */}
                  <div className="space-y-2">
                    <h3
                      className="font-semibold text-sm line-clamp-2 min-h-[40px]"
                      title={product.name}
                    >
                      {product.name}
                    </h3>

                    {/* ✅ V1 Weight Selector */}
                    {product.availableWeights && product.availableWeights.length > 0 && (
                      <Select
                        value={
                          selectedWeights[product.id] ||
                          product.availableWeights[0].weight
                        }
                        onValueChange={(value) =>
                          handleWeightChange(product.id, value)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {product.availableWeights.map((option) => (
                            <SelectItem
                              key={option.weight}
                              value={option.weight}
                              className="text-xs"
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* ── PRICE + ADD BUTTON ── */}
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        {/* ✅ V1 per-kg price label */}
                        {product.pricePerKg ? (
                          <>
                            <div className="text-xs text-muted-foreground mb-0.5">
                              {formatCurrency(product.pricePerKg)}/kg
                            </div>
                            <div className="font-bold text-lg text-primary">
                              {formatCurrency(calculatePrice(product))}
                            </div>
                          </>
                        ) : (
                          <>
                            {/* ✅ V2 MRP strikethrough */}
                            {product.mrp && product.mrp > product.price && (
                              <div className="text-xs text-muted-foreground line-through">
                                {formatCurrency(product.mrp)}
                              </div>
                            )}
                            <div className="font-bold text-lg text-primary">
                              {formatCurrency(calculatePrice(product))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* ✅ V1 Add button style */}
                      <Button
                        size="icon"
                        disabled={!product.final_stock_status}
                        onClick={() => handleAddToCart(product)}
                        className={`h-9 w-9 rounded-full shadow-sm transition-colors border border-primary/10 ${
                          product.final_stock_status
                            ? "bg-secondary text-secondary-foreground hover:bg-primary hover:text-white"
                            : "bg-muted cursor-not-allowed"
                        }`}
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── QUICK VIEW MODAL ── */}
      <Dialog
        open={!!quickViewProduct}
        onOpenChange={(open) => !open && setQuickViewProduct(null)}
      >
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">
            {quickViewProduct?.name || "Product Quick View"}
          </DialogTitle>

          {quickViewProduct && (
            <div className="relative">
              {/* ✅ V1 Close button */}
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white rounded-full"
                onClick={() => setQuickViewProduct(null)}
              >
                <X className="h-5 w-5" />
              </Button>

              {/* ✅ V1 Large image */}
              <div className="w-full aspect-square max-h-[70vh] bg-secondary/10">
                <img
                  src={quickViewProduct.image}
                  alt={quickViewProduct.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      "https://placehold.co/800x800/6B9B5A/white?text=Product+Image";
                  }}
                />
              </div>

              {/* ✅ V1 Product info panel below image */}
              <div className="p-6 bg-white">
                <h2 className="text-xl font-bold mb-2">
                  {quickViewProduct.name}
                </h2>
                {quickViewProduct.mrp &&
                  quickViewProduct.mrp > quickViewProduct.price && (
                    <p className="text-sm text-muted-foreground line-through mb-1">
                      {formatCurrency(quickViewProduct.mrp)}
                    </p>
                  )}
                <p className="text-2xl font-bold text-primary mb-4">
                  {formatCurrency(calculatePrice(quickViewProduct))}
                </p>
                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={!quickViewProduct.final_stock_status}
                  onClick={() => {
                    handleAddToCart(quickViewProduct);
                    setQuickViewProduct(null);
                  }}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  {quickViewProduct.final_stock_status
                    ? "Add to Cart"
                    : "Out of Stock"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CategorySection;

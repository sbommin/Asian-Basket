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

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface ProductVariant {
  id: number;
  label: string;         // "250g", "500g", "1kg"
  weight_kg: number;     // 0.25, 0.5, 1.0
  price: string;         // "1.99"
  mrp?: string;          // "2.49"
  in_stock: boolean;
  stock_quantity: number;
  final_stock_status: boolean;
  sort_order: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  mrp?: number;
  image: string;
  category: string;
  weight: number;
  final_stock_status: boolean;
  priority?: number;
  description?: string;
  price_per_kg?: number;
  discount_percentage?: number;
  has_variants?: boolean;
  variants?: ProductVariant[];
  // Legacy fields (kept for backward compatibility)
  pricePerKg?: number;
  availableWeights?: { weight: string; label: string }[];
}

interface CategorySectionProps {
  title: string;
  products: Product[];
  bgColor?: string;
  categorySlug: string;
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;

const calculateDiscount = (mrp?: number, price?: number) => {
  if (!mrp || !price || mrp <= price) return null;
  return Math.round(((mrp - price) / mrp) * 100);
};

/* ─── Component ───────────────────────────────────────────────────────────── */

const CategorySection = ({
  title,
  products,
  bgColor = "bg-white",
  categorySlug,
}: CategorySectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();
  const { toast } = useToast();

  // Track selected variant per product
  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({});
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  /* ── Sort by priority ─────────────────────────────────────────────────── */
  const sortedProducts = [...products].sort((a, b) => {
    const pa = a.priority ?? 0;
    const pb = b.priority ?? 0;
    if (pa === 0 && pb === 0) return 0;
    if (pa === 0) return 1;
    if (pb === 0) return -1;
    return pa - pb;
  });

  /* ── Get active variants for a product ───────────────────────────────── */
  const getActiveVariants = (product: Product): ProductVariant[] => {
    return (product.variants || []).filter((v) => v.final_stock_status || !v.in_stock);
  };

  /* ── Get selected variant ─────────────────────────────────────────────── */
  const getSelectedVariant = (product: Product): ProductVariant | null => {
    const variants = getActiveVariants(product);
    if (!variants.length) return null;
    const selectedId = selectedVariants[product.id];
    return variants.find((v) => v.id === selectedId) || variants[0];
  };

  /* ── Get display price ────────────────────────────────────────────────── */
  const getDisplayPrice = (product: Product): number => {
    const variant = getSelectedVariant(product);
    if (variant) return parseFloat(variant.price);
    return product.price;
  };

  /* ── Get display MRP ──────────────────────────────────────────────────── */
  const getDisplayMrp = (product: Product): number | undefined => {
    const variant = getSelectedVariant(product);
    if (variant?.mrp) return parseFloat(variant.mrp);
    return product.mrp;
  };

  /* ── Get stock status ─────────────────────────────────────────────────── */
  const getStockStatus = (product: Product): boolean => {
    const variant = getSelectedVariant(product);
    if (variant) return variant.final_stock_status;
    return product.final_stock_status;
  };

  /* ── Add to cart ──────────────────────────────────────────────────────── */
  const handleAddToCart = (product: Product) => {
    if (!getStockStatus(product)) return;

    const variant = getSelectedVariant(product);
    const finalPrice = getDisplayPrice(product);
    const variantLabel = variant?.label || "";

    addToCart({
      id: variant ? `${product.id}-${variant.id}` : product.id,
      name: variantLabel ? `${product.name} - ${variantLabel}` : product.name,
      image: product.image,
      category: product.category,
      price: finalPrice,
      weight: variant ? variant.weight_kg : Number(product.weight),
    });

    toast({
      title: "Added to cart ✓",
      description: `${product.name}${variantLabel ? ` (${variantLabel})` : ""} added successfully`,
    });
  };

  /* ── Scroll ───────────────────────────────────────────────────────────── */
  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === "left"
        ? -scrollRef.current.clientWidth * 0.8
        : scrollRef.current.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <>
      <section className={`py-12 ${bgColor}`}>
        <div className="container mx-auto px-4">

          {/* ── Header ───────────────────────────────────────────────────── */}
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
              <Button variant="outline" size="icon"
                className="h-8 w-8 rounded-full border-primary/20 hover:bg-primary hover:text-white transition-colors"
                onClick={() => scroll("left")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon"
                className="h-8 w-8 rounded-full border-primary/20 hover:bg-primary hover:text-white transition-colors"
                onClick={() => scroll("right")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* ── Product Cards ─────────────────────────────────────────────── */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x"
          >
            {sortedProducts.map((product) => {
              const activeVariants = getActiveVariants(product);
              const hasVariants    = activeVariants.length > 0;
              const selectedVariant = getSelectedVariant(product);
              const displayPrice   = getDisplayPrice(product);
              const displayMrp     = getDisplayMrp(product);
              const inStock        = getStockStatus(product);
              const discount       = calculateDiscount(displayMrp, displayPrice);

              return (
                <div
                  key={product.id}
                  className={`min-w-[200px] w-[200px] md:min-w-[240px] md:w-[240px] snap-start bg-card rounded-xl border border-border p-3 transition-all group relative ${
                    inStock ? "hover:shadow-lg" : "opacity-70"
                  }`}
                >
                  {/* ── Image ─────────────────────────────────────────────── */}
                  <div
                    className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-secondary/10 cursor-pointer"
                    onClick={() => setQuickViewProduct(product)}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/400x400/6B9B5A/white?text=Product+Image";
                      }}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Quick view overlay */}
                    {inStock && (
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="icon" variant="secondary"
                          className="h-8 w-8 rounded-full shadow-md bg-white hover:bg-white text-foreground"
                          onClick={(e) => { e.stopPropagation(); setQuickViewProduct(product); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {/* Discount badge */}
                    {discount && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white text-[11px] font-bold px-2 py-1 rounded-full">
                        {discount}% OFF
                      </div>
                    )}

                    {/* Out of stock overlay */}
                    {!inStock && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <span className="bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                          OUT OF STOCK
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ── Product Info ───────────────────────────────────────── */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm line-clamp-2 min-h-[40px]" title={product.name}>
                      {product.name}
                    </h3>

                    {/* ✅ Variant Selector — shows if product has variants */}
                    {hasVariants && (
                      <Select
                        value={String(selectedVariant?.id || activeVariants[0]?.id)}
                        onValueChange={(val) =>
                          setSelectedVariants((prev) => ({
                            ...prev,
                            [product.id]: Number(val),
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs border-primary/30">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeVariants.map((variant) => (
                            <SelectItem
                              key={variant.id}
                              value={String(variant.id)}
                              className="text-xs"
                              disabled={!variant.final_stock_status}
                            >
                              {variant.label}
                              {!variant.final_stock_status && " (Out of stock)"}
                              {" — "}
                              {formatCurrency(parseFloat(variant.price))}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* ── Price + Add Button ─────────────────────────────── */}
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        {displayMrp && displayMrp > displayPrice && (
                          <div className="text-xs text-muted-foreground line-through">
                            {formatCurrency(displayMrp)}
                          </div>
                        )}
                        <div className="font-bold text-lg text-primary">
                          {formatCurrency(displayPrice)}
                        </div>
                        {product.price_per_kg && !hasVariants && (
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(product.price_per_kg)}/kg
                          </div>
                        )}
                      </div>

                      <Button
                        size="icon"
                        disabled={!inStock}
                        onClick={() => handleAddToCart(product)}
                        className={`h-9 w-9 rounded-full shadow-sm transition-colors border border-primary/10 ${
                          inStock
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

      {/* ── Quick View Modal ───────────────────────────────────────────────── */}
      <Dialog open={!!quickViewProduct} onOpenChange={(open) => !open && setQuickViewProduct(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">
            {quickViewProduct?.name || "Product Quick View"}
          </DialogTitle>

          {quickViewProduct && (() => {
            const qvVariants      = getActiveVariants(quickViewProduct);
            const qvHasVariants   = qvVariants.length > 0;
            const qvSelectedVariant = getSelectedVariant(quickViewProduct);
            const qvPrice         = getDisplayPrice(quickViewProduct);
            const qvMrp           = getDisplayMrp(quickViewProduct);
            const qvInStock       = getStockStatus(quickViewProduct);

            return (
              <div className="relative">
                <Button size="icon" variant="ghost"
                  className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white rounded-full"
                  onClick={() => setQuickViewProduct(null)}>
                  <X className="h-5 w-5" />
                </Button>

                <div className="w-full aspect-square max-h-[60vh] bg-secondary/10">
                  <img
                    src={quickViewProduct.image}
                    alt={quickViewProduct.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/800x800/6B9B5A/white?text=Product+Image";
                    }}
                  />
                </div>

                <div className="p-6 bg-white space-y-4">
                  <h2 className="text-xl font-bold">{quickViewProduct.name}</h2>

                  {quickViewProduct.description && (
                    <p className="text-sm text-muted-foreground">{quickViewProduct.description}</p>
                  )}

                  {/* Variant selector in quick view */}
                  {qvHasVariants && (
                    <Select
                      value={String(qvSelectedVariant?.id || qvVariants[0]?.id)}
                      onValueChange={(val) =>
                        setSelectedVariants((prev) => ({
                          ...prev,
                          [quickViewProduct.id]: Number(val),
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {qvVariants.map((variant) => (
                          <SelectItem
                            key={variant.id}
                            value={String(variant.id)}
                            disabled={!variant.final_stock_status}
                          >
                            {variant.label}
                            {!variant.final_stock_status && " (Out of stock)"}
                            {" — "}
                            {formatCurrency(parseFloat(variant.price))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <div>
                    {qvMrp && qvMrp > qvPrice && (
                      <p className="text-sm text-muted-foreground line-through">
                        {formatCurrency(qvMrp)}
                      </p>
                    )}
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(qvPrice)}
                    </p>
                  </div>

                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={!qvInStock}
                    onClick={() => {
                      handleAddToCart(quickViewProduct);
                      setQuickViewProduct(null);
                    }}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    {qvInStock ? "Add to Cart" : "Out of Stock"}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CategorySection;

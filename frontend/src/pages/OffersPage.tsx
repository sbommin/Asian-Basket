// import { useState } from 'react';
// import Header from '@/components/Header';
// import Footer from '@/components/Footer';
// import BottomNav from '@/components/BottomNav';
// import Cart from '@/components/Cart';

// const OffersPage = () => {
//     const [isCartOpen, setIsCartOpen] = useState(false);

//     return (
//         <div className="min-h-screen bg-background pb-16 md:pb-0">
//             <Header />

//             <div className="pt-[188px] md:pt-[200px]">
//                 <div className="container mx-auto px-4 py-8">
//                     <h1 className="text-3xl font-bold mb-2 text-primary">Special Offers</h1>
//                     <p className="text-muted-foreground mb-8">Check out our latest deals and discounts</p>

//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-8">
//                         <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-6 border-2 border-primary">
//                             <h3 className="text-xl font-bold text-primary mb-2">50% OFF</h3>
//                             <p className="text-foreground mb-4">On all fresh vegetables</p>
//                             <p className="text-sm text-muted-foreground">Valid until end of month</p>
//                         </div>

//                         <div className="bg-gradient-to-br from-accent/10 to-primary/10 rounded-xl p-6 border-2 border-accent">
//                             <h3 className="text-xl font-bold text-accent mb-2">Buy 1 Get 1</h3>
//                             <p className="text-foreground mb-4">On selected rice products</p>
//                             <p className="text-sm text-muted-foreground">Limited time offer</p>
//                         </div>

//                         <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-6 border-2 border-primary">
//                             <h3 className="text-xl font-bold text-primary mb-2">Free Delivery</h3>
//                             <p className="text-foreground mb-4">On orders above €50</p>
//                             <p className="text-sm text-muted-foreground">No code needed</p>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <Footer />
//             <BottomNav setIsCartOpen={setIsCartOpen} />
//             <Cart isOpen={isCartOpen} setIsOpen={setIsCartOpen} />
//         </div>
//     );
// };

// export default OffersPage;
import { useState, useEffect } from "react";
import axios from "axios";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import Cart from "@/components/Cart";
import { Loader2, Tag, ShoppingBag, Truck, Gift, Percent } from "lucide-react";

const BASE_URL = "https://api.asianbasket.ie/api/auth";

/* ================================
   TYPES
================================ */
type BadgeType = "percent" | "bogo" | "delivery" | "flat" | "custom";

interface Offer {
  id: number;
  title: string;
  description: string;
  validity: string;
  badge_type: BadgeType;
  priority: number;
}

/* ================================
   BADGE STYLE MAP
================================ */
const badgeStyles: Record<BadgeType, {
  card: string;
  border: string;
  title: string;
  icon: React.ReactNode;
}> = {
  percent: {
    card:   "from-primary/10 to-accent/10",
    border: "border-primary",
    title:  "text-primary",
    icon:   <Percent className="h-8 w-8 text-primary" />,
  },
  bogo: {
    card:   "from-accent/10 to-primary/10",
    border: "border-accent",
    title:  "text-accent",
    icon:   <ShoppingBag className="h-8 w-8 text-accent" />,
  },
  delivery: {
    card:   "from-blue-50 to-sky-50",
    border: "border-blue-400",
    title:  "text-blue-600",
    icon:   <Truck className="h-8 w-8 text-blue-500" />,
  },
  flat: {
    card:   "from-orange-50 to-yellow-50",
    border: "border-orange-400",
    title:  "text-orange-600",
    icon:   <Tag className="h-8 w-8 text-orange-500" />,
  },
  custom: {
    card:   "from-purple-50 to-pink-50",
    border: "border-purple-400",
    title:  "text-purple-600",
    icon:   <Gift className="h-8 w-8 text-purple-500" />,
  },
};

/* ================================
   SKELETON CARD
================================ */
const OfferSkeleton = () => (
  <div className="rounded-xl p-6 border-2 border-gray-200 bg-gray-50 animate-pulse space-y-3">
    <div className="w-10 h-10 rounded-full bg-gray-200" />
    <div className="h-6 w-24 bg-gray-200 rounded" />
    <div className="h-4 w-48 bg-gray-200 rounded" />
    <div className="h-3 w-32 bg-gray-200 rounded" />
  </div>
);

/* ================================
   MAIN COMPONENT
================================ */
const OffersPage = () => {
  const [isCartOpen, setIsCartOpen]   = useState(false);
  const [offers, setOffers]           = useState<Offer[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(false);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/offers/`)
      .then((res) => {
        setOffers(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />

      <div className="pt-[188px] md:pt-[200px]">
        <div className="container mx-auto px-4 py-8">

          {/* ── Page Header ── */}
          <h1 className="text-3xl font-bold mb-2 text-primary">
            Special Offers
          </h1>
          <p className="text-muted-foreground mb-8">
            Check out our latest deals and discounts
          </p>

          {/* ── Loading State ── */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-8">
              {[1, 2, 3].map((i) => <OfferSkeleton key={i} />)}
            </div>
          )}

          {/* ── Error State ── */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Failed to load offers. Please try again later.
              </p>
            </div>
          )}

          {/* ── Empty State ── */}
          {!loading && !error && offers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Tag className="h-16 w-16 text-muted-foreground/40 mb-4" />
              <h2 className="text-xl font-semibold text-muted-foreground mb-2">
                No offers right now
              </h2>
              <p className="text-sm text-muted-foreground">
                Check back soon — new deals are added regularly!
              </p>
            </div>
          )}

          {/* ── Offer Cards ── */}
          {!loading && !error && offers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-8">
              {offers.map((offer) => {
                const style = badgeStyles[offer.badge_type] ?? badgeStyles.custom;
                return (
                  <div
                    key={offer.id}
                    className={`bg-gradient-to-br ${style.card} rounded-xl p-6 border-2 ${style.border} hover:shadow-md transition-shadow duration-200`}
                  >
                    {/* Icon */}
                    <div className="mb-4">
                      {style.icon}
                    </div>

                    {/* Title */}
                    <h3 className={`text-xl font-bold mb-2 ${style.title}`}>
                      {offer.title}
                    </h3>

                    {/* Description */}
                    <p className="text-foreground mb-4">
                      {offer.description}
                    </p>

                    {/* Validity */}
                    {offer.validity && (
                      <p className="text-sm text-muted-foreground">
                        {offer.validity}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      <Footer />
      <BottomNav setIsCartOpen={setIsCartOpen} />
      <Cart isOpen={isCartOpen} setIsOpen={setIsCartOpen} />
    </div>
  );
};

export default OffersPage;

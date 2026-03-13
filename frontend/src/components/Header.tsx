// import { useState, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { Menu, ShoppingBag, User, LogOut } from "lucide-react";
// import axios from "axios";

// import { Button } from "@/components/ui/button";
// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

// import { useCart } from "@/contexts/CartContext";
// import { useAuth } from "@/contexts/AuthContext";
// import Cart from "./Cart";
// import MegaMenu from "./MegaMenu";
// import SearchBar from "./SearchBar";
// import asianBasketLogo from "@/assets/asian-basket-logo-light.jpg";

// /* ================================
//    DEFAULT ANNOUNCEMENTS
// ================================ */
// const DEFAULT_ANNOUNCEMENTS = [
//   "🚚 Free Delivery available within Dublin for orders above €39.99",
//   "🥦 Fresh Indian & Asian Groceries",
//   "🛒 Order Now!",
// ];

// const Header = () => {
//   const [isCartOpen, setIsCartOpen] = useState(false);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [announcements, setAnnouncements] = useState<string[]>([]);

//   const { cartItems } = useCart();
//   const { user, isAuthenticated, logout } = useAuth();
//   const navigate = useNavigate();

//   /* ================================
//      FETCH ANNOUNCEMENTS
//   ================================ */
//   useEffect(() => {
//     axios
//       .get("https://api.asianbasket.ie/api/auth/announcement/")
//       .then((res) => {
//         if (Array.isArray(res.data) && res.data.length > 0) {
//           setAnnouncements(res.data.map((a) => a.description));
//         } else {
//           setAnnouncements(DEFAULT_ANNOUNCEMENTS);
//         }
//       })
//       .catch(() => {
//         setAnnouncements(DEFAULT_ANNOUNCEMENTS);
//       });
//   }, []);

//   /* ================================
//      REPEAT FOR INFINITE SCROLL
//   ================================ */
//   const scrollingAnnouncements = [
//     ...announcements,
//     ...announcements,
//     ...announcements,
//   ];

//   const handleLogout = () => {
//     logout();
//     navigate("/");
//   };

//   return (
//     <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
//       {/* ANNOUNCEMENT BAR */}
//       <div className="bg-primary text-primary-foreground py-2 overflow-hidden">
//         <div className="flex w-max animate-marquee">
//           {scrollingAnnouncements.map((text, index) => (
//             <span
//               key={index}
//               className="mx-12 text-xs md:text-sm font-semibold whitespace-nowrap"
//             >
//               {text}
//             </span>
//           ))}
//         </div>
//       </div>

//       {/* MAIN HEADER */}
//       <div className="container mx-auto px-4 py-3 md:py-4">
//         <div className="flex items-center justify-between gap-4">
//           {/* Logo + Mobile Menu */}
//           <div className="flex items-center gap-3">
//             <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
//               <SheetTrigger asChild>
//                 <Button variant="ghost" size="icon" className="md:hidden">
//                   <Menu className="h-6 w-6" />
//                 </Button>
//               </SheetTrigger>
//               <SheetContent side="left" className="w-[300px]">
//                 <nav className="flex flex-col gap-4 mt-8">
//                   <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
//                     Home
//                   </Link>
//                   <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)}>
//                     My Orders
//                   </Link>
//                   <Link to="/offers" onClick={() => setIsMobileMenuOpen(false)}>
//                     Offers
//                   </Link>
//                 </nav>
//               </SheetContent>
//             </Sheet>

//             <Link to="/">
//               <img
//                 src={asianBasketLogo}
//                 alt="Asian Basket"
//                 className="h-20 md:h-24 object-contain"
//               />
//             </Link>
//           </div>

//           {/* Search */}
//           <div className="hidden md:flex flex-1 justify-center">
//             <SearchBar />
//           </div>

//           {/* Actions */}
//           <div className="flex items-center gap-2">
//             {isAuthenticated ? (
//               <DropdownMenu>
//                 <DropdownMenuTrigger asChild>
//                   <Button variant="ghost">
//                     <User className="h-5 w-5 mr-1" />
//                     {user?.name}
//                   </Button>
//                 </DropdownMenuTrigger>
//                 <DropdownMenuContent align="end">
//                   <DropdownMenuItem onClick={() => navigate("/profile")}>
//                     Profile
//                   </DropdownMenuItem>
//                   <DropdownMenuSeparator />
//                   <DropdownMenuItem
//                     onClick={handleLogout}
//                     className="text-destructive"
//                   >
//                     <LogOut className="h-4 w-4 mr-2" />
//                     Logout
//                   </DropdownMenuItem>
//                 </DropdownMenuContent>
//               </DropdownMenu>
//             ) : (
//               <div className="flex items-center gap-2">
//                 <Link to="/login">
//                   <Button variant="ghost">
//                     <User className="h-5 w-5 mr-1" />
//                     Login
//                   </Button>
//                 </Link>
//                 <Link to="/register">
//                   <Button variant="ghost">
//                     <User className="h-5 w-5 mr-1" />
//                     Signup
//                   </Button>
//                 </Link>
//               </div>
//             )}

//             {/* Cart */}
//             <Button
//               onClick={() => setIsCartOpen(true)}
//               className="relative bg-primary text-primary-foreground rounded-full px-4"
//             >
//               <ShoppingBag className="h-5 w-5" />
//               {cartItems.length > 0 && (
//                 <span className="absolute -top-2 -right-2 bg-accent text-xs font-bold px-2 rounded-full">
//                   {cartItems.length}
//                 </span>
//               )}
//             </Button>
//           </div>
//         </div>

//         {/* Mobile Search */}
//         <div className="mt-3 md:hidden">
//           <SearchBar />
//         </div>
//       </div>

//       <MegaMenu />
//       <Cart isOpen={isCartOpen} setIsOpen={setIsCartOpen} />
//     </header>
//   );
// };

// export default Header;
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  Heart,
  ShoppingBag,
  User,
  LogOut,
  Package,
  MapPin,
  Phone,
} from "lucide-react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import Cart from "./Cart";
import MegaMenu from "./MegaMenu";
import SearchBar from "./SearchBar";
import asianBasketLogo from "@/assets/asian-basket-logo-light.jpg";

/* ================================
   DEFAULT ANNOUNCEMENTS
================================ */
const DEFAULT_ANNOUNCEMENTS = [
  "🚚 Free Delivery available within Dublin for orders above €39.99",
  "🥦 Fresh Indian & Asian Groceries Delivered to Your Door",
  "🛒 Order Now!",
];

const Header = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<string[]>([]);

  const { cartItems } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  /* ================================
     FETCH ANNOUNCEMENTS FROM BACKEND
  ================================ */
  useEffect(() => {
    axios
      .get("https://api.asianbasket.ie/api/auth/announcement/")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setAnnouncements(res.data.map((a: any) => a.description));
        } else {
          setAnnouncements(DEFAULT_ANNOUNCEMENTS);
        }
      })
      .catch(() => setAnnouncements(DEFAULT_ANNOUNCEMENTS));
  }, []);

  // Triple-repeat for seamless infinite scroll
  const scrollingAnnouncements = [
    ...announcements,
    ...announcements,
    ...announcements,
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Get user initial for avatar
  const userInitial = user?.name?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-card shadow-sm border-b border-border">
      {/* ── 1. ANNOUNCEMENT BAR ──────────────────────────────────── */}
      <div className="bg-primary text-primary-foreground py-1.5 overflow-hidden">
        <div className="flex w-max animate-marquee">
          {scrollingAnnouncements.map((text, index) => (
            <span
              key={index}
              className="mx-12 text-xs md:text-sm font-semibold whitespace-nowrap"
            >
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* ── 2. MAIN HEADER ───────────────────────────────────────── */}
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo + Mobile Menu Trigger */}
          <div className="flex items-center gap-3">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>

              {/* ── MOBILE DRAWER ── */}
              <SheetContent
                side="left"
                className="w-[300px] sm:w-[400px] overflow-y-auto"
              >
                <nav className="flex flex-col gap-4 mt-8">
                  <Link
                    to="/"
                    className="text-lg font-bold text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    to="/orders"
                    className="text-lg font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  <Link
                    to="/offers"
                    className="text-lg font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Special Offers
                  </Link>
                  <Link
                    to="/search?q=Festival"
                    className="text-lg font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Festival Season
                  </Link>
                  <Link
                    to="/search?q=Indian Fruits"
                    className="text-lg font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Indian Fruits
                  </Link>

                  <hr />

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Categories
                    </p>
                    <Link
                      to="/category/fruits-veg"
                      className="block py-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Fruits & Vegetables
                    </Link>
                    <Link
                      to="/category/meat"
                      className="block py-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Meat & Poultry
                    </Link>
                    <Link
                      to="/category/seafood"
                      className="block py-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Seafood
                    </Link>
                    <Link
                      to="/category/staples"
                      className="block py-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Rice & Flour
                    </Link>
                    <Link
                      to="/category/dairy"
                      className="block py-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dairy & Bakery
                    </Link>
                    <Link
                      to="/category/snacks"
                      className="block py-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Snacks & Drinks
                    </Link>
                  </div>

                  <hr />

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Get in Touch
                    </p>
                    <Link
                      to="/contact"
                      className="block py-2 text-lg font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Contact Us
                    </Link>
                    <a
                      href="tel:+353899899412"
                      className="flex items-center gap-2 py-2 text-primary font-medium"
                    >
                      <Phone className="h-5 w-5" />
                      +353 899899412
                    </a>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src={asianBasketLogo}
                alt="Asian Basket - Fresh Organic Authentic"
                className="h-20 md:h-24 w-auto object-contain group-hover:scale-105 transition-transform duration-200"
              />
            </Link>
          </div>

          {/* Search Bar — Desktop */}
          <div className="hidden md:flex flex-1 justify-center">
            <SearchBar />
          </div>

          {/* ── USER ACTIONS ── */}
          <div className="flex items-center gap-1 md:gap-3">
            {/* Wishlist — Desktop only */}

            {/* Account */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 pl-2 pr-3 bg-secondary/50 hover:bg-secondary text-primary rounded-full"
                  >
                    {/* Avatar circle with initial */}
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                      {userInitial}
                    </div>
                    <span className="hidden lg:inline-block max-w-[100px] truncate text-sm font-medium">
                      {user?.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                    My Account
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/orders")}>
                    <Package className="mr-2 h-4 w-4" /> My Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/profile?tab=addresses")}
                  >
                    <MapPin className="mr-2 h-4 w-4" /> Addresses
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button
                    variant="ghost"
                    className="hidden md:inline-flex items-center gap-2 font-medium hover:text-primary"
                  >
                    <User className="h-5 w-5" />
                    <span>Login</span>
                  </Button>
                </Link>
                {/* <Link to="/register">
                  <Button
                    variant="default"
                    className="hidden md:inline-flex items-center gap-2 font-medium rounded-full px-4"
                  >
                    Sign Up
                  </Button>
                </Link> */}
              </div>
            )}

            {/* Cart Button */}
            <Button
              onClick={() => setIsCartOpen(true)}
              className="relative bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-4 md:px-5 h-10 md:h-11 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <ShoppingBag className="h-5 w-5 md:mr-2" />
              <span className="hidden md:inline font-bold">My Cart</span>
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full border-2 border-background min-w-[20px] text-center">
                  {cartItems.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Search Bar — Mobile */}
        <div className="mt-3 md:hidden">
          <SearchBar />
        </div>
      </div>

      {/* ── 3. MEGA MENU (Desktop) ────────────────────────────────── */}
      <MegaMenu />

      <Cart isOpen={isCartOpen} setIsOpen={setIsCartOpen} />
    </header>
  );
};

export default Header;

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Loader2,
  Ticket,
  Plus,
  Store,
  Save,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/axios"; // ✅ Using axios instance ONLY

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
// import { useOrders } from "@/contexts/OrderContext";
import { useToast } from "@/hooks/use-toast";

// import { simulatePayment } from "@/lib/razorpay";
import {
  calculateDeliveryFee,
  CartItemWithMeta,
  DeliveryBreakdown,
} from "@/lib/deliveryUtils";
// import { decreaseStock } from "@/lib/stockUtils";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

/* ================================
   TYPES & SCHEMAS
================================ */
type SavedAddress = {
  id: number;
  label?: string;
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
};

const addressSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Phone number is required"),
  street: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(3, "Zip code is required"),
  country: z.string().min(2, "Country is required"), // ✅ ADD THIS
  notes: z.string().optional(),
  saveAddress: z.boolean().optional(),
  addressLabel: z.string().optional(),
});

type AddressForm = z.infer<typeof addressSchema>;

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  // const { createOrder } = useOrders();
  const { toast } = useToast();

  // Address State
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("manual");
  // Promo State
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<string | null>(null);
  const [promoError, setPromoError] = useState("");

  const [promoDiscountAmount, setPromoDiscountAmount] = useState(0);
  const [promoNewTotal, setPromoNewTotal] = useState<number | null>(null);

  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [deliveryBreakdown, setDeliveryBreakdown] =
    useState<DeliveryBreakdown | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      notes: "",
      country: "",
      saveAddress: false,
      addressLabel: "Home",
    },
  });

  // Watch fields
  const watchedCity = useWatch({ control, name: "city" });
  const watchedZipCode = useWatch({ control, name: "zipCode" });
  const watchedSaveAddress = useWatch({ control, name: "saveAddress" });

  /* ================================
     FETCH ADDRESSES - ✅ FIXED
  ================================ */
  const fetchAddresses = async () => {
    try {
      console.log("🚀 Fetching addresses...");
      setLoadingAddresses(true);
      const res = await api.get("auth/addresses/"); // ✅ Relative URL + auto token
      console.log("✅ Addresses loaded:", res.data);
      const addresses: SavedAddress[] = res.data;
      setSavedAddresses(addresses);

      if (selectedAddressId === "manual" && addresses.length > 0) {
        const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
        handleSelectAddress(defaultAddr.id.toString(), addresses);
      }
    } catch (err: any) {
      console.error(
        "❌ Fetch error:",
        err.response?.status,
        err.response?.data,
      );
      toast({
        title: "Failed to load addresses",
        description: `${err.response?.status || "Network"}: ${err.response?.data?.detail || "Check login"}`,
        variant: "destructive",
      });
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated]);

  // Pre-fill user details if no address selected
  useEffect(() => {
    if (user && selectedAddressId === "manual") {
      setValue("name", user.name || "");
      setValue("phone", user.phone || "");
    }
  }, [user, selectedAddressId, setValue]);

  /* ================================
     ADDRESS SELECTION LOGIC
  ================================ */
  const handleSelectAddress = (id: string, list = savedAddresses) => {
    setSelectedAddressId(id);

    if (id === "manual") {
      setValue("street", "");
      setValue("city", "");
      setValue("state", "");
      setValue("zipCode", "");
      setValue("saveAddress", false);
      if (user) {
        setValue("name", user.name || "");
        setValue("phone", user.phone || "");
      }
      return;
    }

    const addr = list.find((a) => a.id.toString() === id);

    if (addr) {
      setValue("name", addr.full_name || "");

      setValue("phone", addr.phone || "");

      setValue("street", addr.line1 + (addr.line2 ? ", " + addr.line2 : ""));

      setValue("city", addr.city || "");

      setValue("state", addr.state || "");

      setValue("zipCode", addr.zip_code || "");

      // ✅ THIS LINE IS THE MOST IMPORTANT FIX
      setValue("country", addr.country || "Ireland");

      console.log("Selected saved address:", addr);
    }
  };

  /* ================================
   DELIVERY CALCULATION (UPDATED)
================================ */

  const totalPrice = getTotalPrice();

  // ✅ convert cart to delivery format
  const cartItemsWithMeta: CartItemWithMeta[] = cartItems.map((item) => ({
    id: item.id,
    name: item.name,
    price: Number(item.price),
    quantity: Number(item.quantity),

    // ✅ CRITICAL FIX — ensures weight always exists
    weight: Number(item.weight) || 0,

    category: item.category || "",
  }));

  // ✅ calculate delivery whenever cart OR address changes
  useEffect(() => {
    if (!watchedCity || !watchedZipCode) {
      setDeliveryBreakdown(null);
      return;
    }

    const breakdown = calculateDeliveryFee(
      cartItemsWithMeta,
      watchedCity,
      watchedZipCode,
      totalPrice,
    );

    console.log("Delivery Breakdown:", breakdown);

    setDeliveryBreakdown(breakdown);
  }, [watchedCity, watchedZipCode, cartItems, totalPrice]);

  const deliveryFee = deliveryBreakdown?.total || 0;

  // Promo Calculation
  const promoDiscount = promoDiscountAmount;

  const grandTotal =
    promoNewTotal !== null
      ? Number(promoNewTotal) + Number(deliveryFee)
      : Number(totalPrice) + Number(deliveryFee);

  const handleApplyPromo = async () => {
    setPromoError("");

    if (!promoCode.trim()) {
      setPromoError("Please enter promo code");
      return;
    }

    try {
      const res = await api.post("auth/apply-promocode/", {
        // code: promoCode.trim().toUpperCase(),
        code: promoCode.trim(),
        cart_total: totalPrice,
      });

      setPromoApplied(res.data.code);
      setPromoDiscountAmount(parseFloat(res.data.discount_amount));
      setPromoNewTotal(parseFloat(res.data.new_total));

      toast({
        title: "Promo Applied 🎉",
        description: `You saved €${parseFloat(res.data.discount_amount).toFixed(2)}`,
      });

      setPromoCode("");
    } catch (err: any) {
      setPromoApplied(null);
      setPromoDiscountAmount(0);
      setPromoNewTotal(null);

      setPromoError(
        err.response?.data?.code ||
          err.response?.data?.detail ||
          "Invalid promo code",
      );
    }
  };

  /* ================================
     SAVE NEW ADDRESS - ✅ FIXED
  ================================ */
  const saveNewAddress = async (data: AddressForm) => {
    try {
      console.log("💾 Saving address..."); // DEBUG
      console.log("📍 Data:", data); // DEBUG

      const token = localStorage.getItem("access");
      console.log("🔑 Token exists:", !!token); // DEBUG

      const response = await api.post("auth/addresses/", {
        label: data.addressLabel || "Home",
        full_name: data.name,
        phone: data.phone,
        line1: data.street.includes(",")
          ? data.street.split(",")[0].trim()
          : data.street,
        line2: data.street.includes(",")
          ? data.street.split(",").slice(1).join(",").trim()
          : "",
        city: data.city,
        state: data.state,
        zip_code: data.zipCode,
        country: data.country,
        is_default: savedAddresses.length === 0, // First address = default
      });

      console.log("✅ SAVE RESPONSE:", response.data); // DEBUG
      toast({ title: "✅ Address saved successfully!" });
      await fetchAddresses(); // Refresh list
    } catch (err: any) {
      console.error("❌ SAVE ERROR FULL:", err.response?.data || err.message);
      console.error("❌ STATUS:", err.response?.status);
      console.error("❌ HEADERS:", err.response?.headers);

      toast({
        title: "Failed to save address",
        description:
          err.response?.data?.detail ||
          err.response?.data?.non_field_errors?.[0] ||
          "Please check your details and try again.",
        variant: "destructive",
      });
    }
  };

  /* ================================
     SUBMIT ORDER
  ================================ */

  const onSubmit = async (data: AddressForm) => {
    setIsProcessing(true);

    try {
      let addressPayload;

      if (selectedAddressId !== "manual") {
        const selected = savedAddresses.find(
          (addr) => addr.id.toString() === selectedAddressId,
        );

        if (!selected) {
          throw new Error("Selected address not found");
        }

        addressPayload = {
          name: selected.full_name,
          phone: selected.phone,
          address:
            selected.line1 + (selected.line2 ? ", " + selected.line2 : ""),
          city: selected.city,
          state: selected.state,
          pincode: selected.zip_code,
          country: selected.country,
        };
      } else {
        addressPayload = {
          name: data.name,
          phone: data.phone,
          address: data.street,
          city: data.city,
          state: data.state,
          pincode: data.zipCode,
          country: data.country,
        };

        if (data.saveAddress && savedAddresses.length < 3) {
          await saveNewAddress(data);
        }
      }

      const response = await api.post("auth/payment/create/", {
        currency: "EUR",

        ...addressPayload,

        subtotal: Number(totalPrice.toFixed(2)),
        discount: Number(promoDiscount.toFixed(2)),
        delivery_fee: Number(deliveryFee.toFixed(2)),
        total_amount: Number(grandTotal.toFixed(2)),

        items: cartItems.map((item) => ({
          name: item.name,
          quantity: Number(item.quantity),
          price: Number(item.price),
        })),
      });

      const checkout_url = response.data?.checkout_url;

      if (!checkout_url) {
        throw new Error("Checkout URL not received");
      }

      window.location.href = checkout_url;
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description:
          error.response?.data?.error ||
          error.message ||
          "Failed to create payment session",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 👇 KEEP THESE useEffects HERE

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login?return=/checkout");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // 👇 THEN loading return
  if (authLoading || loadingAddresses) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="ml-2">Loading checkout...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-[230px] md:pt-[240px] pb-16 px-4 max-w-6xl mx-auto">
        <Link
          to="/"
          className="flex items-center mb-6 text-muted-foreground hover:text-foreground mt-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-6">
              {/* ADDRESS SECTION */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>
                      <MapPin className="inline mr-2 h-5 w-5" /> Delivery
                      Address
                    </span>
                    {savedAddresses.length < 3 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/profile?return=/checkout")}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Manage
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Select a saved address or enter a new one.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {savedAddresses.length > 0 && (
                    <RadioGroup
                      value={selectedAddressId}
                      onValueChange={(val) => handleSelectAddress(val)}
                      className="grid gap-4"
                    >
                      {savedAddresses.map((addr) => (
                        <div
                          key={addr.id}
                          className={`
            group flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-sm
            ${
              selectedAddressId === addr.id.toString()
                ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                : "border-border hover:border-primary/50 hover:bg-accent/50"
            }
          `}
                        >
                          <RadioGroupItem
                            value={addr.id.toString()}
                            id={`addr-${addr.id}`}
                            className="mt-2 border-2 border-gray-300 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                          />

                          <Label
                            htmlFor={`addr-${addr.id}`}
                            className="flex-1 cursor-pointer leading-relaxed"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-base text-foreground">
                                {addr.label || "Saved Address"}
                              </span>
                              {addr.is_default && (
                                <span className="text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full">
                                  Default
                                </span>
                              )}
                            </div>

                            <div className="text-sm font-medium text-foreground mb-1">
                              {addr.full_name}, {addr.phone}
                            </div>

                            <div className="text-sm leading-relaxed text-foreground/90">
                              <span>{addr.line1}</span>
                              {addr.line2 && <span>, {addr.line2}</span>}
                              <br />
                              <span>{addr.city}</span>
                              {addr.state && (
                                <>
                                  <span>, {addr.state}</span>
                                </>
                              )}
                              <span> {addr.zip_code}</span>
                            </div>
                          </Label>
                        </div>
                      ))}

                      <div className="flex items-center gap-3 p-4 border-2 rounded-xl hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer">
                        <RadioGroupItem
                          value="manual"
                          id="addr-manual"
                          className="mt-2 border-2 border-gray-300 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                        />
                        <Label
                          htmlFor="addr-manual"
                          className="flex-1 cursor-pointer font-medium text-foreground"
                        >
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4 text-muted-foreground" />
                            Ship to a different address
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  )}

                  {selectedAddressId === "manual" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-sm font-medium">
                          Full Name *
                        </Label>
                        <Input
                          {...register("name")}
                          readOnly={selectedAddressId !== "manual"}
                          placeholder="John Doe"
                          className="h-11 text-base"
                        />
                        {errors.name && (
                          <p className="text-destructive text-xs mt-1">
                            {errors.name.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Phone Number *
                        </Label>
                        <Input
                          {...register("phone")}
                          readOnly={selectedAddressId !== "manual"}
                          placeholder="+91 98765 43210"
                          className="h-11 text-base"
                        />
                        {errors.phone && (
                          <p className="text-destructive text-xs mt-1">
                            {errors.phone.message}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-sm font-medium">
                          Street Address *
                        </Label>
                        <Input
                          {...register("street")}
                          readOnly={selectedAddressId !== "manual"}
                          placeholder="123 Main St, Apt 4B"
                          className="h-11 text-base"
                        />
                        {errors.street && (
                          <p className="text-destructive text-xs mt-1">
                            {errors.street.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">City *</Label>
                        <Input
                          {...register("city")}
                          readOnly={selectedAddressId !== "manual"}
                          placeholder="Dublin"
                          className="h-11 text-base"
                        />
                        {errors.city && (
                          <p className="text-destructive text-xs mt-1">
                            {errors.city.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">State *</Label>
                        <Input
                          {...register("state")}
                          readOnly={selectedAddressId !== "manual"}
                          placeholder="Dublin"
                          className="h-11 text-base"
                        />
                        {errors.state && (
                          <p className="text-destructive text-xs mt-1">
                            {errors.state.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Zip Code *
                        </Label>
                        <Input
                          {...register("zipCode")}
                          readOnly={selectedAddressId !== "manual"}
                          placeholder="X91H2TN"
                          className="h-11 text-base"
                        />
                        {errors.zipCode && (
                          <p className="text-destructive text-xs mt-1">
                            {errors.zipCode.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Country *</Label>
                        <Input
                          {...register("country")}
                          placeholder="Ireland"
                          className="h-11 text-base"
                        />
                        {errors.country && (
                          <p className="text-destructive text-xs mt-1">
                            {errors.country.message}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-sm font-medium">
                          Delivery Instructions (Optional)
                        </Label>
                        <Textarea
                          {...register("notes")}
                          placeholder="e.g. Leave at security gate, Call before delivery"
                          rows={2}
                          className="text-base resize-none"
                        />
                      </div>

                      {selectedAddressId === "manual" &&
                        savedAddresses.length < 3 && (
                          <div className="md:col-span-2 bg-accent/30 p-4 rounded-xl border">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                id="saveAddress"
                                checked={watchedSaveAddress}
                                onCheckedChange={(c) =>
                                  setValue("saveAddress", c as boolean)
                                }
                              />
                              <div>
                                <Label
                                  htmlFor="saveAddress"
                                  className="font-medium text-foreground cursor-pointer"
                                >
                                  Save this address for future orders
                                </Label>
                                {watchedSaveAddress && (
                                  <div className="mt-2 ml-7">
                                    <Label className="text-xs text-muted-foreground block mb-1">
                                      Label
                                    </Label>
                                    <Input
                                      {...register("addressLabel")}
                                      placeholder="Home"
                                      className="h-9 w-32 text-sm"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* PROMO CODE */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Ticket className="inline mr-2 h-5 w-5" /> Apply Promo Code
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {promoApplied ? (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-md flex justify-between items-center text-green-700">
                      <span>
                        <span className="font-bold">{promoApplied}</span>{" "}
                        applied (-€{promoDiscountAmount.toFixed(2)})
                      </span>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-700 hover:text-green-800 hover:bg-green-100"
                        onClick={() => {
                          setPromoApplied(null);
                          setPromoDiscountAmount(0);
                          setPromoNewTotal(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Input
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          placeholder="ENTER CODE"
                        />
                        <Button type="button" onClick={handleApplyPromo}>
                          Apply
                        </Button>
                      </div>

                      {promoError && (
                        <p className="text-red-500 text-sm">{promoError}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ORDER SUMMARY */}
            <div className="h-fit sticky top-24">
              <Card>
                {/* HEADER */}
                <CardHeader>
                  <CardTitle>
                    <CreditCard className="inline mr-2 h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>

                {/* CONTENT */}
                <CardContent className="space-y-4">
                  {/* SUBTOTAL */}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>

                    <span>€{totalPrice.toFixed(2)}</span>
                  </div>

                  {/* PROMO DISCOUNT */}
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                      <span>Discount</span>

                      <span>-€{promoDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  {/* DELIVERY FEE */}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>

                    <span>
                      {deliveryFee === 0
                        ? "FREE"
                        : `€${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>

                  {/* DELIVERY BREAKDOWN */}
                  {deliveryBreakdown && (
                    <div className="bg-muted/30 p-3 rounded-lg text-xs space-y-1">
                      {/* TOTAL WEIGHT */}
                      <div className="flex justify-between font-medium">
                        <span>Total Weight</span>

                        <span>
                          {deliveryBreakdown.totalWeight.toFixed(2)} kg
                        </span>
                      </div>

                      {/* DELIVERY MESSAGES */}
                      {deliveryBreakdown.messages.map((message, index) => (
                        <div key={index} className="text-muted-foreground">
                          {message}
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  {/* GRAND TOTAL */}
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>

                    <span>€{grandTotal.toFixed(2)}</span>
                  </div>

                  {/* PAY BUTTON */}
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isProcessing}
                    className="w-full mt-4"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Pay €${grandTotal.toFixed(2)}`
                    )}
                  </Button>

                  {/* FOOTER */}
                  <div className="text-xs text-center text-muted-foreground mt-4">
                    <Store className="inline w-3 h-3 mr-1" />
                    Secure checkout via Revolut
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;

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
  Truck,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/axios";
import EircodeInput from "@/components/EircodeInput";
import { EircodeResult } from "@/lib/eircodeUtils";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

import {
  calculateDeliveryFee,
  CartItemWithMeta,
  DeliveryBreakdown,
  DeliveryArea,
} from "@/lib/deliveryUtils";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

/* ─── Types & Schemas ─────────────────────────────────────────────────────── */

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
  name:         z.string().min(2, "Name is required"),
  phone:        z.string().min(10, "Phone number is required"),
  street:       z.string().min(5, "Street address is required"),
  city:         z.string().min(2, "City is required"),
  state:        z.string().min(2, "State is required"),
  zipCode:      z.string().min(3, "Zip code is required"),
  country:      z.string().min(2, "Country is required"),
  notes:        z.string().optional(),
  saveAddress:  z.boolean().optional(),
  addressLabel: z.string().optional(),
});

type AddressForm = z.infer<typeof addressSchema>;

/* ─── Component ───────────────────────────────────────────────────────────── */

const Checkout = () => {
  const navigate  = useNavigate();
  const { cartItems, getTotalPrice, clearCart, markCartConverted } = useCart();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast }  = useToast();

  /* ── State ── */
  const [savedAddresses, setSavedAddresses]       = useState<SavedAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses]   = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("manual");

  // ✅ NEW — delivery area selection (Dublin / Outside Dublin)
  const [deliveryArea, setDeliveryArea] = useState<DeliveryArea>("dublin");

  const [promoCode, setPromoCode]                   = useState("");
  const [promoApplied, setPromoApplied]             = useState<string | null>(null);
  const [promoError, setPromoError]                 = useState("");
  const [promoDiscountAmount, setPromoDiscountAmount] = useState(0);
  const [promoNewTotal, setPromoNewTotal]           = useState<number | null>(null);

  const [isProcessing, setIsProcessing]           = useState(false);
  const handleEircodeFilled = (result: EircodeResult) => {
    if (result.street)  setValue("street",  result.street,  { shouldValidate: true });
    if (result.city)    setValue("city",    result.city,    { shouldValidate: true });
    if (result.state)   setValue("state",   result.state,   { shouldValidate: true });
    if (result.zipCode) setValue("zipCode", result.zipCode, { shouldValidate: true });
    if (result.country) setValue("country", result.country, { shouldValidate: true });
  };
  const [deliveryBreakdown, setDeliveryBreakdown] = useState<DeliveryBreakdown | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: "", phone: "", street: "", city: "", state: "",
      zipCode: "", notes: "", country: "Ireland",
      saveAddress: false, addressLabel: "Home",
    },
  });

  const watchedSaveAddress = useWatch({ control, name: "saveAddress" });

  /* ── Fetch saved addresses ─────────────────────────────────────────────── */
  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const res = await api.get("auth/addresses/");
      const addresses: SavedAddress[] = res.data;
      setSavedAddresses(addresses);
      if (selectedAddressId === "manual" && addresses.length > 0) {
        const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
        handleSelectAddress(defaultAddr.id.toString(), addresses);
      }
    } catch (err: any) {
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
    if (isAuthenticated) fetchAddresses();
  }, [isAuthenticated]);

  useEffect(() => {
    if (user && selectedAddressId === "manual") {
      setValue("name",  user.name  || "");
      setValue("phone", user.phone || "");
    }
  }, [user, selectedAddressId, setValue]);

  /* ── Address selection ─────────────────────────────────────────────────── */
  const handleSelectAddress = (id: string, list = savedAddresses) => {
    setSelectedAddressId(id);
    if (id === "manual") {
      setValue("street", ""); setValue("city", ""); setValue("state", "");
      setValue("zipCode", ""); setValue("saveAddress", false);
      if (user) { setValue("name", user.name || ""); setValue("phone", user.phone || ""); }
      return;
    }
    const addr = list.find((a) => a.id.toString() === id);
    if (addr) {
      setValue("name",    addr.full_name);
      setValue("phone",   addr.phone);
      setValue("street",  addr.line1 + (addr.line2 ? ", " + addr.line2 : ""));
      setValue("city",    addr.city);
      setValue("state",   addr.state);
      setValue("zipCode", addr.zip_code);
      setValue("country", addr.country || "Ireland");
    }
  };

  /* ── Delivery calculation (re-runs when area OR cart changes) ──────────── */
  const totalPrice = getTotalPrice();

  const cartItemsWithMeta: CartItemWithMeta[] = cartItems.map((item) => ({
    id:       item.id,
    name:     item.name,
    price:    Number(item.price),
    quantity: Number(item.quantity),
    weight:   Number(item.weight) || 0,
    category: item.category || "",
  }));

  useEffect(() => {
    const breakdown = calculateDeliveryFee(cartItemsWithMeta, deliveryArea, totalPrice);
    setDeliveryBreakdown(breakdown);
  }, [deliveryArea, JSON.stringify(cartItems), totalPrice]);

  const deliveryFee  = deliveryBreakdown?.total || 0;
  const promoDiscount = promoDiscountAmount;
  const grandTotal   = promoNewTotal !== null
    ? Number(promoNewTotal) + Number(deliveryFee)
    : Number(totalPrice)   + Number(deliveryFee);

  /* ── Apply promo ───────────────────────────────────────────────────────── */
  const handleApplyPromo = async () => {
    setPromoError("");
    if (!promoCode.trim()) { setPromoError("Please enter promo code"); return; }
    try {
      const res = await api.post("auth/apply-promocode/", {
        code: promoCode.trim(),
        cart_total: totalPrice,
      });
      setPromoApplied(res.data.code);
      setPromoDiscountAmount(parseFloat(res.data.discount_amount));
      setPromoNewTotal(parseFloat(res.data.new_total));
      toast({ title: "Promo Applied 🎉", description: `You saved €${parseFloat(res.data.discount_amount).toFixed(2)}` });
      setPromoCode("");
    } catch (err: any) {
      setPromoApplied(null); setPromoDiscountAmount(0); setPromoNewTotal(null);
      setPromoError(err.response?.data?.code || err.response?.data?.detail || "Invalid promo code");
    }
  };

  /* ── Save new address ──────────────────────────────────────────────────── */
  const saveNewAddress = async (data: AddressForm) => {
    try {
      await api.post("auth/addresses/", {
        label:      data.addressLabel || "Home",
        full_name:  data.name,
        phone:      data.phone,
        line1:      data.street.includes(",") ? data.street.split(",")[0].trim() : data.street,
        line2:      data.street.includes(",") ? data.street.split(",").slice(1).join(",").trim() : "",
        city:       data.city,
        state:      data.state,
        zip_code:   data.zipCode,
        country:    data.country,
        is_default: savedAddresses.length === 0,
      });
      toast({ title: "✅ Address saved successfully!" });
      await fetchAddresses();
    } catch (err: any) {
      toast({
        title: "Failed to save address",
        description: err.response?.data?.detail || "Please check your details.",
        variant: "destructive",
      });
    }
  };

  /* ── Submit order ──────────────────────────────────────────────────────── */
  const onSubmit = async (data: AddressForm) => {
    setIsProcessing(true);
    try {
      let addressPayload;
      if (selectedAddressId !== "manual") {
        const selected = savedAddresses.find((a) => a.id.toString() === selectedAddressId);
        if (!selected) throw new Error("Selected address not found");
        addressPayload = {
          name:    selected.full_name,
          phone:   selected.phone,
          address: selected.line1 + (selected.line2 ? ", " + selected.line2 : ""),
          city:    selected.city,
          state:   selected.state,
          pincode: selected.zip_code,
          country: selected.country,
        };
      } else {
        addressPayload = {
          name: data.name, phone: data.phone, address: data.street,
          city: data.city, state: data.state, pincode: data.zipCode, country: data.country,
        };
        if (data.saveAddress && savedAddresses.length < 3) await saveNewAddress(data);
      }

      const response = await api.post("auth/payment/create/", {
        currency: "EUR",
        ...addressPayload,
        // ✅ Send delivery area to backend for server-side verification
        delivery_area:  deliveryArea,
        subtotal:       Number(totalPrice.toFixed(2)),
        discount:       Number(promoDiscount.toFixed(2)),
        delivery_fee:   Number(deliveryFee.toFixed(2)),
        total_amount:   Number(grandTotal.toFixed(2)),
        items: cartItems.map((item) => ({
          name:     item.name,
          quantity: Number(item.quantity),
          price:    Number(item.price),
          weight:   Number(item.weight) || 0,
          category: item.category || "",
        })),
      });

      const checkout_url = response.data?.checkout_url;
      if (!checkout_url) throw new Error("Checkout URL not received");

      // ✅ Mark cart as converted before leaving
      await markCartConverted();

      window.location.href = checkout_url;
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.response?.data?.error || error.message || "Failed to create payment session",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /* ── Guards ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login?return=/checkout");
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading || loadingAddresses) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="ml-2">Loading checkout...</p>
      </div>
    );
  }

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-[230px] md:pt-[240px] pb-16 px-4 max-w-6xl mx-auto">
        <Link to="/" className="flex items-center mb-6 text-muted-foreground hover:text-foreground mt-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid lg:grid-cols-3 gap-8">

            {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">

              {/* ── DELIVERY AREA SELECTION (Feature 4) ──────────────── */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    Delivery Area
                  </CardTitle>
                  <CardDescription>
                    Select your delivery area to see applicable charges.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Where are we delivering to? *</Label>
                    <Select
                      value={deliveryArea}
                      onValueChange={(val) => setDeliveryArea(val as DeliveryArea)}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select delivery area" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dublin">
                          <div className="flex flex-col">
                            <span className="font-semibold">Dublin</span>
                            <span className="text-xs text-muted-foreground">
                              Free delivery on orders ≥ €40 · €4.99 below €40
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="outside_dublin">
                          <div className="flex flex-col">
                            <span className="font-semibold">Outside Dublin</span>
                            <span className="text-xs text-muted-foreground">
                              €6.99 flat delivery charge
                            </span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Live delivery preview */}
                    {deliveryBreakdown && (
                      <div className={`mt-3 p-3 rounded-lg text-sm space-y-1 ${
                        deliveryBreakdown.total === 0
                          ? "bg-green-50 border border-green-200 text-green-700"
                          : "bg-blue-50 border border-blue-200 text-blue-700"
                      }`}>
                        {deliveryBreakdown.messages.map((msg, i) => (
                          <p key={i} className="flex items-center gap-1">
                            <span>{deliveryBreakdown.total === 0 ? "🎉" : "🚚"}</span>
                            {msg}
                          </p>
                        ))}
                        <p className="font-bold pt-1 border-t border-current/20">
                          Delivery: {deliveryBreakdown.total === 0 ? "FREE" : `€${deliveryBreakdown.total.toFixed(2)}`}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ── ADDRESS SECTION ──────────────────────────────────── */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>
                      <MapPin className="inline mr-2 h-5 w-5" />Delivery Address
                    </span>
                    {savedAddresses.length < 3 && (
                      <Button type="button" variant="outline" size="sm"
                        onClick={() => navigate("/profile?return=/checkout")}>
                        <Plus className="h-4 w-4 mr-1" /> Manage
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription>Select a saved address or enter a new one.</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {savedAddresses.length > 0 && (
                    <RadioGroup value={selectedAddressId}
                      onValueChange={(val) => handleSelectAddress(val)}
                      className="grid gap-4">
                      {savedAddresses.map((addr) => (
                        <div key={addr.id}
                          className={`group flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-sm ${
                            selectedAddressId === addr.id.toString()
                              ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                              : "border-border hover:border-primary/50 hover:bg-accent/50"
                          }`}>
                          <RadioGroupItem value={addr.id.toString()} id={`addr-${addr.id}`}
                            className="mt-2 border-2 border-gray-300 data-[state=checked]:border-primary data-[state=checked]:bg-primary" />
                          <Label htmlFor={`addr-${addr.id}`} className="flex-1 cursor-pointer leading-relaxed">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-base">{addr.label || "Saved Address"}</span>
                              {addr.is_default && (
                                <span className="text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-medium mb-1">{addr.full_name}, {addr.phone}</div>
                            <div className="text-sm leading-relaxed text-foreground/90">
                              {addr.line1}{addr.line2 && `, ${addr.line2}`}<br />
                              {addr.city}{addr.state && `, ${addr.state}`} {addr.zip_code}
                            </div>
                          </Label>
                        </div>
                      ))}

                      <div className="flex items-center gap-3 p-4 border-2 rounded-xl hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer">
                        <RadioGroupItem value="manual" id="addr-manual"
                          className="mt-2 border-2 border-gray-300 data-[state=checked]:border-primary data-[state=checked]:bg-primary" />
                        <Label htmlFor="addr-manual" className="flex-1 cursor-pointer font-medium">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4 text-muted-foreground" />
                            Ship to a different address
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  )}

                  {selectedAddressId === "manual" && (
                    <div className="md:col-span-2">
  		      <EircodeInput
    			onAddressFilled={handleEircodeFilled}
    			disabled={selectedAddressId !== "manual"}
  		       />
		    </div>

		   <div className="md:col-span-2">
  		     <div className="flex items-center gap-3">
    			<div className="flex-1 h-px bg-border" />
    			<span className="text-xs text-muted-foreground">or enter manually</span>
    			<div className="flex-1 h-px bg-border" />
  		     </div>
		        </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-sm font-medium">Full Name *</Label>
                        <Input {...register("name")} placeholder="John Doe" className="h-11 text-base" />
                        {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Phone Number *</Label>
                        <Input {...register("phone")} placeholder="+353 87 123 4567" className="h-11 text-base" />
                        {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>}
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-sm font-medium">Street Address *</Label>
                        <Input {...register("street")} placeholder="123 Main Street, Apt 4B" className="h-11 text-base" />
                        {errors.street && <p className="text-destructive text-xs mt-1">{errors.street.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">City *</Label>
                        <Input {...register("city")} placeholder="Dublin" className="h-11 text-base" />
                        {errors.city && <p className="text-destructive text-xs mt-1">{errors.city.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">County / State *</Label>
                        <Input {...register("state")} placeholder="Dublin" className="h-11 text-base" />
                        {errors.state && <p className="text-destructive text-xs mt-1">{errors.state.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Eircode / Zip *</Label>
                        <Input {...register("zipCode")} placeholder="D01 F5P2" className="h-11 text-base" />
                        {errors.zipCode && <p className="text-destructive text-xs mt-1">{errors.zipCode.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Country *</Label>
                        <Input {...register("country")} placeholder="Ireland" className="h-11 text-base" />
                        {errors.country && <p className="text-destructive text-xs mt-1">{errors.country.message}</p>}
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-sm font-medium">Delivery Instructions (Optional)</Label>
                        <Textarea {...register("notes")} placeholder="e.g. Leave at security gate, call before delivery"
                          rows={2} className="text-base resize-none" />
                      </div>
                      {savedAddresses.length < 3 && (
                        <div className="md:col-span-2 bg-accent/30 p-4 rounded-xl border">
                          <div className="flex items-start gap-3">
                            <Checkbox id="saveAddress" checked={watchedSaveAddress}
                              onCheckedChange={(c) => setValue("saveAddress", c as boolean)} />
                            <div>
                              <Label htmlFor="saveAddress" className="font-medium cursor-pointer">
                                Save this address for future orders
                              </Label>
                              {watchedSaveAddress && (
                                <div className="mt-2 ml-7">
                                  <Label className="text-xs text-muted-foreground block mb-1">Label</Label>
                                  <Input {...register("addressLabel")} placeholder="Home" className="h-9 w-32 text-sm" />
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

              {/* ── PROMO CODE ───────────────────────────────────────── */}
              <Card>
                <CardHeader>
                  <CardTitle><Ticket className="inline mr-2 h-5 w-5" />Apply Promo Code</CardTitle>
                </CardHeader>
                <CardContent>
                  {promoApplied ? (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-md flex justify-between items-center text-green-700">
                      <span><span className="font-bold">{promoApplied}</span> applied (-€{promoDiscountAmount.toFixed(2)})</span>
                      <Button variant="ghost" size="sm" className="text-green-700 hover:text-green-800 hover:bg-green-100"
                        onClick={() => { setPromoApplied(null); setPromoDiscountAmount(0); setPromoNewTotal(null); }}>
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="ENTER CODE" />
                        <Button type="button" onClick={handleApplyPromo}>Apply</Button>
                      </div>
                      {promoError && <p className="text-red-500 text-sm">{promoError}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── ORDER SUMMARY ────────────────────────────────────────── */}
            <div className="h-fit sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle><CreditCard className="inline mr-2 h-5 w-5" />Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>€{totalPrice.toFixed(2)}</span>
                  </div>

                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                      <span>Discount</span>
                      <span>-€{promoDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Delivery
                      <span className="ml-1 text-xs text-muted-foreground/70">
                        ({deliveryArea === "dublin" ? "Dublin" : "Outside Dublin"})
                      </span>
                    </span>
                    <span className={deliveryFee === 0 ? "text-green-600 font-semibold" : ""}>
                      {deliveryFee === 0 ? "FREE" : `€${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>

                  {/* Delivery breakdown detail */}
                  {deliveryBreakdown && deliveryBreakdown.messages.length > 0 && (
                    <div className="bg-muted/30 p-3 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between font-medium">
                        <span>Total Weight</span>
                        <span>{deliveryBreakdown.totalWeight.toFixed(2)} kg</span>
                      </div>
                      {deliveryBreakdown.messages.map((msg, i) => (
                        <div key={i} className="text-muted-foreground">{msg}</div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>€{grandTotal.toFixed(2)}</span>
                  </div>

                  <Button type="submit" size="lg" disabled={isProcessing} className="w-full mt-4">
                    {isProcessing ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                    ) : (
                      `Pay €${grandTotal.toFixed(2)}`
                    )}
                  </Button>

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

// ============================================================
// CREATE NEW FILE: src/components/admin/CustomerQuickSearch.tsx
// A standalone admin component — embed in your admin dashboard
// ============================================================

import { useState, useRef, useCallback } from "react";
import {
  Search, User, Mail, Phone, ShoppingBag,
  ChevronRight, X, Package, MapPin, Clock,
  TrendingUp, AlertCircle, CheckCircle, XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface CustomerResult {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  total_orders: number;
  total_spent: string | null;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: string;
}

interface Order {
  id: number;
  order_id: string;
  status: string;
  payment_status: string;
  total_amount: string;
  subtotal: string;
  discount: string;
  delivery_fee: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  items_count: number;
  items_preview: OrderItem[];
  created_at: string;
}

interface Address {
  id: number;
  label: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
}

interface CustomerDetail {
  customer: CustomerResult;
  orders: Order[];
  addresses: Address[];
}

/* ─── Status config ──────────────────────────────────────────────────────── */

const orderStatusConfig: Record<string, { color: string; bg: string; label: string }> = {
  PENDING:   { color: "text-yellow-700", bg: "bg-yellow-100", label: "Pending"   },
  PROCESSED: { color: "text-blue-700",   bg: "bg-blue-100",   label: "Processed" },
  SHIPPED:   { color: "text-purple-700", bg: "bg-purple-100", label: "Shipped"   },
  DELIVERED: { color: "text-green-700",  bg: "bg-green-100",  label: "Delivered" },
  CANCELLED: { color: "text-red-700",    bg: "bg-red-100",    label: "Cancelled" },
};

const paymentStatusConfig: Record<string, { color: string; icon: any }> = {
  PAID:    { color: "text-green-600", icon: CheckCircle },
  PENDING: { color: "text-yellow-600", icon: Clock },
  FAILED:  { color: "text-red-600",   icon: XCircle },
};

/* ─── Component ───────────────────────────────────────────────────────────── */

const CustomerQuickSearch = () => {
  const [query, setQuery]             = useState("");
  const [results, setResults]         = useState<CustomerResult[]>([]);
  const [selected, setSelected]       = useState<CustomerDetail | null>(null);
  const [searching, setSearching]     = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError]             = useState("");
  const [searched, setSearched]       = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Search ──────────────────────────────────────────────────────────── */
  const handleSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setSearched(false); return; }

    setSearching(true);
    setError("");
    setSelected(null);

    try {
      const res = await api.get(`auth/admin/customers/search/?q=${encodeURIComponent(q)}`);
      setResults(res.data);
      setSearched(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(val), 400);
  };

  /* ── Load customer detail ────────────────────────────────────────────── */
  const handleSelectCustomer = async (customerId: number) => {
    setLoadingDetail(true);
    setError("");
    try {
      const res = await api.get(`auth/admin/customers/${customerId}/`);
      setSelected(res.data);
    } catch (err: any) {
      setError("Failed to load customer details.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleClear = () => {
    setQuery(""); setResults([]); setSelected(null);
    setSearched(false); setError("");
  };

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">

      {/* ── Title ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <Search className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Customer Quick Search</h2>
          <p className="text-sm text-muted-foreground">
            Search by name, email, or phone number
          </p>
        </div>
      </div>

      {/* ── Search Bar ─────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={query}
          onChange={handleInputChange}
          placeholder="Search by name, email or phone..."
          className="pl-10 pr-10 h-12 text-base"
          autoFocus
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {searching && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          </div>
        )}
      </div>

      {/* ── Error ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* ── No results ─────────────────────────────────────────────────── */}
      {searched && results.length === 0 && !searching && (
        <div className="text-center py-8 text-muted-foreground">
          <User className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="font-medium">No customers found</p>
          <p className="text-sm">Try a different name, email, or phone number</p>
        </div>
      )}

      {/* ── Search Results ─────────────────────────────────────────────── */}
      {results.length > 0 && !selected && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">
            {results.length} result{results.length !== 1 ? "s" : ""} found
          </p>
          {results.map((customer) => (
            <Card
              key={customer.id}
              className="cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
              onClick={() => handleSelectCustomer(customer.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-sm">
                        {customer.full_name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{customer.full_name}</p>
                        {!customer.is_active && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {customer.email}
                        </span>
                        {customer.phone && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {customer.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold">
                        {customer.total_orders} order{customer.total_orders !== 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        €{parseFloat(customer.total_spent || "0").toFixed(2)} spent
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Loading detail ─────────────────────────────────────────────── */}
      {loadingDetail && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      )}

      {/* ── Customer Detail View ───────────────────────────────────────── */}
      {selected && !loadingDetail && (
        <div className="space-y-5">
          {/* Back button */}
          <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
            ← Back to results
          </Button>

          {/* Profile card */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-xl">
                    {selected.customer.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
                <div>
                  <p className="text-xl font-bold">{selected.customer.full_name}</p>
                  <p className="text-sm text-muted-foreground font-normal">
                    Customer since {new Date(selected.customer.created_at).toLocaleDateString("en-IE", {
                      month: "long", year: "numeric",
                    })}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selected.customer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selected.customer.phone || "—"}</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-muted/40 rounded-xl p-3 text-center">
                  <ShoppingBag className="h-5 w-5 mx-auto text-primary mb-1" />
                  <p className="text-xl font-bold">{selected.customer.total_orders}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
                <div className="bg-muted/40 rounded-xl p-3 text-center">
                  <TrendingUp className="h-5 w-5 mx-auto text-green-600 mb-1" />
                  <p className="text-xl font-bold">
                    €{parseFloat(selected.customer.total_spent || "0").toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                </div>
                <div className="bg-muted/40 rounded-xl p-3 text-center">
                  <MapPin className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                  <p className="text-xl font-bold">{selected.addresses.length}</p>
                  <p className="text-xs text-muted-foreground">Addresses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Saved addresses */}
          {selected.addresses.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Saved Addresses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selected.addresses.map((addr) => (
                  <div key={addr.id} className="p-3 bg-muted/30 rounded-lg text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{addr.label || "Address"}</span>
                      {addr.is_default && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground">
                      {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city} {addr.zip_code}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Order history */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Order History ({selected.orders.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selected.orders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No orders yet.</p>
              ) : (
                selected.orders.map((order) => {
                  const orderStatus   = orderStatusConfig[order.status]   || orderStatusConfig.PENDING;
                  const paymentStatus = paymentStatusConfig[order.payment_status] || paymentStatusConfig.PENDING;
                  const PayIcon       = paymentStatus.icon;

                  return (
                    <div key={order.id} className="border rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm">{order.order_id}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${orderStatus.bg} ${orderStatus.color}`}>
                            {orderStatus.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <PayIcon className={`h-4 w-4 ${paymentStatus.color}`} />
                          <span className={`text-sm font-bold ${paymentStatus.color}`}>
                            €{parseFloat(order.total_amount).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Items preview */}
                      <p className="text-xs text-muted-foreground">
                        {order.items_preview.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                        {order.items_count > 5 && ` +${order.items_count - 5} more`}
                      </p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {order.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(order.created_at).toLocaleDateString("en-IE", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CustomerQuickSearch;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart, Search, RefreshCw, Eye, Clock,
  CheckCircle, XCircle, AlertCircle, User, Phone, Mail,
} from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}

interface AbandonedCart {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: CartItem[];
  total_items: number;
  total_amount: string;
  status: "active" | "converted" | "expired";
  created_at: string;
  updated_at: string;
  converted_at: string | null;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const STATUS_CONFIG = {
  active:    { label: "Active",    icon: AlertCircle, className: "bg-amber-100 text-amber-700 border-amber-200" },
  converted: { label: "Converted", icon: CheckCircle, className: "bg-green-100 text-green-700 border-green-200" },
  expired:   { label: "Expired",   icon: XCircle,     className: "bg-gray-100  text-gray-600  border-gray-200"  },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (days  > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins  > 0) return `${mins}m ago`;
  return "just now";
}

/* ─── Component ─────────────────────────────────────────────────────────── */

const AbandonedCarts = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate  = useNavigate();
  const { toast } = useToast();

  const [carts, setCarts]           = useState<AbandonedCart[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected]     = useState<AbandonedCart | null>(null);

  /* ── Auth guard ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [authLoading, isAuthenticated, navigate]);

  /* ── Fetch ──────────────────────────────────────────────────────────── */
  const fetchCarts = async () => {
    setLoading(true);
    try {
      const res = await api.get("auth/admin/abandoned-carts/");
      setCarts(res.data);
    } catch (err: any) {
      toast({
        title: "Failed to load abandoned carts",
        description: err.response?.data?.detail || "Check your admin permissions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchCarts();
  }, [isAuthenticated]);

  /* ── Filter ─────────────────────────────────────────────────────────── */
  const filtered = carts.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.customer_name.toLowerCase().includes(q)  ||
      c.customer_email.toLowerCase().includes(q) ||
      c.customer_phone.includes(q);
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  /* ── Stats ──────────────────────────────────────────────────────────── */
  const stats = {
    total:     carts.length,
    active:    carts.filter((c) => c.status === "active").length,
    converted: carts.filter((c) => c.status === "converted").length,
    expired:   carts.filter((c) => c.status === "expired").length,
    totalValue: carts
      .filter((c) => c.status === "active")
      .reduce((sum, c) => sum + parseFloat(c.total_amount), 0),
  };

  /* ── Render ─────────────────────────────────────────────────────────── */
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-[230px] md:pt-[240px] pb-16 px-4 max-w-7xl mx-auto">

        {/* ── Title ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-7 w-7 text-primary" />
              Abandoned Carts
            </h1>
            <p className="text-muted-foreground mt-1">
              Customers who added items but didn't complete checkout
            </p>
          </div>
          <Button onClick={fetchCarts} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* ── Stats ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Carts",   value: stats.total,     color: "text-foreground" },
            { label: "Active",        value: stats.active,    color: "text-amber-600"  },
            { label: "Converted",     value: stats.converted, color: "text-green-600"  },
            { label: "Value at Risk", value: `€${stats.totalValue.toFixed(2)}`, color: "text-primary" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Filters ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── Table ─────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No abandoned carts found</p>
              <p className="text-sm mt-1">Try adjusting the filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((cart) => {
              const cfg = STATUS_CONFIG[cart.status];
              const Icon = cfg.icon;
              return (
                <Card key={cart.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4 px-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">

                      {/* Customer info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-semibold truncate">
                            {cart.customer_name || "Unknown"}
                          </span>
                          <Badge variant="outline" className={`text-xs shrink-0 ${cfg.className}`}>
                            <Icon className="h-3 w-3 mr-1" />
                            {cfg.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {cart.customer_email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />{cart.customer_email}
                            </span>
                          )}
                          {cart.customer_phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />{cart.customer_phone}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cart summary */}
                      <div className="flex items-center gap-6 text-sm shrink-0">
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Items</p>
                          <p className="font-semibold">{cart.total_items}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Value</p>
                          <p className="font-bold text-primary">€{parseFloat(cart.total_amount).toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Last seen
                          </p>
                          <p className="font-medium">{timeAgo(cart.updated_at)}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelected(cart)}
                        >
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer />

      {/* ── Detail Modal ─────────────────────────────────────────────── */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {selected && (() => {
            const cfg = STATUS_CONFIG[selected.status];
            const Icon = cfg.icon;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    Cart #{selected.id}
                    <Badge variant="outline" className={`ml-auto text-xs ${cfg.className}`}>
                      <Icon className="h-3 w-3 mr-1" />{cfg.label}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>

                {/* Customer */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" /> Customer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> {selected.customer_name || "—"}</p>
                    <p><span className="text-muted-foreground">Email:</span> {selected.customer_email || "—"}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {selected.customer_phone || "—"}</p>
                  </CardContent>
                </Card>

                {/* Items */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" /> Products ({selected.total_items} items)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selected.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No items</p>
                    ) : (
                      selected.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b last:border-0 text-sm">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {item.category && (
                              <p className="text-xs text-muted-foreground">{item.category}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <p className="font-semibold">€{(item.price * item.quantity).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} × €{Number(item.price).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div className="flex justify-between font-bold pt-2 text-sm">
                      <span>Total</span>
                      <span className="text-primary">€{parseFloat(selected.total_amount).toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Timestamps */}
                <div className="text-xs text-muted-foreground space-y-1 px-1">
                  <p>Created: {new Date(selected.created_at).toLocaleString()}</p>
                  <p>Last updated: {new Date(selected.updated_at).toLocaleString()}</p>
                  {selected.converted_at && (
                    <p>Converted: {new Date(selected.converted_at).toLocaleString()}</p>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AbandonedCarts;

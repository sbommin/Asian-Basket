import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, ShoppingBag, Download, RefreshCw,
  Euro, Package, Percent, Truck,
} from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface DailyRow  { date: string; orders: number; revenue: number; subtotal: number; discounts: number; delivery: number; }
interface MonthlyRow { month: string; label: string; orders: number; revenue: number; subtotal: number; discounts: number; delivery: number; }
interface VatRow    { month: string; label: string; orders: number; gross: number; food_net: number; food_vat: number; delivery_net: number; delivery_vat: number; total_vat: number; }
interface ProductRow { product: string; units_sold: number; revenue: number; orders: number; }

interface ReportData {
  summary: { total_orders: number; total_revenue: number; total_discounts: number; total_delivery: number; };
  daily:    DailyRow[];
  monthly:  MonthlyRow[];
  vat:      VatRow[];
  products: ProductRow[];
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const fmt = (n: number) => `€${n.toFixed(2)}`;

function exportCSV(rows: object[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map(r => headers.map(h => (r as any)[h]).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const CHART_COLORS = { revenue: "#16a34a", orders: "#2563eb", vat: "#dc2626", delivery: "#d97706" };

/* ─── Summary card ───────────────────────────────────────────────────────── */

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string; icon: any; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="bg-primary/10 p-2 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function SalesReports() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate  = useNavigate();
  const { toast } = useToast();

  const [data, setData]       = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays]       = useState("30");
  const [months, setMonths]   = useState("12");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [authLoading, isAuthenticated, navigate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`auth/admin/sales-report/?days=${days}&months=${months}`);
      setData(res.data);
    } catch (err: any) {
      toast({
        title: "Failed to load report",
        description: err.response?.data?.detail || "Check admin permissions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isAuthenticated) fetchReport(); }, [isAuthenticated, days, months]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading report…</span>
      </div>
    );
  }

  if (!data) return null;

  const totalVat = data.vat.reduce((s, r) => s + r.total_vat, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-[230px] md:pt-[240px] pb-16 px-4 max-w-7xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-primary" /> Sales Reports
            </h1>
            <p className="text-muted-foreground mt-1">Paid orders only · All amounts in EUR</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchReport}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* ── Summary cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Orders"     value={data.summary.total_orders.toString()} icon={ShoppingBag} sub="All time (paid)" />
          <StatCard label="Total Revenue"    value={fmt(data.summary.total_revenue)}  icon={Euro}       sub="All time" />
          <StatCard label="Total Discounts"  value={fmt(data.summary.total_discounts)} icon={Percent}    sub="All time" />
          <StatCard label="Delivery Income"  value={fmt(data.summary.total_delivery)}  icon={Truck}      sub="All time" />
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────── */}
        <Tabs defaultValue="daily">
          <TabsList className="mb-6">
            <TabsTrigger value="daily">Daily Sales</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Sales</TabsTrigger>
            <TabsTrigger value="vat">VAT Report</TabsTrigger>
            <TabsTrigger value="products">By Product</TabsTrigger>
          </TabsList>

          {/* ══ DAILY ══════════════════════════════════════════════════ */}
          <TabsContent value="daily">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Daily Sales</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={days} onValueChange={setDays}>
                    <SelectTrigger className="h-8 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="60">Last 60 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" className="h-8 text-xs"
                    onClick={() => exportCSV(data.daily, "daily-sales.csv")}>
                    <Download className="h-3 w-3 mr-1" /> CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {data.daily.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">No paid orders in this period.</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={data.daily} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `€${v}`} />
                        <Tooltip formatter={(v: number) => fmt(v)} />
                        <Legend />
                        <Bar dataKey="revenue"   name="Revenue"   fill={CHART_COLORS.revenue}  radius={[3,3,0,0]} />
                        <Bar dataKey="delivery"  name="Delivery"  fill={CHART_COLORS.delivery} radius={[3,3,0,0]} />
                        <Bar dataKey="discounts" name="Discounts" fill="#94a3b8"               radius={[3,3,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="mt-6 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground text-xs uppercase tracking-wide">
                            <th className="text-left py-2">Date</th>
                            <th className="text-right py-2">Orders</th>
                            <th className="text-right py-2">Subtotal</th>
                            <th className="text-right py-2">Discounts</th>
                            <th className="text-right py-2">Delivery</th>
                            <th className="text-right py-2">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...data.daily].reverse().map((r) => (
                            <tr key={r.date} className="border-b hover:bg-muted/30 transition-colors">
                              <td className="py-2 font-medium">{r.date}</td>
                              <td className="text-right py-2">{r.orders}</td>
                              <td className="text-right py-2">{fmt(r.subtotal)}</td>
                              <td className="text-right py-2 text-red-500">-{fmt(r.discounts)}</td>
                              <td className="text-right py-2">{fmt(r.delivery)}</td>
                              <td className="text-right py-2 font-bold text-green-700">{fmt(r.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-bold text-sm border-t-2">
                            <td className="py-2">Total</td>
                            <td className="text-right py-2">{data.daily.reduce((s,r)=>s+r.orders,0)}</td>
                            <td className="text-right py-2">{fmt(data.daily.reduce((s,r)=>s+r.subtotal,0))}</td>
                            <td className="text-right py-2 text-red-500">-{fmt(data.daily.reduce((s,r)=>s+r.discounts,0))}</td>
                            <td className="text-right py-2">{fmt(data.daily.reduce((s,r)=>s+r.delivery,0))}</td>
                            <td className="text-right py-2 text-green-700">{fmt(data.daily.reduce((s,r)=>s+r.revenue,0))}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══ MONTHLY ════════════════════════════════════════════════ */}
          <TabsContent value="monthly">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Monthly Sales</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={months} onValueChange={setMonths}>
                    <SelectTrigger className="h-8 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">Last 6 months</SelectItem>
                      <SelectItem value="12">Last 12 months</SelectItem>
                      <SelectItem value="24">Last 24 months</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" className="h-8 text-xs"
                    onClick={() => exportCSV(data.monthly, "monthly-sales.csv")}>
                    <Download className="h-3 w-3 mr-1" /> CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {data.monthly.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">No paid orders in this period.</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={data.monthly} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `€${v}`} />
                        <Tooltip formatter={(v: number) => fmt(v)} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue"  name="Revenue"  stroke={CHART_COLORS.revenue}  strokeWidth={2} dot />
                        <Line type="monotone" dataKey="delivery" name="Delivery" stroke={CHART_COLORS.delivery} strokeWidth={2} dot />
                      </LineChart>
                    </ResponsiveContainer>

                    <div className="mt-6 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground text-xs uppercase tracking-wide">
                            <th className="text-left py-2">Month</th>
                            <th className="text-right py-2">Orders</th>
                            <th className="text-right py-2">Subtotal</th>
                            <th className="text-right py-2">Discounts</th>
                            <th className="text-right py-2">Delivery</th>
                            <th className="text-right py-2">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...data.monthly].reverse().map((r) => (
                            <tr key={r.month} className="border-b hover:bg-muted/30 transition-colors">
                              <td className="py-2 font-medium">{r.label}</td>
                              <td className="text-right py-2">{r.orders}</td>
                              <td className="text-right py-2">{fmt(r.subtotal)}</td>
                              <td className="text-right py-2 text-red-500">-{fmt(r.discounts)}</td>
                              <td className="text-right py-2">{fmt(r.delivery)}</td>
                              <td className="text-right py-2 font-bold text-green-700">{fmt(r.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-bold text-sm border-t-2">
                            <td className="py-2">Total</td>
                            <td className="text-right py-2">{data.monthly.reduce((s,r)=>s+r.orders,0)}</td>
                            <td className="text-right py-2">{fmt(data.monthly.reduce((s,r)=>s+r.subtotal,0))}</td>
                            <td className="text-right py-2 text-red-500">-{fmt(data.monthly.reduce((s,r)=>s+r.discounts,0))}</td>
                            <td className="text-right py-2">{fmt(data.monthly.reduce((s,r)=>s+r.delivery,0))}</td>
                            <td className="text-right py-2 text-green-700">{fmt(data.monthly.reduce((s,r)=>s+r.revenue,0))}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══ VAT ════════════════════════════════════════════════════ */}
          <TabsContent value="vat">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">VAT Report</CardTitle>
                <Button size="sm" variant="outline" className="h-8 text-xs"
                  onClick={() => exportCSV(data.vat, "vat-report.csv")}>
                  <Download className="h-3 w-3 mr-1" /> CSV
                </Button>
              </CardHeader>
              <CardContent>
                {/* VAT notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800">
                  <p className="font-semibold mb-1">Irish VAT rules applied</p>
                  <p>Food items (groceries): <strong>0% VAT</strong> — zero-rated under Irish law.</p>
                  <p>Delivery charges: <strong>23% VAT</strong> — standard rate applies to delivery services.</p>
                  <p className="mt-1 text-xs">Consult your accountant to confirm rates for your specific product mix.</p>
                </div>

                {/* VAT summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4 pb-3">
                      <p className="text-xs text-muted-foreground">VAT on Delivery (23%)</p>
                      <p className="text-xl font-bold text-red-600 mt-1">{fmt(totalVat)}</p>
                      <p className="text-xs text-muted-foreground">last {months} months</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4 pb-3">
                      <p className="text-xs text-muted-foreground">Food Revenue (0%)</p>
                      <p className="text-xl font-bold mt-1">{fmt(data.vat.reduce((s,r)=>s+r.food_net,0))}</p>
                      <p className="text-xs text-muted-foreground">zero-rated</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4 pb-3">
                      <p className="text-xs text-muted-foreground">Delivery Net (ex VAT)</p>
                      <p className="text-xl font-bold mt-1">{fmt(data.vat.reduce((s,r)=>s+r.delivery_net,0))}</p>
                      <p className="text-xs text-muted-foreground">before 23% VAT</p>
                    </CardContent>
                  </Card>
                </div>

                {data.vat.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No paid orders in this period.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-xs uppercase tracking-wide">
                          <th className="text-left py-2">Month</th>
                          <th className="text-right py-2">Orders</th>
                          <th className="text-right py-2">Gross Revenue</th>
                          <th className="text-right py-2">Food (0%)</th>
                          <th className="text-right py-2">Delivery Net</th>
                          <th className="text-right py-2">VAT on Delivery</th>
                          <th className="text-right py-2">Total VAT Due</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...data.vat].reverse().map((r) => (
                          <tr key={r.month} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="py-2 font-medium">{r.label}</td>
                            <td className="text-right py-2">{r.orders}</td>
                            <td className="text-right py-2">{fmt(r.gross)}</td>
                            <td className="text-right py-2 text-green-700">{fmt(r.food_net)}</td>
                            <td className="text-right py-2">{fmt(r.delivery_net)}</td>
                            <td className="text-right py-2">{fmt(r.delivery_vat)}</td>
                            <td className="text-right py-2 font-bold text-red-600">{fmt(r.total_vat)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-bold text-sm border-t-2">
                          <td className="py-2">Total</td>
                          <td className="text-right py-2">{data.vat.reduce((s,r)=>s+r.orders,0)}</td>
                          <td className="text-right py-2">{fmt(data.vat.reduce((s,r)=>s+r.gross,0))}</td>
                          <td className="text-right py-2 text-green-700">{fmt(data.vat.reduce((s,r)=>s+r.food_net,0))}</td>
                          <td className="text-right py-2">{fmt(data.vat.reduce((s,r)=>s+r.delivery_net,0))}</td>
                          <td className="text-right py-2">{fmt(data.vat.reduce((s,r)=>s+r.delivery_vat,0))}</td>
                          <td className="text-right py-2 text-red-600">{fmt(totalVat)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══ PRODUCTS ═══════════════════════════════════════════════ */}
          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" /> Top Products by Revenue
                  <span className="text-xs text-muted-foreground font-normal">last {months} months</span>
                </CardTitle>
                <Button size="sm" variant="outline" className="h-8 text-xs"
                  onClick={() => exportCSV(data.products, "sales-by-product.csv")}>
                  <Download className="h-3 w-3 mr-1" /> CSV
                </Button>
              </CardHeader>
              <CardContent>
                {data.products.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">No sales data found.</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={data.products.slice(0, 10)}
                        layout="vertical"
                        margin={{ top: 4, right: 32, bottom: 0, left: 120 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `€${v}`} />
                        <YAxis type="category" dataKey="product" tick={{ fontSize: 11 }} width={115} />
                        <Tooltip formatter={(v: number) => fmt(v)} />
                        <Bar dataKey="revenue" name="Revenue" fill={CHART_COLORS.revenue} radius={[0,3,3,0]} />
                      </BarChart>
                    </ResponsiveContainer>

                    <Separator className="my-4" />

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground text-xs uppercase tracking-wide">
                            <th className="text-left py-2">#</th>
                            <th className="text-left py-2">Product</th>
                            <th className="text-right py-2">Units Sold</th>
                            <th className="text-right py-2">Orders</th>
                            <th className="text-right py-2">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.products.map((r, i) => (
                            <tr key={r.product} className="border-b hover:bg-muted/30 transition-colors">
                              <td className="py-2 text-muted-foreground">{i + 1}</td>
                              <td className="py-2 font-medium max-w-[220px] truncate">{r.product}</td>
                              <td className="text-right py-2">{r.units_sold}</td>
                              <td className="text-right py-2">{r.orders}</td>
                              <td className="text-right py-2 font-bold text-green-700">{fmt(r.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}

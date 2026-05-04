// ============================================================
// CREATE NEW FILE: src/components/MyCoupons.tsx
// Use this on your Profile page or Order Success page
// ============================================================

import { useEffect, useState } from "react";
import { Gift, Copy, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface UserCoupon {
  id: number;
  code: string;
  discount_amount: string;
  is_used: boolean;
  is_expired: boolean;
  is_valid: boolean;
  expires_at: string;
  source_order_id: string;
  created_at: string;
}

/* ─── Component ───────────────────────────────────────────────────────────── */

const MyCoupons = () => {
  const { toast } = useToast();
  const [coupons, setCoupons]   = useState<UserCoupon[]>([]);
  const [loading, setLoading]   = useState(true);
  const [copied, setCopied]     = useState<string | null>(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await api.get("auth/coupons/my/");
        setCoupons(res.data);
      } catch (err) {
        console.error("Failed to load coupons:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    toast({ title: "Copied!", description: `${code} copied to clipboard.` });
    setTimeout(() => setCopied(null), 2000);
  };

  const validCoupons   = coupons.filter((c) => c.is_valid);
  const usedCoupons    = coupons.filter((c) => c.is_used);
  const expiredCoupons = coupons.filter((c) => c.is_expired && !c.is_used);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <Gift className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">My Reward Coupons</h2>
          <p className="text-sm text-muted-foreground">
            Earn €5 for every €50 you spend — automatically!
          </p>
        </div>
      </div>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-green-800 font-medium mb-2">🎁 How reward coupons work:</p>
          <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
            <li>Spend €50 on any order → get a €5 coupon</li>
            <li>Spend €100 → get a €10 coupon (scales automatically)</li>
            <li>Coupons expire in 30 days</li>
            <li>One coupon per order, valid for your next purchase only</li>
          </ul>
        </CardContent>
      </Card>

      {/* ── No coupons yet ─────────────────────────────────────────────── */}
      {coupons.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold text-muted-foreground">No coupons yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Place an order of €50 or more to earn your first reward coupon!
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Valid coupons ───────────────────────────────────────────────── */}
      {validCoupons.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Available ({validCoupons.length})
          </h3>
          <div className="space-y-3">
            {validCoupons.map((coupon) => (
              <Card key={coupon.id} className="border-2 border-green-300 bg-green-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-green-700 font-bold text-lg">
                          €{parseFloat(coupon.discount_amount).toFixed(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-mono font-bold text-lg tracking-widest text-green-700">
                          {coupon.code}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          Expires {new Date(coupon.expires_at).toLocaleDateString("en-IE", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </div>
                        {coupon.source_order_id && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Earned from order {coupon.source_order_id}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-400 text-green-700 hover:bg-green-100 flex-shrink-0"
                      onClick={() => handleCopy(coupon.code)}
                    >
                      {copied === coupon.code ? (
                        <><CheckCircle className="h-4 w-4 mr-1" /> Copied!</>
                      ) : (
                        <><Copy className="h-4 w-4 mr-1" /> Copy</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Used coupons ────────────────────────────────────────────────── */}
      {usedCoupons.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Used ({usedCoupons.length})
          </h3>
          <div className="space-y-2">
            {usedCoupons.map((coupon) => (
              <Card key={coupon.id} className="opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <span className="font-mono font-semibold text-muted-foreground line-through">
                        {coupon.code}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        €{parseFloat(coupon.discount_amount).toFixed(2)} — Redeemed
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Expired coupons ─────────────────────────────────────────────── */}
      {expiredCoupons.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Expired ({expiredCoupons.length})
          </h3>
          <div className="space-y-2">
            {expiredCoupons.map((coupon) => (
              <Card key={coupon.id} className="opacity-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                    <div>
                      <span className="font-mono font-semibold text-muted-foreground line-through">
                        {coupon.code}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        €{parseFloat(coupon.discount_amount).toFixed(2)} — Expired
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCoupons;

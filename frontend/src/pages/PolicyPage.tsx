// ============================================================
// CREATE NEW FILE: src/pages/PolicyPage.tsx
// Single component used for both Terms & Conditions and Delivery Policy
// Route as: /terms  and  /delivery-policy
// ============================================================

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FileText, Truck, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import api from "@/lib/axios";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Policy {
  id: number;
  policy_type: string;
  policy_type_display: string;
  title: string;
  content: string;
  last_updated: string;
}

/* ─── Config ─────────────────────────────────────────────────────────────── */

const policyConfig: Record<string, { icon: any; color: string; bg: string }> = {
  terms: {
    icon:  FileText,
    color: "text-blue-600",
    bg:    "bg-blue-50",
  },
  delivery: {
    icon:  Truck,
    color: "text-green-600",
    bg:    "bg-green-50",
  },
};

/* ─── Component ───────────────────────────────────────────────────────────── */

const PolicyPage = ({ policyType }: { policyType: "terms" | "delivery" }) => {
  const [policy, setPolicy]   = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const config   = policyConfig[policyType];
  const Icon     = config.icon;

  useEffect(() => {
    const fetchPolicy = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`auth/policies/${policyType}/`);
        setPolicy(res.data);
      } catch (err: any) {
        setError(
          err.response?.status === 404
            ? "This policy has not been set up yet. Please check back later."
            : "Failed to load policy. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, [policyType]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-[188px] md:pt-[200px] pb-16 px-4">
        <div className="max-w-3xl mx-auto">

          {/* Back */}
          <Link
            to="/"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Policy content */}
          {!loading && policy && (
            <div className="space-y-6">

              {/* Header */}
              <div className={`flex items-center gap-4 p-6 rounded-2xl ${config.bg}`}>
                <div className={`w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm`}>
                  <Icon className={`h-7 w-7 ${config.color}`} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{policy.title}</h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3.5 w-3.5" />
                    Last updated{" "}
                    {new Date(policy.last_updated).toLocaleDateString("en-IE", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Content */}
              <Card className="shadow-sm">
                <CardContent className="pt-6 pb-8 px-6 md:px-8">
                  <div
                    className="prose prose-sm max-w-none
                      prose-headings:font-bold prose-headings:text-foreground
                      prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3
                      prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
                      prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
                      prose-li:text-muted-foreground prose-li:leading-relaxed
                      prose-ul:my-3 prose-ol:my-3
                      prose-strong:text-foreground
                      prose-a:text-primary prose-a:underline"
                    dangerouslySetInnerHTML={{ __html: policy.content }}
                  />
                </CardContent>
              </Card>

              {/* Footer note */}
              <p className="text-xs text-center text-muted-foreground">
                Asian Basket · asianbasket.ie ·{" "}
                {new Date(policy.last_updated).toLocaleDateString("en-IE", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PolicyPage;

// import { useEffect, useState } from "react";
// import { useSearchParams, useNavigate } from "react-router-dom";
// import api from "@/lib/axios";
// import Header from "@/components/Header";
// import Footer from "@/components/Footer";
// import { Loader2, CheckCircle } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { useCart } from "@/contexts/CartContext";

// type PaymentStatus = "VERIFYING" | "SUCCESS" | "FAILED";

// const PaymentSuccess = () => {
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const { clearCart } = useCart();

//   const orderId = searchParams.get("order_id");
//   const [status, setStatus] = useState<PaymentStatus>("VERIFYING");

//   useEffect(() => {
//     if (!orderId) {
//       setStatus("FAILED");
//       return;
//     }

//     let isCancelled = false;

//     const verifyWithRetry = async () => {
//       let attempts = 0;

//       while (attempts < 5 && !isCancelled) {
//         try {
//           const res = await api.post("auth/payment/verify/", {
//             order_id: orderId,
//           });

//           console.log("VERIFY RESPONSE:", res.data);

//           if (res.data.payment_status === "PAID") {
//             if (isCancelled) return;
//             clearCart();
//             setStatus("SUCCESS");
//             return;
//           }
//         } catch (err) {
//           console.error("Verify error:", err);
//         }

//         attempts++;
//         await new Promise((resolve) => setTimeout(resolve, 2000));
//       }

//       if (!isCancelled) {
//         setStatus("FAILED");
//       }
//     };

//     verifyWithRetry();

//     return () => {
//       isCancelled = true;
//     };
//   }, [orderId, navigate]);

//   return (
//     <div className="min-h-screen flex flex-col">
//       <Header />

//       <div className="flex flex-col items-center justify-center flex-1 px-4">
//         {status === "VERIFYING" && (
//           <>
//             <Loader2 className="animate-spin w-16 h-16 mb-4" />
//             <h2 className="text-xl font-semibold mb-2">
//               Verifying your payment...
//             </h2>
//             <p className="text-sm text-muted-foreground text-center max-w-md">
//               This may take a few seconds. Please do not close this window.
//             </p>
//           </>
//         )}

//         {status === "SUCCESS" && (
//           <>
//             <CheckCircle className="text-green-500 w-20 h-20 mb-4" />
//             <h1 className="text-3xl font-bold text-green-600 mb-2">
//               Payment Successful
//             </h1>
//             <p className="text-sm text-muted-foreground mb-4">
//               Order ID: {orderId}
//             </p>
//             <Button onClick={() => navigate("/")}>Back to home</Button>
//           </>
//         )}

//         {status === "FAILED" && (
//           <>
//             <h1 className="text-3xl font-bold text-red-600 mb-2">
//               Payment Failed or Pending
//             </h1>
//             <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
//               We could not verify your payment automatically. If money has been
//               deducted from your account, please contact support with your order
//               ID.
//             </p>
//             <Button variant="outline" onClick={() => navigate("/")}>
//               Back to home
//             </Button>
//             {!orderId && (
//               <p className="text-xs text-muted-foreground mt-2">
//                 Missing order ID in URL.
//               </p>
//             )}
//           </>
//         )}
//       </div>

//       <Footer />
//     </div>
//   );
// };

// export default PaymentSuccess;
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

type PaymentStatus = "VERIFYING" | "SUCCESS" | "FAILED" | "PENDING";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const orderId = searchParams.get("order_id");
  const [status, setStatus] = useState<PaymentStatus>("VERIFYING");
  const [attemptCount, setAttemptCount] = useState(0);

  useEffect(() => {
    if (!orderId) {
      setStatus("FAILED");
      return;
    }

    let isCancelled = false;
    const MAX_ATTEMPTS = 8;
    const DELAY_MS = 3000;

    const verifyWithRetry = async () => {
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        if (isCancelled) return;

        try {
          setAttemptCount(attempt + 1);

          const res = await api.post("auth/payment/verify/", {
            order_id: orderId,
          });

          const paymentStatus = res.data.payment_status;

          if (paymentStatus === "PAID") {
            if (isCancelled) return;
            clearCart();
            setStatus("SUCCESS");
            return;
          }

          // If explicitly failed, stop retrying
          if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED") {
            if (!isCancelled) setStatus("FAILED");
            return;
          }

          // PENDING or unknown — keep retrying
        } catch (err: any) {
          console.error(`Attempt ${attempt + 1} failed:`, err?.response?.data || err);
        }

        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }

      // Exhausted retries but no explicit failure — show PENDING
      if (!isCancelled) setStatus("PENDING");
    };

    verifyWithRetry();
    return () => { isCancelled = true; };
  }, [orderId]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* ── Main Content ── */}
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8 flex flex-col items-center text-center">

          {/* ── VERIFYING ── */}
          {status === "VERIFYING" && (
            <>
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Verifying Payment
              </h1>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Please wait while we confirm your payment with our provider.
                This usually takes a few seconds.
              </p>
              {orderId && (
                <div className="bg-gray-50 rounded-lg px-4 py-2 w-full">
                  <p className="text-xs text-gray-400">Order ID</p>
                  <p className="text-sm font-mono font-medium text-gray-700 break-all">
                    {orderId}
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-4">
                Attempt {attemptCount} of 8 — Do not close this window
              </p>
            </>
          )}

          {/* ── SUCCESS ── */}
          {status === "SUCCESS" && (
            <>
              <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-green-600 mb-2">
                Payment Successful!
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                Thank you for your order. We've received your payment and will
                process your order shortly.
              </p>
              {orderId && (
                <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3 w-full mb-6">
                  <p className="text-xs text-green-600 font-medium">Order ID</p>
                  <p className="text-sm font-mono font-semibold text-green-800 break-all">
                    {orderId}
                  </p>
                </div>
              )}
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => navigate("/")}
              >
                Continue Shopping
              </Button>
            </>
          )}

          {/* ── PENDING (retries exhausted but not explicitly failed) ── */}
          {status === "PENDING" && (
            <>
              <div className="w-20 h-20 rounded-full bg-yellow-50 flex items-center justify-center mb-6">
                <Clock className="w-10 h-10 text-yellow-500" />
              </div>
              <h1 className="text-2xl font-bold text-yellow-600 mb-2">
                Payment Pending
              </h1>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Your payment is still being processed. If money has been
                deducted from your account, your order will be confirmed shortly.
                You'll receive a confirmation email.
              </p>
              {orderId && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-4 py-3 w-full mb-6">
                  <p className="text-xs text-yellow-600 font-medium">Order ID — Save this</p>
                  <p className="text-sm font-mono font-semibold text-yellow-800 break-all">
                    {orderId}
                  </p>
                </div>
              )}
              <div className="flex flex-col gap-3 w-full">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Check Again
                </Button>
                <Button
                  className="w-full"
                  variant="ghost"
                  onClick={() => navigate("/")}
                >
                  Back to Home
                </Button>
              </div>
            </>
          )}

          {/* ── FAILED ── */}
          {status === "FAILED" && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-red-600 mb-2">
                Payment Failed
              </h1>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                We could not verify your payment. If money was deducted from
                your account, please contact our support team with your Order ID.
              </p>
              {orderId ? (
                <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 w-full mb-6">
                  <p className="text-xs text-red-500 font-medium">Order ID</p>
                  <p className="text-sm font-mono font-semibold text-red-800 break-all">
                    {orderId}
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 w-full mb-6">
                  <p className="text-xs text-red-500">
                    No Order ID found in URL. Please contact support.
                  </p>
                </div>
              )}
              <div className="flex flex-col gap-3 w-full">
                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => navigate("/")}
                >
                  Back to Home
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-sm"
                  onClick={() => navigate("/contact")}
                >
                  Contact Support
                </Button>
              </div>
            </>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentSuccess;

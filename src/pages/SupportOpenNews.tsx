import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { HeartHandshake, MessageSquareWarning } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { name?: string; email?: string };
  notes?: Record<string, string>;
  theme?: { color: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export default function SupportOpenNews() {
  const [amount, setAmount] = useState<string>("100");
  const [donorName, setDonorName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState<boolean>(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => toast.error("Failed to load payment gateway.");
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const numericAmount = useMemo(() => Number(amount), [amount]);

  const validateEmail = (value: string) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);

  const handleDonate = async () => {
    const trimmedEmail = email.trim();
    const trimmedName = donorName.trim();

    if (!Number.isFinite(numericAmount) || numericAmount < 50) {
      toast.error("Minimum donation amount is ₹50");
      return;
    }

    if (!trimmedEmail || !validateEmail(trimmedEmail)) {
      toast.error("Please enter a valid email to receive a thank-you message.");
      return;
    }

    if (!razorpayLoaded || !window.Razorpay) {
      toast.error("Payment gateway is still loading. Please try again.");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
        body: {
          amount: Math.round(numericAmount),
          email: trimmedEmail,
          donorName: trimmedName || null,
          isAnonymous,
          donationType: "one-time",
        },
      });

      if (error || !data?.orderId) {
        toast.error(data?.error || "Failed to create donation order.");
        return;
      }

      const razorpay = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "OpenNews",
        description: "Support OpenNews",
        order_id: data.orderId,
        prefill: {
          name: trimmedName || undefined,
          email: trimmedEmail,
        },
        notes: {
          donation_type: "one-time",
          anonymous: String(isAnonymous),
        },
        theme: { color: "#10b981" },
        modal: {
          ondismiss: () => {
            toast.info("Donation checkout closed.");
          },
        },
        handler: async (response) => {
          const verifyResult = await supabase.functions.invoke("verify-razorpay-payment", {
            body: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
          });

          if (verifyResult.error) {
            toast.error("Payment verification failed. Please contact support if amount was debited.");
            return;
          }

          toast.success("Thank you for supporting OpenNews! Receipt confirmation will be sent to your email.");
          setDonorName("");
          setAmount("100");
          setIsAnonymous(false);
        },
      });

      razorpay.open();
    } catch (paymentError) {
      console.error(paymentError);
      toast.error("Unable to start donation checkout right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      <div className="h-14" />

      <main className="container mx-auto max-w-4xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <HeartHandshake className="w-6 h-6 text-primary" />
              Support OpenNews
            </CardTitle>
            <CardDescription>
              Help build independent, unbiased, and public-interest journalism infrastructure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              OpenNews is designed as an open-source civic media layer. Your support helps maintain verification pipelines,
              public archives, and transparent journalism tooling.
            </p>

            <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="donation-amount">Donation Amount (₹)</Label>
                <Input
                  id="donation-amount"
                  type="number"
                  min={50}
                  step={10}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Minimum ₹50"
                />
                <p className="text-xs text-muted-foreground">Minimum donation is ₹50.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="donor-name">Name (optional)</Label>
                <Input
                  id="donor-name"
                  type="text"
                  value={donorName}
                  onChange={(event) => setDonorName(event.target.value)}
                  placeholder="Your name"
                  disabled={isAnonymous}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="donor-email">Email</Label>
                <Input
                  id="donor-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div className="flex items-center gap-2 md:col-span-2">
                <Checkbox
                  id="donate-anonymous"
                  checked={isAnonymous}
                  onCheckedChange={(checked) => setIsAnonymous(Boolean(checked))}
                />
                <Label htmlFor="donate-anonymous" className="text-sm">
                  Donate anonymously
                </Label>
              </div>

              <div className="md:col-span-2">
                <Button onClick={handleDonate} disabled={submitting}>
                  {submitting ? "Starting checkout..." : "Donate with Razorpay"}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <a href="mailto:support@newstack.live?subject=Support%20OpenNews%20Initiative">Support via Email</a>
              </Button>
              <Button asChild variant="outline">
                <Link to="/public-grievances" className="inline-flex items-center gap-2">
                  <MessageSquareWarning className="w-4 h-4" />
                  File Public Grievance
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

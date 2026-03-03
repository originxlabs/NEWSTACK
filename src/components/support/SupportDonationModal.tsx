import { useEffect, useMemo, useState, type ReactNode } from "react";
import { HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string };
  notes?: Record<string, string>;
  theme?: { color: string };
  modal?: { ondismiss?: () => void };
  handler: (response: RazorpayResponse) => void | Promise<void>;
}

interface RazorpayInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface SupportDonationModalProps {
  trigger?: ReactNode;
}

const CHECKOUT_SCRIPT_ID = "razorpay-checkout-script";

export function SupportDonationModal({ trigger }: SupportDonationModalProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("100");
  const [donorName, setDonorName] = useState("");
  const [email, setEmail] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }

    const existing = document.getElementById(CHECKOUT_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      const onLoad = () => setRazorpayLoaded(true);
      existing.addEventListener("load", onLoad);
      return () => existing.removeEventListener("load", onLoad);
    }

    const script = document.createElement("script");
    script.id = CHECKOUT_SCRIPT_ID;
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => toast.error("Failed to load payment gateway.");
    document.body.appendChild(script);
  }, [open]);

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
        handler: async (response: RazorpayResponse) => {
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

          toast.success("Thank you for supporting OpenNews! A thank-you email will be sent shortly.");
          setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="inline-flex items-center gap-2">
            <HeartHandshake className="w-4 h-4" />
            Support OpenNews
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-primary" />
            Support OpenNews
          </DialogTitle>
          <DialogDescription>
            Make an anonymous or named donation. Minimum amount is ₹50.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
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

          <div className="flex items-center gap-2">
            <Checkbox
              id="donate-anonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(Boolean(checked))}
            />
            <Label htmlFor="donate-anonymous" className="text-sm">
              Donate anonymously
            </Label>
          </div>

          <Button onClick={handleDonate} disabled={submitting}>
            {submitting ? "Starting checkout..." : "Donate with Razorpay"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

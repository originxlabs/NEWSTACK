import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Phone, Shield, Loader2, CheckCircle2, 
  MapPin, AlertCircle, FileText, Cookie
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface IngestionAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (accessUserId: string) => void;
}

type Step = "form" | "otp" | "success";

export function IngestionAccessModal({ isOpen, onClose, onSuccess }: IngestionAccessModalProps) {
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [cookiesAccepted, setCookiesAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accessUserId, setAccessUserId] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user location
  const getLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 5000 }
      );
    });
  };

  const handleSubmitForm = async () => {
    if (!email || !termsAccepted || !cookiesAccepted) {
      toast.error("Please fill all required fields and accept terms");
      return;
    }

    setIsLoading(true);
    try {
      // Get location
      const loc = await getLocation();
      setLocation(loc);

      // Collect device info
      const deviceInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      // Create or update access user
      const { data: existingUser, error: checkErr } = await supabase
        .from("ingestion_access_users")
        .select("id")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      let userId: string;

      if (existingUser) {
        // Update existing user
        const { error: updateErr } = await supabase
          .from("ingestion_access_users")
          .update({
            phone: phone || null,
            device_info: deviceInfo,
            location: loc,
            terms_accepted: true,
            cookie_policy_accepted: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingUser.id);

        if (updateErr) throw updateErr;
        userId = existingUser.id;
      } else {
        // Create new user
        const { data: newUser, error: insertErr } = await supabase
          .from("ingestion_access_users")
          .insert({
            email: email.toLowerCase(),
            phone: phone || null,
            device_info: deviceInfo,
            location: loc,
            user_agent: navigator.userAgent,
            terms_accepted: true,
            cookie_policy_accepted: true,
          })
          .select("id")
          .single();

        if (insertErr) throw insertErr;
        userId = newUser.id;
      }

      setAccessUserId(userId);

      // Send OTP
      const { error: otpErr } = await supabase.functions.invoke("send-otp", {
        body: { email: email.toLowerCase(), purpose: "ingestion_access" },
      });

      if (otpErr) throw otpErr;

      toast.success("OTP sent to your email");
      setStep("otp");
    } catch (err) {
      console.error("Failed to submit form:", err);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { email: email.toLowerCase(), otp, purpose: "ingestion_access" },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || "Invalid OTP");
      }

      // Update user as verified
      await supabase
        .from("ingestion_access_users")
        .update({
          is_verified: true,
          otp_verified_at: new Date().toISOString(),
        })
        .eq("id", accessUserId);

      setStep("success");
      toast.success("Verification successful!");

      // Delay before closing
      setTimeout(() => {
        if (accessUserId) {
          onSuccess(accessUserId);
        }
        onClose();
      }, 1500);
    } catch (err) {
      console.error("OTP verification failed:", err);
      toast.error(err instanceof Error ? err.message : "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep("form");
    setEmail("");
    setPhone("");
    setOtp("");
    setTermsAccepted(false);
    setCookiesAccepted(false);
    setAccessUserId(null);
    setLocation(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Ingestion Access
          </DialogTitle>
          <DialogDescription>
            Verify your identity to run the RSS ingestion pipeline
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                    I agree to the{" "}
                    <a href="/terms" target="_blank" className="text-primary underline">
                      Terms of Service
                    </a>{" "}
                    and understand that my access will be logged.
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="cookies"
                    checked={cookiesAccepted}
                    onCheckedChange={(checked) => setCookiesAccepted(checked === true)}
                  />
                  <label htmlFor="cookies" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                    I accept the{" "}
                    <a href="/privacy" target="_blank" className="text-primary underline">
                      Cookie Policy
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" target="_blank" className="text-primary underline">
                      Privacy Policy
                    </a>
                    .
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>Your location and device information will be recorded for security purposes.</span>
              </div>

              <Button
                onClick={handleSubmitForm}
                disabled={isLoading || !email || !termsAccepted || !cookiesAccepted}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Send OTP
              </Button>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code sent to
                </p>
                <p className="font-medium">{email}</p>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value)}
                >
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                onClick={handleVerifyOtp}
                disabled={isLoading || otp.length !== 6}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Verify OTP
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("form")}
                className="w-full"
              >
                Back to form
              </Button>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Verification Complete!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You now have access to the ingestion pipeline.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

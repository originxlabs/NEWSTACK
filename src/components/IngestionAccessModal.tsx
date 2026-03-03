import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Phone, Shield, Loader2, CheckCircle2, 
  MapPin, Clock, QrCode, Lock
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
import { useAuth } from "@/contexts/AuthContext";
import { useNewsroomRole } from "@/hooks/use-newsroom-role";

interface IngestionAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (accessUserId: string) => void;
}

type Step = "form" | "otp" | "success";
const MANUAL_INGESTION_SESSION_MINUTES = 15;

export function IngestionAccessModal({ isOpen, onClose, onSuccess }: IngestionAccessModalProps) {
  const { user } = useAuth();
  const { isAdmin } = useNewsroomRole();
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [cookiesAccepted, setCookiesAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accessUserId, setAccessUserId] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [phoneRequired, setPhoneRequired] = useState(false);

  const allowedAdminEmails = useMemo(
    () =>
      ((import.meta.env.VITE_INGESTION_ADMIN_EMAILS as string | undefined) || "hello@abhishekpanda.com")
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    [],
  );

  const userEmail = (user?.email || "").toLowerCase();
  const isAllowedAdminEmail = !!userEmail && allowedAdminEmails.includes(userEmail);
  const canRequestAccess = !!user && isAdmin && isAllowedAdminEmail;

  // Check if user has previously verified (for re-verification flow)
  useEffect(() => {
    if (isOpen) {
      if (userEmail) {
        setEmail(userEmail);
      }
      const storedUserId = localStorage.getItem("ingestion_access_user_id");
      const storedExpiry = localStorage.getItem("ingestion_access_expiry");
      
      // If there was a previous session that expired, require phone
      if (storedUserId && storedExpiry) {
        const expiry = new Date(storedExpiry);
        if (expiry <= new Date()) {
          // Session expired - this is a returning user
          setIsReturningUser(true);
          setPhoneRequired(true);
        }
      }
    }
  }, [isOpen, userEmail]);

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
    if (!canRequestAccess) {
      toast.error("Only allowlisted newsroom admins can request ingestion access.");
      return;
    }

    if (!email || !termsAccepted || !cookiesAccepted) {
      toast.error("Please fill all required fields and accept terms");
      return;
    }

    // For returning users, phone is required
    if (phoneRequired && !phone) {
      toast.error("Mobile number is required for re-verification");
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
        .select("id, is_verified, phone")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      if (checkErr) throw checkErr;

      const now = new Date();
      let userId: string;

      if (existingUser) {
        // Returning user - require phone if they had one before or if session expired
        if (isReturningUser && existingUser.phone && !phone) {
          setPhoneRequired(true);
          toast.error("Please enter your mobile number to re-verify");
          setIsLoading(false);
          return;
        }

        // Update existing user
        const { error: updateErr } = await supabase
          .from("ingestion_access_users")
          .update({
            phone: phone || existingUser.phone || null,
            device_info: deviceInfo,
            location: loc,
            terms_accepted: true,
            cookie_policy_accepted: true,
            qr_verified: true,
            qr_verified_at: now.toISOString(),
            is_verified: false,
            manual_access_expires_at: null,
            last_verified_email: email.toLowerCase(),
            updated_at: now.toISOString(),
          })
          .eq("id", existingUser.id);

        if (updateErr) throw updateErr;
        userId = existingUser.id;
        setIsReturningUser(true);
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
            qr_verified: true,
            qr_verified_at: now.toISOString(),
            last_verified_email: email.toLowerCase(),
          })
          .select("id")
          .single();

        if (insertErr) throw insertErr;
        userId = newUser.id;
      }

      setAccessUserId(userId);

      // Send OTP to email
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

      const now = new Date();
      const expiresAt = new Date(now.getTime() + MANUAL_INGESTION_SESSION_MINUTES * 60 * 1000);

      // Update user as verified
      await supabase
        .from("ingestion_access_users")
        .update({
          is_verified: true,
          qr_verified: true,
          qr_verified_at: now.toISOString(),
          otp_verified_at: now.toISOString(),
          manual_access_expires_at: expiresAt.toISOString(),
          last_verified_email: email.toLowerCase(),
        })
        .eq("id", accessUserId);

      setStep("success");
      toast.success(`Verification successful. Access valid for ${MANUAL_INGESTION_SESSION_MINUTES} minutes.`);

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
    setEmail(userEmail || "");
    setPhone("");
    setOtp("");
    setTermsAccepted(false);
    setCookiesAccepted(false);
    setAccessUserId(null);
    setLocation(null);
    setIsReturningUser(false);
    setPhoneRequired(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Admin Ingestion Access
          </DialogTitle>
          <DialogDescription>
            QR + OTP verification for admin-only manual ingestion.
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
              {/* Session info */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>Access is valid for <strong>{MANUAL_INGESTION_SESSION_MINUTES} minutes</strong> after verification.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3 flex flex-col items-center text-center">
                  <QrCode className="w-5 h-5 text-primary mb-2" />
                  <img
                    src="/qr/ingestion-admin-access.svg"
                    alt="Admin ingestion access QR"
                    className="w-28 h-28 rounded-md border border-border/50 bg-background p-1 mb-2"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Scan to open admin access flow.
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Allowlisted admin emails</p>
                  <p>{allowedAdminEmails.join(", ")}</p>
                  <p className="mt-2">
                    Your signed-in email must match this allowlist and you must have newsroom admin role or higher.
                  </p>
                </div>
              </div>

              {!user && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
                  Sign in with your admin account first to request manual ingestion access.
                </div>
              )}

              {user && !isAdmin && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
                  Your account is not a newsroom admin. Owner, superadmin, or admin role is required.
                </div>
              )}

              {user && isAdmin && !isAllowedAdminEmail && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
                  Your email is not in the admin allowlist for manual ingestion.
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Signed-In Admin Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 pr-10"
                    readOnly
                    required
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Mobile Number {phoneRequired ? "*" : "(Optional)"}
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={cn("pl-10", phoneRequired && "border-amber-500")}
                    required={phoneRequired}
                  />
                </div>
                {phoneRequired && (
                  <p className="text-xs text-amber-600">
                    Mobile number is required for re-verification
                  </p>
                )}
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
                disabled={!canRequestAccess || isLoading || !email || !termsAccepted || !cookiesAccepted || (phoneRequired && !phone)}
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
                  You now have access to the ingestion pipeline for {MANUAL_INGESTION_SESSION_MINUTES} minutes.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Check,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOwnerAuditLog } from "@/hooks/use-owner-audit-log";
import { differenceInDays, formatDistanceToNow } from "date-fns";

type ViewMode = "login" | "password-expired" | "verify-passkey" | "set-password" | "success";

const PASSWORD_EXPIRY_DAYS = 30;

export default function NewsroomOwnerLogin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const auditLog = useOwnerAuditLog();

  const [viewMode, setViewMode] = useState<ViewMode>("login");
  const [email, setEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [passkey, setPasskey] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [daysUntilExpiry, setDaysUntilExpiry] = useState<number | null>(null);
  const [passwordExpiredMessage, setPasswordExpiredMessage] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/newsroom", { replace: true });
    }
  }, [user, navigate]);

  const checkOwnerAndPasswordExpiry = async (ownerEmail: string) => {
    const normalized = ownerEmail.trim().toLowerCase();

    // Check if owner exists
    const { data: member } = await supabase
      .from("newsroom_members")
      .select("email, role, is_active, password_last_set_at")
      .eq("email", normalized)
      .eq("role", "owner")
      .eq("is_active", true)
      .maybeSingle();

    if (!member) {
      // Fallback: check admin_users
      const { data: adminOwner } = await supabase
        .from("admin_users")
        .select("email, role")
        .eq("email", normalized)
        .eq("role", "owner")
        .maybeSingle();

      if (!adminOwner) {
        return { isOwner: false, isExpired: false, daysRemaining: 0 };
      }

      // If only in admin_users (no password_last_set_at), treat as needing reset
      return { isOwner: true, isExpired: true, daysRemaining: 0 };
    }

    // Check password expiry
    if (!member.password_last_set_at) {
      return { isOwner: true, isExpired: true, daysRemaining: 0 };
    }

    const passwordSetDate = new Date(member.password_last_set_at);
    const daysSinceSet = differenceInDays(new Date(), passwordSetDate);
    const daysRemaining = PASSWORD_EXPIRY_DAYS - daysSinceSet;

    return {
      isOwner: true,
      isExpired: daysRemaining <= 0,
      daysRemaining: Math.max(0, daysRemaining),
    };
  };

  const handleOwnerPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid owner email address");
      return;
    }

    setIsLoading(true);
    try {
      const { isOwner, isExpired, daysRemaining } = await checkOwnerAndPasswordExpiry(email);

      if (!isOwner) {
        await auditLog.logFailed(email.trim(), "Non-owner attempted owner login");
        toast.error("Access denied: this email is not the owner");
        return;
      }

      if (isExpired) {
        setPasswordExpiredMessage(
          "Your password has expired. You must reset it to continue."
        );
        setViewMode("password-expired");
        return;
      }

      // Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: loginPassword,
      });

      if (error || !data.user) {
        await auditLog.logFailed(email.trim(), error?.message || "Owner password login failed");
        toast.error(error?.message || "Invalid credentials");
        return;
      }

      setDaysUntilExpiry(daysRemaining);
      await auditLog.logSuccess(email.trim());

      // Show warning if password expires soon (< 7 days)
      if (daysRemaining <= 7) {
        toast.warning(`Your password expires in ${daysRemaining} day(s). Consider resetting it.`);
      }

      navigate("/newsroom", { replace: true });
    } catch (err: any) {
      await auditLog.logFailed(email.trim(), err?.message || "Owner password login error");
      toast.error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPasskey = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const { isOwner } = await checkOwnerAndPasswordExpiry(email);
      if (!isOwner) {
        await auditLog.logFailed(email.trim(), "Non-owner attempted OTP request");
        toast.error("Access denied: this email is not the owner");
        return;
      }

      await auditLog.logOtpRequest(email.trim(), true);

      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: {
          email: email.trim(),
          purpose: "password_reset",
        },
      });

      if (error || !data?.success) {
        await auditLog.logFailed(email.trim(), error?.message || data?.error || "Failed to send OTP");
        toast.error(error?.message || data?.error || "Failed to send passkey");
        return;
      }

      toast.success("Passkey sent to your email!");
      setViewMode("verify-passkey");
    } catch (err) {
      await auditLog.logFailed(email.trim(), "Failed to send passkey");
      toast.error("Failed to send passkey");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPasskey = async () => {
    if (passkey.length !== 6) {
      toast.error("Please enter the 6-digit passkey");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: {
          email: email.trim(),
          otp: passkey,
          purpose: "password_reset",
        },
      });

      if (error || !data?.success) {
        await auditLog.logOtpVerify(email.trim(), false, data?.error || "Invalid passkey");
        toast.error(data?.error || "Invalid passkey. Please try again.");
        return;
      }

      await auditLog.logOtpVerify(email.trim(), true);
      toast.success("Passkey verified! Please set your new password.");
      setViewMode("set-password");
    } catch (err) {
      await auditLog.logFailed(email.trim(), "Verification failed");
      toast.error("Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const { data: pwData, error: pwError } = await supabase.functions.invoke(
        "update-password",
        {
          body: {
            email: email.trim(),
            newPassword: password,
          },
        }
      );

      if (pwError || !pwData?.success) {
        toast.error(pwData?.error || pwError?.message || "Failed to set password");
        return;
      }

      // Sign in
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError || !signInData.user) {
        toast.error(signInError?.message || "Sign in failed");
        return;
      }

      await auditLog.logSuccess(email.trim());
      toast.success("Password updated! Welcome back.");
      setViewMode("success");

      setTimeout(() => {
        navigate("/newsroom", { replace: true });
      }, 500);
    } catch (err) {
      await auditLog.logFailed(email.trim(), "Password update error");
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (user) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {/* LOGIN SCREEN */}
        {viewMode === "login" && (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-6">
              <Logo size="lg" className="justify-center mb-3" />
              <div className="flex items-center justify-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                  Owner Login
                </span>
              </div>
            </div>

            <Card>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg">Welcome Back, Owner</CardTitle>
                <CardDescription>
                  Sign in with your owner email and password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleOwnerPasswordLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="owner-email">Owner Email</Label>
                    <Input
                      id="owner-email"
                      type="email"
                      placeholder="owner@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="username"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="owner-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="owner-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={isLoading || !email || !loginPassword}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Sign in
                      </>
                    )}
                  </Button>
                </form>

                <div className="relative">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                    Forgot password?
                  </span>
                </div>

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleRequestPasskey}
                  disabled={isLoading || !email}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Reset Password via Passkey
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate("/")}
                >
                  ← Back to Home
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* PASSWORD EXPIRED SCREEN */}
        {viewMode === "password-expired" && (
          <motion.div
            key="expired"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md"
          >
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-amber-500" />
                </div>
                <CardTitle className="text-xl text-amber-600">
                  Password Expired
                </CardTitle>
                <CardDescription className="text-amber-500/80">
                  {passwordExpiredMessage}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-center text-muted-foreground">
                  Your password must be reset every {PASSWORD_EXPIRY_DAYS} days for security.
                  We'll send a passkey to <strong>{email}</strong> to verify your identity.
                </p>

                <Button
                  className="w-full gap-2"
                  onClick={handleRequestPasskey}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Password Reset Passkey
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setViewMode("login")}
                >
                  ← Back to Login
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* VERIFY PASSKEY SCREEN */}
        {viewMode === "verify-passkey" && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-md"
          >
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Check Your Email</CardTitle>
                <CardDescription>
                  We sent a 6-digit passkey to <strong>{email}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={passkey} onChange={setPasskey}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  className="w-full"
                  onClick={handleVerifyPasskey}
                  disabled={isLoading || passkey.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Passkey"
                  )}
                </Button>

                <Button
                  variant="link"
                  className="w-full text-xs"
                  onClick={handleRequestPasskey}
                  disabled={isLoading}
                >
                  Didn't receive it? Resend passkey
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setPasskey("");
                    setViewMode("login");
                  }}
                >
                  ← Back
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* SET PASSWORD SCREEN */}
        {viewMode === "set-password" && (
          <motion.div
            key="set-password"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-md"
          >
            <Card className="border-emerald-500/20">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                  <Check className="w-6 h-6 text-emerald-500" />
                </div>
                <CardTitle className="text-lg">Passkey Verified!</CardTitle>
                <CardDescription>
                  Set your new password (valid for {PASSWORD_EXPIRY_DAYS} days)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-pass">Confirm Password</Label>
                    <Input
                      id="confirm-pass"
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>

                  <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Set New Password
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* SUCCESS SCREEN */}
        {viewMode === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mx-auto w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6"
            >
              <Crown className="w-12 h-12 text-amber-500" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">Welcome Back!</h1>
            <p className="text-muted-foreground mb-4">
              Password updated. Redirecting to the Newsroom...
            </p>
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Crown,
  Check,
  Loader2,
  AlertTriangle,
  Mail,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOwnerAuditLog } from "@/hooks/use-owner-audit-log";
import { PasswordStrengthMeter } from "@/components/newsroom/PasswordStrengthMeter";

type ViewMode = "warning" | "auth" | "verify-passkey" | "set-password" | "success";

export default function NewsroomOwnerSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const auditLog = useOwnerAuditLog();

  const [viewMode, setViewMode] = useState<ViewMode>("warning");
  const [email, setEmail] = useState("");

  // Reset/setup via OTP
  const [passkey, setPasskey] = useState("");

  // Normal login via password
  const [loginPassword, setLoginPassword] = useState("");

  // Password set/reset
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate("/newsroom", { replace: true });
    return null;
  }

  const handleProceedToAuth = () => {
    setViewMode("auth");
  };

  // Designated owner email for first-time setup
  const DESIGNATED_OWNER_EMAIL = "originxlabs@gmail.com";

  const ensureEmailIsOwner = async (ownerEmail: string) => {
    const normalized = ownerEmail.trim().toLowerCase();

    // FIRST: Check if this is the designated owner email for initial setup
    if (normalized === DESIGNATED_OWNER_EMAIL.toLowerCase()) {
      return true;
    }

    // PRIMARY: Check newsroom_members for owner role (this is the source of truth)
    const { data: memberOwner } = await supabase
      .from("newsroom_members")
      .select("email, role, is_active")
      .ilike("email", normalized)
      .eq("role", "owner")
      .eq("is_active", true)
      .maybeSingle();

    if (memberOwner) return true;

    // FALLBACK: Check admin_users for super_admin role (case-insensitive)
    const { data: adminOwner } = await supabase
      .from("admin_users")
      .select("email, role")
      .ilike("email", normalized)
      .in("role", ["super_admin", "admin"])
      .maybeSingle();

    return !!adminOwner;
  };

  const handleOwnerPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid owner email address");
      return;
    }

    setIsLoading(true);
    try {
      const isOwnerEmail = await ensureEmailIsOwner(email);
      if (!isOwnerEmail) {
        await auditLog.logFailed(email.trim(), "Non-owner attempted password login");
        toast.error("Access denied: this email is not the owner");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: loginPassword,
      });

      if (error || !data.user) {
        await auditLog.logFailed(email.trim(), error?.message || "Owner password login failed");
        toast.error(error?.message || "Invalid credentials");
        return;
      }

      await auditLog.logSuccess(email.trim());
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
      const isOwnerEmail = await ensureEmailIsOwner(email);
      if (!isOwnerEmail) {
        await auditLog.logFailed(email.trim(), "Non-owner attempted owner-init OTP request");
        toast.error("Access denied: this email is not the owner");
        return;
      }

      // Log the OTP request attempt
      await auditLog.logOtpRequest(email.trim(), true);

      // Always treat owner-init OTP as a password reset/setup flow
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

      toast.success("Passkey sent to your email from Newstack!");
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
      // Verify OTP via custom backend function
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

      toast.success("Passkey verified! Please set your password.");
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
      // 1) Set (or reset) the owner's password using the verified OTP record.
      //    This works for both: existing auth user OR user created during OTP-signup.
      const { data: pwData, error: pwError } = await supabase.functions.invoke("update-password", {
        body: {
          email: email.trim(),
          newPassword: password,
        },
      });

      if (pwError || !pwData?.success) {
        toast.error(pwData?.error || pwError?.message || "Failed to set password");
        return;
      }

      // 2) Sign in normally with email + password
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError || !signInData.user) {
        toast.error(signInError?.message || "Sign in failed");
        return;
      }

      // 3) Ensure the signed-in user is registered as the newsroom owner
      const { error: memberError } = await supabase
        .from("newsroom_members")
        .upsert(
          {
            user_id: signInData.user.id,
            email: email.trim(),
            role: "owner",
            is_active: true,
          },
          { onConflict: "email" }
        );

      if (memberError) {
        console.error("newsroom_members upsert error:", memberError);
        // Continue anyway; auth is valid.
      }

      const { error: adminError } = await supabase
        .from("admin_users")
        .upsert(
          {
            email: email.trim(),
            role: "owner",
          },
          { onConflict: "email" }
        );

      if (adminError) {
        console.error("admin_users upsert error:", adminError);
      }

      // Log successful owner setup
      await auditLog.logSuccess(email.trim());

      toast.success("Owner setup complete! Use /newsroom/owner-login for future logins.");
      setViewMode("success");

      setTimeout(() => {
        navigate("/newsroom", { replace: true });
      }, 1500);
    } catch (err) {
      await auditLog.logFailed(email.trim(), "Owner setup error");
      console.error("Owner setup error:", err);
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {/* WARNING SCREEN */}
        {viewMode === "warning" && (
          <motion.div
            key="warning"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg"
          >
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader className="text-center pb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="mx-auto w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mb-4"
                >
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                </motion.div>
                <CardTitle className="text-2xl text-red-600">⚠️ Restricted Access</CardTitle>
                <CardDescription className="text-red-500/80 mt-2">
                  This is the <strong>Owner Control Panel</strong> for NEWSTACK Newsroom
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-background/50 border border-red-500/20 space-y-3">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      This panel provides <strong>full administrative access</strong> to all NEWSTACK systems including API management, user controls, and platform settings.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Only authorized personnel with valid <strong>owner credentials</strong> may proceed. Unauthorized access attempts are logged and monitored.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Crown className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      If you are the designated platform owner, sign in with your owner email and password. Use a passkey only if you need to set/reset your password.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate("/")}
                  >
                    Exit
                  </Button>
                  <Button 
                    className="flex-1 gap-2 bg-red-600 hover:bg-red-700"
                    onClick={handleProceedToAuth}
                  >
                    I Understand, Proceed
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* AUTH SCREEN */}
        {viewMode === "auth" && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-6">
              <Logo size="lg" className="justify-center mb-3" />
              <div className="flex items-center justify-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                  Owner Authentication
                </span>
              </div>
            </div>

            <Card>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg">Sign in</CardTitle>
                <CardDescription>
                  Use your owner email + password. Use passkey only to set/reset your password.
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
                    Password reset / first-time setup
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                  <p className="text-sm text-center text-muted-foreground">
                    If you forgot your password (or this is first-time setup), request a passkey to set a new password.
                  </p>
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
                        Send Passkey to Email
                      </>
                    )}
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setViewMode("warning")}
                >
                  ← Back
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
            <div className="text-center mb-6">
              <Logo size="lg" className="justify-center mb-3" />
            </div>

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
                  <InputOTP
                    maxLength={6}
                    value={passkey}
                    onChange={setPasskey}
                  >
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
                    setViewMode("auth");
                  }}
                >
                  ← Back
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* SET PASSWORD SCREEN (for new owners) */}
        {viewMode === "set-password" && (
          <motion.div
            key="set-password"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-6">
              <Logo size="lg" className="justify-center mb-3" />
              <div className="flex items-center justify-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                  Final Step
                </span>
              </div>
            </div>

            <Card className="border-amber-500/20">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                  <Check className="w-6 h-6 text-emerald-500" />
                </div>
                <CardTitle className="text-lg">Email Verified!</CardTitle>
                <CardDescription>
                  Set a password to secure your owner account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Create Password</Label>
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
                    <PasswordStrengthMeter password={password} />
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
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <Crown className="w-4 h-4" />
                        Complete Owner Setup
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
            <h1 className="text-2xl font-bold mb-2">Welcome, Owner!</h1>
            <p className="text-muted-foreground mb-4">
              Your account has been created successfully.
              <br />
              Redirecting to the Newsroom...
            </p>
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

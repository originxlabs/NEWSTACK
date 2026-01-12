import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Phone, ArrowRight, Loader2, Eye, EyeOff, KeyRound, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = "choice" | "email" | "phone" | "otp" | "signup" | "login" | "forgot" | "reset_otp" | "new_password";

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { 
    signInWithEmail, 
    signInWithOtp, 
    verifyOtp, 
    signUp, 
    signIn, 
    signInWithGoogle,
    sendPasswordResetOtp,
    verifyPasswordResetOtp,
    updatePassword
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>("choice");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [companyName, setCompanyName] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPhone("");
    setOtp("");
    setResetEmail("");
    setCompanyName("");
    setMode("choice");
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);
    
    if (error) {
      toast.error(error.message);
    }
    // Redirect happens automatically
  };

  const handleAppleSignIn = async () => {
    // Apple Sign-In would need to be configured in Supabase
    toast.info("Apple Sign-In coming soon!");
  };

  const handleEmailSignIn = async () => {
    if (!email) return;
    setLoading(true);
    const { error } = await signInWithEmail(email);
    setLoading(false);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email for the login link!");
      handleClose();
    }
  };

  const handlePhoneSignIn = async () => {
    if (!phone) return;
    setLoading(true);
    const { error } = await signInWithOtp(phone);
    setLoading(false);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("OTP sent to your phone!");
      setMode("otp");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return;
    setLoading(true);
    const { error } = await verifyOtp(phone, otp);
    setLoading(false);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome to NEWSTACK Enterprise!");
      handleClose();
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !companyName) {
      toast.error("Please fill in all fields including Company Name");
      return;
    }
    setLoading(true);
    // Note: Company name stored in profile after signup
    const { error } = await signUp(email, password);
    setLoading(false);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Enterprise account created! You are now signed in.");
      handleClose();
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back to NEWSTACK Enterprise!");
      handleClose();
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) return;
    setLoading(true);
    const result = await sendPasswordResetOtp(resetEmail);
    setLoading(false);
    
    if (!result.success) {
      toast.error(result.error || "Failed to send reset code");
    } else {
      toast.success("Reset code sent to your email!");
      setMode("reset_otp");
    }
  };

  const handleVerifyResetOtp = async () => {
    if (!otp || otp.length < 6) return;
    setLoading(true);
    const result = await verifyPasswordResetOtp(resetEmail, otp);
    setLoading(false);
    
    if (!result.success) {
      toast.error(result.error || "Invalid code");
    } else {
      toast.success("Code verified! Set your new password.");
      setMode("new_password");
    }
  };

  const handleSetNewPassword = async () => {
    if (!newPassword || !confirmPassword) return;
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    const { error } = await updatePassword(resetEmail, newPassword);
    setLoading(false);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully! Please sign in.");
      setMode("login");
      setEmail(resetEmail);
      setResetEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={handleClose}
          style={{ pointerEvents: 'auto' }}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-card border border-border rounded-2xl w-full max-w-md p-6 overflow-hidden shadow-2xl"
          style={{ pointerEvents: 'auto', zIndex: 10000 }}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent/50 transition-colors z-10"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <Logo size="lg" showText={false} />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-primary" />
              <span className="text-xs uppercase tracking-widest text-primary font-semibold">Enterprise</span>
            </div>
            <h2 className="font-display text-2xl font-bold">
              {mode === "choice" && "Enterprise Access"}
              {mode === "email" && "Sign in with Email"}
              {mode === "phone" && "Sign in with Phone"}
              {mode === "otp" && "Enter OTP"}
              {mode === "signup" && "Create Enterprise Account"}
              {mode === "login" && "Welcome Back"}
              {mode === "forgot" && "Reset Password"}
              {mode === "reset_otp" && "Enter Reset Code"}
              {mode === "new_password" && "Set New Password"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {mode === "choice" && "NEWSTACK Intelligence API for enterprises"}
              {mode === "email" && "We'll send you a magic link"}
              {mode === "phone" && "We'll send you an OTP"}
              {mode === "otp" && "Enter the code sent to your phone"}
              {mode === "signup" && "Create your enterprise account"}
              {mode === "login" && "Sign in to your enterprise account"}
              {mode === "forgot" && "We'll send you a reset code via email"}
              {mode === "reset_otp" && `Enter the 6-digit code sent to ${resetEmail}`}
              {mode === "new_password" && "Choose a strong password"}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {mode === "choice" && (
              <>
                {/* Social Sign-In Buttons */}
                <Button
                  variant="outline"
                  className="w-full h-12 justify-center gap-3 font-medium"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-12 justify-center gap-3 font-medium"
                  onClick={handleAppleSignIn}
                  disabled={loading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Continue with Apple
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-3 text-muted-foreground">or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-12 gap-2"
                    onClick={() => setMode("login")}
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 gap-2"
                    onClick={() => setMode("phone")}
                  >
                    <Phone className="h-4 w-4" />
                    Phone
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  By continuing, you agree to our{" "}
                  <a href="/terms" onClick={handleClose} className="text-primary hover:underline">Terms</a> and{" "}
                  <a href="/privacy" onClick={handleClose} className="text-primary hover:underline">Privacy Policy</a>
                </p>
              </>
            )}

            {mode === "email" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Work Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12"
                  />
                </div>
                <Button
                  className="w-full h-12"
                  onClick={handleEmailSignIn}
                  disabled={loading || !email}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Send Magic Link
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setMode("choice")}>
                  Back to options
                </Button>
              </>
            )}

            {mode === "phone" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-12"
                  />
                </div>
                <Button
                  className="w-full h-12"
                  onClick={handlePhoneSignIn}
                  disabled={loading || !phone}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Send OTP
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setMode("choice")}>
                  Back to options
                </Button>
              </>
            )}

            {mode === "otp" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="h-12 text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                </div>
                <Button
                  className="w-full h-12"
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length < 6}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Verify & Sign In
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setMode("phone")}>
                  Resend OTP
                </Button>
              </>
            )}

            {(mode === "signup" || mode === "login") && (
              <>
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="company"
                        type="text"
                        placeholder="Acme Corporation"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="h-12 pl-10"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Work Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                {mode === "login" && (
                  <Button
                    variant="link"
                    className="w-full justify-end p-0 h-auto text-sm"
                    onClick={() => {
                      setResetEmail(email);
                      setMode("forgot");
                    }}
                  >
                    Forgot password?
                  </Button>
                )}
                <Button
                  className="w-full h-12"
                  onClick={mode === "signup" ? handleSignUp : handleSignIn}
                  disabled={loading || !email || !password || (mode === "signup" && !companyName)}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {mode === "signup" ? "Create Enterprise Account" : "Sign In"}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setMode(mode === "signup" ? "login" : "signup")}
                >
                  {mode === "signup" ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setMode("choice")}>
                  Back to options
                </Button>
              </>
            )}

            {mode === "forgot" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email Address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@company.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="h-12"
                  />
                </div>
                <Button
                  className="w-full h-12"
                  onClick={handleForgotPassword}
                  disabled={loading || !resetEmail}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-5 w-5" />
                      Send Reset Code
                    </>
                  )}
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setMode("login")}>
                  Back to sign in
                </Button>
              </>
            )}

            {mode === "reset_otp" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="reset-otp">Reset Code</Label>
                  <Input
                    id="reset-otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="h-12 text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                </div>
                <Button
                  className="w-full h-12"
                  onClick={handleVerifyResetOtp}
                  disabled={loading || otp.length < 6}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Verify Code
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => {
                    setOtp("");
                    handleForgotPassword();
                  }}
                  disabled={loading}
                >
                  Resend Code
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setMode("forgot")}>
                  Use different email
                </Button>
              </>
            )}

            {mode === "new_password" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-12 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12"
                  />
                </div>
                <Button
                  className="w-full h-12"
                  onClick={handleSetNewPassword}
                  disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Set New Password
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-destructive text-center">Passwords don't match</p>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
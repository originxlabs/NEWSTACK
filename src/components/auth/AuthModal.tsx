import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Phone, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = "choice" | "email" | "phone" | "otp" | "signup" | "login";

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithEmail, signInWithOtp, verifyOtp, signUp, signIn } = useAuth();
  const [mode, setMode] = useState<AuthMode>("choice");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setPhone("");
    setOtp("");
    setMode("choice");
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
      toast.success("Welcome to NEWSTACK!");
      handleClose();
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! You are now signed in.");
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
      toast.success("Welcome back!");
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative glass-card rounded-2xl w-full max-w-md p-6 overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
              <span className="font-display font-bold text-primary-foreground text-xl">N</span>
            </div>
            <h2 className="font-display text-2xl font-bold">
              {mode === "choice" && "Join NEWSTACK"}
              {mode === "email" && "Sign in with Email"}
              {mode === "phone" && "Sign in with Phone"}
              {mode === "otp" && "Enter OTP"}
              {mode === "signup" && "Create Account"}
              {mode === "login" && "Welcome Back"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {mode === "choice" && "Get personalized AI-powered news"}
              {mode === "email" && "We'll send you a magic link"}
              {mode === "phone" && "We'll send you an OTP"}
              {mode === "otp" && "Enter the code sent to your phone"}
              {mode === "signup" && "Create your NEWSTACK account"}
              {mode === "login" && "Sign in to your account"}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {mode === "choice" && (
              <>
                <Button
                  variant="outline"
                  className="w-full h-12 justify-start gap-3"
                  onClick={() => setMode("login")}
                >
                  <Mail className="h-5 w-5" />
                  Continue with Email
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 justify-start gap-3"
                  onClick={() => setMode("phone")}
                >
                  <Phone className="h-5 w-5" />
                  Continue with Phone
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setMode("email")}
                >
                  Sign in with Magic Link
                </Button>
              </>
            )}

            {mode === "email" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
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
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setMode("choice")}
                >
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
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setMode("choice")}
                >
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
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setMode("phone")}
                >
                  Resend OTP
                </Button>
              </>
            )}

            {(mode === "signup" || mode === "login") && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
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
                <Button
                  className="w-full h-12"
                  onClick={mode === "signup" ? handleSignUp : handleSignIn}
                  disabled={loading || !email || !password}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {mode === "signup" ? "Create Account" : "Sign In"}
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
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setMode("choice")}
                >
                  Back to options
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

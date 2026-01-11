import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, ArrowLeft, Mail, KeyRound, Check, Loader2, 
  UserPlus, LogIn, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sendOtpEmail, sendPasskeyEmail } from "@/lib/email";

type ViewMode = "main" | "verify-passkey" | "set-password" | "success";

export default function NewsroomLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passkey, setPasskey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("main");
  const [activeTab, setActiveTab] = useState("login");
  const [isNewAccount, setIsNewAccount] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    navigate("/newsroom", { replace: true });
    return null;
  }

  // Login with email + password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if user is a newsroom member
      const { data: member } = await supabase
        .from("newsroom_members")
        .select("role, is_active")
        .eq("email", email.trim())
        .single();

      if (!member) {
        toast.error("No newsroom account found for this email");
        setIsLoading(false);
        return;
      }

      if (!member.is_active) {
        toast.error("Your account has been deactivated");
        setIsLoading(false);
        return;
      }

      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message || "Invalid credentials");
      } else {
        toast.success("Welcome to the Newsroom");
        navigate("/newsroom");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Request passkey for new registration
  const handleRequestPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      // Check if already a member
      const { data: existingMember } = await supabase
        .from("newsroom_members")
        .select("id, role")
        .eq("email", email.trim())
        .single();

      if (existingMember) {
        toast.error("An account already exists with this email. Please login instead.");
        setActiveTab("login");
        setIsLoading(false);
        return;
      }

      // Generate OTP using Supabase Auth (for verification)
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      // Also send our branded passkey email
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await sendPasskeyEmail(email.trim(), otp, "Registration");

      setIsNewAccount(true);
      toast.success("Passkey sent to your email!");
      setViewMode("verify-passkey");
    } catch (err) {
      toast.error("Failed to send passkey");
    } finally {
      setIsLoading(false);
    }
  };

  // Verify passkey
  const handleVerifyPasskey = async () => {
    if (passkey.length !== 6) {
      toast.error("Please enter the 6-digit passkey");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: passkey,
        type: "email",
      });

      if (error) {
        toast.error("Invalid passkey. Please try again.");
        setIsLoading(false);
        return;
      }

      if (data.session) {
        toast.success("Email verified! Set your password.");
        setViewMode("set-password");
      }
    } catch (err) {
      toast.error("Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Set password and complete registration
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast.error(updateError.message);
        setIsLoading(false);
        return;
      }

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        toast.error("Authentication error");
        setIsLoading(false);
        return;
      }

      // Create as viewer by default (owner can promote later)
      const { error: memberError } = await supabase
        .from("newsroom_members")
        .insert({
          user_id: currentUser.id,
          email: email.trim(),
          role: "viewer", // Default role for new enterprise users
          is_active: true,
        });

      if (memberError) {
        console.error("Member creation error:", memberError);
        toast.error("Failed to create account. Contact administrator.");
        setIsLoading(false);
        return;
      }

      toast.success("Account created successfully!");
      setViewMode("success");

      setTimeout(() => {
        navigate("/newsroom", { replace: true });
      }, 2000);

    } catch (err) {
      console.error("Setup error:", err);
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password - send OTP
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email first");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        toast.error("No account found with this email");
        setIsLoading(false);
        return;
      }

      // Send branded passkey email
      await sendPasskeyEmail(email.trim(), "******", "Password Reset");

      setIsNewAccount(false);
      toast.success("Reset passkey sent to your email!");
      setViewMode("verify-passkey");
    } catch (err) {
      toast.error("Failed to send reset passkey");
    } finally {
      setIsLoading(false);
    }
  };

  const resetToMain = () => {
    setViewMode("main");
    setPasskey("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-4" />
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Enterprise Newsroom</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* MAIN VIEW - Login/Register Tabs */}
          {viewMode === "main" && (
            <motion.div
              key="main"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="login" className="gap-2">
                        <LogIn className="w-4 h-4" />
                        Login
                      </TabsTrigger>
                      <TabsTrigger value="register" className="gap-2">
                        <UserPlus className="w-4 h-4" />
                        Register
                      </TabsTrigger>
                    </TabsList>

                    {/* LOGIN TAB */}
                    <TabsContent value="login">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-email">Email</Label>
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="login-password">Password</Label>
                            <Button
                              type="button"
                              variant="link"
                              className="px-0 h-auto text-xs text-muted-foreground"
                              onClick={handleForgotPassword}
                              disabled={isLoading}
                            >
                              Forgot password?
                            </Button>
                          </div>
                          <div className="relative">
                            <Input
                              id="login-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
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
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Signing in...
                            </>
                          ) : (
                            "Sign In"
                          )}
                        </Button>
                      </form>
                    </TabsContent>

                    {/* REGISTER TAB */}
                    <TabsContent value="register">
                      <form onSubmit={handleRequestPasskey} className="space-y-4">
                        <div className="p-3 rounded-lg bg-muted/50 border border-border mb-4">
                          <p className="text-xs text-muted-foreground text-center">
                            Register to join the NEWSTACK Newsroom. You'll receive a passkey via email to verify your account.
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="register-email">Work Email</Label>
                          <Input
                            id="register-email"
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>

                        <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Sending passkey...
                            </>
                          ) : (
                            <>
                              <Mail className="w-4 h-4" />
                              Send Passkey to Email
                            </>
                          )}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>

                  <Separator className="my-6" />

                  <Button 
                    variant="ghost" 
                    className="w-full gap-2"
                    onClick={() => navigate("/")}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Public Site
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* VERIFY PASSKEY */}
          {viewMode === "verify-passkey" && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <KeyRound className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Enter Passkey</CardTitle>
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
                    onClick={isNewAccount ? handleRequestPasskey : handleForgotPassword}
                    disabled={isLoading}
                  >
                    Didn't receive it? Resend passkey
                  </Button>

                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={resetToMain}
                  >
                    ← Back
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* SET PASSWORD */}
          {viewMode === "set-password" && (
            <motion.div
              key="set-password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                    <Check className="w-6 h-6 text-emerald-500" />
                  </div>
                  <CardTitle>
                    {isNewAccount ? "Complete Registration" : "Reset Password"}
                  </CardTitle>
                  <CardDescription>
                    {isNewAccount 
                      ? "Set a password to secure your account"
                      : "Enter your new password"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-pass">
                        {isNewAccount ? "Create Password" : "New Password"}
                      </Label>
                      <div className="relative">
                        <Input
                          id="new-pass"
                          type={showPassword ? "text" : "password"}
                          placeholder="Min. 8 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
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

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {isNewAccount ? "Creating Account..." : "Updating..."}
                        </>
                      ) : (
                        isNewAccount ? "Create Account" : "Update Password"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* SUCCESS */}
          {viewMode === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card>
                <CardContent className="pt-8 pb-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4"
                  >
                    <Check className="w-8 h-8 text-emerald-500" />
                  </motion.div>
                  <h2 className="text-xl font-semibold mb-2">
                    {isNewAccount ? "Welcome to NEWSTACK!" : "Password Updated!"}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {isNewAccount 
                      ? "Your account has been created."
                      : "Your password has been updated."
                    }
                    <br />
                    Redirecting to the Newsroom...
                  </p>
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mt-4 text-primary" />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-muted-foreground mt-6">
          This is a restricted area for authorized personnel only.
        </p>
      </motion.div>
    </div>
  );
}

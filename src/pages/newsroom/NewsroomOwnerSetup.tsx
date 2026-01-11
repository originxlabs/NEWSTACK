import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Crown, Check, Loader2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Secret access key for owner setup - change this in production!
const OWNER_SECRET_KEY = "NEWSTACK-OWNER-2026-SECURE";

export default function NewsroomOwnerSetup() {
  const [searchParams] = useSearchParams();
  const accessKey = searchParams.get("key");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasExistingOwner, setHasExistingOwner] = useState(false);
  const [checkingOwner, setCheckingOwner] = useState(true);

  // Check if there's already an owner
  useEffect(() => {
    async function checkExistingOwner() {
      const { data, error } = await supabase
        .from("newsroom_members")
        .select("id")
        .eq("role", "owner")
        .limit(1);

      if (!error && data && data.length > 0) {
        setHasExistingOwner(true);
      }
      setCheckingOwner(false);
    }
    
    if (accessKey === OWNER_SECRET_KEY) {
      checkExistingOwner();
    } else {
      setCheckingOwner(false);
    }
  }, [accessKey]);

  // Redirect if already logged in as owner
  useEffect(() => {
    if (user && isSuccess) {
      navigate("/newsroom", { replace: true });
    }
  }, [user, isSuccess, navigate]);

  // Invalid or missing access key
  if (accessKey !== OWNER_SECRET_KEY) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            This page requires a valid access key.
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Return to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  if (checkingOwner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Already has an owner
  if (hasExistingOwner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
            <Crown className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Owner Already Exists</h1>
          <p className="text-muted-foreground mb-6">
            An owner account has already been set up for this newsroom.
            Please use the regular login page or contact the existing owner.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/newsroom/login")}>
              Go to Login
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              Return to Home
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleCreateOwner = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName || email.split("@")[0],
          },
        },
      });

      if (authError) {
        toast.error(authError.message);
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error("Failed to create account");
        setIsLoading(false);
        return;
      }

      // 2. Create newsroom_member with owner role
      const { error: memberError } = await supabase
        .from("newsroom_members")
        .insert({
          user_id: authData.user.id,
          email: email.trim(),
          role: "owner",
          is_active: true,
        });

      if (memberError) {
        toast.error("Account created but failed to set owner role. Contact support.");
        console.error("Member error:", memberError);
        setIsLoading(false);
        return;
      }

      // 3. Also add to admin_users for backwards compatibility
      await supabase
        .from("admin_users")
        .insert({
          email: email.trim(),
          role: "owner",
        });

      toast.success("Owner account created successfully!");
      setIsSuccess(true);

      // Sign in automatically
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      setTimeout(() => {
        navigate("/newsroom", { replace: true });
      }, 1500);

    } catch (err) {
      console.error("Setup error:", err);
      toast.error("An error occurred during setup");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6"
          >
            <Check className="w-10 h-10 text-emerald-500" />
          </motion.div>
          <h1 className="text-2xl font-bold mb-2">Welcome, Owner!</h1>
          <p className="text-muted-foreground mb-4">
            Your owner account has been created.
            <br />
            Redirecting to the Newsroom...
          </p>
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-4" />
          <div className="flex items-center justify-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-semibold uppercase tracking-wider text-amber-600">
              Owner Setup
            </span>
          </div>
        </div>

        <Card className="border-amber-500/20">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Create Owner Account
            </CardTitle>
            <CardDescription>
              Set up the primary owner account for your NEWSTACK Newsroom.
              This account will have full administrative access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOwner} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  type="text"
                  placeholder="Your Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="owner@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
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
                <Label htmlFor="confirm-password">Confirm Password *</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your password"
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
                    Create Owner Account
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <p className="text-xs text-amber-600 text-center">
                <strong>Security Notice:</strong> This is a one-time setup.
                Keep this URL confidential and do not share the access key.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldX, Lock, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useNewsroomRole } from "@/hooks/use-newsroom-role";
import { supabase } from "@/integrations/supabase/client";

interface OwnerOnlyGuardProps {
  children: React.ReactNode;
  requireOwner?: boolean; // true = only owner, false = owner or superadmin
  pageName?: string;
}

export function OwnerOnlyGuard({ 
  children, 
  requireOwner = true,
  pageName = "this page" 
}: OwnerOnlyGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { role, isOwner, isOwnerOrSuperadmin, loading: roleLoading } = useNewsroomRole();
  const navigate = useNavigate();
  const [accessDenied, setAccessDenied] = useState(false);

  const hasAccess = requireOwner ? isOwner : isOwnerOrSuperadmin;
  const loading = authLoading || roleLoading;

  useEffect(() => {
    async function logAccessAttempt() {
      if (loading) return;

      // If user is logged in but doesn't have access, log it
      if (user && !hasAccess && role !== null) {
        setAccessDenied(true);
        
        // Log unauthorized access attempt
        try {
          await supabase.from("owner_access_logs").insert({
            email: user.email || "unknown",
            event_type: "admin_access_denied",
            success: false,
            error_message: `User with role '${role}' attempted to access ${pageName}`,
            metadata: {
              user_id: user.id,
              page: pageName,
              role: role,
            },
          });
        } catch (err) {
          console.error("Failed to log access attempt:", err);
        }
      }
    }

    logAccessAttempt();
  }, [user, hasAccess, role, loading, pageName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Verifying access...</div>
      </div>
    );
  }

  // Not logged in - redirect to login
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-amber-500/30">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-amber-500" />
              </div>
              <CardTitle className="text-xl">Authentication Required</CardTitle>
              <CardDescription>
                Please sign in to access {pageName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full"
                onClick={() => navigate("/newsroom/login")}
              >
                Sign In
              </Button>
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Logged in but no newsroom access at all
  if (role === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-red-500/30 bg-red-500/5">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mb-4">
                <ShieldX className="w-8 h-8 text-red-500" />
              </div>
              <CardTitle className="text-xl text-red-600">No Newsroom Access</CardTitle>
              <CardDescription className="text-red-500/80">
                You don't have access to the Newsroom
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-background/50 border border-red-500/20">
                <p className="text-sm text-muted-foreground text-center">
                  Contact your organization's administrator to request access.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Public Site
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Logged in with some role, but not owner/superadmin
  if (accessDenied || !hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg"
        >
          <Card className="border-red-500/30 bg-red-500/5">
            <CardHeader className="text-center pb-4">
              <Logo size="md" className="justify-center mb-4" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="mx-auto w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mb-4"
              >
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </motion.div>
              <CardTitle className="text-2xl text-red-600">🚫 Access Denied</CardTitle>
              <CardDescription className="text-red-500/80 mt-2">
                <strong>Owner-Only Area</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-background/50 border border-red-500/20 space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldX className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    This area is restricted to <strong>platform owners only</strong>. Your current role (<strong>{role}</strong>) does not have permission to access {pageName}.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    This access attempt has been <strong>logged for security monitoring</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate("/")}
                >
                  Exit
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => navigate("/newsroom")}
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Has access - render children
  return <>{children}</>;
}
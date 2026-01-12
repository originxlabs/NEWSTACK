import { useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Shield,
  Bell,
  Settings,
  Plug,
  LogOut,
  ChevronLeft,
  Rss,
  Lock,
  Activity,
  Key,
  Webhook,
  BarChart3,
  Crown,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useNewsroomRole } from "@/hooks/use-newsroom-role";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  href: string;
  restricted?: boolean;
  ownerOnly?: boolean;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/newsroom" },
  { icon: Activity, label: "API Health", href: "/newsroom/api-health", restricted: true },
  { icon: Key, label: "API Keys", href: "/newsroom/api-keys", restricted: true },
  { icon: Webhook, label: "Webhooks", href: "/newsroom/webhooks", restricted: true },
  { icon: BarChart3, label: "Analytics", href: "/newsroom/analytics", restricted: true },
  { icon: Rss, label: "Ingestion", href: "/newsroom/ingestion", restricted: true },
  { icon: Database, label: "Ingestion Status", href: "/newsroom/ingestion-status", ownerOnly: true },
  { icon: Rss, label: "RSS Feeds", href: "/newsroom/feeds", restricted: true },
  { icon: Shield, label: "Audit Logs", href: "/newsroom/audit-logs", ownerOnly: true },
  { icon: FileText, label: "Stories", href: "/newsroom/stories" },
  { icon: Shield, label: "Trust Console", href: "/newsroom/trust" },
  { icon: Bell, label: "Alerts", href: "/newsroom/alerts" },
  { icon: Plug, label: "Integrations", href: "/newsroom/integrations" },
  { icon: Settings, label: "Settings", href: "/newsroom/settings" },
];

export default function NewsroomLayout() {
  const { user, loading, signOut } = useAuth();
  const { role, isOwnerOrSuperadmin, loading: roleLoading } = useNewsroomRole();
  const navigate = useNavigate();

  // Auth guard - redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/newsroom/login", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Filter nav items based on role - show all but disable restricted ones
  const canAccessItem = (item: NavItem) => {
    if (item.ownerOnly) return isOwnerOrSuperadmin;
    if (item.restricted) return isOwnerOrSuperadmin;
    return true;
  };

  const getRoleBadgeVariant = (r: string | null) => {
    switch (r) {
      case "owner":
        return "default";
      case "superadmin":
        return "secondary";
      case "admin":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        {/* Logo area */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Newsroom
            </span>
          </div>
          {role && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={getRoleBadgeVariant(role)} className="text-[10px] uppercase gap-1">
                {role === "owner" && <Crown className="w-3 h-3" />}
                {role}
              </Badge>
              {isOwnerOrSuperadmin && (
                <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                  Full Access
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const hasAccess = canAccessItem(item);
            const isRestricted = item.restricted || item.ownerOnly;

            if (hasAccess) {
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === "/newsroom"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  {item.ownerOnly && (
                    <Crown className="w-3 h-3 ml-auto text-amber-500" />
                  )}
                </NavLink>
              );
            }

            // Show disabled link with tooltip for restricted items
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium cursor-not-allowed opacity-50",
                      "text-muted-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    <Lock className="w-3 h-3 ml-auto" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="text-xs">
                    {item.ownerOnly
                      ? "Owner access required"
                      : "Owner or Superadmin access required"}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        <Separator />

        {/* Footer */}
        <div className="p-4 space-y-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={() => navigate("/")}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Public Site
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={() => signOut()}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

import { useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, FileText, Shield, Bell, 
  Settings, Plug, LogOut, ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/newsroom" },
  { icon: FileText, label: "Stories", href: "/newsroom/stories" },
  { icon: Shield, label: "Trust Console", href: "/newsroom/trust" },
  { icon: Bell, label: "Alerts", href: "/newsroom/alerts" },
  { icon: Plug, label: "Integrations", href: "/newsroom/integrations" },
  { icon: Settings, label: "Settings", href: "/newsroom/settings" },
];

export default function NewsroomLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Auth guard - redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/newsroom/login", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
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
            </NavLink>
          ))}
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

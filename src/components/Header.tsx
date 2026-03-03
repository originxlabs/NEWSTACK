import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Newspaper,
  Flag,
  Globe2,
  MapPin,
  Building2,
  MessageSquareWarning,
  Code2,
  Flame,
  Radio,
  Pin,
  PinOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { UserMenu } from "@/components/UserMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NLogoSquare } from "@/components/NLogo";
import { TrendingHeaderSlider } from "@/components/TrendingHeaderSlider";

const navLinks = [
  { name: "News", href: "/news", icon: Newspaper },
  { name: "India", href: "/india", icon: Flag },
  { name: "World", href: "/world", icon: Globe2 },
  { name: "Places", href: "/places", icon: MapPin },
  { name: "Open Politics", href: "/open-politics", icon: Building2 },
  { name: "Public Grievances", href: "/public-grievances", icon: MessageSquareWarning },
  { name: "Developers", href: "/api", icon: Code2 },
  { name: "Trending Pulse", href: "/trending", icon: Flame },
];

export function Header() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTrendingPanel, setShowTrendingPanel] = useState(false);
  const [pinTrendingPanel, setPinTrendingPanel] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const { user, loading } = useAuth();
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pointer = window.matchMedia("(pointer: coarse)");
    const apply = () => setIsTouchDevice(pointer.matches);
    apply();
    pointer.addEventListener("change", apply);
    return () => pointer.removeEventListener("change", apply);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="fixed top-0 left-0 right-0 z-50"
        onMouseLeave={() => {
          if (!pinTrendingPanel) setShowTrendingPanel(false);
        }}
      >
        <div className="bg-background/80 backdrop-blur-xl border-b border-border/40">
          <div className="container mx-auto max-w-6xl px-3 sm:px-4">
            <div className="flex items-center justify-between h-14 gap-3 sm:gap-4">
              <Link to="/" className="flex items-center gap-2 shrink-0 mr-2 sm:mr-4">
                <div className="flex items-center justify-center text-foreground">
                  <NLogoSquare size={28} />
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-lg tracking-tight leading-none">
                    NEW<span className="text-primary">STACK</span>
                  </span>
                  <span className="hidden sm:inline text-[8px] text-muted-foreground tracking-widest uppercase leading-none">
                    by OriginX Labs
                  </span>
                </div>
              </Link>

              <nav className="flex-1 min-w-0 pl-1 sm:pl-2">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide whitespace-nowrap px-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.name}
                        to={link.href}
                        onClick={() => {
                          if (link.name === "Trending Pulse" && isTouchDevice) {
                            setShowTrendingPanel(true);
                          }
                        }}
                        onMouseEnter={() => {
                          if (link.name === "Trending Pulse") {
                            setShowTrendingPanel(true);
                          }
                        }}
                        onFocus={() => {
                          if (link.name === "Trending Pulse") {
                            setShowTrendingPanel(true);
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] sm:text-sm rounded-md transition-colors ${
                          isActive(link.href)
                            ? "text-foreground font-medium bg-muted/50"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${link.name === "Trending Pulse" ? "text-orange-500" : ""}`} />
                        {link.name}
                      </Link>
                    );
                  })}
                </div>
              </nav>

              <div className="flex items-center gap-2 shrink-0">
                <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex h-7 px-2 text-xs">
                  <Link to="/opennews">Open News</Link>
                </Button>
                {isTouchDevice && (
                  <Button
                    size="sm"
                    variant={showTrendingPanel ? "default" : "outline"}
                    className="h-7 px-2 text-[11px] sm:hidden"
                    onClick={() => setShowTrendingPanel((value) => !value)}
                  >
                    <Flame className="w-3.5 h-3.5 mr-1 text-orange-500" />
                    Pulse
                  </Button>
                )}
                {showTrendingPanel && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="hidden lg:inline-flex h-7 w-7"
                    onClick={() => setPinTrendingPanel((value) => !value)}
                    aria-label={pinTrendingPanel ? "Unpin trending panel" : "Pin trending panel"}
                    title={pinTrendingPanel ? "Unpin trending panel" : "Pin trending panel"}
                  >
                    {pinTrendingPanel ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
                  </Button>
                )}
                <Badge variant="outline" className="hidden sm:flex gap-1.5 h-6 px-2 text-[10px] bg-emerald-500/5 text-emerald-600 border-emerald-500/20">
                  <Radio className="w-2 h-2 animate-pulse" />
                  LIVE
                </Badge>
                <ThemeToggle />
                <div className="hidden md:flex items-center gap-2 ml-1">
                  {loading ? (
                    <div className="h-8 w-16 bg-muted animate-pulse rounded-md" />
                  ) : user ? (
                    <UserMenu />
                  ) : (
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 text-xs gap-1.5"
                      onClick={() => setShowAuthModal(true)}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      Enterprise Sign In
                    </Button>
                  )}
                </div>
                {!loading && !user && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="md:hidden h-8 w-8"
                    onClick={() => setShowAuthModal(true)}
                    aria-label="Enterprise Sign In"
                    title="Enterprise Sign In"
                  >
                    <Code2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showTrendingPanel && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="border-b border-border/50 bg-background/85 backdrop-blur-xl"
            >
              <div className="container mx-auto max-w-6xl px-4 py-3">
                <TrendingHeaderSlider />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}

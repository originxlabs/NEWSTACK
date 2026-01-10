import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePWAMode } from "@/hooks/use-pwa-mode";
import { SwipeNewsFeed } from "./SwipeNewsFeed";
import { 
  Home, Newspaper, Headphones, MapPin, User, Menu, X, 
  Globe, Bookmark, Settings, LogIn
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AuthModal } from "@/components/auth/AuthModal";

interface MobileAppWrapperProps {
  children: ReactNode;
}

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/news", icon: Newspaper, label: "News" },
  { path: "/listen", icon: Headphones, label: "Listen" },
  { path: "/places", icon: MapPin, label: "Places" },
  { path: "/profile", icon: User, label: "Profile" },
];

const menuItems = [
  { path: "/world", icon: Globe, label: "World News" },
  { path: "/topics", icon: Newspaper, label: "Topics" },
  { path: "/saved", icon: Bookmark, label: "Saved Articles" },
  { path: "/pricing", icon: Settings, label: "Premium" },
];

export function MobileAppWrapper({ children }: MobileAppWrapperProps) {
  const { showSwipeMode, isPWA, isMobile, isTablet } = usePWAMode();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  // Show splash on initial PWA load
  useEffect(() => {
    if (isPWA && (isMobile || isTablet)) {
      const hasShownSplash = sessionStorage.getItem("newstack_splash_shown");
      if (!hasShownSplash) {
        setShowSplash(true);
        setTimeout(() => {
          setShowSplash(false);
          sessionStorage.setItem("newstack_splash_shown", "true");
        }, 2000);
      }
    }
  }, [isPWA, isMobile, isTablet]);

  // For desktop or non-PWA, render normal content
  if (!isPWA || (!isMobile && !isTablet)) {
    return <>{children}</>;
  }

  // Show swipe mode on home page for mobile PWA
  const isHomePage = location.pathname === "/" || location.pathname === "/news";
  const shouldShowSwipe = showSwipeMode && isHomePage;

  return (
    <>
      {/* Initial Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex flex-col items-center"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl mb-6"
              >
                <span className="text-4xl font-bold text-primary-foreground font-display">N</span>
              </motion.div>
              <h1 className="text-3xl font-bold font-display gradient-text mb-2">NEWSTACK</h1>
              <p className="text-sm text-muted-foreground">Global News Intelligence</p>
              
              <motion.div className="flex gap-1.5 mt-6">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    className="w-2 h-2 rounded-full bg-primary"
                  />
                ))}
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-xs text-muted-foreground mt-8"
              >
                Powered by
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-sm font-semibold text-foreground/70"
              >
                CROPXON INNOVATIONS PVT LTD
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-background pb-20">
        {/* Main Content */}
        {shouldShowSwipe ? (
          <SwipeNewsFeed />
        ) : (
          <div className="min-h-screen">
            {/* Mobile Header */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-b safe-area-top">
              <div className="flex items-center justify-between px-4 py-3">
                <Link to="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-foreground font-display">N</span>
                  </div>
                  <span className="font-display font-bold text-lg">NEWSTACK</span>
                </Link>

                <div className="flex items-center gap-2">
                  {!user && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowAuthModal(true)}
                    >
                      <LogIn className="w-5 h-5" />
                    </Button>
                  )}
                  
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Menu className="w-5 h-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-72">
                      <nav className="flex flex-col gap-2 mt-8">
                        {menuItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                          >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </nav>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </header>

            {/* Page Content with top padding for header */}
            <main className="pt-16">
              {children}
            </main>
          </div>
        )}

        {/* Bottom Navigation */}
        {!shouldShowSwipe && (
          <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t safe-area-bottom">
            <div className="flex items-center justify-around py-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? "fill-current" : ""}`} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}

        {/* Floating action to switch views (for swipe mode) */}
        {shouldShowSwipe && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
            onClick={() => navigate("/news?view=list")}
          >
            <Menu className="w-6 h-6" />
          </motion.button>
        )}
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}

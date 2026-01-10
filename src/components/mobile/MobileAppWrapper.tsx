import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePWAMode } from "@/hooks/use-pwa-mode";
import { SwipeNewsFeed } from "./SwipeNewsFeed";
import { MobileSettings } from "./MobileSettings";
import { 
  Home, Newspaper, Headphones, MapPin, User, Menu,
  Globe, Bookmark, Settings, LogIn, Crown, Star
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AuthModal } from "@/components/auth/AuthModal";
import { Separator } from "@/components/ui/separator";

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
  { path: "/world", icon: Globe, label: "World News", description: "Global headlines" },
  { path: "/topics", icon: Newspaper, label: "Topics", description: "Browse categories" },
  { path: "/saved", icon: Bookmark, label: "Saved Articles", description: "Your bookmarks" },
  { path: "/settings", icon: Settings, label: "Settings", description: "Preferences" },
  { path: "/pricing", icon: Crown, label: "Premium", description: "Upgrade your experience" },
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

  // Show settings page
  const isSettingsPage = location.pathname === "/settings";
  if (isSettingsPage && isPWA && (isMobile || isTablet)) {
    return <MobileSettings />;
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
                      className="rounded-full"
                    >
                      <LogIn className="w-5 h-5" />
                    </Button>
                  )}
                  
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Menu className="w-5 h-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-80 bg-background/95 backdrop-blur-xl p-0">
                      <SheetHeader className="p-4 pb-2">
                        <SheetTitle className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary-foreground font-display">N</span>
                          </div>
                          <span className="font-display font-bold">NEWSTACK</span>
                        </SheetTitle>
                      </SheetHeader>
                      <Separator />
                      <nav className="flex flex-col gap-1 p-3">
                        {menuItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <item.icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <span className="font-medium block">{item.label}</span>
                              <span className="text-xs text-muted-foreground">{item.description}</span>
                            </div>
                          </Link>
                        ))}
                      </nav>
                      
                      {!user && (
                        <>
                          <Separator />
                          <div className="p-4">
                            <Button 
                              className="w-full gap-2" 
                              onClick={() => setShowAuthModal(true)}
                            >
                              <LogIn className="w-4 h-4" />
                              Sign In / Sign Up
                            </Button>
                          </div>
                        </>
                      )}
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
          <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
            <div className="flex items-center justify-around py-2 px-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex flex-col items-center gap-0.5 min-w-[56px] py-1"
                  >
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className={`p-2 rounded-xl transition-colors ${
                        isActive 
                          ? "bg-primary/15" 
                          : "hover:bg-muted"
                      }`}
                    >
                      <item.icon className={`w-5 h-5 transition-colors ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`} />
                    </motion.div>
                    <span className={`text-[10px] font-medium transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}

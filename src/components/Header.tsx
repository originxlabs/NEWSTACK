import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { UserMenu } from "@/components/UserMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NLogoSquare } from "@/components/NLogo";

const navLinks = [
  { name: "News", href: "/news" },
  { name: "World", href: "/world" },
  { name: "Places", href: "/places" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading } = useAuth();
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="bg-background/80 backdrop-blur-xl border-b border-border/40">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="flex items-center justify-between h-14">
              {/* Logo - Reverted to original NEWSTACK */}
              <Link to="/" className="flex items-center gap-2">
                <div className="flex items-center justify-center text-foreground">
                  <NLogoSquare size={28} />
                </div>
                <span className="font-display font-bold text-lg tracking-tight">
                  NEW<span className="text-primary">STACK</span>
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`px-4 py-2 text-sm transition-colors relative ${
                      isActive(link.href)
                        ? "text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {link.name}
                    {isActive(link.href) && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary"
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </Link>
                ))}
              </nav>

              {/* Right side */}
              <div className="flex items-center gap-2">
                {/* Live indicator */}
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
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => setShowAuthModal(true)}
                    >
                      Sign in
                    </Button>
                  )}
                </div>

                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-8 w-8"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t border-border/40 overflow-hidden"
              >
                <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.href}
                      className={`px-3 py-2.5 text-sm transition-colors rounded-md ${
                        isActive(link.href)
                          ? "text-foreground bg-muted/50 font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.name}
                    </Link>
                  ))}
                  
                  {!user && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border/40">
                      <Button
                        className="flex-1 h-9"
                        size="sm"
                        onClick={() => {
                          setIsOpen(false);
                          setShowAuthModal(true);
                        }}
                      >
                        Get Started
                      </Button>
                    </div>
                  )}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}

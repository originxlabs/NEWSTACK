import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X, Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { LanguageSelector } from "@/components/LanguageSelector";
import { UserMenu } from "@/components/UserMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";

const navLinks = [
  { name: "Feed", href: "/", icon: "📰" },
  { name: "Listen", href: "/listen", icon: "🎧" },
  { name: "World", href: "/world", icon: "🌍" },
  { name: "Places", href: "/places", icon: "📍" },
  { name: "Topics", href: "/topics", icon: "🧠" },
  { name: "Support", href: "/support", icon: "❤️" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading } = useAuth();
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="glass-card border-b border-border/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Logo size="md" />

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                      isActive(link.href)
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>

              {/* Right side actions */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="hidden sm:flex">
                  <Search className="h-4 w-4" />
                </Button>
                
                <ThemeToggle />
                
                <LanguageSelector />
                
                {user && (
                  <Button variant="ghost" size="icon" className="hidden sm:flex">
                    <Bell className="h-4 w-4" />
                  </Button>
                )}

                <div className="hidden md:flex items-center gap-2 ml-2">
                  {loading ? (
                    <div className="h-9 w-20 bg-muted animate-pulse rounded-lg" />
                  ) : user ? (
                    <UserMenu />
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setShowAuthModal(true)}>
                        Sign In
                      </Button>
                      <Button size="sm" onClick={() => setShowAuthModal(true)}>
                        Get Started
                      </Button>
                    </>
                  )}
                </div>

                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-border/50"
            >
              <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`px-4 py-3 text-sm font-medium transition-colors rounded-lg flex items-center gap-3 ${
                      isActive(link.href)
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <span>{link.icon}</span>
                    {link.name}
                  </Link>
                ))}
                
                {!user && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setIsOpen(false);
                        setShowAuthModal(true);
                      }}
                    >
                      Sign In
                    </Button>
                    <Button
                      className="flex-1"
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
        </div>
      </motion.header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}

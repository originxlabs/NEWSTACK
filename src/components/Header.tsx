import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X, Search, User, Bell, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const navLinks = [
  { name: "Feed", href: "/" },
  { name: "World", href: "/world" },
  { name: "Places", href: "/places" },
  { name: "Topics", href: "/topics" },
  { name: "Pricing", href: "/pricing" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
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
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="font-display font-bold text-primary-foreground text-sm">N</span>
              </div>
              <span className="font-display font-bold text-xl tracking-tight">
                NEW<span className="text-primary">STACK</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50"
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
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Globe className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="hidden md:flex items-center gap-2 ml-2">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
                <Button size="sm">
                  Get Started
                </Button>
              </div>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
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
            className="md:hidden border-t border-border/50"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                <Button variant="outline" className="flex-1">
                  Sign In
                </Button>
                <Button className="flex-1">
                  Get Started
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}

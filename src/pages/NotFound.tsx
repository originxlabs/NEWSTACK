import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Newspaper, Globe, Headphones, MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NLogoSquare } from "@/components/NLogo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const suggestedLinks = [
    { name: "News Feed", href: "/news", icon: Newspaper, description: "Latest headlines" },
    { name: "World News", href: "/world", icon: Globe, description: "Global coverage" },
    { name: "Listen", href: "/listen", icon: Headphones, description: "Audio news" },
    { name: "Places", href: "/places", icon: MapPin, description: "Local insights" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        {/* NEWSTACK Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="flex justify-center mb-8"
        >
          <div className="flex items-center gap-3">
            <NLogoSquare size={56} animate themeAware />
            <div className="text-left">
              <h2 className="font-display text-2xl font-bold tracking-tight">
                NEW<span className="text-primary">STACK</span>
              </h2>
              <p className="text-xs text-muted-foreground">Global News Intelligence</p>
            </div>
          </div>
        </motion.div>
        
        {/* Error Code */}
        <div className="relative mb-6">
          <motion.div 
            className="text-[100px] md:text-[140px] font-display font-bold text-primary/10 leading-none select-none"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.4 }}
          >
            404
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-background/90 backdrop-blur-sm px-6 py-3 rounded-xl border border-border/50"
            >
              <h1 className="font-display text-xl md:text-2xl font-bold">Page Not Found</h1>
            </motion.div>
          </div>
        </div>
        
        {/* Message */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground mb-8 max-w-md mx-auto"
        >
          Oops! The page <span className="text-foreground font-mono text-sm bg-muted px-2 py-0.5 rounded">{location.pathname}</span> doesn't exist. Let's get you back to the latest news.
        </motion.p>

        {/* Primary Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 justify-center mb-8"
        >
          <Button asChild size="lg" className="gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              Go to Homepage
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg" className="gap-2">
            <Link to="/news">
              <Newspaper className="w-4 h-4" />
              Browse News
            </Link>
          </Button>
        </motion.div>

        {/* Suggested Links */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="border-t border-border/50 pt-8"
        >
          <p className="text-sm text-muted-foreground mb-4">Or explore these sections:</p>
          <div className="grid grid-cols-2 gap-3">
            {suggestedLinks.map((link, index) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <Link
                  to={link.href}
                  className="group flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted border border-transparent hover:border-border/50 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <link.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{link.name}</div>
                    <div className="text-xs text-muted-foreground">{link.description}</div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Back Button & Retry */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex items-center justify-center gap-6"
        >
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </motion.div>

        {/* Branding Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-xs text-muted-foreground/60 mt-12"
        >
          © 2026 NEWSTACK. All Rights Reserved by CROPXON INNOVATIONS PVT LTD
        </motion.p>
      </motion.div>
    </div>
  );
};

export default NotFound;

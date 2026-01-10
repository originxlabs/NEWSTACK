import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, Search, ArrowLeft, Newspaper, Globe, Headphones, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

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
        {/* Logo */}
        <Logo size="lg" className="justify-center mb-8" />
        
        {/* Error Code */}
        <div className="relative mb-6">
          <motion.div 
            className="text-[120px] md:text-[160px] font-display font-bold text-muted-foreground/10 leading-none select-none"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.4 }}
          >
            404
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg">
              <h1 className="font-display text-2xl md:text-3xl font-bold">Page Not Found</h1>
            </div>
          </div>
        </div>
        
        {/* Message */}
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back to the latest news.
        </p>

        {/* Primary Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button asChild size="lg">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Go to Homepage
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link to="/news">
              <Newspaper className="w-4 h-4 mr-2" />
              Browse News
            </Link>
          </Button>
        </div>

        {/* Suggested Links */}
        <div className="border-t border-border/50 pt-8">
          <p className="text-sm text-muted-foreground mb-4">Or explore these sections:</p>
          <div className="grid grid-cols-2 gap-3">
            {suggestedLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="group flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <link.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-sm">{link.name}</div>
                  <div className="text-xs text-muted-foreground">{link.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back to previous page
        </button>
      </motion.div>
    </div>
  );
};

export default NotFound;

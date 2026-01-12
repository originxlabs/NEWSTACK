import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ChevronRight, Home, Globe, MapPin, Building2, 
  Navigation, Menu, X, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  id: string;
  label: string;
  path?: string;
  icon?: React.ReactNode;
  type: "home" | "continent" | "country" | "state" | "district" | "city" | "locality";
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  onNavigate: (item: BreadcrumbItem, index: number) => void;
  onGoBack?: () => void;
  showHamburger?: boolean;
  className?: string;
}

const TYPE_ICONS: Record<BreadcrumbItem["type"], React.ReactNode> = {
  home: <Home className="w-3.5 h-3.5" />,
  continent: <Globe className="w-3.5 h-3.5" />,
  country: <MapPin className="w-3.5 h-3.5" />,
  state: <Building2 className="w-3.5 h-3.5" />,
  district: <Navigation className="w-3.5 h-3.5" />,
  city: <MapPin className="w-3.5 h-3.5" />,
  locality: <Navigation className="w-3.5 h-3.5" />,
};

const TYPE_COLORS: Record<BreadcrumbItem["type"], string> = {
  home: "bg-blue-500",
  continent: "bg-emerald-500",
  country: "bg-purple-500",
  state: "bg-orange-500",
  district: "bg-cyan-500",
  city: "bg-pink-500",
  locality: "bg-amber-500",
};

export function BreadcrumbNav({
  items,
  onNavigate,
  onGoBack,
  showHamburger = true,
  className,
}: BreadcrumbNavProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleItemClick = (item: BreadcrumbItem, index: number) => {
    if (item.path) {
      navigate(item.path);
    } else {
      onNavigate(item, index);
    }
    setIsOpen(false);
  };

  const handleBack = () => {
    if (onGoBack) {
      onGoBack();
    } else if (items.length > 1) {
      onNavigate(items[items.length - 2], items.length - 2);
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-2 bg-background/98 backdrop-blur-md py-3 px-4 border-b border-border/40",
      className
    )}>
      {/* Back Button */}
      {items.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="gap-1.5 h-8 px-2 flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
      )}

      {/* Desktop Breadcrumb */}
      <div className="hidden md:flex items-center gap-1 overflow-x-auto">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-muted-foreground mx-1 flex-shrink-0" />
            )}
            <button
              onClick={() => handleItemClick(item, index)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md text-sm transition-colors whitespace-nowrap",
                index === items.length - 1
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              {item.icon || TYPE_ICONS[item.type]}
              <span className="max-w-[120px] truncate">{item.label}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Mobile: Current location + hamburger */}
      <div className="flex md:hidden items-center gap-2 flex-1 min-w-0">
        {items.length > 0 && (
          <Badge 
            variant="secondary" 
            className={cn(
              "text-xs font-medium truncate max-w-[150px]",
              TYPE_COLORS[items[items.length - 1].type],
              "text-white"
            )}
          >
            {items[items.length - 1].label}
          </Badge>
        )}
      </div>

      {/* Hamburger Menu for drill-down navigation */}
      {showHamburger && items.length > 1 && (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 md:hidden">
              <Menu className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[320px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Navigation
              </SheetTitle>
            </SheetHeader>
            
            <div className="mt-6 space-y-1">
              {items.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleItemClick(item, index)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                    index === items.length - 1
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted"
                  )}
                  style={{ paddingLeft: `${12 + index * 12}px` }}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-white",
                    TYPE_COLORS[item.type]
                  )}>
                    {item.icon || TYPE_ICONS[item.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      "block text-sm font-medium truncate",
                      index === items.length - 1 && "text-primary"
                    )}>
                      {item.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {item.type}
                    </span>
                  </div>
                  {index === items.length - 1 && (
                    <Badge variant="secondary" className="text-[9px]">
                      Current
                    </Badge>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Quick actions */}
            <div className="mt-6 pt-4 border-t space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate("/");
                  setIsOpen(false);
                }}
                className="w-full justify-start gap-2"
              >
                <Home className="w-4 h-4" />
                Go to Home
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate("/news");
                  setIsOpen(false);
                }}
                className="w-full justify-start gap-2"
              >
                <Globe className="w-4 h-4" />
                All News
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

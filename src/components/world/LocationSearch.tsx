import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Globe, MapPin, Building2, Navigation, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { searchLocations, SearchResult } from "@/lib/geo-hierarchy";
import { useDebounce } from "@/hooks/use-debounce";

interface LocationSearchProps {
  onSelect: (result: SearchResult) => void;
  onClose?: () => void;
  placeholder?: string;
  className?: string;
}

export function LocationSearch({ 
  onSelect, 
  onClose, 
  placeholder = "Search countries, states, cities...",
  className 
}: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 200);

  const results = useMemo(() => {
    return searchLocations(debouncedQuery, 15);
  }, [debouncedQuery]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleSelect = useCallback((result: SearchResult) => {
    onSelect(result);
    setQuery("");
    setIsOpen(false);
    onClose?.();
  }, [onSelect, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      onClose?.();
    }
  }, [results, selectedIndex, handleSelect, onClose]);

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "continent":
        return <Globe className="h-3.5 w-3.5 text-primary" />;
      case "country":
        return <MapPin className="h-3.5 w-3.5 text-primary" />;
      case "state":
        return <Building2 className="h-3.5 w-3.5 text-muted-foreground" />;
      case "city":
        return <Navigation className="h-3.5 w-3.5 text-muted-foreground" />;
      case "locality":
        return <MapPin className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-9 pr-9 h-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 top-full mt-2 w-full bg-background border border-border rounded-lg shadow-xl max-h-80 overflow-auto"
          >
            <div className="p-1">
              {results.map((result, index) => (
                <motion.button
                  key={`${result.type}-${result.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full flex items-start gap-3 p-2.5 rounded-md text-left transition-colors",
                    selectedIndex === index 
                      ? "bg-accent text-accent-foreground" 
                      : "hover:bg-accent/50"
                  )}
                >
                  <div className="mt-0.5">
                    {result.flag ? (
                      <span className="text-base">{result.flag}</span>
                    ) : (
                      getIcon(result.type)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{result.name}</span>
                      <Badge variant="outline" className="text-[9px] h-4 px-1 flex-shrink-0">
                        {getTypeLabel(result.type)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {result.path.join(" › ")}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {isOpen && query.length >= 2 && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 top-full mt-2 w-full bg-background border border-border rounded-lg shadow-xl p-4 text-center"
          >
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No locations found for "{query}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay to close on click outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

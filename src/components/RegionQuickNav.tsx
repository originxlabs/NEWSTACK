import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Globe, ChevronRight, MapPin, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { GEO_HIERARCHY, getCountryByCode } from "@/lib/geo-hierarchy";

// Quick region data for fast navigation
const QUICK_REGIONS = [
  { id: "global", name: "Global", emoji: "🌍", type: "all" },
  { id: "asia", name: "Asia", emoji: "🌏", type: "continent" },
  { id: "europe", name: "Europe", emoji: "🇪🇺", type: "continent" },
  { id: "north-america", name: "N. America", emoji: "🌎", type: "continent" },
  { id: "africa", name: "Africa", emoji: "🌍", type: "continent" },
  { id: "south-america", name: "S. America", emoji: "🌎", type: "continent" },
  { id: "oceania", name: "Oceania", emoji: "🌏", type: "continent" },
];

// Popular countries for quick access
const QUICK_COUNTRIES = [
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "US", name: "USA", flag: "🇺🇸" },
  { code: "GB", name: "UK", flag: "🇬🇧" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
];

interface RegionQuickNavProps {
  className?: string;
  compact?: boolean;
}

export function RegionQuickNav({ className, compact = false }: RegionQuickNavProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const currentRegion = searchParams.get("region");
  const currentCountry = searchParams.get("country");

  const handleRegionClick = (regionId: string, type: string) => {
    const newParams = new URLSearchParams();
    
    if (type === "all") {
      // Clear all filters for global
      setSearchParams(newParams);
      return;
    }
    
    if (type === "continent") {
      newParams.set("region", regionId);
    }
    
    setSearchParams(newParams);
  };

  const handleCountryClick = (countryCode: string) => {
    const newParams = new URLSearchParams();
    newParams.set("country", countryCode);
    setSearchParams(newParams);
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1.5 overflow-x-auto scrollbar-hide", className)}>
        {QUICK_REGIONS.slice(0, 4).map((region) => (
          <Button
            key={region.id}
            variant={
              (region.type === "all" && !currentRegion && !currentCountry) ||
              currentRegion === region.id
                ? "secondary"
                : "ghost"
            }
            size="sm"
            className="h-7 px-2 text-xs flex-shrink-0 gap-1"
            onClick={() => handleRegionClick(region.id, region.type)}
          >
            <span>{region.emoji}</span>
            <span className="hidden sm:inline">{region.name}</span>
          </Button>
        ))}
        {QUICK_COUNTRIES.slice(0, 3).map((country) => (
          <Button
            key={country.code}
            variant={currentCountry === country.code ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs flex-shrink-0 gap-1"
            onClick={() => handleCountryClick(country.code)}
          >
            <span>{country.flag}</span>
            <span className="hidden sm:inline">{country.name}</span>
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Regions row */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_REGIONS.map((region) => (
          <Button
            key={region.id}
            variant={
              (region.type === "all" && !currentRegion && !currentCountry) ||
              currentRegion === region.id
                ? "secondary"
                : "outline"
            }
            size="sm"
            className="h-8 px-3 text-xs gap-1.5"
            onClick={() => handleRegionClick(region.id, region.type)}
          >
            <span className="text-base">{region.emoji}</span>
            {region.name}
          </Button>
        ))}
      </div>

      {/* Countries row */}
      <ScrollArea className="w-full">
        <div className="flex gap-1.5 pb-2">
          {QUICK_COUNTRIES.map((country) => (
            <Button
              key={country.code}
              variant={currentCountry === country.code ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "h-7 px-2.5 text-xs flex-shrink-0 gap-1",
                currentCountry === country.code && "bg-primary/10"
              )}
              onClick={() => handleCountryClick(country.code)}
            >
              <span>{country.flag}</span>
              {country.name}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

// Compact version showing current location with drill-down path
export function LocationBreadcrumb({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const region = searchParams.get("region");
  const country = searchParams.get("country");
  const state = searchParams.get("state");
  const city = searchParams.get("city");
  const locality = searchParams.get("locality");

  const countryInfo = country ? getCountryByCode(country) : null;
  const continentInfo = region ? GEO_HIERARCHY.find(c => c.id === region) : null;

  const breadcrumbs = useMemo(() => {
    const items: { label: string; emoji?: string; onClick: () => void }[] = [];
    
    items.push({
      label: "Global",
      emoji: "🌍",
      onClick: () => setSearchParams(new URLSearchParams()),
    });

    if (continentInfo) {
      items.push({
        label: continentInfo.name,
        onClick: () => {
          const params = new URLSearchParams();
          params.set("region", region!);
          setSearchParams(params);
        },
      });
    }

    if (countryInfo) {
      items.push({
        label: countryInfo.name,
        emoji: countryInfo.flag,
        onClick: () => {
          const params = new URLSearchParams();
          params.set("country", country!);
          setSearchParams(params);
        },
      });
    }

    if (state) {
      items.push({
        label: state,
        onClick: () => {
          const params = new URLSearchParams();
          if (country) params.set("country", country);
          params.set("state", state);
          setSearchParams(params);
        },
      });
    }

    if (city) {
      items.push({
        label: city,
        onClick: () => {
          const params = new URLSearchParams();
          if (country) params.set("country", country);
          if (state) params.set("state", state);
          params.set("city", city);
          setSearchParams(params);
        },
      });
    }

    if (locality) {
      items.push({
        label: locality,
        onClick: () => {},
      });
    }

    return items;
  }, [region, country, state, city, locality, continentInfo, countryInfo, setSearchParams]);

  if (breadcrumbs.length <= 1) return null;

  return (
    <div className={cn("flex items-center gap-1 text-sm overflow-x-auto scrollbar-hide", className)}>
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="w-3 h-3 mx-1 text-muted-foreground flex-shrink-0" />
          )}
          <button
            onClick={item.onClick}
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted/60 transition-colors flex-shrink-0",
              index === breadcrumbs.length - 1 && "font-medium"
            )}
          >
            {item.emoji && <span className="text-sm">{item.emoji}</span>}
            <span className="text-xs">{item.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
}

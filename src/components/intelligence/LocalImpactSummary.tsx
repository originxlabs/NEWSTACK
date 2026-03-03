import { motion } from "framer-motion";
import { 
  Building2, Construction, DollarSign, Shield, 
  TrendingUp, AlertTriangle, ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ImpactCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  count: number;
  highlights: string[];
}

interface LocalImpactSummaryProps {
  placeName: string;
  newsItems?: Array<{
    headline: string;
    category?: string;
    published_at?: string;
  }>;
  className?: string;
}

function categorizeLocalNews(newsItems: LocalImpactSummaryProps["newsItems"]): ImpactCategory[] {
  if (!newsItems || newsItems.length === 0) {
    return [];
  }

  const categories: Record<string, { items: string[]; keywords: string[] }> = {
    governance: {
      items: [],
      keywords: ["government", "council", "municipal", "policy", "election", "mayor", "minister", "law", "regulation"],
    },
    infrastructure: {
      items: [],
      keywords: ["road", "bridge", "metro", "railway", "construction", "project", "development", "transport", "airport"],
    },
    economy: {
      items: [],
      keywords: ["business", "jobs", "employment", "company", "startup", "investment", "economy", "market", "industry"],
    },
    safety: {
      items: [],
      keywords: ["police", "crime", "accident", "safety", "emergency", "fire", "disaster", "flood", "storm"],
    },
  };

  newsItems.forEach(item => {
    const headline = item.headline.toLowerCase();
    
    for (const [category, data] of Object.entries(categories)) {
      if (data.keywords.some(kw => headline.includes(kw))) {
        if (data.items.length < 3) {
          data.items.push(item.headline);
        }
        break;
      }
    }
  });

  const categoryConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
    governance: {
      icon: Building2,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      label: "Governance",
    },
    infrastructure: {
      icon: Construction,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      label: "Infrastructure",
    },
    economy: {
      icon: DollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      label: "Economy & Jobs",
    },
    safety: {
      icon: Shield,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      label: "Safety",
    },
  };

  return Object.entries(categories)
    .filter(([_, data]) => data.items.length > 0)
    .map(([key, data]) => ({
      id: key,
      label: categoryConfig[key].label,
      icon: categoryConfig[key].icon,
      color: categoryConfig[key].color,
      bgColor: categoryConfig[key].bgColor,
      count: data.items.length,
      highlights: data.items,
    }));
}

function ImpactCard({ category }: { category: ImpactCategory }) {
  const Icon = category.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-3 rounded-lg border transition-colors hover:border-primary/30",
        category.bgColor,
        "border-transparent"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("p-1.5 rounded-md", category.bgColor)}>
          <Icon className={cn("w-4 h-4", category.color)} />
        </div>
        <span className="text-sm font-medium">{category.label}</span>
        <Badge variant="outline" className="text-[10px] h-4 ml-auto">
          {category.count}
        </Badge>
      </div>
      
      <ul className="space-y-1">
        {category.highlights.map((highlight, i) => (
          <li key={i} className="text-xs text-muted-foreground line-clamp-1 flex items-start gap-1.5">
            <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5 text-muted-foreground/50" />
            <span>{highlight}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export function LocalImpactSummary({ 
  placeName, 
  newsItems,
  className 
}: LocalImpactSummaryProps) {
  const categories = categorizeLocalNews(newsItems);

  if (categories.length === 0) {
    return null;
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold text-sm">Local Impact Summary</h3>
            <p className="text-xs text-muted-foreground">
              What's affecting {placeName} right now
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map(category => (
            <ImpactCard key={category.id} category={category} />
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-muted-foreground/50" />
            No significant local impacts detected
          </div>
        )}
      </CardContent>
    </Card>
  );
}

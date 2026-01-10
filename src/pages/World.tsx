import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Globe, TrendingUp, AlertTriangle, Thermometer, DollarSign, Leaf } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { usePreferences } from "@/contexts/PreferencesContext";

interface Region {
  code: string;
  name: string;
  flag: string;
  stories: number;
  trending: string;
  status: "stable" | "alert" | "hotspot";
}

const regions: Region[] = [
  { code: "NA", name: "North America", flag: "🇺🇸", stories: 234, trending: "Tech earnings season", status: "stable" },
  { code: "EU", name: "Europe", flag: "🇪🇺", stories: 189, trending: "Energy crisis update", status: "alert" },
  { code: "AS", name: "Asia Pacific", flag: "🇨🇳", stories: 312, trending: "Trade negotiations", status: "stable" },
  { code: "ME", name: "Middle East", flag: "🇦🇪", stories: 87, trending: "Oil production cuts", status: "hotspot" },
  { code: "AF", name: "Africa", flag: "🇿🇦", stories: 56, trending: "Climate summit", status: "stable" },
  { code: "SA", name: "South America", flag: "🇧🇷", stories: 78, trending: "Economic reforms", status: "stable" },
];

const globalStats = [
  { label: "Markets", value: "+1.2%", icon: TrendingUp, color: "text-success" },
  { label: "Conflicts", value: "3 Active", icon: AlertTriangle, color: "text-destructive" },
  { label: "Climate", value: "+1.5°C", icon: Thermometer, color: "text-warning" },
  { label: "Oil Price", value: "$78.45", icon: DollarSign, color: "text-primary" },
  { label: "Carbon", value: "418 ppm", icon: Leaf, color: "text-success" },
];

const World = () => {
  const { country } = usePreferences();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6">
              <Globe className="h-4 w-4" />
              Global Intelligence
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              World Overview
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Real-time global news, markets, conflicts, and climate events.
              {country && ` Your location: ${country.flag_emoji} ${country.name}`}
            </p>
          </motion.div>

          {/* Global Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-12"
          >
            {globalStats.map((stat) => (
              <div key={stat.label} className="glass-card rounded-xl p-4 text-center">
                <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                <div className={`font-display font-bold text-xl ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* World Map Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-8 mb-12 text-center"
          >
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="font-display text-xl font-semibold mb-2">Interactive World Map</h3>
            <p className="text-muted-foreground">
              Click on any region to explore stories, trends, and insights
            </p>
          </motion.div>

          {/* Regions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regions.map((region, index) => (
              <motion.div
                key={region.code}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="glass-card rounded-xl p-6 cursor-pointer hover:scale-[1.02] transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{region.flag}</span>
                    <div>
                      <h3 className="font-display font-semibold">{region.name}</h3>
                      <p className="text-sm text-muted-foreground">{region.stories} stories</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      region.status === "hotspot"
                        ? "destructive"
                        : region.status === "alert"
                        ? "secondary"
                        : "outline"
                    }
                    className="capitalize"
                  >
                    {region.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Trending:</span>
                  <span>{region.trending}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default World;

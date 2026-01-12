import { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock, Layers, Languages, Loader2, MapPin, Globe, Volume2, Pause
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTTS } from "@/hooks/use-tts";
import { useTTSLimit } from "@/hooks/use-tts-limit";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface NewsGridItem {
  id: string;
  headline: string;
  summary?: string;
  originalHeadline?: string | null;
  originalSummary?: string | null;
  originalLanguage?: string | null;
  imageUrl?: string;
  source?: string;
  timestamp?: string;
  publishedAt?: string;
  sourceCount?: number;
  category?: string;
  locality?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  tier?: "local" | "district" | "state" | "country" | "global";
}

interface NewsGridCardProps {
  item: NewsGridItem;
  onClick?: () => void;
  index?: number;
}

const LANGUAGE_DISPLAY: Record<string, { name: string; native: string }> = {
  or: { name: "Odia", native: "ଓଡ଼ିଆ" },
  hi: { name: "Hindi", native: "हिंदी" },
  bn: { name: "Bengali", native: "বাংলা" },
  ta: { name: "Tamil", native: "தமிழ்" },
  te: { name: "Telugu", native: "తెలుగు" },
  mr: { name: "Marathi", native: "मराठी" },
  gu: { name: "Gujarati", native: "ગુજરાતી" },
  kn: { name: "Kannada", native: "ಕನ್ನಡ" },
  ml: { name: "Malayalam", native: "മലയാളം" },
  pa: { name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  as: { name: "Assamese", native: "অসমীয়া" },
  en: { name: "English", native: "English" },
};

const TIER_CONFIG: Record<string, { label: string; color: string; icon: typeof MapPin }> = {
  local: { label: "Local", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: MapPin },
  district: { label: "District", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: MapPin },
  state: { label: "State", color: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: MapPin },
  country: { label: "National", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Globe },
  global: { label: "Global", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20", icon: Globe },
};

export function NewsGridCard({ item, onClick, index = 0 }: NewsGridCardProps) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedHeadline, setTranslatedHeadline] = useState<string | null>(null);
  const [translatedSummary, setTranslatedSummary] = useState<string | null>(null);

  const displayHeadline = showTranslation && translatedHeadline ? translatedHeadline : item.headline;
  const displaySummary = showTranslation && translatedSummary ? translatedSummary : item.summary;

  const langCode = item.originalLanguage || "en";
  const langInfo = LANGUAGE_DISPLAY[langCode] || LANGUAGE_DISPLAY.en;
  const tierConfig = TIER_CONFIG[item.tier || "global"];
  const hasRegionalLanguage = item.originalLanguage && item.originalLanguage !== "en";

  const { speak, toggle, isLoading: ttsLoading, isPlaying } = useTTS({ language: langCode });
  const { incrementUsage, canPlay } = useTTSLimit();

  const handleTranslate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }

    if (translatedHeadline) {
      setShowTranslation(true);
      return;
    }

    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke("translate-to-english", {
        body: { headline: item.headline, summary: item.summary },
      });

      if (error) throw error;
      setTranslatedHeadline(data?.headline_en || item.headline);
      setTranslatedSummary(data?.summary_en || item.summary);
      setShowTranslation(true);
    } catch (err) {
      toast.error("Translation failed");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleListen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      toggle();
      return;
    }
    if (!canPlay() || !incrementUsage()) return;
    
    const textToSpeak = item.originalHeadline || item.headline;
    await speak(textToSpeak.substring(0, 200));
  };

  const locationText = item.locality || item.city || item.state || item.country || "Global";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
    >
      <Card
        className="group overflow-hidden hover:shadow-lg transition-all cursor-pointer border-border/50 h-full"
        onClick={onClick}
      >
        {/* Image */}
        {item.imageUrl && (
          <div className="relative h-36 overflow-hidden">
            <img
              src={item.imageUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            
            {/* Tier badge */}
            <Badge 
              variant="outline" 
              className={cn("absolute top-2 left-2 text-[9px] h-5 gap-1", tierConfig.color)}
            >
              <tierConfig.icon className="w-2.5 h-2.5" />
              {tierConfig.label}
            </Badge>

            {/* Language badge */}
            {hasRegionalLanguage && (
              <Badge 
                variant="outline" 
                className="absolute top-2 right-2 text-[9px] h-5 bg-background/80"
              >
                {langInfo.native}
              </Badge>
            )}
          </div>
        )}

        <CardContent className={cn("p-3", !item.imageUrl && "pt-4")}>
          {/* No image tier badge */}
          {!item.imageUrl && (
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="outline" 
                className={cn("text-[9px] h-5 gap-1", tierConfig.color)}
              >
                <tierConfig.icon className="w-2.5 h-2.5" />
                {tierConfig.label}
              </Badge>
              {hasRegionalLanguage && (
                <Badge 
                  variant="outline" 
                  className="text-[9px] h-5 bg-primary/5"
                >
                  {langInfo.native}
                </Badge>
              )}
            </div>
          )}

          {/* Headline */}
          <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors mb-2">
            {displayHeadline}
          </h3>

          {/* Summary */}
          {displaySummary && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {displaySummary}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />
                <span className="truncate max-w-16">{locationText}</span>
              </div>
              {item.sourceCount && item.sourceCount > 1 && (
                <div className="flex items-center gap-1">
                  <Layers className="w-2.5 h-2.5" />
                  <span>{item.sourceCount}</span>
                </div>
              )}
              {item.timestamp && (
                <div className="flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{item.timestamp}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {hasRegionalLanguage && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleTranslate}
                  disabled={isTranslating}
                >
                  {isTranslating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Languages className="w-3 h-3" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleListen}
                disabled={ttsLoading}
              >
                {ttsLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-3 h-3" />
                ) : (
                  <Volume2 className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

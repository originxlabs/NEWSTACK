import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX, Loader2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTTS } from "@/hooks/use-tts";
import { useTTSLimit } from "@/hooks/use-tts-limit";
import { cn } from "@/lib/utils";

interface RegionalTTSButtonProps {
  text: string;
  originalText?: string | null;
  language: string;
  originalLanguage?: string | null;
  className?: string;
  size?: "sm" | "default" | "lg";
  showLanguageBadge?: boolean;
}

// Language display config
const LANGUAGE_DISPLAY: Record<
  string,
  { name: string; native: string; flag: string }
> = {
  or: { name: "Odia", native: "ଓଡ଼ିଆ", flag: "🏛️" },
  hi: { name: "Hindi", native: "हिंदी", flag: "🇮🇳" },
  bn: { name: "Bengali", native: "বাংলা", flag: "🎭" },
  ta: { name: "Tamil", native: "தமிழ்", flag: "🏯" },
  te: { name: "Telugu", native: "తెలుగు", flag: "🏰" },
  mr: { name: "Marathi", native: "मराठी", flag: "🦁" },
  gu: { name: "Gujarati", native: "ગુજરાતી", flag: "🦁" },
  kn: { name: "Kannada", native: "ಕನ್ನಡ", flag: "🐘" },
  ml: { name: "Malayalam", native: "മലയാളം", flag: "🌴" },
  pa: { name: "Punjabi", native: "ਪੰਜਾਬੀ", flag: "🌾" },
  en: { name: "English", native: "English", flag: "🌐" },
};

export function RegionalTTSButton({
  text,
  originalText,
  language,
  originalLanguage,
  className,
  size = "sm",
  showLanguageBadge = true,
}: RegionalTTSButtonProps) {
  const [playingOriginal, setPlayingOriginal] = useState(false);

  // Determine which language to use for TTS
  const effectiveLang = playingOriginal && originalLanguage ? originalLanguage : language;
  const effectiveText = playingOriginal && originalText ? originalText : text;

  const { speak, toggle, stop, isLoading, isPlaying, progress, usingFallback } =
    useTTS({
      language: effectiveLang,
    });

  const { incrementUsage, canPlay } = useTTSLimit();

  const langDisplay = LANGUAGE_DISPLAY[effectiveLang] || LANGUAGE_DISPLAY.en;

  const handlePlay = useCallback(
    async (e: React.MouseEvent, useOriginal: boolean) => {
      e.stopPropagation();

      if (isPlaying) {
        toggle();
        return;
      }

      if (isLoading) return;

      // Update which version we're playing
      setPlayingOriginal(useOriginal);

      if (!canPlay()) return;
      if (!incrementUsage()) return;

      const textToSpeak = useOriginal && originalText ? originalText : text;
      await speak(textToSpeak.substring(0, 250));
    },
    [
      isPlaying,
      isLoading,
      toggle,
      canPlay,
      incrementUsage,
      speak,
      text,
      originalText,
    ]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => stop();
  }, [stop]);

  const hasOriginalLanguage =
    originalLanguage && originalLanguage !== "en" && originalText;

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1", className)}>
        {/* English TTS button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="glass"
              size={size}
              onClick={(e) => handlePlay(e, false)}
              disabled={isLoading && !playingOriginal}
              className={cn(
                "gap-1",
                size === "sm" && "h-7 px-2 text-xs",
                isPlaying && !playingOriginal && "bg-primary/10 text-primary"
              )}
            >
              {isLoading && !playingOriginal ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isPlaying && !playingOriginal ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <AudioWave />
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">EN</span>
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Listen in English</p>
          </TooltipContent>
        </Tooltip>

        {/* Original language TTS button */}
        {hasOriginalLanguage && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="glass"
                size={size}
                onClick={(e) => handlePlay(e, true)}
                disabled={isLoading && playingOriginal}
                className={cn(
                  "gap-1",
                  size === "sm" && "h-7 px-2 text-xs",
                  isPlaying && playingOriginal && "bg-primary/10 text-primary"
                )}
              >
                {isLoading && playingOriginal ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isPlaying && playingOriginal ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <AudioWave />
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {LANGUAGE_DISPLAY[originalLanguage]?.native ||
                        originalLanguage.toUpperCase()}
                    </span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Listen in{" "}
                {LANGUAGE_DISPLAY[originalLanguage]?.name || originalLanguage}
              </p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Language badge */}
        {showLanguageBadge && hasOriginalLanguage && (
          <Badge
            variant="outline"
            className="text-[9px] h-5 px-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
          >
            {LANGUAGE_DISPLAY[originalLanguage]?.native || originalLanguage}
          </Badge>
        )}

        {/* Progress indicator */}
        {isPlaying && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="absolute bottom-0 left-0 h-0.5 bg-primary/50 rounded-full"
          />
        )}
      </div>
    </TooltipProvider>
  );
}

// Audio wave animation
function AudioWave() {
  return (
    <div className="flex items-center gap-0.5 h-3">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="w-0.5 bg-current rounded-full"
          animate={{
            height: ["4px", "12px", "4px"],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

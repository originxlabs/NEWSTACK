import { cn } from "@/lib/utils";
import { getStateFlag, getStateConfig } from "@/lib/india-states-config";

interface StateFlagBadgeProps {
  stateId: string;
  size?: "sm" | "md" | "lg" | "xl";
  showEmoji?: boolean;
  showCode?: boolean;
  className?: string;
}

export function StateFlagBadge({
  stateId,
  size = "md",
  showEmoji = true,
  showCode = true,
  className,
}: StateFlagBadgeProps) {
  const flagInfo = getStateFlag(stateId);
  const stateConfig = getStateConfig(stateId);

  if (!stateConfig) return null;

  const sizeClasses = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm",
    xl: "w-12 h-12 text-base",
  };

  const gradientStyle = flagInfo?.colors
    ? {
        background: flagInfo.colors.length > 1
          ? `linear-gradient(135deg, ${flagInfo.colors.join(", ")})`
          : flagInfo.colors[0],
      }
    : undefined;

  return (
    <div
      className={cn(
        "rounded-lg flex items-center justify-center font-bold text-white shadow-sm",
        sizeClasses[size],
        !flagInfo && stateConfig.color,
        className
      )}
      style={gradientStyle}
      title={stateConfig.name}
    >
      {showEmoji && flagInfo?.emoji ? (
        <span className="drop-shadow-sm">{flagInfo.emoji}</span>
      ) : showCode ? (
        <span className="drop-shadow-sm">{stateConfig.code}</span>
      ) : null}
    </div>
  );
}

// Horizontal state flag strip component
interface StateFlagStripProps {
  stateIds: string[];
  size?: "sm" | "md";
  maxShow?: number;
  className?: string;
}

export function StateFlagStrip({
  stateIds,
  size = "sm",
  maxShow = 5,
  className,
}: StateFlagStripProps) {
  const visibleStates = stateIds.slice(0, maxShow);
  const remaining = stateIds.length - maxShow;

  return (
    <div className={cn("flex items-center -space-x-1", className)}>
      {visibleStates.map((stateId) => (
        <StateFlagBadge
          key={stateId}
          stateId={stateId}
          size={size}
          showEmoji={false}
          className="border-2 border-background"
        />
      ))}
      {remaining > 0 && (
        <div className={cn(
          "rounded-lg flex items-center justify-center bg-muted text-muted-foreground border-2 border-background",
          size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs"
        )}>
          +{remaining}
        </div>
      )}
    </div>
  );
}

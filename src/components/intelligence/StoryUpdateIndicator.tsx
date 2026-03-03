import { motion } from "framer-motion";
import { Bell, RefreshCw, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface StoryUpdateIndicatorProps {
  type: "new_sources" | "signal_change" | "headline_update";
  message: string;
  previousValue?: string | number;
  currentValue?: string | number;
  className?: string;
}

export function StoryUpdateIndicator({
  type,
  message,
  previousValue,
  currentValue,
  className,
}: StoryUpdateIndicatorProps) {
  const config = {
    new_sources: {
      icon: Plus,
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      label: "Updated",
    },
    signal_change: {
      icon: RefreshCw,
      color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      label: "Status changed",
    },
    headline_update: {
      icon: Bell,
      color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      label: "Updated",
    },
  };

  const { icon: Icon, color, label } = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px]",
        color,
        className
      )}
    >
      <Icon className="w-2.5 h-2.5" />
      <span>{message}</span>
    </motion.div>
  );
}

interface UpdatedSinceLastViewProps {
  lastViewedAt: Date;
  updates: Array<{
    type: "new_sources" | "signal_change" | "headline_update";
    message: string;
  }>;
  className?: string;
}

export function UpdatedSinceLastView({
  lastViewedAt,
  updates,
  className,
}: UpdatedSinceLastViewProps) {
  if (updates.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "mb-2 p-2 rounded-md bg-primary/5 border border-primary/20",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <Bell className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground mb-1">
            Updated since you last viewed
          </p>
          <p className="text-[10px] text-muted-foreground mb-2">
            {formatDistanceToNow(lastViewedAt, { addSuffix: true })}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {updates.map((update, i) => (
              <StoryUpdateIndicator
                key={i}
                type={update.type}
                message={update.message}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Compact badge version for news cards
interface UpdateBadgeProps {
  updateCount: number;
  className?: string;
}

export function UpdateBadge({ updateCount, className }: UpdateBadgeProps) {
  if (updateCount === 0) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 text-[10px] h-5 px-1.5 bg-primary/10 text-primary border-primary/20",
        className
      )}
    >
      <Bell className="w-2.5 h-2.5" />
      Updated
    </Badge>
  );
}

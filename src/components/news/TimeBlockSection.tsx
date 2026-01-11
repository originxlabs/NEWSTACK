import { motion } from "framer-motion";
import { Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface TimeBlockSectionProps {
  label: string;
  id: string;
  count: number;
  children: React.ReactNode;
  isFirst?: boolean;
}

export function TimeBlockSection({
  label,
  id,
  count,
  children,
  isFirst = false,
}: TimeBlockSectionProps) {
  const [isExpanded, setIsExpanded] = useState(isFirst);

  return (
    <section className="mb-6">
      {/* Time block header */}
      <div className="sticky top-28 lg:top-20 z-20 bg-background/95 backdrop-blur-sm py-2 -mx-1 px-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full group"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <h2 className="text-sm font-medium text-foreground">{label}</h2>
            <span className="text-xs text-muted-foreground">
              ({count} {count === 1 ? "story" : "stories"})
            </span>
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        </button>
        <div className="h-px bg-border/50 mt-2" />
      </div>

      {/* Content */}
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="pt-3 space-y-3">{children}</div>
      </motion.div>

      {/* "Load more" if collapsed and has content */}
      {!isExpanded && count > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-xs h-8"
          onClick={() => setIsExpanded(true)}
        >
          Show {count} {count === 1 ? "story" : "stories"} from {label.toLowerCase()}
        </Button>
      )}
    </section>
  );
}

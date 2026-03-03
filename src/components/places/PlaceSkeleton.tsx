import { motion } from "framer-motion";

interface PlaceSkeletonProps {
  type?: "hero" | "card" | "list" | "weather" | "chat";
}

export function PlaceSkeleton({ type = "card" }: PlaceSkeletonProps) {
  if (type === "hero") {
    return (
      <div className="relative h-[60vh] min-h-[400px] w-full">
        <div className="absolute inset-0 bg-muted animate-shimmer" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto max-w-6xl">
            <div className="h-4 w-24 bg-muted rounded animate-shimmer mb-4" />
            <div className="h-12 w-96 max-w-full bg-muted rounded animate-shimmer mb-3" />
            <div className="h-6 w-64 bg-muted rounded animate-shimmer mb-6" />
            <div className="flex gap-3">
              <div className="h-10 w-24 bg-muted rounded-full animate-shimmer" />
              <div className="h-10 w-24 bg-muted rounded-full animate-shimmer" />
              <div className="h-10 w-24 bg-muted rounded-full animate-shimmer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "weather") {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex-shrink-0 w-32 h-28 glass-card rounded-xl p-4"
          >
            <div className="h-4 w-12 bg-muted rounded animate-shimmer mb-3" />
            <div className="h-8 w-16 bg-muted rounded animate-shimmer mb-2" />
            <div className="h-3 w-20 bg-muted rounded animate-shimmer" />
          </motion.div>
        ))}
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-xl p-4 flex items-center gap-4"
          >
            <div className="w-16 h-16 bg-muted rounded-lg animate-shimmer flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="h-4 w-32 bg-muted rounded animate-shimmer mb-2" />
              <div className="h-3 w-48 bg-muted rounded animate-shimmer mb-2" />
              <div className="h-3 w-20 bg-muted rounded animate-shimmer" />
            </div>
            <div className="h-8 w-8 bg-muted rounded-full animate-shimmer" />
          </motion.div>
        ))}
      </div>
    );
  }

  if (type === "chat") {
    return (
      <div className="space-y-4 p-4">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`${
                i % 2 === 0 ? "bg-primary/20" : "bg-muted"
              } rounded-2xl p-4 max-w-[80%] animate-shimmer`}
            >
              <div className="h-4 w-48 bg-muted rounded animate-shimmer mb-2" />
              <div className="h-4 w-32 bg-muted rounded animate-shimmer" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  // Default card skeleton
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl overflow-hidden"
    >
      <div className="h-40 bg-muted animate-shimmer" />
      <div className="p-4">
        <div className="h-5 w-32 bg-muted rounded animate-shimmer mb-2" />
        <div className="h-4 w-48 bg-muted rounded animate-shimmer mb-3" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-muted rounded-full animate-shimmer" />
          <div className="h-6 w-16 bg-muted rounded-full animate-shimmer" />
        </div>
      </div>
    </motion.div>
  );
}

export function PlaceGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <PlaceSkeleton key={i} />
      ))}
    </div>
  );
}

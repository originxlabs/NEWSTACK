import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn(
      "rounded-md bg-muted animate-shimmer",
      className
    )} />
  );
}

export function NewsCardSkeleton() {
  return (
    <div className="rounded-lg border border-border/50 p-4 sm:p-5 bg-card">
      {/* Badge row */}
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
      
      {/* Headline */}
      <Skeleton className="h-6 w-full mb-2" />
      <Skeleton className="h-6 w-3/4 mb-3" />
      
      {/* Meta row */}
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      
      {/* Summary */}
      <Skeleton className="h-4 w-full mb-1.5" />
      <Skeleton className="h-4 w-5/6 mb-4" />
      
      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-7 w-7 rounded" />
          <Skeleton className="h-7 w-7 rounded" />
          <Skeleton className="h-7 w-7 rounded" />
        </div>
      </div>
    </div>
  );
}

export function StoryClusterSkeleton() {
  return (
    <div className="rounded-lg border border-border/50 p-4 bg-card">
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Skeleton className="h-5 w-full mb-1.5" />
      <Skeleton className="h-5 w-4/5 mb-3" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-3/4 mb-4" />
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}

export function RegionCardSkeleton() {
  return (
    <div className="rounded-lg border border-border/50 p-4 bg-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-8 rounded" />
          <div>
            <Skeleton className="h-4 w-24 mb-1.5" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-5 w-14" />
      </div>
      <Skeleton className="h-3 w-20 mb-2" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-14" />
        <Skeleton className="h-5 w-12" />
      </div>
    </div>
  );
}

export function WorldMapSkeleton() {
  return (
    <div className="rounded-lg border border-border/50 p-6 bg-card">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="aspect-[2/1] relative">
        <Skeleton className="absolute inset-0 rounded-lg" />
        {/* Simulated map hotspots */}
        <div className="absolute inset-0 flex items-center justify-center gap-8">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-3 w-3 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function TrustPanelSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="rounded-lg border border-border/50 p-3 bg-card space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-12" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Skeleton className="h-3 w-12 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div>
            <Skeleton className="h-3 w-14 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FilterPanelSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-4 w-4" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-16 mb-2" />
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
}

// Full page loading state
export function NewsPageSkeleton() {
  return (
    <div className="flex gap-6">
      {/* Left panel */}
      <div className="hidden lg:block w-56 flex-shrink-0">
        <FilterPanelSkeleton />
      </div>
      
      {/* Center content */}
      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-7 w-20" />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-7 w-7" />
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <NewsCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Right panel */}
      <div className="hidden xl:block w-56 flex-shrink-0">
        <TrustPanelSkeleton />
      </div>
    </div>
  );
}

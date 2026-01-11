import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NLogoProps {
  size?: number;
  className?: string;
  animate?: boolean;
  color?: string;
}

/**
 * NEWSTACK N-style Logo Component
 * Based on the stacked block design representing news layers
 */
export function NLogo({ 
  size = 40, 
  className = "", 
  animate = false,
  color = "currentColor" 
}: NLogoProps) {
  const blockVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.08,
        duration: 0.3,
        type: "spring" as const,
        stiffness: 300,
        damping: 15
      }
    })
  };

  if (animate) {
    return (
      <motion.svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={cn("", className)}
        initial="hidden"
        animate="visible"
      >
        {/* Row 1: Top left with diagonal cut */}
        <motion.path
          d="M8 8 L8 28 Q8 30 10 30 L36 30 L48 18 L48 10 Q48 8 46 8 L10 8 Q8 8 8 8 Z"
          fill={color}
          custom={0}
          variants={blockVariants}
        />
        {/* Row 1: Top right with diagonal cut */}
        <motion.path
          d="M54 8 L54 18 L66 30 L90 30 Q92 30 92 28 L92 10 Q92 8 90 8 L54 8 Z"
          fill={color}
          custom={1}
          variants={blockVariants}
        />
        
        {/* Row 2: Left block */}
        <motion.rect
          x="8" y="36" width="18" height="24" rx="2"
          fill={color}
          custom={2}
          variants={blockVariants}
        />
        {/* Row 2: Center diagonal block */}
        <motion.rect
          x="32" y="36" width="36" height="24" rx="2"
          fill={color}
          custom={3}
          variants={blockVariants}
        />
        {/* Row 2: Right block */}
        <motion.rect
          x="74" y="36" width="18" height="24" rx="2"
          fill={color}
          custom={4}
          variants={blockVariants}
        />
        
        {/* Row 3: Bottom left */}
        <motion.rect
          x="8" y="66" width="22" height="24" rx="2"
          fill={color}
          custom={5}
          variants={blockVariants}
        />
        {/* Row 3: Bottom center */}
        <motion.rect
          x="36" y="66" width="18" height="24" rx="2"
          fill={color}
          custom={6}
          variants={blockVariants}
        />
        {/* Row 3: Bottom right with diagonal cut */}
        <motion.path
          d="M60 66 L48 78 L48 88 Q48 90 50 90 L90 90 Q92 90 92 88 L92 66 L60 66 Z"
          fill={color}
          custom={7}
          variants={blockVariants}
        />
      </motion.svg>
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn("", className)}
    >
      {/* Row 1: Top left with diagonal cut */}
      <path
        d="M8 8 L8 28 Q8 30 10 30 L36 30 L48 18 L48 10 Q48 8 46 8 L10 8 Q8 8 8 8 Z"
        fill={color}
      />
      {/* Row 1: Top right with diagonal cut */}
      <path
        d="M54 8 L54 18 L66 30 L90 30 Q92 30 92 28 L92 10 Q92 8 90 8 L54 8 Z"
        fill={color}
      />
      
      {/* Row 2: Left block */}
      <rect x="8" y="36" width="18" height="24" rx="2" fill={color} />
      {/* Row 2: Center block */}
      <rect x="32" y="36" width="36" height="24" rx="2" fill={color} />
      {/* Row 2: Right block */}
      <rect x="74" y="36" width="18" height="24" rx="2" fill={color} />
      
      {/* Row 3: Bottom left */}
      <rect x="8" y="66" width="22" height="24" rx="2" fill={color} />
      {/* Row 3: Bottom center */}
      <rect x="36" y="66" width="18" height="24" rx="2" fill={color} />
      {/* Row 3: Bottom right with diagonal cut */}
      <path
        d="M60 66 L48 78 L48 88 Q48 90 50 90 L90 90 Q92 90 92 88 L92 66 L60 66 Z"
        fill={color}
      />
    </svg>
  );
}

/**
 * Animated spinning logo for loading states
 */
export function NLogoSpinner({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <motion.div
      animate={{ rotateY: [0, 360] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.5 }}
      className={className}
    >
      <NLogo size={size} color="hsl(var(--primary))" />
    </motion.div>
  );
}

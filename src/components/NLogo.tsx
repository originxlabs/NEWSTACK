import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NLogoProps {
  size?: number;
  className?: string;
  animate?: boolean;
  /** Use "currentColor" to inherit from parent, or specify a color */
  color?: string;
  /** For theme-aware rendering - automatically uses black on light, white on dark */
  themeAware?: boolean;
}

/**
 * NEWSTACK N-style Logo Component
 * Stacked horizontal bars with diagonal cuts forming an "N" shape
 * Represents stacked news layers
 */
export function NLogo({ 
  size = 40, 
  className = "", 
  animate = false,
  color,
  themeAware = true
}: NLogoProps) {
  // If themeAware is true and no color specified, use currentColor which inherits from parent
  const fillColor = color || (themeAware ? "currentColor" : "#1a1a1a");

  const blockVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.06,
        duration: 0.25,
        type: "spring" as const,
        stiffness: 400,
        damping: 20
      }
    })
  };

  // The exact N-style logo paths based on the reference image
  // 3 rows of stacked bars with diagonal cuts creating the N
  const paths = {
    // Row 1: Top left block (rounded top-left, diagonal cut bottom-right)
    topLeft: "M4 4 Q4 0 8 0 L40 0 L40 4 L22 22 L4 22 L4 4 Z",
    // Row 1: Top right block (diagonal cut top-left, rounded top-right)  
    topRight: "M60 0 L92 0 Q96 0 96 4 L96 22 L78 22 L60 4 L60 0 Z",
    
    // Row 2: Left block
    row2Left: "M4 28 L22 28 L22 50 L4 50 Q0 50 0 46 L0 32 Q0 28 4 28 Z",
    // Row 2: Center block (full width with diagonal)
    row2Center: "M28 28 L68 28 L68 50 L28 50 L28 28 Z",
    // Row 2: Right block
    row2Right: "M74 28 L96 28 Q100 28 100 32 L100 46 Q100 50 96 50 L74 50 L74 28 Z",
    
    // Row 3: Bottom left block (rounded bottom-left)
    bottomLeft: "M4 56 L22 56 L22 78 L8 78 Q4 78 4 74 L4 56 Z",
    // Row 3: Bottom center block
    bottomCenter: "M28 56 L46 56 L46 78 L28 78 L28 56 Z",
    // Row 3: Bottom right block (diagonal cut top-left, rounded bottom-right)
    bottomRight: "M56 56 L96 56 L96 74 Q96 78 92 78 L52 78 L52 74 L56 56 Z"
  };

  // Simplified accurate paths matching the exact reference
  const accuratePaths = [
    // Row 1 - Top
    { d: "M2 2 C2 0.9 2.9 0 4 0 L36 0 L36 2 L20 18 L2 18 L2 2 Z", custom: 0 },
    { d: "M64 0 L96 0 C97.1 0 98 0.9 98 2 L98 18 L80 18 L64 2 L64 0 Z", custom: 1 },
    
    // Row 2 - Middle  
    { d: "M2 24 L18 24 L18 46 L2 46 C0.9 46 0 45.1 0 44 L0 26 C0 24.9 0.9 24 2 24 Z", custom: 2 },
    { d: "M24 24 L76 24 L76 46 L24 46 L24 24 Z", custom: 3 },
    { d: "M82 24 L98 24 C99.1 24 100 24.9 100 26 L100 44 C100 45.1 99.1 46 98 46 L82 46 L82 24 Z", custom: 4 },
    
    // Row 3 - Bottom
    { d: "M2 52 L18 52 L18 70 L4 70 C2.9 70 2 69.1 2 68 L2 52 Z", custom: 5 },
    { d: "M24 52 L40 52 L40 70 L24 70 L24 52 Z", custom: 6 },
    { d: "M54 52 L98 52 L98 68 C98 69.1 97.1 70 96 70 L46 70 L46 68 L54 52 Z", custom: 7 },
  ];

  if (animate) {
    return (
      <motion.svg
        viewBox="0 0 100 70"
        width={size}
        height={size * 0.7}
        className={cn("text-foreground", className)}
        initial="hidden"
        animate="visible"
        preserveAspectRatio="xMidYMid meet"
      >
        {accuratePaths.map((path, idx) => (
          <motion.path
            key={idx}
            d={path.d}
            fill={fillColor}
            custom={path.custom}
            variants={blockVariants}
          />
        ))}
      </motion.svg>
    );
  }

  return (
    <svg
      viewBox="0 0 100 70"
      width={size}
      height={size * 0.7}
      className={cn("text-foreground", className)}
      preserveAspectRatio="xMidYMid meet"
    >
      {accuratePaths.map((path, idx) => (
        <path key={idx} d={path.d} fill={fillColor} />
      ))}
    </svg>
  );
}

/**
 * Square version of the logo for app icons
 */
export function NLogoSquare({ 
  size = 40, 
  className = "", 
  color,
  themeAware = true,
  withBackground = false,
  bgColor = "transparent"
}: NLogoProps & { withBackground?: boolean; bgColor?: string }) {
  const fillColor = color || (themeAware ? "currentColor" : "#1a1a1a");

  // Paths adjusted to fit in a square viewBox with padding
  const paths = [
    // Row 1 - Top
    { d: "M12 15 C12 13 14 11 16 11 L42 11 L42 13 L28 27 L12 27 L12 15 Z" },
    { d: "M58 11 L84 11 C86 11 88 13 88 15 L88 27 L72 27 L58 13 L58 11 Z" },
    
    // Row 2 - Middle  
    { d: "M12 33 L26 33 L26 53 L12 53 C10 53 8 51 8 49 L8 37 C8 35 10 33 12 33 Z" },
    { d: "M32 33 L68 33 L68 53 L32 53 L32 33 Z" },
    { d: "M74 33 L88 33 C90 33 92 35 92 37 L92 49 C92 51 90 53 88 53 L74 53 L74 33 Z" },
    
    // Row 3 - Bottom
    { d: "M12 59 L26 59 L26 75 L16 75 C14 75 12 73 12 71 L12 59 Z" },
    { d: "M32 59 L46 59 L46 75 L32 75 L32 59 Z" },
    { d: "M56 59 L88 59 L88 71 C88 73 86 75 84 75 L48 75 L48 73 L56 59 Z" },
  ];

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn("text-foreground", className)}
      preserveAspectRatio="xMidYMid meet"
    >
      {withBackground && (
        <rect x="0" y="0" width="100" height="100" fill={bgColor} rx="20" />
      )}
      {paths.map((path, idx) => (
        <path key={idx} d={path.d} fill={fillColor} />
      ))}
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
      className={cn("text-primary", className)}
      style={{ perspective: 1000 }}
    >
      <NLogoSquare size={size} />
    </motion.div>
  );
}

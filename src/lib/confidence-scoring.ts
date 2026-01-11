// Confidence Scoring Logic
// Measures reporting reliability, NOT truth
// Based on: source count, diversity, primary reporting, contradictions

export type ConfidenceLevel = "low" | "medium" | "high";
export type StoryState = "single-source" | "developing" | "confirmed" | "contradicted" | "resolved";

export interface ConfidenceInput {
  sourceCount: number;
  verifiedSourceCount?: number;
  hasPrimaryReporting?: boolean;
  hasContradictions?: boolean;
  ageMinutes?: number;
  isStableNarrative?: boolean;
}

export interface ConfidenceResult {
  level: ConfidenceLevel;
  label: string;
  explanation: string;
  storyState: StoryState;
  stateLabel: string;
  isSingleSource: boolean;
}

// Verified primary sources
const VERIFIED_SOURCES = new Set([
  "reuters", "ap news", "associated press", "afp", "pti",
  "bbc", "cnn", "al jazeera", "npr", "nbc news", "cbs news", "abc news",
  "new york times", "washington post", "the guardian", "the hindu",
  "times of india", "hindustan times", "financial times", "wall street journal",
  "bloomberg", "cnbc", "forbes", "economic times", "marketwatch",
  "techcrunch", "the verge", "ars technica", "wired",
]);

export function isVerifiedSource(sourceName: string): boolean {
  const lower = sourceName.toLowerCase();
  return Array.from(VERIFIED_SOURCES).some(vs => lower.includes(vs));
}

/**
 * Calculate confidence level based on reporting signals
 * 
 * LOW CONFIDENCE: Only 1 source, no primary reporting, major contradictions, very recent
 * MEDIUM CONFIDENCE: 2-3 independent sources, some primary reporting, no major contradictions
 * HIGH CONFIDENCE: 4+ independent sources, clear primary reporting, no contradictions, stable narrative
 */
export function calculateConfidence(input: ConfidenceInput): ConfidenceResult {
  const {
    sourceCount,
    verifiedSourceCount = 0,
    hasPrimaryReporting = false,
    hasContradictions = false,
    ageMinutes = Infinity,
    isStableNarrative = true,
  } = input;

  const isSingleSource = sourceCount <= 1;

  // RULE: Single-source stories can NEVER be High
  // RULE: Contradictions must reduce confidence immediately

  // Determine story state
  let storyState: StoryState;
  let stateLabel: string;

  if (hasContradictions) {
    storyState = "contradicted";
    stateLabel = "Contradicted";
  } else if (isSingleSource) {
    storyState = "single-source";
    stateLabel = "Single Source";
  } else if (sourceCount >= 4 && verifiedSourceCount >= 2 && isStableNarrative) {
    storyState = "confirmed";
    stateLabel = "Confirmed";
  } else {
    storyState = "developing";
    stateLabel = "Developing";
  }

  // LOW CONFIDENCE conditions
  if (
    isSingleSource ||
    !hasPrimaryReporting && sourceCount < 3 ||
    hasContradictions ||
    (ageMinutes < 30 && sourceCount < 2)
  ) {
    return {
      level: "low",
      label: "Low",
      explanation: isSingleSource 
        ? "Limited independent confirmation — only one source reporting"
        : hasContradictions
        ? "Contradictions detected between sources"
        : "Limited independent confirmation",
      storyState,
      stateLabel,
      isSingleSource,
    };
  }

  // HIGH CONFIDENCE conditions
  if (
    sourceCount >= 4 &&
    verifiedSourceCount >= 2 &&
    !hasContradictions &&
    isStableNarrative &&
    (hasPrimaryReporting || verifiedSourceCount >= 3)
  ) {
    return {
      level: "high",
      label: "High",
      explanation: "Consistent reporting across multiple independent sources",
      storyState,
      stateLabel,
      isSingleSource,
    };
  }

  // MEDIUM CONFIDENCE (default)
  return {
    level: "medium",
    label: "Medium",
    explanation: "Multiple sources reporting consistently",
    storyState,
    stateLabel,
    isSingleSource,
  };
}

/**
 * Get confidence color classes
 */
export function getConfidenceColors(level: ConfidenceLevel) {
  switch (level) {
    case "low":
      return {
        text: "text-amber-600 dark:text-amber-500",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
      };
    case "medium":
      return {
        text: "text-blue-600 dark:text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
      };
    case "high":
      return {
        text: "text-emerald-600 dark:text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      };
  }
}

/**
 * Get story state color classes
 */
export function getStoryStateColors(state: StoryState) {
  switch (state) {
    case "single-source":
      return {
        text: "text-amber-600 dark:text-amber-500",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        icon: "AlertTriangle",
      };
    case "developing":
      return {
        text: "text-blue-600 dark:text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        icon: "RefreshCw",
      };
    case "confirmed":
      return {
        text: "text-emerald-600 dark:text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        icon: "CheckCircle2",
      };
    case "contradicted":
      return {
        text: "text-red-600 dark:text-red-500",
        bg: "bg-red-500/10",
        border: "border-red-500/20",
        icon: "AlertTriangle",
      };
    case "resolved":
      return {
        text: "text-muted-foreground",
        bg: "bg-muted",
        border: "border-border",
        icon: "MinusCircle",
      };
  }
}

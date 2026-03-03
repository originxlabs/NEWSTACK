import type { OpenNewsPostMetrics } from "@/modules/opennews/types";

export interface TrendingInputs {
  metrics: OpenNewsPostMetrics;
  ageHours: number;
  journalistCredibilityScore: number;
  controversyScore: number;
  verifiedJournalist: boolean;
  newsroomAccount: boolean;
}

export function calculateOpenNewsScore(input: TrendingInputs): number {
  const {
    likes,
    reposts,
    quotes,
    replies,
    bookmarks,
    poll_votes,
    unique_engagers,
  } = input.metrics;

  const base =
    likes * 1 +
    reposts * 3 +
    quotes * 2.5 +
    replies * 2 +
    bookmarks * 1.5 +
    poll_votes * 0.8 +
    unique_engagers * 2;

  const timeDecay = Math.exp(-Math.max(input.ageHours, 0) / 18);
  const credibilityWeight = 1 + (Math.max(0, Math.min(100, input.journalistCredibilityScore)) / 100) * 0.2;
  const verifiedWeight = input.verifiedJournalist ? 1.25 : input.newsroomAccount ? 1.15 : 1;
  const controversyBoost = Math.max(1, Math.min(1.35, 1 + input.controversyScore * 0.25));

  return Number((base * timeDecay * credibilityWeight * verifiedWeight * controversyBoost).toFixed(6));
}

export type ModerationCategory =
  | "hate_speech"
  | "violence"
  | "nudity"
  | "harassment"
  | "political_incitement"
  | "misinformation_risk";

export interface ModerationDecision {
  status: "clean" | "watch" | "queued" | "hidden_auto";
  reasons: ModerationCategory[];
}

export function decideModeration(scores: Record<ModerationCategory, number>): ModerationDecision {
  const severe = Object.entries(scores).filter(([, v]) => v >= 0.86).map(([k]) => k as ModerationCategory);
  const incitement = scores.political_incitement >= 0.9;
  if (severe.length || incitement) {
    return { status: "hidden_auto", reasons: [...severe, ...(incitement ? ["political_incitement"] : [])] };
  }

  const queueReasons = Object.entries(scores)
    .filter(([, v]) => v >= 0.72 && v < 0.86)
    .map(([k]) => k as ModerationCategory);

  if (queueReasons.length) {
    return { status: "queued", reasons: queueReasons };
  }

  const watchReasons = Object.entries(scores)
    .filter(([, v]) => v >= 0.45 && v < 0.72)
    .map(([k]) => k as ModerationCategory);

  if (watchReasons.length) {
    return { status: "watch", reasons: watchReasons };
  }

  return { status: "clean", reasons: [] };
}

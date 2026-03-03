export const OPENNEWS_NAME = "OpenNews" as const;

export type OpenNewsAiProvider = "sarvam" | "open_source";

const rawProvider = (import.meta.env.VITE_OPENNEWS_AI_PROVIDER as string | undefined)
  ?.trim()
  .toLowerCase();

export const OPENNEWS_AI_PROVIDER: OpenNewsAiProvider =
  rawProvider === "open_source" ? "open_source" : "sarvam";

export const OPENNEWS_CAPABILITIES = [
  "verify_sources",
  "analyze_news",
  "publish_to_x",
  "monitor_x_and_web",
] as const;

export const OPENNEWS_SOCIAL_MODE = {
  xPublishingEnabled: (import.meta.env.VITE_OPENNEWS_X_PUBLISHING as string | undefined) === "true",
  xMonitoringEnabled: (import.meta.env.VITE_OPENNEWS_X_MONITORING as string | undefined) === "true",
} as const;

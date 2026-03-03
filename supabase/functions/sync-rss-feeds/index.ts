import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-secret",
};

type FeedInput = {
  name: string;
  url: string;
  publisher?: string | null;
  country_code?: string | null;
  language?: string | null;
  category?: string | null;
  reliability_tier?: "tier_1" | "tier_2" | "tier_3" | null;
  source_type?: "primary" | "secondary" | "opinion" | "aggregator" | null;
  fetch_interval_minutes?: number | null;
  priority?: number | null;
  state_id?: string | null;
};

type SyncPayload = {
  feeds?: FeedInput[];
  deactivate_urls?: string[];
  activate_urls?: string[];
};

const ALLOWED_CATEGORIES = new Set([
  "AI", "Business", "Finance", "Politics", "Startups", "Technology",
  "Climate", "Health", "Sports", "Entertainment", "Science", "World", "India", "Local",
]);

const CATEGORY_MAP: Record<string, string> = {
  ai: "AI",
  business: "Business",
  finance: "Finance",
  politics: "Politics",
  startup: "Startups",
  startups: "Startups",
  technology: "Technology",
  tech: "Technology",
  climate: "Climate",
  health: "Health",
  sports: "Sports",
  entertainment: "Entertainment",
  science: "Science",
  world: "World",
  india: "India",
  local: "Local",
};

async function normalizeExistingFeedMetadata(supabase: ReturnType<typeof createClient>) {
  const categoryPairs: Array<[string, string]> = [
    ["world", "World"],
    ["politics", "Politics"],
    ["business", "Business"],
    ["finance", "Finance"],
    ["tech", "Technology"],
    ["technology", "Technology"],
    ["india", "India"],
    ["local", "Local"],
    ["sports", "Sports"],
    ["entertainment", "Entertainment"],
    ["health", "Health"],
    ["science", "Science"],
    ["climate", "Climate"],
    ["ai", "AI"],
    ["startups", "Startups"],
  ];

  for (const [from, to] of categoryPairs) {
    const { error } = await supabase.from("rss_feeds").update({ category: to }).eq("category", from);
    if (error) throw error;
  }

  const { error: sourceTypeError } = await supabase
    .from("rss_feeds")
    .update({ source_type: "secondary" })
    .is("source_type", null);
  if (sourceTypeError) throw sourceTypeError;

  const { error: tierError } = await supabase
    .from("rss_feeds")
    .update({ reliability_tier: "tier_2" })
    .is("reliability_tier", null);
  if (tierError) throw tierError;

  const { error: languageError } = await supabase
    .from("rss_feeds")
    .update({ language: "en" })
    .is("language", null);
  if (languageError) throw languageError;

  const { error: intervalError } = await supabase
    .from("rss_feeds")
    .update({ fetch_interval_minutes: 30 })
    .is("fetch_interval_minutes", null);
  if (intervalError) throw intervalError;
}

function normalizeCategory(category?: string | null): string {
  if (!category) return "World";
  const direct = category.trim();
  if (ALLOWED_CATEGORIES.has(direct)) return direct;
  const mapped = CATEGORY_MAP[direct.toLowerCase()];
  return mapped ?? "World";
}

function normalizeFeed(feed: FeedInput) {
  const name = (feed.name || "").trim();
  const url = (feed.url || "").trim();

  if (!name || !url) {
    throw new Error("Feed must include non-empty name and url.");
  }

  const reliabilityTier =
    feed.reliability_tier && ["tier_1", "tier_2", "tier_3"].includes(feed.reliability_tier)
      ? feed.reliability_tier
      : "tier_2";

  const sourceType =
    feed.source_type && ["primary", "secondary", "opinion", "aggregator"].includes(feed.source_type)
      ? feed.source_type
      : "secondary";

  return {
    name,
    url,
    publisher: feed.publisher?.trim() || null,
    country_code: feed.country_code?.trim() || null,
    language: feed.language?.trim() || "en",
    category: normalizeCategory(feed.category),
    reliability_tier: reliabilityTier,
    source_type: sourceType,
    fetch_interval_minutes: feed.fetch_interval_minutes && feed.fetch_interval_minutes > 0
      ? feed.fetch_interval_minutes
      : 30,
    priority: feed.priority ?? 50,
    state_id: feed.state_id?.trim() || null,
    is_active: true,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const syncSecret = req.headers.get("x-sync-secret")?.trim();
  const expectedSecret = Deno.env.get("CRON_INGEST_SECRET")?.trim();

  if (!expectedSecret || !syncSecret || syncSecret !== expectedSecret) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json() as SyncPayload;
    const feeds = Array.isArray(body?.feeds) ? body.feeds as FeedInput[] : [];
    const deactivateUrls = Array.isArray(body?.deactivate_urls)
      ? body.deactivate_urls.filter((u) => typeof u === "string" && u.trim().length > 0)
      : [];
    const activateUrls = Array.isArray(body?.activate_urls)
      ? body.activate_urls.filter((u) => typeof u === "string" && u.trim().length > 0)
      : [];

    if (feeds.length === 0 && deactivateUrls.length === 0 && activateUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: "No sync payload provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let upserted = 0;
    let deactivated = 0;
    let activated = 0;
    const chunkSize = 100;

    if (deactivateUrls.length > 0) {
      for (let i = 0; i < deactivateUrls.length; i += chunkSize) {
        const chunk = deactivateUrls.slice(i, i + chunkSize);
        const { data, error } = await supabase
          .from("rss_feeds")
          .update({ is_active: false })
          .in("url", chunk)
          .select("id");

        if (error) throw error;
        deactivated += data?.length ?? 0;
      }
    }

    if (activateUrls.length > 0) {
      for (let i = 0; i < activateUrls.length; i += chunkSize) {
        const chunk = activateUrls.slice(i, i + chunkSize);
        const { data, error } = await supabase
          .from("rss_feeds")
          .update({ is_active: true })
          .in("url", chunk)
          .select("id");

        if (error) throw error;
        activated += data?.length ?? 0;
      }
    }

    if (feeds.length > 0) {
      await normalizeExistingFeedMetadata(supabase);
      const normalizedFeeds = feeds.map(normalizeFeed);

      for (let i = 0; i < normalizedFeeds.length; i += chunkSize) {
        const chunk = normalizedFeeds.slice(i, i + chunkSize);
        const { error } = await supabase
          .from("rss_feeds")
          .upsert(chunk, { onConflict: "url", ignoreDuplicates: false });

        if (error) {
          throw error;
        }

        upserted += chunk.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        received: feeds.length,
        upserted,
        deactivated,
        activated,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  enclosure?: { url: string };
  "media:content"?: { url: string };
}

interface RSSFeed {
  id: string;
  name: string;
  url: string;
  category: string;
  country_code: string | null;
  language: string | null;
}

// ===== CATEGORY TAXONOMY (LOCKED) =====
const VALID_CATEGORIES = [
  "AI", "Business", "Finance", "Politics", "Startups", "Technology",
  "Climate", "Health", "Sports", "Entertainment", "Science", "World", "India", "Local"
];

// Category precedence order (higher = more specific)
const CATEGORY_PRECEDENCE = [
  "AI", "Startups", "Finance", "Business", "Politics", "Technology",
  "Climate", "Health", "Science", "Sports", "Entertainment", "World"
];

// ===== KEYWORD DICTIONARY =====
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "AI": [
    "artificial intelligence", "machine learning", "deep learning", "generative ai",
    "large language model", "llm", "openai", "chatgpt", "anthropic", "google ai",
    "microsoft ai", "ai model", "ai startup", "gpt-4", "gpt-5", "claude"
  ],
  "Startups": [
    "startup", "start-up", "founder", "funding", "seed round", "series a",
    "series b", "venture capital", "vc funding", "angel investment", "unicorn",
    "ipo filing", "accelerator", "incubator"
  ],
  "Business": [
    "company", "corporate", "revenue", "profits", "earnings", "merger",
    "acquisition", "layoffs", "hiring", "board decision", "ceo appointment",
    "quarterly results", "market share"
  ],
  "Finance": [
    "stock market", "stocks", "sensex", "nifty", "nasdaq", "dow jones",
    "interest rates", "inflation", "gdp", "rbi", "federal reserve", "bond yields",
    "crypto", "bitcoin", "ethereum", "banking", "investment"
  ],
  "Politics": [
    "election", "polls", "parliament", "government", "cabinet", "minister",
    "prime minister", "president", "bill passed", "ordinance", "policy decision",
    "assembly", "congress", "senate", "legislation"
  ],
  "Technology": [
    "technology", "tech", "software", "hardware", "semiconductor", "chip",
    "cloud computing", "saas", "cybersecurity", "data breach", "it services",
    "digital transformation", "5g", "quantum computing"
  ],
  "Climate": [
    "climate change", "global warming", "carbon emissions", "renewable energy",
    "solar power", "wind energy", "net zero", "environment", "pollution",
    "air quality", "cop climate", "sustainability"
  ],
  "Health": [
    "health", "medical", "disease", "virus", "pandemic", "covid", "vaccine",
    "hospital", "mental health", "nutrition", "healthcare system", "who",
    "clinical trial", "drug approval"
  ],
  "Sports": [
    "match", "tournament", "league", "final", "semi-final", "cricket",
    "football", "fifa", "ipl", "olympics", "world cup", "score", "wins",
    "championship", "premier league", "nba", "nfl"
  ],
  "Entertainment": [
    "movie", "film", "cinema", "actor", "actress", "director", "series",
    "tv show", "web series", "box office", "music album", "concert",
    "netflix", "disney", "streaming"
  ],
  "Science": [
    "science", "research", "study finds", "scientists", "space", "nasa",
    "isro", "astronomy", "quantum", "physics", "biology", "discovery",
    "breakthrough", "experiment"
  ]
};

// ===== URL PATH TO CATEGORY MAPPING =====
const URL_PATH_MAPPING: Record<string, string> = {
  "/business/": "Business",
  "/economy/": "Finance",
  "/markets/": "Finance",
  "/money/": "Finance",
  "/politics/": "Politics",
  "/elections/": "Politics",
  "/startup/": "Startups",
  "/startups/": "Startups",
  "/technology/": "Technology",
  "/tech/": "Technology",
  "/science/": "Science",
  "/health/": "Health",
  "/climate/": "Climate",
  "/environment/": "Climate",
  "/sports/": "Sports",
  "/sport/": "Sports",
  "/entertainment/": "Entertainment",
  "/movies/": "Entertainment",
  "/cricket/": "Sports",
  "/football/": "Sports",
  "/ai/": "AI",
  "/artificial-intelligence/": "AI",
  "/india/": "India",
  "/national/": "India",
  "/world/": "World",
  "/international/": "World",
};

// ===== INDIAN CITIES/STATES FOR LOCAL DETECTION =====
const INDIAN_LOCALITIES = [
  "mumbai", "delhi", "bangalore", "bengaluru", "chennai", "kolkata",
  "hyderabad", "pune", "ahmedabad", "jaipur", "lucknow", "kanpur",
  "nagpur", "indore", "thane", "bhopal", "visakhapatnam", "patna",
  "vadodara", "ghaziabad", "ludhiana", "agra", "nashik", "faridabad",
  "meerut", "rajkot", "varanasi", "srinagar", "aurangabad", "dhanbad",
  "amritsar", "allahabad", "ranchi", "howrah", "coimbatore", "jabalpur",
  "gwalior", "vijayawada", "jodhpur", "madurai", "raipur", "kota",
  "guwahati", "chandigarh", "solapur", "hubli", "tiruchirappalli",
  "bareilly", "mysore", "tiruppur", "gurgaon", "noida", "kerala",
  "karnataka", "maharashtra", "tamil nadu", "telangana", "gujarat",
  "rajasthan", "uttar pradesh", "madhya pradesh", "west bengal", "bihar",
  "odisha", "andhra pradesh", "punjab", "haryana", "jharkhand", "assam"
];

// Stopwords for normalization
const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "must", "shall", "can", "need", "dare",
  "to", "of", "in", "for", "on", "with", "at", "by", "from", "as",
  "into", "through", "during", "before", "after", "above", "below",
  "and", "but", "or", "nor", "so", "yet", "both", "either", "neither",
  "not", "only", "own", "same", "than", "too", "very", "just",
]);

// ===== CLASSIFICATION FUNCTIONS =====

// STEP 1: Get category from URL path
function getCategoryFromURL(url: string): string | null {
  const lowerUrl = url.toLowerCase();
  for (const [path, category] of Object.entries(URL_PATH_MAPPING)) {
    if (lowerUrl.includes(path)) {
      return category;
    }
  }
  return null;
}

// STEP 2: Get category from headline/description keywords
function getCategoryFromKeywords(text: string): { primary: string | null; secondary: string[] } {
  const lowerText = text.toLowerCase();
  const matches: string[] = [];

  // Check each category in precedence order
  for (const category of CATEGORY_PRECEDENCE) {
    const keywords = CATEGORY_KEYWORDS[category] || [];
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        if (!matches.includes(category)) {
          matches.push(category);
        }
        break; // Found match for this category, move to next
      }
    }
  }

  return {
    primary: matches[0] || null,
    secondary: matches.slice(1, 3), // Max 2 secondary categories
  };
}

// STEP 3: Determine region scope
function getRegionScope(
  headline: string,
  feedCountryCode: string | null,
  feedName: string
): { scope: "Local" | "India" | "World"; locality: string | null } {
  const lowerHeadline = headline.toLowerCase();

  // Check for local city/state mentions
  for (const locality of INDIAN_LOCALITIES) {
    if (lowerHeadline.includes(locality)) {
      return {
        scope: "Local",
        locality: locality.charAt(0).toUpperCase() + locality.slice(1),
      };
    }
  }

  // Check for India-specific mentions
  const indiaKeywords = ["india", "indian", "modi", "parliament", "lok sabha", "rajya sabha"];
  if (indiaKeywords.some(kw => lowerHeadline.includes(kw))) {
    return { scope: "India", locality: null };
  }

  // If feed is from India, default to India scope
  if (feedCountryCode === "IN") {
    return { scope: "India", locality: null };
  }

  // Check for world/international signals
  const worldKeywords = ["us ", "china", "russia", "europe", "uk ", "global", "world", "un ", "united nations"];
  if (worldKeywords.some(kw => lowerHeadline.includes(kw))) {
    return { scope: "World", locality: null };
  }

  // Default based on feed
  return { scope: feedCountryCode ? "India" : "World", locality: null };
}

// Combined classification
function classifyStory(
  headline: string,
  description: string,
  url: string,
  feed: RSSFeed
): {
  primary_category: string;
  secondary_categories: string[];
  region_scope: "Local" | "India" | "World";
  locality: string | null;
} {
  let primaryCategory = feed.category || "World";
  let secondaryCategories: string[] = [];

  // STEP 1: Check URL path
  const urlCategory = getCategoryFromURL(url);
  if (urlCategory) {
    primaryCategory = urlCategory;
  }

  // STEP 2: Check keywords (can override or add secondary)
  const combinedText = `${headline} ${description}`;
  const keywordResult = getCategoryFromKeywords(combinedText);

  if (keywordResult.primary) {
    // If keyword match is higher precedence, use it
    const urlPrecedence = CATEGORY_PRECEDENCE.indexOf(primaryCategory);
    const keywordPrecedence = CATEGORY_PRECEDENCE.indexOf(keywordResult.primary);

    if (keywordPrecedence !== -1 && (keywordPrecedence < urlPrecedence || urlPrecedence === -1)) {
      // Keyword category is higher precedence
      if (primaryCategory !== keywordResult.primary) {
        secondaryCategories.push(primaryCategory);
      }
      primaryCategory = keywordResult.primary;
    } else if (keywordResult.primary !== primaryCategory) {
      secondaryCategories.push(keywordResult.primary);
    }
  }

  // Add remaining secondary categories
  secondaryCategories = [
    ...secondaryCategories,
    ...keywordResult.secondary.filter(c => c !== primaryCategory && !secondaryCategories.includes(c))
  ].slice(0, 2);

  // STEP 3: Determine region scope
  const { scope, locality } = getRegionScope(headline, feed.country_code, feed.name);

  return {
    primary_category: primaryCategory,
    secondary_categories: secondaryCategories,
    region_scope: scope,
    locality,
  };
}

// ===== UTILITY FUNCTIONS =====

function normalizeHeadline(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(word => !STOPWORDS.has(word) && word.length > 2)
    .join(" ")
    .substring(0, 100);
}

async function createHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 32);
}

function parseRSSItems(xmlText: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];

    const getTag = (tag: string): string => {
      const tagRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
      const tagMatch = itemContent.match(tagRegex);
      return (tagMatch?.[1] || tagMatch?.[2] || "").trim();
    };

    const getEnclosure = (): string | undefined => {
      const encRegex = /<enclosure[^>]*url=["']([^"']+)["'][^>]*>/i;
      const encMatch = itemContent.match(encRegex);
      return encMatch?.[1];
    };

    const getMediaContent = (): string | undefined => {
      const mediaRegex = /<media:content[^>]*url=["']([^"']+)["'][^>]*>/i;
      const mediaMatch = itemContent.match(mediaRegex);
      return mediaMatch?.[1];
    };

    const title = getTag("title");
    const link = getTag("link");
    const description = getTag("description");
    const pubDate = getTag("pubDate");

    if (title && link) {
      items.push({
        title,
        link,
        description: description.replace(/<[^>]*>/g, "").substring(0, 500),
        pubDate,
        enclosure: getEnclosure() ? { url: getEnclosure()! } : undefined,
        "media:content": getMediaContent() ? { url: getMediaContent()! } : undefined,
      });
    }
  }

  return items;
}

async function fetchRSSFeed(feed: RSSFeed): Promise<RSSItem[]> {
  try {
    console.log(`Fetching: ${feed.name}`);

    const response = await fetch(feed.url, {
      headers: {
        "User-Agent": "NEWSTACK/1.0 (News Aggregator)",
        "Accept": "application/rss+xml, application/xml, text/xml",
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch ${feed.name}: ${response.status}`);
      return [];
    }

    const xmlText = await response.text();
    return parseRSSItems(xmlText);
  } catch (error) {
    console.error(`Error fetching ${feed.name}:`, error);
    return [];
  }
}

async function processItems(
  supabase: any,
  items: RSSItem[],
  feed: RSSFeed
): Promise<{ created: number; merged: number }> {
  let created = 0;
  let merged = 0;

  for (const item of items) {
    try {
      const normalizedHeadline = normalizeHeadline(item.title);
      const storyHash = await createHash(normalizedHeadline);

      // Parse publish date
      let publishedAt: Date;
      try {
        publishedAt = new Date(item.pubDate);
        if (isNaN(publishedAt.getTime())) {
          publishedAt = new Date();
        }
      } catch {
        publishedAt = new Date();
      }

      // Skip stories older than 48 hours
      const hoursSincePublished = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSincePublished > 48) {
        continue;
      }

      // Classify the story
      const classification = classifyStory(item.title, item.description, item.link, feed);

      // Get image URL
      const imageUrl = item.enclosure?.url || item["media:content"]?.url || null;

      // Check if story exists
      const { data: existingStory } = await supabase
        .from("stories")
        .select("id, source_count")
        .eq("story_hash", storyHash)
        .single();

      if (existingStory) {
        // Story exists - add source and update
        const { error: sourceError } = await supabase
          .from("story_sources")
          .upsert(
            {
              story_id: existingStory.id,
              source_name: feed.name,
              source_url: item.link,
              published_at: publishedAt.toISOString(),
              description: item.description,
            },
            { onConflict: "story_id,source_url" }
          );

        if (!sourceError) {
          await supabase
            .from("stories")
            .update({
              source_count: (existingStory.source_count || 1) + 1,
              last_updated_at: new Date().toISOString(),
              image_url: imageUrl || undefined,
            })
            .eq("id", existingStory.id);

          merged++;
        }
      } else {
        // Create new story with enhanced classification
        const { data: newStory, error: storyError } = await supabase
          .from("stories")
          .insert({
            story_hash: storyHash,
            headline: item.title,
            normalized_headline: normalizedHeadline,
            summary: item.description,
            category: classification.primary_category,
            country_code: feed.country_code,
            city: classification.locality,
            is_global: classification.region_scope === "World",
            first_published_at: publishedAt.toISOString(),
            last_updated_at: new Date().toISOString(),
            image_url: imageUrl,
            source_count: 1,
          })
          .select("id")
          .single();

        if (newStory && !storyError) {
          await supabase.from("story_sources").insert({
            story_id: newStory.id,
            source_name: feed.name,
            source_url: item.link,
            published_at: publishedAt.toISOString(),
            description: item.description,
          });

          created++;
        }
      }
    } catch (error) {
      console.error("Error processing item:", error);
    }
  }

  return { created, merged };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authorization for scheduled/manual calls
  const authHeader = req.headers.get("Authorization");
  const cronSecret = Deno.env.get("CRON_INGEST_SECRET");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  
  const url = new URL(req.url);
  const secretParam = url.searchParams.get("secret");
  
  // Check various auth methods:
  // 1. URL parameter with cron secret
  const isValidSecretParam = cronSecret && secretParam && secretParam === cronSecret;
  // 2. Bearer token with cron secret
  const isValidBearerToken = cronSecret && authHeader === `Bearer ${cronSecret}`;
  // 3. Internal Supabase cron (uses anon key in Authorization header)
  const isInternalCron = authHeader?.includes(supabaseAnonKey || "ANON_KEY_PLACEHOLDER");
  // 4. Direct call without auth (for testing in config.toml cron - verify_jwt is false)
  const isLocalCron = !authHeader && !secretParam;
  
  console.log("Auth check:", { 
    hasSecretParam: !!secretParam, 
    secretMatch: isValidSecretParam, 
    bearerMatch: isValidBearerToken,
    internalCron: isInternalCron,
    localCron: isLocalCron
  });

  // For external calls (cron-job.org), require the secret
  // For internal Supabase cron, allow through
  if (!isValidSecretParam && !isValidBearerToken && !isInternalCron && !isLocalCron) {
    console.log("Unauthorized access attempt - no valid auth method found");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  console.log("Authorization successful - starting ingestion");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting enhanced RSS ingestion...");

    // Get active RSS feeds
    const { data: feeds, error: feedsError } = await supabase
      .from("rss_feeds")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false });

    if (feedsError || !feeds) {
      throw new Error("Failed to fetch RSS feeds");
    }

    console.log(`Found ${feeds.length} active feeds`);

    let totalCreated = 0;
    let totalMerged = 0;

    // Process each feed
    for (const feed of feeds) {
      const items = await fetchRSSFeed(feed);

      if (items.length > 0) {
        const { created, merged } = await processItems(supabase, items, feed);
        totalCreated += created;
        totalMerged += merged;

        // Update last fetched timestamp
        await supabase
          .from("rss_feeds")
          .update({ last_fetched_at: new Date().toISOString() })
          .eq("id", feed.id);
      }
    }

    // Clean up old stories (older than 48 hours)
    const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    await supabase.from("stories").delete().lt("first_published_at", cutoffTime);

    const result = {
      success: true,
      feeds_processed: feeds.length,
      stories_created: totalCreated,
      stories_merged: totalMerged,
      timestamp: new Date().toISOString(),
    };

    console.log("Enhanced RSS ingestion complete:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("RSS ingestion error:", message);

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

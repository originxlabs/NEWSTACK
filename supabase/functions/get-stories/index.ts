import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ===== OUTPUT SANITIZATION (CRITICAL) =====
// Clean any HTML entities or tags from stored data at read time
function sanitizeOutput(text: string | null): string {
  if (!text) return "";
  
  let cleaned = text;
  
  // Decode HTML entities
  const entityMap: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": "\"",
    "&apos;": "'",
    "&#39;": "'",
    "&nbsp;": " ",
    "&ndash;": "-",
    "&mdash;": "—",
    "&lsquo;": "'",
    "&rsquo;": "'",
    "&ldquo;": "\"",
    "&rdquo;": "\"",
    "&hellip;": "...",
    "&#8216;": "'",
    "&#8217;": "'",
    "&#8218;": ",",
    "&#8220;": "\"",
    "&#8221;": "\"",
    "&#8230;": "...",
  };
  
  // Decode named entities
  for (const [entity, char] of Object.entries(entityMap)) {
    cleaned = cleaned.replace(new RegExp(entity, "gi"), char);
  }
  
  // Decode numeric entities (decimal) - like &#8217;
  cleaned = cleaned.replace(/&#(\d+);/g, (_, num) => {
    const code = parseInt(num, 10);
    return String.fromCharCode(code);
  });
  
  // Decode numeric entities (hexadecimal) - like &#x2019;
  cleaned = cleaned.replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
    const code = parseInt(hex, 16);
    return String.fromCharCode(code);
  });
  
  // Strip any remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, "");
  
  // Clean up any remaining & sequences that look like entities
  cleaned = cleaned.replace(/&[a-z]+;/gi, "");
  
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  
  return cleaned;
}

interface StoryRequest {
  feedType?: "recent" | "trending" | "foryou" | "local" | "world";
  category?: string;
  country?: string;
  region?: string; // World region filter (north-america, europe, asia-pacific, middle-east, africa, south-america)
  state?: string; // State/region filter for drill-down
  city?: string; // City filter for drill-down
  locality?: string; // Locality/area filter for drill-down
  userCity?: string;
  userState?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "latest" | "sources" | "discussed" | "relevance";
  source?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Region to country code mapping for all 7 continents
const REGION_COUNTRIES: Record<string, string[]> = {
  "asia": ["CN", "JP", "KR", "IN", "ID", "PK", "BD", "VN", "TH", "MY", "PH", "MM", "NP", "LK", "KH", "LA", "SG", "BT", "MV", "BN", "TL", "MN", "KZ", "UZ", "TM", "KG", "TJ", "AF", "IR", "IQ", "SA", "AE", "QA", "KW", "BH", "OM", "YE", "JO", "LB", "SY", "PS", "IL", "TR", "GE", "AM", "AZ", "CY"],
  "africa": ["NG", "EG", "ZA", "ET", "CD", "TZ", "KE", "UG", "DZ", "SD", "MA", "AO", "GH", "MZ", "MG", "CI", "CM", "NE", "BF", "ML", "MW", "ZM", "SN", "ZW", "TD", "SO", "SS", "RW", "TN", "GN", "BJ", "BI", "TG", "SL", "LR", "CF", "MR", "ER", "NA", "GM", "BW", "GA", "LS", "GW", "GQ", "MU", "SZ", "DJ", "KM", "CV", "ST", "SC"],
  "europe": ["RU", "DE", "GB", "FR", "IT", "ES", "UA", "PL", "RO", "NL", "BE", "CZ", "GR", "PT", "SE", "HU", "BY", "AT", "CH", "RS", "BG", "DK", "FI", "SK", "NO", "IE", "HR", "MD", "BA", "AL", "LT", "MK", "SI", "LV", "EE", "ME", "LU", "MT", "IS", "AD", "MC", "LI", "SM", "VA"],
  "north-america": ["US", "CA", "MX", "GT", "CU", "HT", "DO", "HN", "NI", "SV", "CR", "PA", "JM", "TT", "BZ", "BS", "BB", "LC", "GD", "VC", "AG", "DM", "KN"],
  "south-america": ["BR", "AR", "CO", "PE", "VE", "CL", "EC", "BO", "PY", "UY", "GY", "SR"],
  "oceania": ["AU", "PG", "NZ", "FJ", "SB", "VU", "NC", "PF", "WS", "GU", "KI", "FM", "TO", "PW", "MH"],
  "antarctica": [],
  // Legacy aliases for backward compatibility
  "asia-pacific": ["CN", "JP", "KR", "IN", "AU", "NZ", "SG", "MY", "TH", "VN", "PH", "ID", "TW", "HK", "PK", "BD", "LK", "NP"],
  "middle-east": ["AE", "SA", "IL", "TR", "IR", "IQ", "QA", "KW", "BH", "OM", "JO", "LB", "SY", "YE", "PS"],
};

// Verified sources list for accurate scoring
const VERIFIED_SOURCES = [
  "Reuters", "AP News", "Associated Press", "AFP", "PTI",
  "BBC", "CNN", "Al Jazeera", "NPR", "NBC News", "CBS News", "ABC News", "Sky News", "DW News", "France 24",
  "New York Times", "Washington Post", "The Guardian", "The Hindu", "Times of India", "Hindustan Times", "Financial Times", "Wall Street Journal",
  "Bloomberg", "CNBC", "Forbes", "Economic Times", "MarketWatch", "LiveMint", "Business Standard",
  "TechCrunch", "The Verge", "Ars Technica", "Wired",
  "India Today", "NDTV", "Indian Express", "Japan Times", "South China Morning Post"
];

// Category taxonomy
const VALID_CATEGORIES = [
  "AI", "Business", "Finance", "Politics", "Startups", "Technology",
  "Climate", "Health", "Sports", "Entertainment", "Science", "World", "India", "Local"
];

// Indian cities for local matching
const INDIAN_CITIES = [
  "mumbai", "delhi", "bangalore", "bengaluru", "chennai", "kolkata",
  "hyderabad", "pune", "ahmedabad", "jaipur", "lucknow", "kanpur",
  "nagpur", "indore", "thane", "bhopal", "visakhapatnam", "patna",
  "vadodara", "ghaziabad", "ludhiana", "agra", "nashik", "faridabad",
  "gurgaon", "noida", "chandigarh", "coimbatore", "kochi", "surat"
];

const INDIAN_STATES = [
  "maharashtra", "karnataka", "tamil nadu", "telangana", "gujarat",
  "rajasthan", "uttar pradesh", "madhya pradesh", "west bengal", "bihar",
  "kerala", "andhra pradesh", "punjab", "haryana", "jharkhand", "assam",
  "odisha", "chhattisgarh", "uttarakhand", "himachal pradesh", "goa"
];

function isVerifiedSource(sourceName: string): boolean {
  const normalized = sourceName.toLowerCase();
  return VERIFIED_SOURCES.some(vs => normalized.includes(vs.toLowerCase()));
}

function calculateDiversityScore(sources: any[]): {
  score: number;
  verifiedCount: number;
  reason: string;
} {
  if (!sources || sources.length === 0) {
    return { score: 15, verifiedCount: 0, reason: "Single unverified source" };
  }

  const verifiedCount = sources.filter(s => isVerifiedSource(s.source_name)).length;
  const totalSources = sources.length;
  
  // Scoring logic:
  // - 1 source: 15-25% (low diversity)
  // - 2 sources: 30-50% (moderate)
  // - 3+ sources: 55-85% (good)
  // - 5+ verified sources: 85-100% (excellent)
  
  let baseScore: number;
  let reason: string;
  
  if (totalSources === 1) {
    if (verifiedCount === 1) {
      baseScore = 25;
      reason = "Single verified source - limited perspective";
    } else {
      baseScore = 15;
      reason = "Single unverified source - consider seeking additional sources";
    }
  } else if (totalSources === 2) {
    if (verifiedCount >= 2) {
      baseScore = 50;
      reason = "Two verified sources - moderate coverage";
    } else if (verifiedCount === 1) {
      baseScore = 40;
      reason = "One verified, one unverified source";
    } else {
      baseScore = 30;
      reason = "Two unverified sources";
    }
  } else if (totalSources >= 3 && totalSources < 5) {
    const verifiedRatio = verifiedCount / totalSources;
    baseScore = 55 + Math.round(verifiedRatio * 30);
    reason = `${totalSources} sources (${verifiedCount} verified) - good coverage`;
  } else {
    // 5+ sources
    const verifiedRatio = verifiedCount / totalSources;
    baseScore = 75 + Math.round(verifiedRatio * 25);
    reason = `${totalSources} sources (${verifiedCount} verified) - excellent diversity`;
  }
  
  return {
    score: Math.min(100, Math.max(0, baseScore)),
    verifiedCount,
    reason
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const params = await req.json() as StoryRequest;
    const {
      feedType = "recent",
      category,
      country,
      region,
      state,
      city,
      locality,
      userCity,
      userState,
      page = 1,
      pageSize = 20,
      sortBy = "latest",
      source,
      dateFrom,
      dateTo,
    } = params;

    console.log("Fetching stories:", { feedType, category, country, region, state, city, locality, userCity, userState, page, sortBy, source });

    // Calculate cutoff for stories
    const now = new Date();
    let defaultCutoff: string;
    
    if (feedType === "recent" && !dateFrom) {
      defaultCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
    } else if (feedType === "trending" || feedType === "foryou") {
      defaultCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      defaultCutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    }
    const cutoffTime = dateFrom || defaultCutoff;

    // Build query
    let query = supabase
      .from("stories")
      .select(`
        id,
        headline,
        summary,
        ai_summary,
        category,
        country_code,
        city,
        state,
        is_global,
        first_published_at,
        last_updated_at,
        source_count,
        trend_score,
        image_url,
        engagement_reads,
        engagement_listens,
        original_headline,
        original_summary,
        original_language
      `)
      .gte("first_published_at", cutoffTime);

    // Apply category filter
    if (category && category !== "all") {
      const normalizedCategory = VALID_CATEGORIES.find(
        c => c.toLowerCase() === category.toLowerCase()
      );
      if (normalizedCategory) {
        query = query.eq("category", normalizedCategory);
      }
    }

    // Apply geographic filters in order of specificity: locality > city > state > country > region
    // This implements the drill-down from World page: Continent → Country → State → City → Locality
    // IMPORTANT: Show ONLY location-specific stories first; if none exist, then show country-level
    
    // Apply geographic filters with proper column mapping
    // Hierarchy: locality > city > state > country > region
    
    if (locality && country) {
      // Locality filter - check locality column first, fallback to city
      const { count: localityCount } = await supabase
        .from("stories")
        .select("*", { count: "exact", head: true })
        .eq("country_code", country.toUpperCase())
        .ilike("locality", `%${locality}%`)
        .gte("first_published_at", cutoffTime);
      
      if (localityCount && localityCount > 0) {
        query = query.eq("country_code", country.toUpperCase()).ilike("locality", `%${locality}%`);
        console.log(`Showing ${localityCount} stories for locality: ${locality}`);
      } else {
        // Fallback to city search
        query = query.eq("country_code", country.toUpperCase()).ilike("city", `%${locality}%`);
        console.log(`No locality match, searching city for: ${locality}`);
      }
    } else if (city && country) {
      // City filter - search in city column
      const { count: cityCount } = await supabase
        .from("stories")
        .select("*", { count: "exact", head: true })
        .eq("country_code", country.toUpperCase())
        .ilike("city", `%${city}%`)
        .gte("first_published_at", cutoffTime);
      
      if (cityCount && cityCount > 0) {
        query = query.eq("country_code", country.toUpperCase()).ilike("city", `%${city}%`);
        console.log(`Showing ${cityCount} stories for city: ${city}`);
      } else {
        query = query.eq("country_code", country.toUpperCase());
        console.log(`No city-specific stories for ${city}, showing all ${country} news`);
      }
    } else if (state && country) {
      // STATE filter - CRITICAL: search in the STATE column, not city!
      const stateNormalized = state.replace(/-/g, ' ').replace(/_/g, ' ');
      
      // First try exact match on state column
      const { count: stateCount } = await supabase
        .from("stories")
        .select("*", { count: "exact", head: true })
        .eq("country_code", country.toUpperCase())
        .ilike("state", `%${stateNormalized}%`)
        .gte("first_published_at", cutoffTime);
      
      console.log(`State-specific stories for ${stateNormalized}: ${stateCount || 0}`);
      
      if (stateCount && stateCount > 0) {
        // Filter by STATE column (not city!)
        query = query.eq("country_code", country.toUpperCase()).ilike("state", `%${stateNormalized}%`);
        console.log(`Showing ${stateCount} state-specific stories for ${stateNormalized}`);
      } else {
        // Also check city column for state name (some stories have state in city field)
        const { count: cityStateCount } = await supabase
          .from("stories")
          .select("*", { count: "exact", head: true })
          .eq("country_code", country.toUpperCase())
          .ilike("city", `%${stateNormalized}%`)
          .gte("first_published_at", cutoffTime);
        
        if (cityStateCount && cityStateCount > 0) {
          query = query.eq("country_code", country.toUpperCase()).ilike("city", `%${stateNormalized}%`);
          console.log(`Found ${cityStateCount} stories with state name in city field`);
        } else {
          // No state-specific stories, fall back to country-level news
          query = query.eq("country_code", country.toUpperCase());
          console.log(`No state-specific stories for ${stateNormalized}, showing all ${country} news`);
        }
      }
    } else if (country) {
      // Country filter - filter by country code
      query = query.eq("country_code", country.toUpperCase());
      console.log(`Filtering by country: ${country}`);
    } else if (region && REGION_COUNTRIES[region]) {
      // Region/Continent filter: filter by country codes in the region
      const regionCodes = REGION_COUNTRIES[region];
      query = query.in("country_code", regionCodes);
      console.log(`Filtering by region: ${region} (${regionCodes.length} countries)`);
    } else if (feedType === "local") {
      // Local news: search for stories matching user's city, nearby cities, state, or country
      if (userCity) {
        const cityLower = userCity.toLowerCase();
        // Find nearby cities (same state/region logic)
        const matchingCities = INDIAN_CITIES.filter(c => 
          c === cityLower || 
          c.includes(cityLower) || 
          cityLower.includes(c)
        );
        
        if (matchingCities.length > 0 || userState) {
          // Search for stories in user's city OR state
          let localFilters = [];
          if (userCity) localFilters.push(`city.ilike.%${userCity}%`);
          if (userState) localFilters.push(`city.ilike.%${userState}%`);
          
          // Also include country-specific non-global stories
          const userCountry = params.country;
          if (userCountry) {
            query = query.or(`${localFilters.join(',')},and(country_code.eq.${userCountry},is_global.eq.false)`);
          } else if (localFilters.length > 0) {
            query = query.or(localFilters.join(','));
          }
        } else {
          query = query.ilike("city", `%${userCity}%`);
        }
      }
    } else if (feedType === "world") {
      query = query.eq("is_global", true);
    }

    // Sorting strategies based on feed type and sortBy param
    // For "latest" sortBy or recent feed, always prioritize freshness first
    if (sortBy === "latest") {
      // Pure chronological: newest stories first, regardless of source count
      query = query.order("first_published_at", { ascending: false });
    } else if (feedType === "recent") {
      // Recent feed: prioritize freshness, then by source count for same-time stories
      query = query
        .order("first_published_at", { ascending: false })
        .order("source_count", { ascending: false });
    } else if (feedType === "trending" || sortBy === "sources") {
      query = query
        .gte("source_count", 2)
        .order("source_count", { ascending: false })
        .order("first_published_at", { ascending: false });
    } else if (feedType === "foryou") {
      query = query
        .order("source_count", { ascending: false })
        .order("first_published_at", { ascending: false });
    } else if (sortBy === "relevance") {
      query = query
        .order("city", { ascending: false, nullsFirst: false })
        .order("first_published_at", { ascending: false });
    } else {
      query = query.order("first_published_at", { ascending: false });
    }

    // Pagination - fetch sufficient stories for clustering
    const from = (page - 1) * pageSize;
    const limit = Math.max(pageSize, 500); // Fetch up to 500 for better clustering
    query = query.range(from, from + limit - 1);

    const { data: stories, error: storiesError } = await query;

    if (storiesError) {
      console.error("Stories query error:", storiesError);
      throw new Error(`Failed to fetch stories: ${storiesError.message}`);
    }

    if (!stories || stories.length === 0) {
      console.log("No stories found, returning empty array");
      return new Response(
        JSON.stringify({ 
          articles: [], 
          total: 0, 
          source: "newstack",
          meta: {
            feedType,
            verifiedSourcesAvailable: VERIFIED_SOURCES.length,
            cronSchedule: "Every 15 minutes"
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${stories.length} stories`);

    // Fetch sources for each story in parallel
    let storiesWithSources = await Promise.all(
      stories.map(async (story) => {
        let sourcesQuery = supabase
          .from("story_sources")
          .select("source_name, source_url, published_at, description")
          .eq("story_id", story.id)
          .order("published_at", { ascending: true })
          .limit(10);
        
        const { data: sources } = await sourcesQuery;

        // Calculate relative time
        const publishedDate = new Date(story.first_published_at);
        const diffMs = now.getTime() - publishedDate.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        let timestamp: string;
        if (diffMins < 1) {
          timestamp = "Just now";
        } else if (diffMins < 60) {
          timestamp = `${diffMins}m ago`;
        } else if (diffHours < 24) {
          timestamp = `${diffHours}h ago`;
        } else {
          timestamp = `${Math.floor(diffHours / 24)}d ago`;
        }

        // Determine location relevance
        let locationRelevance: "Local" | "Country" | "Global";
        if (story.city) {
          locationRelevance = "Local";
        } else if (story.country_code === country && !story.is_global) {
          locationRelevance = "Country";
        } else {
          locationRelevance = "Global";
        }

        // Use actual fetched sources for accuracy
        const actualSources = sources || [];
        const actualSourceCount = actualSources.length || 1;
        
        // Calculate diversity score with detailed breakdown
        const diversity = calculateDiversityScore(actualSources);

        // Generate proper "Why this matters" - context, not metadata
        const category = story.category?.toLowerCase() || "news";
        let whyMatters: string;
        
        if (actualSourceCount === 1) {
          whyMatters = "This is an early report from a single source. The details may evolve as more information becomes available.";
        } else if (actualSourceCount >= 4 && diversity.verifiedCount >= 2) {
          whyMatters = "Multiple independent sources are reporting this story with consistent details, indicating high reliability.";
        } else if (actualSourceCount >= 2) {
          whyMatters = "This story is being reported by multiple sources. Key details are still developing.";
        } else {
          whyMatters = "This story is developing. Check back for updates as more sources report.";
        }

        // Determine story state based on sources and age
        const ageMinutes = Math.floor(diffMs / (1000 * 60));
        let storyState: string;
        if (actualSourceCount === 1) {
          storyState = "single-source";
        } else if (ageMinutes < 30) {
          storyState = "breaking";
        } else if (actualSourceCount >= 4 && diversity.verifiedCount >= 2) {
          storyState = "confirmed";
        } else {
          storyState = "developing";
        }

        // Determine confidence level
        let confidenceLevel: string;
        if (actualSourceCount === 1 || diversity.verifiedCount === 0) {
          confidenceLevel = "low";
        } else if (actualSourceCount >= 4 && diversity.verifiedCount >= 2) {
          confidenceLevel = "high";
        } else {
          confidenceLevel = "medium";
        }

        return {
          id: story.id,
          // CRITICAL: Sanitize all text output to prevent HTML leakage
          headline: sanitizeOutput(story.headline),
          summary: sanitizeOutput(story.ai_summary || story.summary || ""),
          content: sanitizeOutput(story.summary || ""),
          ai_analysis: sanitizeOutput(story.ai_summary || story.summary || ""),
          why_matters: whyMatters,
          perspectives: [],
          source_name: actualSources[0]?.source_name || "Unknown",
          source_url: actualSources[0]?.source_url || "",
          source_logo: null,
          image_url: story.image_url,
          topic_slug: story.category?.toLowerCase() || "world",
          sentiment: "neutral",
          trust_score: diversity.score,
          diversity_score: diversity.score,
          diversity_reason: diversity.reason,
          verified_source_count: diversity.verifiedCount,
          published_at: story.first_published_at,
          is_global: story.is_global,
          country_code: story.country_code,
          city: story.city,
          // CRITICAL: Use actual source count from fetched sources
          source_count: actualSourceCount,
          sources: actualSources.map((s: any) => ({
            ...s,
            source_name: sanitizeOutput(s.source_name),
            description: sanitizeOutput(s.description),
          })),
          timestamp,
          location_relevance: locationRelevance,
          is_trending: actualSourceCount >= 2,
          // NEW: Story intelligence fields
          story_state: storyState,
          confidence_level: confidenceLevel,
          is_single_source: actualSourceCount === 1,
        };
      })
    );

    // Sort results: prioritize multi-source verified stories
    if (feedType === "recent") {
      storiesWithSources.sort((a, b) => {
        // First priority: stories with 3+ verified sources
        if (a.verified_source_count >= 3 && b.verified_source_count < 3) return -1;
        if (b.verified_source_count >= 3 && a.verified_source_count < 3) return 1;
        
        // Second priority: stories with 2+ sources
        if (a.source_count >= 2 && b.source_count < 2) return -1;
        if (b.source_count >= 2 && a.source_count < 2) return 1;
        
        // Third priority: more sources is better
        if (a.source_count !== b.source_count) return b.source_count - a.source_count;
        
        // Finally: sort by freshness
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      });
    }

    // Filter by source name if specified
    if (source && source !== "all") {
      const sourceNameLower = source.toLowerCase();
      storiesWithSources = storiesWithSources.filter(story => {
        const matchesPrimary = story.source_name.toLowerCase().includes(sourceNameLower);
        const matchesAny = story.sources?.some((s: { source_name: string }) => 
          s.source_name.toLowerCase().includes(sourceNameLower)
        );
        return matchesPrimary || matchesAny;
      });
    }

    // Limit to requested page size (unless pageSize is large for clustering)
    const finalLimit = pageSize >= 100 ? Math.min(pageSize, 500) : pageSize;
    storiesWithSources = storiesWithSources.slice(0, finalLimit);

    // Calculate stats for the response
    const totalVerifiedSources = new Set(
      storiesWithSources
        .flatMap(s => s.sources || [])
        .filter((s: any) => isVerifiedSource(s.source_name))
        .map((s: any) => s.source_name)
    ).size;

    return new Response(
      JSON.stringify({
        articles: storiesWithSources,
        total: storiesWithSources.length,
        source: "newstack",
        meta: {
          feedType,
          totalVerifiedSources,
          verifiedSourcesAvailable: VERIFIED_SOURCES.length,
          cronSchedule: "Every 15 minutes",
          lastUpdated: now.toISOString(),
          prioritization: "Multi-source verified stories first, then by freshness"
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Get stories error:", message);

    return new Response(
      JSON.stringify({ articles: [], total: 0, error: message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase-env";

const SUPABASE_KEY = SUPABASE_ANON_KEY;

// ── Bridge localStorage prefetch cache → React Query initial data ──
const PREFETCH_CACHE_KEY = "newstack_prefetch_cache";
const PREFETCH_CACHE_EXPIRY = 15 * 60 * 1000; // 15 min (same as splash prefetch)

function getInitialDataFromLocalStorage(): NewsResponse | undefined {
  try {
    const raw = localStorage.getItem(PREFETCH_CACHE_KEY);
    if (!raw) return undefined;
    const cache = JSON.parse(raw) as { stories: any[]; timestamp: number };
    if (Date.now() - cache.timestamp > PREFETCH_CACHE_EXPIRY || !cache.stories?.length) {
      return undefined;
    }
    // Map splash-prefetch NewsItem → NewsArticle shape
    const articles: NewsArticle[] = cache.stories.map((s: any) => ({
      id: s.id,
      headline: s.headline || "",
      summary: s.summary || "",
      content: "",
      ai_analysis: "",
      why_matters: "",
      perspectives: [],
      source_name: s.source || "Local Sources",
      source_url: "",
      source_logo: null,
      image_url: s.imageUrl || null,
      topic_slug: s.topic || "news",
      sentiment: (s.sentiment as any) || "neutral",
      trust_score: s.trustScore ?? 80,
      published_at: s.publishedAt || new Date().toISOString(),
      is_global: s.isGlobal ?? false,
      country_code: s.countryCode || null,
      source_count: s.sourceCount ?? 1,
      location_relevance: s.locationRelevance || "Local",
      original_headline: s.original_headline ?? null,
      original_summary: s.original_summary ?? null,
      original_language: s.original_language ?? null,
    }));
    return { articles, total: articles.length };
  } catch {
    return undefined;
  }
}

export interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  content: string;
  ai_analysis: string;
  why_matters: string;
  perspectives: Array<{ viewpoint: string; content: string }>;
  source_name: string;
  source_url: string;
  source_logo: string | null;
  image_url: string | null;
  topic_slug: string;
  sentiment: "positive" | "negative" | "neutral";
  trust_score: number;
  published_at: string;
  is_global: boolean;
  country_code: string | null;
  source_count?: number;
  location_relevance?: "Local" | "Country" | "Global";
  // Original language support
  original_headline?: string | null;
  original_summary?: string | null;
  original_language?: string | null;
}

interface FetchNewsParams {
  country?: string;
  topic?: string;
  language?: string;
  region?: string; // World region/continent filter
  state?: string; // State filter for drill-down
  city?: string; // City filter for drill-down
  locality?: string; // Locality filter for drill-down
  page?: number;
  pageSize?: number;
  query?: string;
  feedType?: "recent" | "trending" | "foryou";
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  userCity?: string;
  userState?: string;
  sortBy?: "latest" | "sources" | "discussed" | "relevance"; // Sort order
  refetchIntervalMs?: number;
}

interface NewsResponse {
  articles: NewsArticle[];
  total: number;
  meta?: {
    feedType?: string;
    totalVerifiedSources?: number;
    verifiedSourcesAvailable?: number;
    cronSchedule?: string;
    lastUpdated?: string;
    prioritization?: string;
  };
}

async function fetchNews(params: FetchNewsParams): Promise<NewsResponse> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/get-stories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({
      feedType: params.feedType || "recent",
      category: params.topic,
      country: params.country,
      region: params.region,
      state: params.state,
      city: params.city,
      locality: params.locality,
      userCity: params.userCity,
      userState: params.userState,
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      source: params.source,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      sortBy: params.sortBy || "latest", // Default to latest-first
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Failed to fetch news: ${response.status}`);
  }

  return response.json();
}

export function useNews(params: FetchNewsParams = {}) {
  // On first cold load, seed from localStorage prefetch cache so cards show instantly
  const cachedInitial = getInitialDataFromLocalStorage();

  return useQuery({
    queryKey: ["news", params],
    queryFn: () => fetchNews(params),
    staleTime: 5 * 60 * 1000, // 5 minutes — show cached data instantly, refetch in background
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes for instant loads
    retry: 2,
    refetchOnWindowFocus: false, // Don't refetch on every tab focus (cache handles freshness)
    refetchInterval: params.refetchIntervalMs || false,
    placeholderData: (previousData) => previousData || cachedInitial, // Show cached/previous data while fetching new
    initialData: cachedInitial, // Instant first render from localStorage cache
    initialDataUpdatedAt: cachedInitial ? Date.now() - 60_000 : undefined, // Mark as slightly stale so background refetch still happens
  });
}

export function useInfiniteNews(params: Omit<FetchNewsParams, "page"> = {}) {
  return useInfiniteQuery({
    queryKey: ["infinite-news", params],
    queryFn: ({ pageParam = 1 }) => fetchNews({ ...params, page: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((acc, page) => acc + page.articles.length, 0);
      if (loadedCount < lastPage.total) {
        return allPages.length + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes — instant from cache
    gcTime: 30 * 60 * 1000, // 30 minutes in cache
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

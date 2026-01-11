import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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
}

interface FetchNewsParams {
  country?: string;
  topic?: string;
  language?: string;
  page?: number;
  pageSize?: number;
  query?: string;
  feedType?: "recent" | "trending" | "foryou";
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  userCity?: string;
  userState?: string;
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
  // Try to fetch from RSS-backed stories first
  try {
    const storiesResponse = await fetch(`${SUPABASE_URL}/functions/v1/get-stories`, {
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
        userCity: params.userCity,
        userState: params.userState,
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        source: params.source,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      }),
    });

    if (storiesResponse.ok) {
      const data = await storiesResponse.json();
      if (data.articles && data.articles.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.log("Stories endpoint not available, falling back to fetch-news");
  }

  // Fallback to external APIs
  const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-news`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Failed to fetch news: ${response.status}`);
  }

  return response.json();
}

export function useNews(params: FetchNewsParams = {}) {
  return useQuery({
    queryKey: ["news", params],
    queryFn: () => fetchNews(params),
    staleTime: 1 * 60 * 1000, // 1 minute for fresher data
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 2,
    refetchOnWindowFocus: true, // Refetch when user focuses window
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
    staleTime: 1 * 60 * 1000, // 1 minute for fresher data
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: true,
  });
}

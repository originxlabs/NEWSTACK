import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase-env";
import type {
  OpenNewsFeedResponse,
  OpenNewsPost,
  OpenNewsTrendingScore,
  PoliticianProfile,
} from "@/modules/opennews/types";

type HttpMethod = "GET" | "POST" | "DELETE";

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || SUPABASE_ANON_KEY;
}

async function opennewsRequest<T>(path: string, method: HttpMethod = "GET", body?: unknown): Promise<T> {
  const token = await getAccessToken();
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/opennews-api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data?.error || `OpenNews request failed (${resp.status})`);
  }
  return data as T;
}

function normalizePosts(data: any): OpenNewsPost[] {
  if (!Array.isArray(data)) return [];
  return data as OpenNewsPost[];
}

export async function fetchOpenNewsMe(): Promise<{
  user_id: string | null;
  role: string;
  can_moderate: boolean;
  can_manage_trending: boolean;
}> {
  return opennewsRequest("/me", "GET");
}

export async function fetchOpenNewsPosts(params: Record<string, string> = {}): Promise<OpenNewsFeedResponse> {
  const query = new URLSearchParams(params).toString();
  const path = query ? `/posts?${query}` : "/posts";
  const data = await opennewsRequest<{ posts: OpenNewsPost[]; next_cursor: string | null }>(path, "GET");

  return {
    posts: normalizePosts(data?.posts),
    next_cursor: data?.next_cursor ?? null,
  };
}

export async function fetchOpenNewsThread(postId: string): Promise<{ root_id: string; posts: OpenNewsPost[] }> {
  const data = await opennewsRequest<{ root_id: string; posts: OpenNewsPost[] }>(`/posts/${postId}/thread`, "GET");
  return {
    root_id: data.root_id,
    posts: normalizePosts(data.posts),
  };
}

export async function createOpenNewsPost(payload: {
  body: string;
  post_mode?: "anonymous" | "named";
  anonymous_id?: string;
  comments_enabled?: boolean;
  parent_post_id?: string | null;
  quote_post_id?: string | null;
  headline?: string | null;
  moderation_level?: string;
  hashtags?: string[];
  poll?: {
    question: string;
    options: string[];
    closes_at?: string;
  } | null;
}) {
  return opennewsRequest<{ success: boolean; post_id: string; moderation_status: string }>("/posts", "POST", payload);
}

export async function createOpenNewsReply(postId: string, payload: {
  body: string;
  post_mode?: "anonymous" | "named";
  anonymous_id?: string;
  comments_enabled?: boolean;
}) {
  return opennewsRequest<{ success: boolean; post_id: string; moderation_status: string }>(`/posts/${postId}/reply`, "POST", payload);
}

export async function fetchOpenNewsTrending(window: "1h" | "6h" | "24h" = "24h"): Promise<OpenNewsTrendingScore[]> {
  const data = await opennewsRequest<{ scores: OpenNewsTrendingScore[] }>(`/trending?window=${window}`, "GET");
  return (data?.scores || []) as OpenNewsTrendingScore[];
}

export async function fetchOpenNewsPoliticians(search = ""): Promise<PoliticianProfile[]> {
  const q = encodeURIComponent(search);
  const data = await opennewsRequest<{ politicians: PoliticianProfile[] }>(
    `/politicians${search ? `?q=${q}` : ""}`,
    "GET",
  );
  return (data?.politicians || []) as PoliticianProfile[];
}

export async function fetchModerationQueue() {
  return opennewsRequest<{ queue: any[] }>("/moderation/queue", "GET");
}

export async function moderateQueueDecision(queueId: string, decision: "approve" | "reject" | "hide" | "unhide", reason?: string) {
  return opennewsRequest<{ success: boolean }>(`/moderation/queue/${queueId}/decision`, "POST", { decision, reason });
}

export async function fetchBannedTerms() {
  return opennewsRequest<{ terms: any[] }>("/moderation/banned-terms", "GET");
}

export async function addBannedTerm(payload: { term: string; mode: "exact" | "regex"; severity: number }) {
  return opennewsRequest<{ term: any }>("/moderation/banned-terms", "POST", payload);
}

export async function deleteBannedTerm(termId: string) {
  return opennewsRequest<{ success: boolean }>(`/moderation/banned-terms/${termId}`, "DELETE");
}

export async function fetchTrendingConfig() {
  return opennewsRequest<{ config: Record<string, any> }>("/admin/trending-config", "GET");
}

export async function updateTrendingConfig(payload: Record<string, number>) {
  return opennewsRequest<{ config: Record<string, any> }>("/admin/trending-config", "POST", payload);
}

export async function submitVerificationRequest(payload: { note?: string; links?: string[] }) {
  return opennewsRequest<{ request: any }>("/verification/request", "POST", payload);
}

export async function fetchVerificationRequests() {
  return opennewsRequest<{ requests: any[] }>("/verification/requests", "GET");
}

export async function reviewVerificationRequest(requestId: string, decision: "approve" | "reject") {
  return opennewsRequest<{ success: boolean; status: string }>(`/verification/requests/${requestId}/review`, "POST", { decision });
}

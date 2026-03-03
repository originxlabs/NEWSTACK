export type OpenNewsRole =
  | "anonymous"
  | "user"
  | "journalist"
  | "moderator"
  | "admin"
  | "newsroom_owner";

export type OpenNewsModerationStatus =
  | "clean"
  | "watch"
  | "queued"
  | "hidden_auto"
  | "approved_override"
  | "rejected";

export interface OpenNewsPostMetrics {
  likes: number;
  reposts: number;
  quotes: number;
  replies: number;
  bookmarks: number;
  poll_votes: number;
  unique_engagers: number;
}

export interface OpenNewsPost {
  id: string;
  root_post_id: string | null;
  parent_post_id: string | null;
  author_id: string | null;
  author_name: string | null;
  author_role: OpenNewsRole;
  headline: string | null;
  body: string;
  tldr: string | null;
  hashtags: string[];
  quote_post_id?: string | null;
  comments_enabled: boolean;
  is_locked: boolean;
  moderation_level: string;
  moderation_status: OpenNewsModerationStatus;
  controversy_score: number;
  journalist_credibility_score: number;
  visibility: "public" | "followers" | "private";
  created_at: string;
  updated_at: string;
  metrics?: OpenNewsPostMetrics;
  poll?: {
    id: string;
    question: string;
    closes_at?: string | null;
  } | null;
}

export interface OpenNewsTrendingScore {
  post_id: string;
  score: number;
  calculated_at: string;
  window: "1h" | "6h" | "24h";
}

export interface PoliticianProfile {
  id: string;
  name: string;
  slug: string;
  country_code: string;
  state_code: string | null;
  party_name: string | null;
  current_position: string | null;
  credibility_score: number;
  controversy_count: number;
}

export interface OpenNewsFeedResponse {
  posts: OpenNewsPost[];
  next_cursor: string | null;
}

export interface OpenNewsThreadResponse {
  root_id: string;
  posts: OpenNewsPost[];
}

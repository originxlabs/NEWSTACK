export type OpenPoliticsScope = "india" | "world";

export interface OpenPoliticsNode {
  id: string;
  slug: string;
  name: string;
  country_code: string;
  state_code: string | null;
  district: string | null;
  current_position: string | null;
  party_name: string | null;
  party_slug: string | null;
  office_level: string | null;
  official_photo_url: string | null;
  wikipedia_url: string | null;
  is_major_leader: boolean;
  credibility_score: number | null;
  controversy_count: number | null;
  metadata: Record<string, unknown>;
  children: OpenPoliticsNode[];
}

export interface OpenPoliticsTreeResponse {
  scope: OpenPoliticsScope;
  last_synced_at: string | null;
  roots: OpenPoliticsNode[];
}

export interface OpenPoliticsProfile {
  politician: {
    id: string;
    slug: string;
    name: string;
    country_code: string;
    state_code: string | null;
    district: string | null;
    current_position: string | null;
    party_name: string | null;
    party_slug: string | null;
    bio: string | null;
    credibility_score: number | null;
    controversy_count: number | null;
    official_photo_url: string | null;
    wikipedia_url: string | null;
    education: string | null;
    qualifications: string | null;
    declared_income_text: string | null;
    criminal_case_summary: string | null;
    corruption_case_summary: string | null;
    achievements: unknown[];
    government_email: string | null;
    metadata: Record<string, unknown>;
    updated_at: string | null;
    last_synced_at: string | null;
  };
  office_terms: Array<{
    id: string;
    office_title: string;
    region: string | null;
    started_on: string | null;
    ended_on: string | null;
  }>;
  controversies: Array<{
    id: string;
    title: string;
    description: string | null;
    source_url: string | null;
    happened_on: string | null;
    severity: number | null;
  }>;
  public_promises: Array<{
    id: string;
    promise_text: string;
    status: string;
    promised_on: string | null;
    due_on: string | null;
    source_url: string | null;
  }>;
  sources: Array<{
    id: string;
    source_type: string;
    source_url: string;
    source_title: string | null;
    captured_at: string;
    source_published_at: string | null;
  }>;
  recent_news: Array<{
    id: string;
    headline: string;
    summary: string | null;
    country_code: string | null;
    created_at: string;
  }>;
}

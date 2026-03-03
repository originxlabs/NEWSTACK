import { SUPABASE_URL } from "@/lib/supabase-env";
import { supabase } from "@/integrations/supabase/client";
import type { OpenPoliticsProfile, OpenPoliticsScope, OpenPoliticsTreeResponse } from "@/modules/openpolitics/types";

async function openPoliticsRequest<T>(path: string): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const resp = await fetch(`${SUPABASE_URL}/functions/v1/opennews-api${path}`, {
    method: "GET",
    headers,
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data?.error || `OpenPolitics request failed (${resp.status})`);
  }

  return data as T;
}

export async function fetchOpenPoliticsTree(scope: OpenPoliticsScope): Promise<OpenPoliticsTreeResponse> {
  return openPoliticsRequest<OpenPoliticsTreeResponse>(`/politics/tree?scope=${encodeURIComponent(scope)}`);
}

export async function fetchOpenPoliticsProfile(slug: string): Promise<OpenPoliticsProfile> {
  return openPoliticsRequest<OpenPoliticsProfile>(`/politics/profile/${encodeURIComponent(slug)}`);
}

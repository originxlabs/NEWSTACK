import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function decide(scores: Record<string, number>) {
  if (Object.values(scores).some((v) => v >= 0.86) || (scores.political_incitement ?? 0) >= 0.9) {
    return "hidden_auto";
  }
  if (Object.values(scores).some((v) => v >= 0.72)) return "queued";
  if (Object.values(scores).some((v) => v >= 0.45)) return "watch";
  return "clean";
}

async function sarvamModerate(text: string) {
  const key = Deno.env.get("SARVAM_API_KEY");
  if (!key) return null;

  try {
    const response = await fetch("https://api.sarvam.ai/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: text }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return {
      hate_speech: Number(data?.results?.[0]?.category_scores?.hate ?? 0),
      violence: Number(data?.results?.[0]?.category_scores?.violence ?? 0),
      nudity: Number(data?.results?.[0]?.category_scores?.sexual ?? 0),
      harassment: Number(data?.results?.[0]?.category_scores?.harassment ?? 0),
      political_incitement: Number(data?.results?.[0]?.category_scores?.self_harm ?? 0),
      misinformation_risk: Number(data?.results?.[0]?.category_scores?.illicit ?? 0),
    };
  } catch {
    return null;
  }
}

function fallbackModerate(text: string) {
  const lower = text.toLowerCase();
  return {
    hate_speech: /(hate|vermin|exterminate)/.test(lower) ? 0.82 : 0.1,
    violence: /(kill|attack|riot|bomb)/.test(lower) ? 0.88 : 0.1,
    nudity: /(nude|porn)/.test(lower) ? 0.8 : 0.05,
    harassment: /(abuse|harass|stalk)/.test(lower) ? 0.78 : 0.1,
    political_incitement: /(overthrow|uprising|burn down)/.test(lower) ? 0.91 : 0.1,
    misinformation_risk: /(rumor|unverified|forwarded)/.test(lower) ? 0.76 : 0.2,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return json(500, { error: "Missing Supabase env" });

  const client = createClient(supabaseUrl, serviceRole);

  const body = await req.json().catch(() => ({}));
  const text = String(body?.text || "").trim();
  if (!text) return json(400, { error: "text is required" });

  const { data: banned } = await client.schema("opennews").from("banned_terms").select("term,mode").eq("is_active", true);
  const normalized = text.toLowerCase();
  for (const row of banned || []) {
    if (row.mode === "exact" && normalized.includes(String(row.term).toLowerCase())) {
      return json(200, {
        status: "rejected",
        reason: "banned_term",
        scores: null,
      });
    }
  }

  const scores = (await sarvamModerate(text)) || fallbackModerate(text);
  const status = decide(scores);

  return json(200, { status, scores });
});

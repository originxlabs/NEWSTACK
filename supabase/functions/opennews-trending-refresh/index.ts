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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const cronSecret = Deno.env.get("CRON_INGEST_SECRET");
  const incomingSecret = req.headers.get("x-cron-secret");
  if (cronSecret && incomingSecret !== cronSecret) {
    return json(401, { error: "Unauthorized" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return json(500, { error: "Missing Supabase env" });

  const client = createClient(supabaseUrl, serviceRole);

  const { data: cfg, error: cfgErr } = await client
    .schema("opennews")
    .from("trending_config")
    .select("*")
    .eq("id", 1)
    .single();

  if (cfgErr || !cfg) return json(400, { error: cfgErr?.message || "Missing trending config" });

  const { data: posts, error: postErr } = await client
    .schema("opennews")
    .from("posts")
    .select("id,author_role,journalist_credibility_score,controversy_score,created_at,moderation_status")
    .in("moderation_status", ["clean", "approved_override", "watch"]) 
    .order("created_at", { ascending: false })
    .limit(500);

  if (postErr) return json(400, { error: postErr.message });

  const postIds = (posts || []).map((p: any) => p.id);
  const { data: metrics } = await client
    .schema("opennews")
    .from("post_metrics")
    .select("post_id,likes,reposts,quotes,replies,bookmarks,poll_votes,unique_engagers")
    .in("post_id", postIds.length ? postIds : ["00000000-0000-0000-0000-000000000000"]);

  const metricMap = new Map((metrics || []).map((m: any) => [m.post_id, m]));
  const now = Date.now();
  const inserts: any[] = [];

  for (const post of posts || []) {
    const m = metricMap.get(post.id) || {
      likes: 0,
      reposts: 0,
      quotes: 0,
      replies: 0,
      bookmarks: 0,
      poll_votes: 0,
      unique_engagers: 0,
    };

    const base =
      Number(m.likes) * Number(cfg.like_weight) +
      Number(m.reposts) * Number(cfg.repost_weight) +
      Number(m.quotes) * Number(cfg.quote_weight) +
      Number(m.replies) * Number(cfg.reply_weight) +
      Number(m.bookmarks) * Number(cfg.bookmark_weight) +
      Number(m.poll_votes) * Number(cfg.poll_vote_weight) +
      Number(m.unique_engagers) * Number(cfg.unique_engager_weight);

    const ageHours = Math.max(0, (now - new Date(post.created_at).getTime()) / 3600000);
    const decay = Math.exp(-ageHours / Number(cfg.decay_half_life_hours || 18));
    const verifiedWeight = post.author_role === "journalist" ? Number(cfg.journalist_weight) : post.author_role === "newsroom_owner" ? Number(cfg.newsroom_weight) : 1;
    const credibilityWeight = 1 + (Number(post.journalist_credibility_score || 50) / 100) * 0.2;
    const controversyBoost = Math.max(1, Math.min(1.35, 1 + Number(post.controversy_score || 0) * Number(cfg.controversy_multiplier || 0.25)));
    const final = Number((base * decay * verifiedWeight * credibilityWeight * controversyBoost).toFixed(6));

    inserts.push({
      post_id: post.id,
      score: final,
      score_window: "24h",
      calculated_at: new Date().toISOString(),
    });
  }

  if (inserts.length) {
    const { error: insertErr } = await client.schema("opennews").from("post_score_snapshots").insert(inserts);
    if (insertErr) return json(400, { error: insertErr.message });
  }

  return json(200, { success: true, refreshed: inserts.length });
});

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

async function publishToX(text: string) {
  const accessToken = Deno.env.get("X_USER_ACCESS_TOKEN");
  const apiBase = Deno.env.get("X_API_BASE") || "https://api.x.com/2";
  if (!accessToken) {
    return { ok: false, error: "X_USER_ACCESS_TOKEN not configured" };
  }

  const resp = await fetch(`${apiBase}/tweets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  const payload = await resp.json().catch(() => ({}));
  if (!resp.ok) return { ok: false, error: payload };
  return { ok: true, payload };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return json(500, { error: "Missing Supabase env" });

  const client = createClient(supabaseUrl, serviceRole);

  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "");

    if (action === "queue") {
      const postId = String(body?.post_id || "").trim();
      if (!postId) return json(400, { error: "post_id required" });

      const { data: post } = await client
        .schema("opennews")
        .from("posts")
        .select("id,body")
        .eq("id", postId)
        .single();

      if (!post) return json(404, { error: "Post not found" });

      const tweetText = String(post.body).slice(0, 270);
      const { data, error } = await client
        .schema("opennews")
        .from("x_publish_queue")
        .insert({ post_id: postId, tweet_text: tweetText, status: "pending" })
        .select("id,status")
        .single();

      if (error) return json(400, { error: error.message });
      return json(200, { success: true, queue: data });
    }

    if (action === "approve_and_publish") {
      const queueId = String(body?.queue_id || "").trim();
      if (!queueId) return json(400, { error: "queue_id required" });

      const { data: queue, error } = await client
        .schema("opennews")
        .from("x_publish_queue")
        .select("id,tweet_text,status")
        .eq("id", queueId)
        .single();

      if (error || !queue) return json(404, { error: "Queue item not found" });
      if (queue.status !== "pending" && queue.status !== "approved") {
        return json(400, { error: `Cannot publish from status ${queue.status}` });
      }

      const result = await publishToX(queue.tweet_text);
      if (!result.ok) {
        await client.schema("opennews").from("x_publish_queue").update({
          status: "failed",
          response_payload: result.error,
        }).eq("id", queueId);
        return json(502, { error: "X publish failed", details: result.error });
      }

      await client.schema("opennews").from("x_publish_queue").update({
        status: "published",
        external_tweet_id: result.payload?.data?.id || null,
        response_payload: result.payload,
      }).eq("id", queueId);

      return json(200, { success: true, published: result.payload });
    }

    return json(400, { error: "Unsupported action" });
  }

  if (req.method === "GET") {
    const { data, error } = await client
      .schema("opennews")
      .from("x_publish_queue")
      .select("id,post_id,status,tweet_text,external_tweet_id,created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return json(400, { error: error.message });
    return json(200, { items: data || [] });
  }

  return json(405, { error: "Method not allowed" });
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type OpenNewsSocialAction = "post_to_x" | "search_x_news";

interface BasePayload {
  action: OpenNewsSocialAction;
}

interface PostToXPayload extends BasePayload {
  action: "post_to_x";
  text: string;
  reply_to_tweet_id?: string;
}

interface SearchXNewsPayload extends BasePayload {
  action: "search_x_news";
  query: string;
  max_results?: number;
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const payload = (await req.json()) as PostToXPayload | SearchXNewsPayload;
    const action = payload?.action;

    if (!action) {
      return jsonResponse(400, { error: "Missing action" });
    }

    const apiBase = Deno.env.get("X_API_BASE") || "https://api.x.com/2";

    if (action === "search_x_news") {
      const query = (payload as SearchXNewsPayload).query?.trim();
      const maxResults = Math.min(Math.max((payload as SearchXNewsPayload).max_results ?? 25, 10), 100);
      const bearer = Deno.env.get("X_BEARER_TOKEN");

      if (!query) {
        return jsonResponse(400, { error: "Missing query" });
      }
      if (!bearer) {
        return jsonResponse(400, {
          error: "X_BEARER_TOKEN is not configured",
          hint: "Set X_BEARER_TOKEN in Supabase function secrets.",
        });
      }

      const params = new URLSearchParams({
        query,
        max_results: String(maxResults),
        "tweet.fields": "created_at,author_id,public_metrics,lang",
      });

      const resp = await fetch(`${apiBase}/tweets/search/recent?${params.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${bearer}`,
          "Content-Type": "application/json",
        },
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        return jsonResponse(resp.status, { error: "X search failed", details: data });
      }

      return jsonResponse(200, {
        success: true,
        provider: "x_api",
        mode: "search",
        query,
        count: Array.isArray(data?.data) ? data.data.length : 0,
        data,
      });
    }

    if (action === "post_to_x") {
      const text = (payload as PostToXPayload).text?.trim();
      const replyTo = (payload as PostToXPayload).reply_to_tweet_id?.trim();
      const accessToken = Deno.env.get("X_USER_ACCESS_TOKEN");

      if (!text) {
        return jsonResponse(400, { error: "Missing tweet text" });
      }
      if (!accessToken) {
        return jsonResponse(400, {
          error: "X_USER_ACCESS_TOKEN is not configured",
          hint: "Set a user-scoped OAuth2 token with tweet.write in Supabase secrets.",
        });
      }

      const body: Record<string, unknown> = { text };
      if (replyTo) {
        body.reply = { in_reply_to_tweet_id: replyTo };
      }

      const resp = await fetch(`${apiBase}/tweets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        return jsonResponse(resp.status, { error: "X post failed", details: data });
      }

      return jsonResponse(200, {
        success: true,
        provider: "x_api",
        mode: "publish",
        data,
      });
    }

    return jsonResponse(400, { error: `Unsupported action: ${String(action)}` });
  } catch (error) {
    return jsonResponse(500, {
      error: "opennews-social failed",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

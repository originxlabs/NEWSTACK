import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

type OpenNewsRole = "anonymous" | "user" | "journalist" | "moderator" | "admin" | "newsroom_owner";
type ModStatus = "clean" | "watch" | "queued" | "hidden_auto" | "approved_override" | "rejected";

interface CreatePostInput {
  body: string;
  comments_enabled?: boolean;
  post_mode?: "anonymous" | "named";
  anonymous_id?: string;
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
}

function json(status: number, payload: unknown, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });
}

function extractSubPath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.lastIndexOf("opennews-api");
  if (idx === -1) return "/";
  const sub = parts.slice(idx + 1).join("/");
  return `/${sub}`;
}

function splitPath(subPath: string): string[] {
  return subPath.split("/").filter(Boolean);
}

function parseHashtags(text: string): string[] {
  const found = text.match(/#[a-zA-Z0-9_]{2,64}/g) || [];
  return [...new Set(found.map((v) => v.slice(1).toLowerCase()))];
}

function summarizeTLDR(body: string): string {
  const trimmed = body.replace(/\s+/g, " ").trim();
  if (!trimmed) return "";
  if (trimmed.length <= 180) return trimmed;
  return `${trimmed.slice(0, 177)}...`;
}

function heuristicScores(body: string) {
  const text = body.toLowerCase();
  const score = {
    hate_speech: 0.08,
    violence: 0.08,
    nudity: 0.04,
    harassment: 0.08,
    political_incitement: 0.08,
    misinformation_risk: 0.14,
  };

  if (/(kill|attack|bomb|riot)/.test(text)) score.violence = 0.88;
  if (/(hate|vermin|exterminate)/.test(text)) score.hate_speech = 0.82;
  if (/(nude|porn|explicit)/.test(text)) score.nudity = 0.8;
  if (/(harass|abuse|stalk|dox)/.test(text)) score.harassment = 0.78;
  if (/(uprising|overthrow|burn down)/.test(text)) score.political_incitement = 0.91;
  if (/(unverified|rumor|forwarded as received|trust me bro)/.test(text)) score.misinformation_risk = 0.76;

  return score;
}

function decisionFromScores(scores: Record<string, number>): ModStatus {
  const severe = Object.values(scores).some((v) => v >= 0.86);
  if (severe || (scores.political_incitement ?? 0) >= 0.9) return "hidden_auto";
  const queued = Object.values(scores).some((v) => v >= 0.72 && v < 0.86);
  if (queued) return "queued";
  const watch = Object.values(scores).some((v) => v >= 0.45 && v < 0.72);
  if (watch) return "watch";
  return "clean";
}

function normalizeScopes(scopes: unknown): string[] {
  if (!Array.isArray(scopes)) return [];
  return scopes.map((v) => String(v).trim()).filter(Boolean);
}

function canManageTrending(role: OpenNewsRole): boolean {
  return role === "admin" || role === "newsroom_owner";
}

function canModerate(role: OpenNewsRole): boolean {
  return role === "moderator" || role === "admin" || role === "newsroom_owner";
}

function toNumeric(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildPoliticsTree(
  nodes: any[],
  edges: Array<{
    parent_politician_id: string | null;
    child_politician_id: string;
    display_order: number;
  }>,
) {
  const nodeMap = new Map<string, any>();
  const hasParent = new Set<string>();

  for (const row of nodes) {
    nodeMap.set(row.id, { ...row, children: [] as any[] });
  }

  for (const edge of edges) {
    const child = nodeMap.get(edge.child_politician_id);
    if (!child) continue;

    const parent = edge.parent_politician_id ? nodeMap.get(edge.parent_politician_id) : null;
    if (!parent) continue;
    if (parent.id === child.id) continue;

    parent.children.push({ ...child, __order: edge.display_order ?? 0 });
    hasParent.add(child.id);
  }

  const sortNodes = (list: any[]) => {
    list.sort((a, b) => {
      const ao = Number(a.__order || 0);
      const bo = Number(b.__order || 0);
      if (ao !== bo) return ao - bo;
      return String(a.name).localeCompare(String(b.name));
    });
    for (const node of list) {
      if (node.children?.length) sortNodes(node.children);
      delete node.__order;
    }
  };

  const roots = [...nodeMap.values()].filter((node) => !hasParent.has(node.id));
  sortNodes(roots);
  return roots;
}

async function getAuthUser(serviceClient: any, req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;

  const { data, error } = await serviceClient.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return data.user.id;
}

async function resolveRole(serviceClient: any, userId: string | null): Promise<OpenNewsRole> {
  if (!userId) return "anonymous";

  const { data: account } = await serviceClient
    .schema("opennews")
    .from("accounts")
    .select("role,journalist_verified")
    .eq("user_id", userId)
    .maybeSingle();

  if (account?.role) {
    if (account.journalist_verified && account.role === "user") return "journalist";
    return account.role;
  }

  const { data: member } = await serviceClient
    .from("newsroom_members")
    .select("role,is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (member?.role === "owner" || member?.role === "superadmin") return "newsroom_owner";
  if (member?.role === "admin") return "admin";

  return "user";
}

async function ensureAccountRow(serviceClient: any, userId: string | null, role: OpenNewsRole) {
  if (!userId) return;
  await serviceClient
    .schema("opennews")
    .from("accounts")
    .upsert({ user_id: userId, role: role === "anonymous" ? "user" : role }, { onConflict: "user_id" });
}

async function validateApiKey(serviceClient: any, req: Request) {
  const key = req.headers.get("x-api-key");
  if (!key) return { allowed: true, apiKeyId: null as string | null, scopes: [] as string[] };

  const { data, error } = await serviceClient
    .from("api_keys")
    .select("id, is_active, product, scopes")
    .eq("api_key", key)
    .single();

  if (error || !data || !data.is_active) {
    return { allowed: false, apiKeyId: null, status: 401, error: "Invalid API key", scopes: [] as string[] };
  }

  if (data.product !== "opennews") {
    return { allowed: false, apiKeyId: null, status: 403, error: "API key not scoped for OpenNews", scopes: [] as string[] };
  }

  return { allowed: true, apiKeyId: data.id as string, scopes: normalizeScopes(data.scopes) };
}

async function logUsage(serviceClient: any, apiKeyId: string | null, endpoint: string, statusCode: number) {
  if (!apiKeyId) return;
  await serviceClient.schema("opennews").from("api_usage_logs").insert({
    api_key_id: apiKeyId,
    endpoint,
    request_count: 1,
    status_code: statusCode,
  });
}

async function enforceBannedTerms(serviceClient: any, bodyText: string) {
  const { data: bannedTerms } = await serviceClient
    .schema("opennews")
    .from("banned_terms")
    .select("term,mode")
    .eq("is_active", true);

  const normalized = bodyText.toLowerCase();
  for (const term of bannedTerms || []) {
    if (term.mode === "exact" && normalized.includes(String(term.term).toLowerCase())) {
      return { allowed: false, code: "BANNED_TERM" };
    }
    if (term.mode === "regex") {
      try {
        if (new RegExp(String(term.term), "i").test(bodyText)) {
          return { allowed: false, code: "BANNED_PATTERN" };
        }
      } catch {
        // skip invalid regex
      }
    }
  }

  return { allowed: true };
}

async function enforceAnonymousRateLimit(serviceClient: any, anonymousIdentityId: string) {
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { count } = await serviceClient
    .schema("opennews")
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("anonymous_identity_id", anonymousIdentityId)
    .gte("created_at", tenMinAgo);

  return (count || 0) < 6;
}

async function createPost(serviceClient: any, userId: string | null, role: OpenNewsRole, input: CreatePostInput) {
  const text = String(input.body || "").trim();
  if (!text) return { ok: false, status: 400, error: "Post body is required" };
  if (text.length > 3000) return { ok: false, status: 400, error: "Post body too long" };

  const banned = await enforceBannedTerms(serviceClient, text);
  if (!banned.allowed) {
    return { ok: false, status: 400, error: "Rejected by content policy", code: banned.code };
  }

  let authorId: string | null = userId;
  let authorRole: OpenNewsRole = role === "anonymous" ? "user" : role;
  let anonymousIdentityId: string | null = null;

  if (input.post_mode === "anonymous" || !userId) {
    authorId = null;
    authorRole = "anonymous";

    const anonHash = String(input.anonymous_id || "").trim();
    if (!anonHash) {
      return { ok: false, status: 400, error: "anonymous_id required for anonymous posting" };
    }

    const { data: existingAnon } = await serviceClient
      .schema("opennews")
      .from("anonymous_identities")
      .select("id")
      .eq("fingerprint_hash", anonHash)
      .maybeSingle();

    if (existingAnon?.id) {
      anonymousIdentityId = existingAnon.id;
      await serviceClient
        .schema("opennews")
        .from("anonymous_identities")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", existingAnon.id);
    } else {
      const { data: createdAnon, error: anonError } = await serviceClient
        .schema("opennews")
        .from("anonymous_identities")
        .insert({ fingerprint_hash: anonHash, last_seen_at: new Date().toISOString() })
        .select("id")
        .single();
      if (anonError) return { ok: false, status: 400, error: anonError.message };
      anonymousIdentityId = createdAnon.id;
    }

    if (!(await enforceAnonymousRateLimit(serviceClient, anonymousIdentityId))) {
      await serviceClient.schema("opennews").from("abuse_logs").insert({
        anonymous_identity_id: anonymousIdentityId,
        action: "rate_limited_post_attempt",
        detail: "Exceeded anonymous post rate limit",
      });
      return { ok: false, status: 429, error: "Rate limit: please wait before posting again" };
    }
  }

  let parentPostId: string | null = input.parent_post_id || null;
  let rootPostId: string | null = null;

  if (parentPostId) {
    const { data: parentPost, error: parentErr } = await serviceClient
      .schema("opennews")
      .from("posts")
      .select("id,root_post_id,is_locked,comments_enabled")
      .eq("id", parentPostId)
      .single();

    if (parentErr || !parentPost) {
      return { ok: false, status: 404, error: "Parent post not found" };
    }

    if (parentPost.is_locked && !canModerate(role)) {
      return { ok: false, status: 403, error: "Thread is locked" };
    }
    if (!parentPost.comments_enabled && !canModerate(role)) {
      return { ok: false, status: 403, error: "Comments are disabled for this post" };
    }

    rootPostId = parentPost.root_post_id || parentPost.id;
  }

  let quotePostId: string | null = input.quote_post_id || null;
  if (quotePostId) {
    const { data: quoted } = await serviceClient
      .schema("opennews")
      .from("posts")
      .select("id")
      .eq("id", quotePostId)
      .maybeSingle();

    if (!quoted?.id) return { ok: false, status: 404, error: "Quoted post not found" };
  }

  const scores = heuristicScores(text);
  const moderationStatus = decisionFromScores(scores);
  const extractedHashtags = parseHashtags(text);
  const manualHashtags = Array.isArray(input.hashtags) ? input.hashtags.map((h) => String(h).toLowerCase()) : [];
  const hashtags = [...new Set([...extractedHashtags, ...manualHashtags])];

  const controversy = Math.max(scores.political_incitement, scores.misinformation_risk, scores.harassment);
  const tldr = summarizeTLDR(text);

  const { data: inserted, error: insertError } = await serviceClient
    .schema("opennews")
    .from("posts")
    .insert({
      root_post_id: rootPostId,
      parent_post_id: parentPostId,
      quote_post_id: quotePostId,
      author_id: authorId,
      anonymous_identity_id: anonymousIdentityId,
      author_role: authorRole,
      headline: input.headline || null,
      body: text,
      tldr,
      ai_summary: tldr,
      comments_enabled: input.comments_enabled !== false,
      moderation_level: input.moderation_level || "standard",
      moderation_status: moderationStatus,
      moderation_scores: scores,
      controversy_score: controversy,
      hashtags,
      visibility: "public",
    })
    .select("id")
    .single();

  if (insertError) return { ok: false, status: 400, error: insertError.message };

  await serviceClient.schema("opennews").from("post_metrics").upsert({ post_id: inserted.id });

  if (hashtags.length) {
    await serviceClient
      .schema("opennews")
      .from("post_hashtags")
      .insert(hashtags.map((h) => ({ post_id: inserted.id, hashtag: h })));
  }

  if (input.poll?.question && Array.isArray(input.poll.options) && input.poll.options.length >= 2) {
    const options = input.poll.options.map((v) => String(v).trim()).filter(Boolean).slice(0, 6);
    if (options.length >= 2) {
      const { data: poll } = await serviceClient
        .schema("opennews")
        .from("polls")
        .insert({
          post_id: inserted.id,
          question: String(input.poll.question).trim(),
          closes_at: input.poll.closes_at || null,
        })
        .select("id")
        .single();

      if (poll?.id) {
        await serviceClient
          .schema("opennews")
          .from("poll_options")
          .insert(options.map((optionText, idx) => ({ poll_id: poll.id, option_text: optionText, sort_order: idx })));
      }
    }
  }

  if (moderationStatus === "queued" || moderationStatus === "hidden_auto") {
    await serviceClient.schema("opennews").from("moderation_queue").upsert({
      post_id: inserted.id,
      status: "pending",
      priority: moderationStatus === "hidden_auto" ? 1 : 3,
      flagged_categories: Object.entries(scores)
        .filter(([, v]) => v >= 0.72)
        .map(([k]) => k),
    });
  }

  if (parentPostId) {
    await serviceClient.schema("opennews").from("post_engagements").insert({
      post_id: parentPostId,
      user_id: authorId,
      anonymous_identity_id: anonymousIdentityId,
      engagement_type: "reply",
    });
  }

  return {
    ok: true,
    status: 200,
    data: {
      success: true,
      post_id: inserted.id,
      moderation_status: moderationStatus,
      tldr,
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) {
    return json(500, { error: "Supabase env missing" });
  }

  const serviceClient = createClient(supabaseUrl, serviceRole);
  const validation = await validateApiKey(serviceClient, req);
  if (!validation.allowed) {
    return json(validation.status || 403, { error: validation.error || "Not allowed" });
  }

  const url = new URL(req.url);
  const subPath = extractSubPath(url.pathname);
  const segments = splitPath(subPath);
  const userId = await getAuthUser(serviceClient, req);
  const role = await resolveRole(serviceClient, userId);
  await ensureAccountRow(serviceClient, userId, role);

  try {
    // /me
    if (req.method === "GET" && segments[0] === "me") {
      return json(200, {
        user_id: userId,
        role,
        can_moderate: canModerate(role),
        can_manage_trending: canManageTrending(role),
      });
    }

    // /posts GET
    if (req.method === "GET" && (segments.length === 0 || segments[0] === "posts") && segments.length <= 1) {
      const scope = url.searchParams.get("scope") || "latest";
      const cursor = url.searchParams.get("cursor");
      const limit = Math.min(Number(url.searchParams.get("limit") || "20"), 50);
      const sort = url.searchParams.get("sort") || "latest";
      const hashtag = (url.searchParams.get("hashtag") || "").trim().toLowerCase();

      if (scope === "moderation_queue" && !canModerate(role)) {
        return json(403, { error: "Moderator access required" });
      }

      let query = serviceClient
        .schema("opennews")
        .from("posts")
        .select("id,root_post_id,parent_post_id,quote_post_id,author_id,author_name,author_role,headline,body,tldr,hashtags,comments_enabled,is_locked,moderation_level,moderation_status,controversy_score,journalist_credibility_score,visibility,created_at,updated_at")
        .limit(limit + 1);

      if (sort === "latest") query = query.order("created_at", { ascending: false });
      if (cursor) query = query.lt("created_at", cursor);
      if (hashtag) query = query.contains("hashtags", [hashtag]);

      if (scope === "investigations") query = query.contains("hashtags", ["investigation"]);
      if (scope === "anonymous") query = query.eq("author_role", "anonymous");
      if (scope === "verified_journalists") query = query.eq("author_role", "journalist");
      if (scope === "debate") query = query.contains("hashtags", ["debate"]);
      if (scope === "political_tracker") query = query.contains("hashtags", ["politics"]);
      if (scope === "moderation_queue") query = query.in("moderation_status", ["queued", "hidden_auto", "rejected"]);

      if (!canModerate(role) || scope !== "moderation_queue") {
        query = query.eq("visibility", "public").in("moderation_status", ["clean", "approved_override", "watch"]);
      }

      const { data, error } = await query;
      if (error) return json(400, { error: error.message });

      const rows = data || [];
      const hasMore = rows.length > limit;
      const sliced = hasMore ? rows.slice(0, limit) : rows;
      const ids = sliced.map((r: any) => r.id);

      const { data: metricsData } = await serviceClient
        .schema("opennews")
        .from("post_metrics")
        .select("post_id,likes,reposts,quotes,replies,bookmarks,poll_votes,unique_engagers")
        .in("post_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

      const metricMap = new Map((metricsData || []).map((m: any) => [m.post_id, m]));

      const { data: polls } = await serviceClient
        .schema("opennews")
        .from("polls")
        .select("id,post_id,question,closes_at")
        .in("post_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

      const pollMap = new Map((polls || []).map((p: any) => [p.post_id, p]));

      const posts = sliced.map((p: any) => ({
        ...p,
        metrics: metricMap.get(p.id) || undefined,
        poll: pollMap.get(p.id) || null,
      }));

      await logUsage(serviceClient, validation.apiKeyId, "/posts", 200);
      return json(200, {
        posts,
        next_cursor: hasMore ? sliced[sliced.length - 1].created_at : null,
      });
    }

    // /posts/:id/thread
    if (req.method === "GET" && segments[0] === "posts" && segments[1] && segments[2] === "thread") {
      const requestedId = segments[1];

      const { data: post, error: postErr } = await serviceClient
        .schema("opennews")
        .from("posts")
        .select("id,root_post_id")
        .eq("id", requestedId)
        .single();
      if (postErr || !post) return json(404, { error: "Post not found" });

      const rootId = post.root_post_id || post.id;
      const { data: threadPosts, error } = await serviceClient
        .schema("opennews")
        .from("posts")
        .select("id,root_post_id,parent_post_id,quote_post_id,author_id,author_name,author_role,headline,body,tldr,hashtags,comments_enabled,is_locked,moderation_level,moderation_status,controversy_score,journalist_credibility_score,visibility,created_at,updated_at")
        .or(`id.eq.${rootId},root_post_id.eq.${rootId}`)
        .order("created_at", { ascending: true });

      if (error) return json(400, { error: error.message });

      const visible = canModerate(role)
        ? threadPosts || []
        : (threadPosts || []).filter((p: any) =>
            p.visibility === "public" && ["clean", "approved_override", "watch"].includes(p.moderation_status),
          );

      const ids = visible.map((p: any) => p.id);
      const { data: metricsData } = await serviceClient
        .schema("opennews")
        .from("post_metrics")
        .select("post_id,likes,reposts,quotes,replies,bookmarks,poll_votes,unique_engagers")
        .in("post_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

      const metricMap = new Map((metricsData || []).map((m: any) => [m.post_id, m]));

      const posts = visible.map((p: any) => ({ ...p, metrics: metricMap.get(p.id) || undefined }));
      await logUsage(serviceClient, validation.apiKeyId, "/posts/:id/thread", 200);
      return json(200, { root_id: rootId, posts });
    }

    // /posts/:id/reply
    if (req.method === "POST" && segments[0] === "posts" && segments[1] && segments[2] === "reply") {
      const payload = (await req.json().catch(() => ({}))) as CreatePostInput;
      payload.parent_post_id = segments[1];
      if (!payload.post_mode) payload.post_mode = userId ? "named" : "anonymous";

      const created = await createPost(serviceClient, userId, role, payload);
      await logUsage(serviceClient, validation.apiKeyId, "/posts/:id/reply", created.status);
      if (!created.ok) return json(created.status, { error: created.error, code: (created as any).code });
      return json(200, created.data);
    }

    // /posts POST
    if (req.method === "POST" && segments[0] === "posts" && segments.length === 1) {
      const payload = (await req.json().catch(() => ({}))) as CreatePostInput;
      if (!payload.post_mode) payload.post_mode = userId ? "named" : "anonymous";

      const created = await createPost(serviceClient, userId, role, payload);
      await logUsage(serviceClient, validation.apiKeyId, "/posts", created.status);
      if (!created.ok) return json(created.status, { error: created.error, code: (created as any).code });
      return json(200, created.data);
    }

    // /trending
    if (req.method === "GET" && segments[0] === "trending") {
      const window = url.searchParams.get("window") || "24h";
      const { data, error } = await serviceClient
        .schema("opennews")
        .from("post_score_snapshots")
        .select("post_id,score,calculated_at,score_window")
        .eq("score_window", window)
        .order("calculated_at", { ascending: false })
        .limit(500);

      if (error) return json(400, { error: error.message });

      const seen = new Set<string>();
      const scores = [];
      for (const row of data || []) {
        if (seen.has(row.post_id)) continue;
        seen.add(row.post_id);
        scores.push({
          post_id: row.post_id,
          score: Number(row.score),
          calculated_at: row.calculated_at,
          window: row.score_window,
        });
        if (scores.length >= 100) break;
      }

      await logUsage(serviceClient, validation.apiKeyId, "/trending", 200);
      return json(200, { scores });
    }

    // /politicians
    if (req.method === "GET" && segments[0] === "politicians") {
      const q = (url.searchParams.get("q") || "").trim();
      let query = serviceClient
        .schema("opennews")
        .from("politicians")
        .select("id,name,slug,country_code,state_code,current_position,credibility_score,controversy_count,party_id,is_major_leader,official_photo_url,wikipedia_url")
        .order("credibility_score", { ascending: false })
        .limit(100);

      if (q) query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%,country_code.ilike.%${q}%,state_code.ilike.%${q}%`);
      const { data, error } = await query;
      if (error) return json(400, { error: error.message });

      const parties = (await serviceClient.schema("opennews").from("parties").select("id,name")).data || [];
      const partyMap = new Map(parties.map((p: any) => [p.id, p.name]));

      const politicians = (data || []).map((p: any) => ({
        ...p,
        party_name: p.party_id ? partyMap.get(p.party_id) || null : null,
      }));

      await logUsage(serviceClient, validation.apiKeyId, "/politicians", 200);
      return json(200, { politicians });
    }

    // /politics/tree
    if (req.method === "GET" && segments[0] === "politics" && segments[1] === "tree") {
      const scope = (url.searchParams.get("scope") || "india").trim().toLowerCase();
      if (!["india", "world"].includes(scope)) {
        return json(400, { error: "scope must be india or world" });
      }

      const { data: parties } = await serviceClient
        .schema("opennews")
        .from("parties")
        .select("id,name,slug");
      const partyMap = new Map((parties || []).map((p: any) => [p.id, p]));

      const { data: allPoliticians, error: polErr } = await serviceClient
        .schema("opennews")
        .from("politicians")
        .select("id,name,slug,country_code,state_code,district,current_position,party_id,office_level,is_major_leader,official_photo_url,wikipedia_url,credibility_score,controversy_count,metadata,last_synced_at,updated_at")
        .order("is_major_leader", { ascending: false })
        .order("name", { ascending: true })
        .limit(2500);
      if (polErr) return json(400, { error: polErr.message });

      const scopedPoliticians = (allPoliticians || []).filter((row: any) => {
        if (scope === "india") {
          return row.country_code === "IN" || row.slug === "open-politics-india-root";
        }
        return (row.country_code !== "IN" && row.country_code !== "WW") || row.slug === "open-politics-world-root";
      });

      const scopedIds = new Set(scopedPoliticians.map((row: any) => row.id));

      let edgeQuery = serviceClient
        .schema("opennews")
        .from("political_hierarchy")
        .select("parent_politician_id,child_politician_id,display_order,country_code,is_active")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(5000);

      if (scope === "india") edgeQuery = edgeQuery.eq("country_code", "IN");
      else edgeQuery = edgeQuery.neq("country_code", "IN");

      const { data: edges, error: edgeErr } = await edgeQuery;
      if (edgeErr) return json(400, { error: edgeErr.message });

      const normalizedNodes = scopedPoliticians.map((row: any) => {
        const party = row.party_id ? partyMap.get(row.party_id) || null : null;
        return {
          id: row.id,
          slug: row.slug,
          name: row.name,
          country_code: row.country_code,
          state_code: row.state_code,
          district: row.district,
          current_position: row.current_position,
          party_name: party?.name || null,
          party_slug: party?.slug || null,
          office_level: row.office_level || null,
          official_photo_url: row.official_photo_url || null,
          wikipedia_url: row.wikipedia_url || null,
          is_major_leader: Boolean(row.is_major_leader),
          credibility_score: toNumeric(row.credibility_score),
          controversy_count: toNumeric(row.controversy_count),
          metadata: row.metadata || {},
        };
      });

      const usableEdges = (edges || []).filter((edge: any) => {
        const childOk = scopedIds.has(edge.child_politician_id);
        const parentOk = edge.parent_politician_id ? scopedIds.has(edge.parent_politician_id) : true;
        return childOk && parentOk;
      });

      const roots = buildPoliticsTree(normalizedNodes, usableEdges);

      let lastSyncedAt: string | null = null;
      for (const row of scopedPoliticians) {
        const candidate = row.last_synced_at || row.updated_at;
        if (!candidate) continue;
        if (!lastSyncedAt || new Date(candidate).getTime() > new Date(lastSyncedAt).getTime()) {
          lastSyncedAt = candidate;
        }
      }

      await logUsage(serviceClient, validation.apiKeyId, "/politics/tree", 200);
      return json(200, {
        scope,
        last_synced_at: lastSyncedAt,
        roots,
      });
    }

    // /politics/profile/:slug
    if (req.method === "GET" && segments[0] === "politics" && segments[1] === "profile" && segments[2]) {
      const slug = segments[2];
      const { data: politician, error: polErr } = await serviceClient
        .schema("opennews")
        .from("politicians")
        .select("id,party_id,name,slug,country_code,state_code,district,current_position,bio,credibility_score,controversy_count,metadata,official_photo_url,wikipedia_url,education,qualifications,declared_income_text,criminal_case_summary,corruption_case_summary,achievements,government_email,updated_at,last_synced_at")
        .eq("slug", slug)
        .single();
      if (polErr || !politician) return json(404, { error: "Politician not found" });

      const party = politician.party_id
        ? (
            await serviceClient
              .schema("opennews")
              .from("parties")
              .select("id,name,slug")
              .eq("id", politician.party_id)
              .maybeSingle()
          ).data
        : null;

      const { data: officeTerms } = await serviceClient
        .schema("opennews")
        .from("office_terms")
        .select("id,office_title,region,started_on,ended_on")
        .eq("politician_id", politician.id)
        .order("started_on", { ascending: false })
        .limit(100);

      const { data: controversies } = await serviceClient
        .schema("opennews")
        .from("controversies")
        .select("id,title,description,severity,source_url,happened_on")
        .eq("politician_id", politician.id)
        .order("happened_on", { ascending: false })
        .limit(100);

      const { data: promises } = await serviceClient
        .schema("opennews")
        .from("public_promises")
        .select("id,promise_text,status,promised_on,due_on,source_url")
        .eq("politician_id", politician.id)
        .order("promised_on", { ascending: false })
        .limit(100);

      const { data: sources } = await serviceClient
        .schema("opennews")
        .from("politician_sources")
        .select("id,source_type,source_url,source_title,captured_at,source_published_at")
        .eq("politician_id", politician.id)
        .order("captured_at", { ascending: false })
        .limit(30);

      const oneYearAgoIso = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      const personQuery = politician.name.replace(/,/g, " ").replace(/\s+/g, " ").trim();
      const recentStoriesResp = await serviceClient
        .from("stories")
        .select("id,headline,summary,country_code,created_at")
        .gte("created_at", oneYearAgoIso)
        .or(`headline.ilike.%${personQuery}%,summary.ilike.%${personQuery}%`)
        .order("created_at", { ascending: false })
        .limit(30);

      const recentNews = recentStoriesResp.data || [];

      await logUsage(serviceClient, validation.apiKeyId, "/politics/profile/:slug", 200);
      return json(200, {
        politician: {
          id: politician.id,
          slug: politician.slug,
          name: politician.name,
          country_code: politician.country_code,
          state_code: politician.state_code,
          district: politician.district,
          current_position: politician.current_position,
          party_name: party?.name || null,
          party_slug: party?.slug || null,
          bio: politician.bio,
          credibility_score: toNumeric(politician.credibility_score),
          controversy_count: toNumeric(politician.controversy_count),
          official_photo_url: politician.official_photo_url || null,
          wikipedia_url: politician.wikipedia_url || null,
          education: politician.education || null,
          qualifications: politician.qualifications || null,
          declared_income_text: politician.declared_income_text || null,
          criminal_case_summary: politician.criminal_case_summary || null,
          corruption_case_summary: politician.corruption_case_summary || null,
          achievements: Array.isArray(politician.achievements) ? politician.achievements : [],
          government_email: politician.government_email || null,
          metadata: politician.metadata || {},
          updated_at: politician.updated_at || null,
          last_synced_at: politician.last_synced_at || null,
        },
        office_terms: officeTerms || [],
        controversies: controversies || [],
        public_promises: promises || [],
        sources: sources || [],
        recent_news: recentNews,
      });
    }

    // /moderation/queue GET
    if (req.method === "GET" && segments[0] === "moderation" && segments[1] === "queue") {
      if (!canModerate(role)) return json(403, { error: "Moderator access required" });

      const { data, error } = await serviceClient
        .schema("opennews")
        .from("moderation_queue")
        .select("id,post_id,status,priority,flagged_categories,assigned_to,created_at,updated_at")
        .order("priority", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) return json(400, { error: error.message });

      const postIds = (data || []).map((r: any) => r.post_id);
      const posts = (await serviceClient
        .schema("opennews")
        .from("posts")
        .select("id,body,headline,author_role,moderation_status,created_at")
        .in("id", postIds.length ? postIds : ["00000000-0000-0000-0000-000000000000"]))
        .data || [];

      const postMap = new Map(posts.map((p: any) => [p.id, p]));

      return json(200, {
        queue: (data || []).map((row: any) => ({
          ...row,
          post: postMap.get(row.post_id) || null,
        })),
      });
    }

    // /moderation/queue/:id/decision POST
    if (
      req.method === "POST" &&
      segments[0] === "moderation" &&
      segments[1] === "queue" &&
      segments[2] &&
      segments[3] === "decision"
    ) {
      if (!canModerate(role)) return json(403, { error: "Moderator access required" });
      if (!userId) return json(401, { error: "Authentication required" });

      const queueId = segments[2];
      const body = await req.json().catch(() => ({}));
      const decision = String(body?.decision || "").trim();
      const reason = String(body?.reason || "").trim() || null;

      const { data: queueRow, error: queueErr } = await serviceClient
        .schema("opennews")
        .from("moderation_queue")
        .select("id,post_id,status")
        .eq("id", queueId)
        .single();

      if (queueErr || !queueRow) return json(404, { error: "Queue item not found" });

      let queueStatus = "approved";
      let postStatus: ModStatus = "approved_override";

      if (decision === "approve") {
        queueStatus = "approved";
        postStatus = "approved_override";
      } else if (decision === "reject") {
        queueStatus = "rejected";
        postStatus = "rejected";
      } else if (decision === "hide") {
        queueStatus = "approved";
        postStatus = "hidden_auto";
      } else if (decision === "unhide") {
        queueStatus = "approved";
        postStatus = "approved_override";
      } else {
        return json(400, { error: "Unsupported decision" });
      }

      const { error: updateQueueErr } = await serviceClient
        .schema("opennews")
        .from("moderation_queue")
        .update({ status: queueStatus, assigned_to: userId, updated_at: new Date().toISOString() })
        .eq("id", queueId);
      if (updateQueueErr) return json(400, { error: updateQueueErr.message });

      const { error: updatePostErr } = await serviceClient
        .schema("opennews")
        .from("posts")
        .update({ moderation_status: postStatus })
        .eq("id", queueRow.post_id);
      if (updatePostErr) return json(400, { error: updatePostErr.message });

      await serviceClient.schema("opennews").from("moderation_events").insert({
        post_id: queueRow.post_id,
        actor_user_id: userId,
        decision,
        reason,
      });

      return json(200, { success: true });
    }

    // /moderation/banned-terms
    if (req.method === "GET" && segments[0] === "moderation" && segments[1] === "banned-terms") {
      if (!canModerate(role)) return json(403, { error: "Moderator access required" });
      const { data, error } = await serviceClient
        .schema("opennews")
        .from("banned_terms")
        .select("id,term,mode,severity,is_active,created_at")
        .order("created_at", { ascending: false });
      if (error) return json(400, { error: error.message });
      return json(200, { terms: data || [] });
    }

    if (req.method === "POST" && segments[0] === "moderation" && segments[1] === "banned-terms") {
      if (!canModerate(role)) return json(403, { error: "Moderator access required" });
      if (!userId) return json(401, { error: "Authentication required" });

      const body = await req.json().catch(() => ({}));
      const term = String(body?.term || "").trim();
      const mode = String(body?.mode || "exact").trim();
      const severity = Number(body?.severity || 3);
      if (!term) return json(400, { error: "term is required" });
      if (!["exact", "regex"].includes(mode)) return json(400, { error: "mode must be exact or regex" });

      const { data, error } = await serviceClient
        .schema("opennews")
        .from("banned_terms")
        .insert({ term, mode, severity, is_active: true, created_by: userId })
        .select("id,term,mode,severity,is_active,created_at")
        .single();

      if (error) return json(400, { error: error.message });
      return json(200, { term: data });
    }

    if (req.method === "DELETE" && segments[0] === "moderation" && segments[1] === "banned-terms" && segments[2]) {
      if (!canModerate(role)) return json(403, { error: "Moderator access required" });
      const { error } = await serviceClient
        .schema("opennews")
        .from("banned_terms")
        .delete()
        .eq("id", segments[2]);
      if (error) return json(400, { error: error.message });
      return json(200, { success: true });
    }

    // /admin/trending-config
    if (req.method === "GET" && segments[0] === "admin" && segments[1] === "trending-config") {
      if (!canModerate(role)) return json(403, { error: "Moderator access required" });
      const { data, error } = await serviceClient
        .schema("opennews")
        .from("trending_config")
        .select("*")
        .eq("id", 1)
        .single();
      if (error) return json(400, { error: error.message });
      return json(200, { config: data });
    }

    if (req.method === "POST" && segments[0] === "admin" && segments[1] === "trending-config") {
      if (!canManageTrending(role)) return json(403, { error: "Admin/newsroom owner access required" });
      if (!userId) return json(401, { error: "Authentication required" });

      const body = await req.json().catch(() => ({}));
      const allowed = [
        "like_weight",
        "repost_weight",
        "quote_weight",
        "reply_weight",
        "bookmark_weight",
        "poll_vote_weight",
        "unique_engager_weight",
        "decay_half_life_hours",
        "journalist_weight",
        "newsroom_weight",
        "controversy_multiplier",
      ];

      const patch: Record<string, number | string> = {};
      for (const key of allowed) {
        if (body[key] !== undefined && body[key] !== null && body[key] !== "") {
          patch[key] = Number(body[key]);
        }
      }
      patch.updated_by = userId;
      patch.updated_at = new Date().toISOString();

      const { data, error } = await serviceClient
        .schema("opennews")
        .from("trending_config")
        .update(patch)
        .eq("id", 1)
        .select("*")
        .single();

      if (error) return json(400, { error: error.message });
      return json(200, { config: data });
    }

    // /verification/request
    if (req.method === "POST" && segments[0] === "verification" && segments[1] === "request") {
      if (!userId) return json(401, { error: "Authentication required" });

      const body = await req.json().catch(() => ({}));
      const note = String(body?.note || "").trim();
      const links = Array.isArray(body?.links) ? body.links.slice(0, 10) : [];

      const { data: existing } = await serviceClient
        .schema("opennews")
        .from("verification_requests")
        .select("id,status")
        .eq("user_id", userId)
        .eq("status", "pending")
        .maybeSingle();

      if (existing?.id) {
        return json(400, { error: "You already have a pending verification request" });
      }

      const { data, error } = await serviceClient
        .schema("opennews")
        .from("verification_requests")
        .insert({
          user_id: userId,
          status: "pending",
          documents: { note, links },
        })
        .select("id,status,created_at")
        .single();

      if (error) return json(400, { error: error.message });
      return json(200, { request: data });
    }

    // /verification/requests GET
    if (req.method === "GET" && segments[0] === "verification" && segments[1] === "requests") {
      if (!canModerate(role)) return json(403, { error: "Moderator access required" });

      const { data, error } = await serviceClient
        .schema("opennews")
        .from("verification_requests")
        .select("id,user_id,status,documents,reviewer_id,reviewed_at,created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) return json(400, { error: error.message });
      return json(200, { requests: data || [] });
    }

    // /verification/requests/:id/review POST
    if (
      req.method === "POST" &&
      segments[0] === "verification" &&
      segments[1] === "requests" &&
      segments[2] &&
      segments[3] === "review"
    ) {
      if (!canModerate(role)) return json(403, { error: "Moderator access required" });
      if (!userId) return json(401, { error: "Authentication required" });

      const requestId = segments[2];
      const body = await req.json().catch(() => ({}));
      const decision = String(body?.decision || "").trim(); // approve|reject
      if (!["approve", "reject"].includes(decision)) return json(400, { error: "decision must be approve or reject" });

      const { data: requestRow, error: requestErr } = await serviceClient
        .schema("opennews")
        .from("verification_requests")
        .select("id,user_id,status")
        .eq("id", requestId)
        .single();

      if (requestErr || !requestRow) return json(404, { error: "Verification request not found" });

      const nextStatus = decision === "approve" ? "approved" : "rejected";
      const { error: updateErr } = await serviceClient
        .schema("opennews")
        .from("verification_requests")
        .update({ status: nextStatus, reviewer_id: userId, reviewed_at: new Date().toISOString() })
        .eq("id", requestId);

      if (updateErr) return json(400, { error: updateErr.message });

      if (decision === "approve") {
        await serviceClient
          .schema("opennews")
          .from("accounts")
          .upsert(
            {
              user_id: requestRow.user_id,
              role: "journalist",
              journalist_verified: true,
            },
            { onConflict: "user_id" },
          );
      }

      return json(200, { success: true, status: nextStatus });
    }

    // /analyze
    if (req.method === "POST" && segments[0] === "analyze") {
      const body = await req.json().catch(() => ({}));
      const text = String(body?.text || "").trim();
      if (!text) return json(400, { error: "text is required" });

      const scores = heuristicScores(text);
      const tldr = summarizeTLDR(text);
      return json(200, {
        tldr,
        controversy_score: Math.max(scores.political_incitement, scores.misinformation_risk, scores.harassment),
        moderation_scores: scores,
      });
    }

    // /factcheck
    if (req.method === "POST" && segments[0] === "factcheck") {
      const body = await req.json().catch(() => ({}));
      const claim = String(body?.claim || "").trim();
      if (!claim) return json(400, { error: "claim is required" });

      const risk = /rumou?r|forwarded|unknown source|unverified/i.test(claim) ? 0.72 : 0.34;
      return json(200, {
        claim,
        confidence: Number((1 - risk).toFixed(2)),
        risk,
        recommendation: risk > 0.6 ? "needs_manual_verification" : "likely_safe_to_publish",
      });
    }

    return json(404, { error: `Not found: ${subPath}` });
  } catch (error) {
    return json(500, {
      error: "opennews-api failed",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

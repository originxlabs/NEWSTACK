import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SyncTarget {
  slug: string;
  wiki_title: string;
}

interface ChiefMinisterRecord {
  stateName: string;
  cmName: string;
  cmWikiTitle: string;
  partyName: string | null;
  tookOffice: string | null;
  imageFileName: string | null;
}

const GLOBAL_SYNC_TARGETS: SyncTarget[] = [
  { slug: "narendra-modi", wiki_title: "Narendra_Modi" },
  { slug: "droupadi-murmu", wiki_title: "Droupadi_Murmu" },
  { slug: "amit-shah", wiki_title: "Amit_Shah" },
  { slug: "rajnath-singh", wiki_title: "Rajnath_Singh" },
  { slug: "nirmala-sitharaman", wiki_title: "Nirmala_Sitharaman" },
  { slug: "s-jaishankar", wiki_title: "Subrahmanyam_Jaishankar" },
  { slug: "donald-trump", wiki_title: "Donald_Trump" },
  { slug: "keir-starmer", wiki_title: "Keir_Starmer" },
  { slug: "emmanuel-macron", wiki_title: "Emmanuel_Macron" },
  { slug: "olaf-scholz", wiki_title: "Olaf_Scholz" },
  { slug: "vladimir-putin", wiki_title: "Vladimir_Putin" },
  { slug: "xi-jinping", wiki_title: "Xi_Jinping" },
  { slug: "shigeru-ishiba", wiki_title: "Shigeru_Ishiba" },
];

function cleanWikiText(value: string): string {
  return value.replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeStateName(value: string): string {
  return cleanWikiText(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function toSlug(value: string): string {
  return cleanWikiText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseDateFromRow(row: string): string | null {
  const dateMatch = row.match(/\{\{dts\|format=dmy\|(\d{4})\|(\d{1,2})\|(\d{1,2})\}\}/i);
  if (!dateMatch) return null;
  const [, year, month, day] = dateMatch;
  const mm = month.padStart(2, "0");
  const dd = day.padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function buildWikipediaPageUrl(wikiTitle: string): string {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiTitle.replace(/\s+/g, "_"))}`;
}

function buildFilePathUrl(fileName: string): string {
  return `https://en.wikipedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName.replace(/\s+/g, "_"))}`;
}

function extractPartyFromRow(row: string, cmWikiTitle: string): string | null {
  const linkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  const links = [...row.matchAll(linkRegex)].map((match) => {
    const title = cleanWikiText(match[1] || "");
    const label = cleanWikiText(match[2] || match[1] || "");
    return { title, label };
  });

  // Skip state link + CM link. Party usually appears next in row.
  const candidates = links.slice(2);

  for (const link of candidates) {
    const titleLower = link.title.toLowerCase();
    const labelLower = link.label.toLowerCase();

    if (!link.title) continue;
    if (link.title === cmWikiTitle) continue;
    if (titleLower.startsWith("file:")) continue;
    if (titleLower.startsWith("chief minister of ")) continue;
    if (titleLower.includes(" ministry")) continue;
    if (titleLower.includes(" alliance") || labelLower.includes(" alliance")) continue;
    if (titleLower.includes("national democratic alliance")) continue;
    if (titleLower.includes("indian national developmental inclusive alliance")) continue;
    if (titleLower.includes("kutami") || titleLower.includes("mahagathbandhan") || titleLower.includes("maha yuti")) continue;

    return link.label || link.title;
  }

  return null;
}

function parseChiefMinisterRows(wikitext: string): Map<string, ChiefMinisterRecord> {
  const stateMap = new Map<string, ChiefMinisterRecord>();
  const rows = wikitext.split("\n|-");
  let carryPartyName: string | null = null;

  for (const row of rows) {
    if (!row.includes("Chief Minister of")) continue;

    const stateMatch = row.match(/\|\s*\[\[Chief Minister of [^\]|]+\|([^\]]+)\]\]/);
    const nameMatch = row.match(/!\s*\[\[\s*([^\]|]+?)(?:\|([^\]]+))?\s*\]\]/);
    if (!stateMatch || !nameMatch) continue;

    const stateName = cleanWikiText(stateMatch[1]);
    const cmWikiTitle = cleanWikiText(nameMatch[1]);
    const cmName = cleanWikiText(nameMatch[2] || nameMatch[1]);
    const imageMatch = row.match(/\[\[File:([^|\]]+)/i);
    const partyFromRow = extractPartyFromRow(row, cmWikiTitle);
    const partyName = partyFromRow || carryPartyName;

    if (partyFromRow) carryPartyName = partyFromRow;

    stateMap.set(normalizeStateName(stateName), {
      stateName,
      cmName,
      cmWikiTitle,
      partyName,
      tookOffice: parseDateFromRow(row),
      imageFileName: imageMatch ? cleanWikiText(imageMatch[1]) : null,
    });
  }

  return stateMap;
}

function extractStateFromSlug(slug: string): string {
  return slug.replace(/^cm-/, "").replace(/-/g, " ");
}

async function fetchWikiSummary(wikiTitle: string) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`;
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "OpenNewsPoliticsSync/1.0 (originxlabs.com)",
      Accept: "application/json",
    },
  });

  if (!resp.ok) return null;
  const data = await resp.json();
  return {
    title: data?.title || null,
    extract: data?.extract || null,
    description: data?.description || null,
    image: data?.thumbnail?.source || null,
    page: data?.content_urls?.desktop?.page || null,
    wikibase_item: data?.wikibase_item || null,
    timestamp: data?.timestamp || null,
  };
}

async function fetchChiefMinisterSourceMap(): Promise<Map<string, ChiefMinisterRecord>> {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "parse");
  url.searchParams.set("page", "List_of_current_Indian_chief_ministers");
  url.searchParams.set("prop", "wikitext");
  url.searchParams.set("format", "json");

  const resp = await fetch(url.toString(), {
    headers: {
      "User-Agent": "OpenNewsPoliticsSync/1.0 (originxlabs.com)",
      Accept: "application/json",
    },
  });

  if (!resp.ok) return new Map();
  const payload = await resp.json();
  const wikitext = payload?.parse?.wikitext?.["*"];
  if (!wikitext || typeof wikitext !== "string") return new Map();

  return parseChiefMinisterRows(wikitext);
}

async function ensurePartyId(serviceClient: ReturnType<typeof createClient>, partyName: string): Promise<string | null> {
  const slug = toSlug(partyName);
  if (!slug) return null;

  const { data: existingBySlug } = await serviceClient
    .schema("opennews")
    .from("parties")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existingBySlug?.id) return existingBySlug.id;

  const { data: existingByName } = await serviceClient
    .schema("opennews")
    .from("parties")
    .select("id")
    .ilike("name", partyName)
    .eq("country_code", "IN")
    .maybeSingle();

  if (existingByName?.id) return existingByName.id;

  const { data: inserted, error } = await serviceClient
    .schema("opennews")
    .from("parties")
    .insert({
      name: partyName,
      slug,
      country_code: "IN",
      ideology: "Regional",
    })
    .select("id")
    .single();

  if (error || !inserted?.id) return null;
  return inserted.id;
}

async function syncGlobalLeaders(serviceClient: ReturnType<typeof createClient>, snapshotMonth: Date) {
  const syncResults: Array<{ slug: string; status: string; details?: string }> = [];
  let updated = 0;

  for (const target of GLOBAL_SYNC_TARGETS) {
    const { data: politician, error: findErr } = await serviceClient
      .schema("opennews")
      .from("politicians")
      .select("id,slug,name,current_position,party_id,metadata,official_photo_url")
      .eq("slug", target.slug)
      .maybeSingle();

    if (findErr || !politician?.id) {
      syncResults.push({ slug: target.slug, status: "skipped", details: "missing_politician_row" });
      continue;
    }

    const wiki = await fetchWikiSummary(target.wiki_title);
    if (!wiki) {
      syncResults.push({ slug: target.slug, status: "skipped", details: "wiki_fetch_failed" });
      continue;
    }

    const nowIso = new Date().toISOString();
    const mergedMetadata = {
      ...(politician.metadata || {}),
      wiki_extract: wiki.extract,
      wiki_description: wiki.description,
      wiki_title: wiki.title,
      sync_source: "wikipedia_rest_summary",
      sync_ts: nowIso,
    };

    const { error: updateErr } = await serviceClient
      .schema("opennews")
      .from("politicians")
      .update({
        bio: wiki.extract || politician.name,
        official_photo_url: wiki.image || politician.official_photo_url,
        wikipedia_url: wiki.page || buildWikipediaPageUrl(target.wiki_title),
        wikidata_id: wiki.wikibase_item,
        metadata: mergedMetadata,
        source_last_updated_at: wiki.timestamp || nowIso,
        last_synced_at: nowIso,
      })
      .eq("id", politician.id);

    if (updateErr) {
      syncResults.push({ slug: target.slug, status: "error", details: updateErr.message });
      continue;
    }

    await serviceClient.schema("opennews").from("politician_sources").insert({
      politician_id: politician.id,
      source_type: "wikipedia",
      source_url: wiki.page || buildWikipediaPageUrl(target.wiki_title),
      source_title: wiki.title || target.wiki_title,
      source_published_at: wiki.timestamp || null,
      payload: wiki,
    });

    await serviceClient.schema("opennews").from("politician_snapshot_history").upsert(
      {
        politician_id: politician.id,
        snapshot_month: snapshotMonth.toISOString().slice(0, 10),
        current_position: politician.current_position,
        party_id: politician.party_id,
        is_major_leader: true,
        metadata: { source: "opennews-politics-sync", captured_at: nowIso, scope: "global_leader" },
      },
      { onConflict: "politician_id,snapshot_month" },
    );

    updated += 1;
    syncResults.push({ slug: target.slug, status: "updated" });
  }

  return {
    updated,
    checked: GLOBAL_SYNC_TARGETS.length,
    results: syncResults,
  };
}

async function syncIndianChiefMinisters(serviceClient: ReturnType<typeof createClient>, snapshotMonth: Date) {
  const { data: cmRows, error: cmFetchErr } = await serviceClient
    .schema("opennews")
    .from("politicians")
    .select("id,slug,name,current_position,party_id,metadata,official_photo_url,wikipedia_url")
    .like("slug", "cm-%");

  if (cmFetchErr || !cmRows?.length) {
    return {
      updated: 0,
      checked: 0,
      results: [{ slug: "cm-sync", status: "skipped", details: "no_cm_rows_found" }],
    };
  }

  const cmSourceMap = await fetchChiefMinisterSourceMap();
  const syncResults: Array<{ slug: string; status: string; details?: string }> = [];
  let updated = 0;

  for (const politician of cmRows) {
    const stateNameFromMeta =
      typeof politician.metadata?.state_name === "string"
        ? politician.metadata.state_name
        : extractStateFromSlug(politician.slug);

    const normalizedState = normalizeStateName(stateNameFromMeta);
    const sourceRow = cmSourceMap.get(normalizedState);

    if (!sourceRow) {
      syncResults.push({
        slug: politician.slug,
        status: "skipped",
        details: `state_not_found_in_source:${stateNameFromMeta}`,
      });
      continue;
    }

    const wiki = await fetchWikiSummary(sourceRow.cmWikiTitle);
    if (!wiki) {
      syncResults.push({
        slug: politician.slug,
        status: "skipped",
        details: `wiki_fetch_failed:${sourceRow.cmWikiTitle}`,
      });
      continue;
    }

    const nowIso = new Date().toISOString();
    const partyId = sourceRow.partyName
      ? await ensurePartyId(serviceClient, sourceRow.partyName)
      : politician.party_id;

    const fallbackImage = sourceRow.imageFileName ? buildFilePathUrl(sourceRow.imageFileName) : politician.official_photo_url;
    const mergedMetadata = {
      ...(politician.metadata || {}),
      state_name: sourceRow.stateName,
      sync_pending: false,
      cm_sync_source: "wikipedia_current_chief_ministers",
      cm_party_name: sourceRow.partyName,
      cm_took_office: sourceRow.tookOffice,
      wiki_extract: wiki.extract,
      wiki_description: wiki.description,
      wiki_title: wiki.title,
      sync_ts: nowIso,
    };

    const { error: updateErr } = await serviceClient
      .schema("opennews")
      .from("politicians")
      .update({
        name: sourceRow.cmName,
        current_position: `Chief Minister of ${sourceRow.stateName}`,
        bio: wiki.extract || `Chief Minister of ${sourceRow.stateName}`,
        official_photo_url: wiki.image || fallbackImage,
        wikipedia_url: wiki.page || buildWikipediaPageUrl(sourceRow.cmWikiTitle),
        wikidata_id: wiki.wikibase_item,
        party_id: partyId,
        metadata: mergedMetadata,
        source_last_updated_at: wiki.timestamp || nowIso,
        last_synced_at: nowIso,
      })
      .eq("id", politician.id);

    if (updateErr) {
      syncResults.push({ slug: politician.slug, status: "error", details: updateErr.message });
      continue;
    }

    await serviceClient.schema("opennews").from("politician_sources").insert({
      politician_id: politician.id,
      source_type: "wikipedia",
      source_url: wiki.page || buildWikipediaPageUrl(sourceRow.cmWikiTitle),
      source_title: `Chief Minister of ${sourceRow.stateName} (Wikipedia)`,
      source_published_at: wiki.timestamp || null,
      payload: {
        ...wiki,
        source_state: sourceRow.stateName,
        source_party: sourceRow.partyName,
        source_took_office: sourceRow.tookOffice,
      },
    });

    await serviceClient.schema("opennews").from("politician_snapshot_history").upsert(
      {
        politician_id: politician.id,
        snapshot_month: snapshotMonth.toISOString().slice(0, 10),
        current_position: `Chief Minister of ${sourceRow.stateName}`,
        party_id: partyId,
        is_major_leader: true,
        metadata: {
          source: "opennews-politics-sync",
          captured_at: nowIso,
          scope: "india_state_cm",
          took_office: sourceRow.tookOffice,
        },
      },
      { onConflict: "politician_id,snapshot_month" },
    );

    updated += 1;
    syncResults.push({ slug: politician.slug, status: "updated" });
  }

  return {
    updated,
    checked: cmRows.length,
    results: syncResults,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const cronSecret = Deno.env.get("CRON_INGEST_SECRET");

  if (!supabaseUrl || !serviceRole) {
    return new Response(JSON.stringify({ error: "Supabase env missing" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const incomingSecret = req.headers.get("x-cron-secret");
  if (!cronSecret || !incomingSecret || incomingSecret !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const serviceClient = createClient(supabaseUrl, serviceRole);
  const snapshotMonth = new Date();
  snapshotMonth.setUTCDate(1);
  snapshotMonth.setUTCHours(0, 0, 0, 0);

  const globalResult = await syncGlobalLeaders(serviceClient, snapshotMonth);
  const cmResult = await syncIndianChiefMinisters(serviceClient, snapshotMonth);

  return new Response(
    JSON.stringify({
      success: true,
      updated: globalResult.updated + cmResult.updated,
      checked: globalResult.checked + cmResult.checked,
      sync_summary: {
        global_leaders: {
          updated: globalResult.updated,
          checked: globalResult.checked,
        },
        india_state_chief_ministers: {
          updated: cmResult.updated,
          checked: cmResult.checked,
        },
      },
      sync_results: [...globalResult.results, ...cmResult.results],
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});


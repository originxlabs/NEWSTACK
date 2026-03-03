import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SARVAM_API_KEY = Deno.env.get("SARVAM_API_KEY") || "";

const GRIEVANCE_FROM_EMAIL =
  Deno.env.get("GRIEVANCE_FROM_EMAIL") || "NEWSTACK Grievances <admin@newstack.live>";
const GRIEVANCE_FALLBACK_EMAIL = Deno.env.get("GRIEVANCE_FALLBACK_EMAIL") || "support@newstack.live";
const GRIEVANCE_ADMIN_ROUTING_EMAIL =
  Deno.env.get("GRIEVANCE_ADMIN_ROUTING_EMAIL") || "admin@newstack.live";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for public-grievances function.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

type GrievanceAction = "list" | "draft" | "submit";

interface ListPayload {
  action: "list";
  countryCode?: string;
  regionCode?: string;
  sectorKey?: string;
  query?: string;
}

interface DraftPayload {
  action: "draft";
  title: string;
  details: string;
  countryCode: string;
  sectorName?: string;
  authorityName?: string;
  authorityEmail?: string | null;
}

interface SubmitPayload {
  action: "submit";
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
  countryCode: string;
  regionCode?: string;
  sectorKey: string;
  authorityId?: string;
  authorityName?: string;
  authorityEmail?: string | null;
  subject: string;
  body: string;
  to?: string[];
  cc?: string[];
  aiAssisted?: boolean;
}

const fallbackSectors = [
  { key: "auth", name: "Auth & Identity", description: "Identity, Aadhaar and authentication grievances." },
  { key: "agriculture", name: "Agriculture", description: "Farming and agri support grievances." },
  { key: "defence", name: "Defence", description: "Defence and ex-servicemen grievances." },
  { key: "railways", name: "Railways", description: "Rail operation and passenger grievances." },
  { key: "power-energy", name: "Power & Energy", description: "Power distribution and billing grievances." },
  { key: "telecom", name: "Telecom & Digital", description: "Telecom and digital service grievances." },
  { key: "education", name: "Education", description: "Education-related grievances." },
  { key: "health", name: "Health & Public Health", description: "Healthcare and public health grievances." },
  { key: "finance-tax", name: "Finance & Tax", description: "Tax and finance service grievances." },
  { key: "consumer-affairs", name: "Consumer Affairs", description: "Consumer protection and redressal grievances." },
  { key: "labour", name: "Labour & Employment", description: "Labour and employment grievances." },
  { key: "women-child", name: "Women & Child Welfare", description: "Women and child welfare grievances." },
  { key: "environment", name: "Environment", description: "Environment and pollution grievances." },
  { key: "law-order", name: "Law, Order & Cyber", description: "Law, order and cyber grievance channels." },
  { key: "politics-governance", name: "Politics & Governance", description: "Public governance grievances." },
  { key: "local-civic", name: "Local Civic Services", description: "Municipal and civic grievances." },
];

const fallbackAuthorities = [
  {
    id: "fallback-cpgrams-auth",
    country_code: "IN",
    region_code: "national",
    sector_key: "auth",
    authority_name: "UIDAI + CPGRAMS Identity Grievance Route",
    department_level: "national",
    contact_email: "help@uidai.gov.in",
    contact_phone: "1947",
    grievance_url: "https://pgportal.gov.in/",
    website_url: "https://uidai.gov.in/",
    escalation_contacts: [{ level: "L1", label: "UIDAI Helpline", email: "help@uidai.gov.in", portal: "https://uidai.gov.in/" }],
    source_url: "https://uidai.gov.in/",
    data_version: "2026-03-03",
    last_verified_at: "2026-03-03",
    data_refreshed_at: new Date().toISOString(),
    is_active: true,
  },
  {
    id: "fallback-cpgrams-governance",
    country_code: "IN",
    region_code: "national",
    sector_key: "politics-governance",
    authority_name: "CPGRAMS - Central Public Grievance Redress And Monitoring System",
    department_level: "national",
    contact_email: null,
    contact_phone: "1800-11-1555",
    grievance_url: "https://pgportal.gov.in/",
    website_url: "https://darpg.gov.in/",
    escalation_contacts: [{ level: "L1", label: "CPGRAMS", email: null, portal: "https://pgportal.gov.in/" }],
    source_url: "https://pgportal.gov.in/",
    data_version: "2026-03-03",
    last_verified_at: "2026-03-03",
    data_refreshed_at: new Date().toISOString(),
    is_active: true,
  },
];

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const normalized = String(email).trim().toLowerCase();
  if (!normalized.includes("@") || normalized.length > 254) return null;
  return normalized;
}

function dedupeEmails(values: Array<string | null | undefined>): string[] {
  const set = new Set<string>();
  for (const value of values) {
    const normalized = normalizeEmail(value);
    if (normalized) set.add(normalized);
  }
  return [...set];
}

function parseEscalationEmails(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const emails: string[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const mail = normalizeEmail((row as Record<string, unknown>).email as string | undefined);
    if (mail) emails.push(mail);
  }
  return dedupeEmails(emails);
}

function sanitizeText(input: string, max = 8000): string {
  return String(input || "")
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, max);
}

function createTicketNo(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const nonce = crypto.randomUUID().split("-")[0].toUpperCase();
  return `ON-GR-${y}${m}${d}-${nonce}`;
}

function fallbackDraft(payload: DraftPayload) {
  const title = sanitizeText(payload.title, 200) || "Public grievance submission";
  const details = sanitizeText(payload.details, 5000);
  const sector = sanitizeText(payload.sectorName || "General", 80);
  const authority = sanitizeText(payload.authorityName || "Concerned authority", 120);

  const subject = `${title} | ${sector} | ${payload.countryCode}`;
  const body = [
    `Dear ${authority} Team,`,
    "",
    `I am writing to submit a public grievance regarding ${sector.toLowerCase()}.`,
    "",
    "Issue Summary:",
    title,
    "",
    "Detailed Description:",
    details || "(Please describe the issue in detail)",
    "",
    "Request:",
    "Please acknowledge this complaint and share the expected timeline for resolution.",
    "",
    "Regards,",
    "[Your Name]",
    "[Your Contact Number]",
  ].join("\n");

  return {
    subject,
    body,
    to: dedupeEmails([payload.authorityEmail]),
    cc: [] as string[],
    notes: [
      "Draft generated in guardrail mode.",
      "Edit factual details before sending.",
    ],
  };
}

async function draftWithSarvam(payload: DraftPayload) {
  if (!SARVAM_API_KEY) {
    return fallbackDraft(payload);
  }

  const fallback = fallbackDraft(payload);

  const prompt = `You are an assistant generating civic grievance emails.
Return strict JSON only with shape: {"subject":"...","body":"...","to":["..."],"cc":["..."],"notes":["..."]}.
No markdown.
Context:
Country=${payload.countryCode}
Sector=${payload.sectorName || "General"}
Authority=${payload.authorityName || "Concerned authority"}
Title=${sanitizeText(payload.title, 240)}
Details=${sanitizeText(payload.details, 4000)}
AuthorityEmail=${payload.authorityEmail || ""}
Rules:
- Keep tone respectful and non-defamatory.
- Include clear ask and expected resolution timeline.
- Keep body under 350 words.
- If authority email unknown, keep to empty array.
`;

  try {
    const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SARVAM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sarvam-m",
        temperature: 0.2,
        messages: [
          { role: "system", content: "Return only valid compact JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      return fallback;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      return fallback;
    }

    const parsed = JSON.parse(content);
    return {
      subject: sanitizeText(parsed?.subject || fallback.subject, 220),
      body: sanitizeText(parsed?.body || fallback.body, 6000),
      to: dedupeEmails(Array.isArray(parsed?.to) ? parsed.to : fallback.to),
      cc: dedupeEmails(Array.isArray(parsed?.cc) ? parsed.cc : []),
      notes: Array.isArray(parsed?.notes)
        ? parsed.notes.map((n: unknown) => sanitizeText(String(n), 180)).filter(Boolean)
        : fallback.notes,
    };
  } catch {
    return fallback;
  }
}

async function getUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return data.user.id;
}

async function handleList(payload: ListPayload) {
  const countryCode = sanitizeText(payload.countryCode || "", 4).toUpperCase();
  const regionInput = sanitizeText(payload.regionCode || "", 40);
  const regionCode = regionInput.toLowerCase() === "national" ? "national" : regionInput.toUpperCase();
  const sectorKey = sanitizeText(payload.sectorKey || "", 64).toLowerCase();
  const query = sanitizeText(payload.query || "", 100).toLowerCase();

  try {
    let request = supabase
      .from("public_grievance_authorities")
      .select(
        "id,country_code,region_code,sector_key,authority_name,department_level,contact_email,contact_phone,grievance_url,website_url,escalation_contacts,source_url,data_version,last_verified_at,data_refreshed_at,is_active",
      )
      .eq("is_active", true)
      .order("country_code", { ascending: true })
      .order("sector_key", { ascending: true })
      .order("authority_name", { ascending: true })
      .limit(500);

    if (countryCode) {
      request = request.eq("country_code", countryCode);
    }
    if (sectorKey) {
      request = request.eq("sector_key", sectorKey);
    }
      if (regionCode && regionCode !== "all") {
        if (regionCode === "national") request = request.eq("region_code", "national");
        else request = request.in("region_code", [regionCode, "national"]);
      }

    const { data: authorities, error } = await request;
    if (error) {
      throw error;
    }

    const filtered = (authorities || []).filter((row) => {
      if (!query) return true;
      const hay = [row.authority_name, row.sector_key, row.country_code, row.region_code]
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });

    const { data: sectors } = await supabase
      .from("public_grievance_sectors")
      .select("key,name,description")
      .order("name", { ascending: true });

    const { data: latest } = await supabase
      .from("public_grievance_authorities")
      .select("data_refreshed_at")
      .eq("is_active", true)
      .order("data_refreshed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return json(200, {
      sectors: sectors || fallbackSectors,
      authorities: filtered,
      lastSyncedAt: latest?.data_refreshed_at || null,
      baselineVersion: "2026-03-03",
    });
  } catch (error) {
    console.error("public-grievances list fallback", error);
    const scopedAuthorities = fallbackAuthorities.filter((row) => {
      if (countryCode && row.country_code !== countryCode) return false;
      if (sectorKey && row.sector_key !== sectorKey) return false;
      if (regionCode && regionCode !== "all") {
        const rowRegion = String(row.region_code || "");
        if (regionCode === "national") return rowRegion.toLowerCase() === "national";
        return rowRegion.toLowerCase() === "national" || rowRegion.toUpperCase() === regionCode;
      }
      if (!query) return true;
      const hay = [row.authority_name, row.sector_key, row.country_code, row.region_code].join(" ").toLowerCase();
      return hay.includes(query);
    });

    return json(200, {
      sectors: fallbackSectors,
      authorities: scopedAuthorities,
      lastSyncedAt: null,
      baselineVersion: "2026-03-03",
      fallback: true,
    });
  }
}

async function enforceSubmissionRateLimit(requesterEmail: string, ip: string | null): Promise<boolean> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count: byEmailCount } = await supabase
    .from("public_grievance_tickets")
    .select("id", { count: "exact", head: true })
    .eq("requester_email", requesterEmail)
    .gte("created_at", since);

  if ((byEmailCount || 0) >= 5) return false;

  if (ip) {
    const { count: byIpCount } = await supabase
      .from("public_grievance_tickets")
      .select("id", { count: "exact", head: true })
      .filter("metadata->>ip", "eq", ip)
      .gte("created_at", since);

    if ((byIpCount || 0) >= 10) return false;
  }

  return true;
}

function renderMailHtml(input: {
  ticketNo: string;
  requesterName: string;
  requesterEmail: string;
  countryCode: string;
  sectorKey: string;
  subject: string;
  body: string;
}) {
  const escapedBody = input.body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");

  return `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
    <h2 style="margin: 0 0 12px;">New Public Grievance Submission</h2>
    <p style="margin: 0 0 12px;"><strong>Ticket:</strong> ${input.ticketNo}</p>
    <p style="margin: 0 0 12px;"><strong>Subject:</strong> ${input.subject}</p>
    <p style="margin: 0 0 12px;"><strong>Sector:</strong> ${input.sectorKey}</p>
    <p style="margin: 0 0 12px;"><strong>Country:</strong> ${input.countryCode}</p>
    <p style="margin: 0 0 12px;"><strong>Requester:</strong> ${input.requesterName} (${input.requesterEmail})</p>
    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0;"/>
    <div>${escapedBody}</div>
    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0;"/>
    <p style="font-size: 12px; color: #6b7280;">Sent via NEWSTACK OpenNews Public Grievances.</p>
  </body>
</html>`;
}

function renderAckHtml(ticketNo: string, authorityName: string, subject: string) {
  return `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
    <h2 style="margin: 0 0 12px;">Your Grievance Ticket Is Created</h2>
    <p style="margin: 0 0 12px;">Thank you for submitting your grievance through NEWSTACK Public Grievances.</p>
    <p style="margin: 0 0 8px;"><strong>Ticket No:</strong> ${ticketNo}</p>
    <p style="margin: 0 0 8px;"><strong>Authority:</strong> ${authorityName}</p>
    <p style="margin: 0 0 16px;"><strong>Subject:</strong> ${subject}</p>
    <p style="margin: 0;">Keep this ticket number for tracking and escalation.</p>
  </body>
</html>`;
}

async function handleSubmit(req: Request, payload: SubmitPayload) {
  const requesterName = sanitizeText(payload.requesterName, 120);
  const requesterEmail = normalizeEmail(payload.requesterEmail);
  const requesterPhone = sanitizeText(payload.requesterPhone || "", 32);
  const countryCode = sanitizeText(payload.countryCode, 4).toUpperCase();
  const regionCode = sanitizeText(payload.regionCode || "national", 40).toLowerCase();
  const sectorKey = sanitizeText(payload.sectorKey, 64).toLowerCase();
  const subject = sanitizeText(payload.subject, 220);
  const body = sanitizeText(payload.body, 8000);
  const authorityNameInput = sanitizeText(payload.authorityName || "", 180);
  const authorityEmailInput = normalizeEmail(payload.authorityEmail);

  if (!requesterName || !requesterEmail || !countryCode || !sectorKey || !subject || !body) {
    return json(400, { error: "Missing required fields for grievance submission." });
  }

  if (body.length < 50) {
    return json(400, { error: "Please provide more detail (minimum 50 characters)." });
  }

  const ip = sanitizeText((req.headers.get("x-forwarded-for") || "").split(",")[0] || "", 120) || null;
  const allowed = await enforceSubmissionRateLimit(requesterEmail, ip);
  if (!allowed) {
    return json(429, {
      error: "Rate limit reached. Please wait before submitting another grievance.",
    });
  }

  let authority:
    | {
        id: string;
        authority_name: string;
        contact_email: string | null;
        escalation_contacts: unknown;
      }
    | null = null;

  if (payload.authorityId) {
    const { data } = await supabase
      .from("public_grievance_authorities")
      .select("id,authority_name,contact_email,escalation_contacts")
      .eq("id", payload.authorityId)
      .eq("is_active", true)
      .maybeSingle();
    authority = data || null;
  }

  const authorityName = authority?.authority_name || authorityNameInput || "Concerned Authority";
  const authorityEmail = normalizeEmail(authority?.contact_email) || authorityEmailInput;
  const escalationEmails = parseEscalationEmails(authority?.escalation_contacts);

  const to = dedupeEmails([...(payload.to || []), authorityEmail, GRIEVANCE_FALLBACK_EMAIL]);
  const cc = dedupeEmails([
    ...(payload.cc || []),
    ...escalationEmails,
    GRIEVANCE_ADMIN_ROUTING_EMAIL,
  ]);

  const ticketNo = createTicketNo();
  const requesterUserId = await getUserId(req);

  const { data: inserted, error: insertError } = await supabase
    .from("public_grievance_tickets")
    .insert({
      ticket_no: ticketNo,
      requester_user_id: requesterUserId,
      requester_name: requesterName,
      requester_email: requesterEmail,
      requester_phone: requesterPhone || null,
      country_code: countryCode,
      region_code: regionCode,
      sector_key: sectorKey,
      authority_id: authority?.id || null,
      authority_name_snapshot: authorityName,
      authority_email_snapshot: authorityEmail || null,
      subject,
      message_body: body,
      ai_assisted: !!payload.aiAssisted,
      status: "submitted",
      metadata: {
        ip,
        user_agent: req.headers.get("user-agent") || null,
      },
      mail_to: to,
      mail_cc: cc,
    })
    .select("id")
    .single();

  if (insertError || !inserted?.id) {
    console.error("Failed to create grievance ticket", insertError);
    return json(500, { error: "Failed to create grievance ticket." });
  }

  let outboundId: string | null = null;
  let ackId: string | null = null;
  let status: "submitted" | "forwarded" | "failed" = "submitted";

  if (resend) {
    try {
      const sent = await resend.emails.send({
        from: GRIEVANCE_FROM_EMAIL,
        to,
        cc,
        subject: `[${ticketNo}] ${subject}`,
        html: renderMailHtml({
          ticketNo,
          requesterName,
          requesterEmail,
          countryCode,
          sectorKey,
          subject,
          body,
        }),
      });

      outboundId = sent.data?.id || null;
      status = "forwarded";

      const ack = await resend.emails.send({
        from: GRIEVANCE_FROM_EMAIL,
        to: [requesterEmail],
        subject: `NEWSTACK Grievance Ticket ${ticketNo}`,
        html: renderAckHtml(ticketNo, authorityName, subject),
      });

      ackId = ack.data?.id || null;
    } catch (mailError) {
      console.error("Failed to send grievance emails", mailError);
      status = "failed";
    }
  }

  await supabase
    .from("public_grievance_tickets")
    .update({
      status,
      outbound_message_id: outboundId,
      acknowledgement_message_id: ackId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", inserted.id);

  await supabase.from("public_grievance_events").insert({
    ticket_id: inserted.id,
    event_type: status === "failed" ? "mail_failed" : "submitted",
    actor_type: "system",
    actor_id: requesterUserId,
    event_payload: {
      ticket_no: ticketNo,
      outbound_message_id: outboundId,
      acknowledgement_message_id: ackId,
      to,
      cc,
    },
  });

  return json(200, {
    success: true,
    ticketNo,
    status,
    to,
    cc,
    acknowledgementSent: Boolean(ackId),
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const payload = (await req.json()) as ListPayload | DraftPayload | SubmitPayload;
    const action = payload?.action as GrievanceAction | undefined;

    if (!action) {
      return json(400, { error: "Action is required." });
    }

    if (action === "list") {
      return await handleList(payload as ListPayload);
    }

    if (action === "draft") {
      const draftPayload = payload as DraftPayload;
      const title = sanitizeText(draftPayload.title, 240);
      const details = sanitizeText(draftPayload.details, 5000);
      if (!title || !details) {
        return json(400, { error: "title and details are required for draft action." });
      }

      const draft = await draftWithSarvam({
        ...draftPayload,
        title,
        details,
      });

      return json(200, {
        success: true,
        draft,
        provider: SARVAM_API_KEY ? "sarvam-with-fallback" : "fallback-template",
      });
    }

    if (action === "submit") {
      return await handleSubmit(req, payload as SubmitPayload);
    }

    return json(400, { error: "Unknown action." });
  } catch (error) {
    console.error("public-grievances error", error);
    return json(500, { error: "Internal server error" });
  }
});

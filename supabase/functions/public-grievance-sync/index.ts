import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SYNC_SECRET = Deno.env.get("PUBLIC_GRIEVANCE_SYNC_SECRET") || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for public-grievance-sync.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

const sectors = [
  ["auth", "Auth & Identity", "Identity, Aadhaar, digital identity and authentication grievances."],
  ["agriculture", "Agriculture", "Farming, crop support, agri credit, procurement, irrigation grievances."],
  ["defence", "Defence", "Defence-related citizen grievances and ex-servicemen issue routing."],
  ["railways", "Railways", "Rail operations, passenger issues, station complaints, service grievances."],
  ["power-energy", "Power & Energy", "Electricity supply, transmission, billing escalation contacts."],
  ["telecom", "Telecom & Digital", "Telecom service quality, spam fraud, internet and digital public services."],
  ["education", "Education", "School and higher education grievances and institutional escalation routes."],
  ["health", "Health & Public Health", "Hospital access, healthcare delivery, public health reporting channels."],
  ["finance-tax", "Finance & Tax", "Banking, taxation, public finance and citizen financial grievance pathways."],
  ["consumer-affairs", "Consumer Affairs", "Consumer rights, fraud, unfair trade practices and complaint filing."],
  ["labour", "Labour & Employment", "Workplace and labour policy grievances, welfare and employment services."],
  ["women-child", "Women & Child Welfare", "Women and child support channels, safety and welfare complaints."],
  ["environment", "Environment", "Pollution, climate, forest and wildlife governance complaints."],
  ["law-order", "Law, Order & Cyber", "Police, cybercrime, legal process and public security channels."],
  ["politics-governance", "Politics & Governance", "Elected office, governance conduct and policy grievances."],
  ["local-civic", "Local Civic Services", "Municipal, sanitation, roads, water and local public service issues."],
  ["transport", "Transport", "Road transport, civil aviation and multimodal transport complaints."],
  ["housing-urban", "Housing & Urban Affairs", "Housing schemes, urban development and city infrastructure grievances."],
  ["rural-development", "Rural Development", "Rural development schemes and village infrastructure grievances."],
  ["social-justice", "Social Justice", "Social justice, welfare and inclusion grievances."],
  ["minority-affairs", "Minority Affairs", "Minority welfare and access-related grievances."],
  ["tribal-affairs", "Tribal Affairs", "Tribal welfare and rights-related grievance channels."],
  ["food-public-distribution", "Food & Public Distribution", "Food supply, ration and PDS grievance routes."],
  ["water-sanitation", "Water & Sanitation", "Water supply and sanitation grievances."],
  ["disaster-management", "Disaster Management", "Disaster response, relief and emergency grievance channels."],
  ["judiciary-legal", "Judiciary & Legal Services", "Legal aid and justice service-related grievances."],
  ["immigration-passport", "Immigration & Passport", "Passport and immigration grievance pathways."],
  ["pensions-senior-citizens", "Pensions & Senior Citizens", "Pension and senior citizen grievance channels."],
  ["business-msme", "Business & MSME", "Industry, startup and MSME support grievance channels."],
  ["tourism-culture", "Tourism & Culture", "Tourism and culture service grievances."],
] as const;

const INDIA_STATE_CODES = [
  "AN", "AP", "AR", "AS", "BR", "CH", "CG", "DN", "DL", "GA", "GJ", "HR", "HP", "JK", "JH", "KA", "KL",
  "LA", "LD", "MP", "MH", "MN", "ML", "MZ", "NL", "OD", "PY", "PB", "RJ", "SK", "TN", "TG", "TR", "UP",
  "UK", "WB",
] as const;

const authorities = [
  {
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
  },
  {
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
  },
  {
    country_code: "IN",
    region_code: "national",
    sector_key: "consumer-affairs",
    authority_name: "National Consumer Helpline",
    department_level: "national",
    contact_email: "support@nch.gov.in",
    contact_phone: "1915",
    grievance_url: "https://consumerhelpline.gov.in/",
    website_url: "https://consumeraffairs.nic.in/",
    escalation_contacts: [{ level: "L1", label: "NCH", email: "support@nch.gov.in", portal: "https://consumerhelpline.gov.in/" }],
    source_url: "https://consumerhelpline.gov.in/",
  },
  {
    country_code: "IN",
    region_code: "national",
    sector_key: "law-order",
    authority_name: "National Cyber Crime Reporting Portal",
    department_level: "national",
    contact_email: null,
    contact_phone: "1930",
    grievance_url: "https://cybercrime.gov.in/",
    website_url: "https://www.mha.gov.in/",
    escalation_contacts: [{ level: "L1", label: "Cyber Crime Portal", email: null, portal: "https://cybercrime.gov.in/" }],
    source_url: "https://cybercrime.gov.in/",
  },
  {
    country_code: "IN",
    region_code: "national",
    sector_key: "railways",
    authority_name: "RailMadad",
    department_level: "national",
    contact_email: null,
    contact_phone: "139",
    grievance_url: "https://railmadad.indianrailways.gov.in/",
    website_url: "https://indianrailways.gov.in/",
    escalation_contacts: [{ level: "L1", label: "RailMadad", email: null, portal: "https://railmadad.indianrailways.gov.in/" }],
    source_url: "https://railmadad.indianrailways.gov.in/",
  },
  {
    country_code: "US",
    region_code: "national",
    sector_key: "consumer-affairs",
    authority_name: "USA.gov Complaint and Consumer Support",
    department_level: "national",
    contact_email: null,
    contact_phone: null,
    grievance_url: "https://www.usa.gov/consumer-complaints",
    website_url: "https://www.usa.gov/",
    escalation_contacts: [{ level: "L1", label: "USA.gov", email: null, portal: "https://www.usa.gov/consumer-complaints" }],
    source_url: "https://www.usa.gov/consumer-complaints",
  },
] as const;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const headerSecret = req.headers.get("x-sync-secret") || "";
  if (!SYNC_SECRET || headerSecret !== SYNC_SECRET) {
    return json(401, { error: "Unauthorized sync request" });
  }

  const today = new Date();
  const y = today.getUTCFullYear();
  const m = String(today.getUTCMonth() + 1).padStart(2, "0");
  const d = String(today.getUTCDate()).padStart(2, "0");
  const dateVersion = `${y}-${m}-${d}`;

  try {
    await supabase.from("public_grievance_sectors").upsert(
      sectors.map(([key, name, description]) => ({ key, name, description })),
      { onConflict: "key" },
    );

    const stateAuthAuthorities = INDIA_STATE_CODES.map((stateCode) => ({
      country_code: "IN",
      region_code: stateCode,
      sector_key: "auth",
      authority_name: `State Identity + CPGRAMS Grievance (${stateCode})`,
      department_level: "state",
      contact_email: "help@uidai.gov.in",
      contact_phone: "1947",
      grievance_url: "https://pgportal.gov.in/",
      website_url: "https://uidai.gov.in/",
      escalation_contacts: [
        { level: "L1", label: "UIDAI", email: "help@uidai.gov.in", portal: "https://uidai.gov.in/" },
        { level: "L2", label: "CPGRAMS", email: null, portal: "https://pgportal.gov.in/" },
      ],
      source_url: "https://pgportal.gov.in/",
    }));

    await supabase.from("public_grievance_authorities").upsert(
      [...authorities, ...stateAuthAuthorities].map((row) => ({
        ...row,
        data_version: dateVersion,
        last_verified_at: dateVersion,
        data_refreshed_at: new Date().toISOString(),
        is_active: true,
        updated_at: new Date().toISOString(),
      })),
      {
        onConflict: "country_code,region_code,sector_key,authority_name",
      },
    );

    return json(200, {
      success: true,
      message: "Public grievance catalog sync completed.",
      syncedAt: new Date().toISOString(),
      recordCounts: {
        sectors: sectors.length,
        authorities: authorities.length + stateAuthAuthorities.length,
      },
    });
  } catch (error) {
    console.error("public-grievance-sync failure", error);
    return json(500, { error: "Sync failed" });
  }
});

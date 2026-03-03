import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function renderSvg(title: string, subtitle: string) {
  const safeTitle = title.replace(/[<>]/g, "");
  const safeSubtitle = subtitle.replace(/[<>]/g, "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0A0A0A"/>
  <rect x="40" y="40" width="1120" height="550" rx="24" fill="#121212" stroke="#2A2A2A"/>
  <text x="80" y="130" fill="#7DD3FC" font-size="28" font-family="Arial, sans-serif">OPENNEWS</text>
  <text x="80" y="220" fill="#F8FAFC" font-size="56" font-family="Arial, sans-serif" font-weight="700">${safeTitle}</text>
  <text x="80" y="280" fill="#94A3B8" font-size="28" font-family="Arial, sans-serif">${safeSubtitle}</text>
  <text x="80" y="560" fill="#38BDF8" font-size="22" font-family="Arial, sans-serif">open journalism · verified sources · realtime debates</text>
</svg>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const title = url.searchParams.get("title") || "Independent Journalism, Public Accountability";
  const subtitle = url.searchParams.get("subtitle") || "OpenNews Beta 1.0";

  const svg = renderSvg(title, subtitle);
  return new Response(svg, {
    headers: {
      ...corsHeaders,
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
});

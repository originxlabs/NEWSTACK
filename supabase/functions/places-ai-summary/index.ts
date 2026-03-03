import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SummaryRequest {
  place_name: string;
  weather?: {
    temp: number;
    condition: string;
  };
  aqi?: number;
  attractions?: string[];
}

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { place_name, weather, aqi, attractions } = await req.json() as SummaryRequest;

    if (!place_name) {
      throw new Error("place_name is required");
    }

    console.log("Generating AI summary for:", place_name);

    // Build context
    let context = `Place: ${place_name}\n`;
    if (weather) {
      context += `Current weather: ${weather.temp}°C, ${weather.condition}\n`;
    }
    if (aqi !== undefined) {
      const aqiLabel = aqi <= 50 ? "Good" : aqi <= 100 ? "Moderate" : aqi <= 150 ? "Unhealthy for Sensitive Groups" : "Unhealthy";
      context += `Air Quality Index: ${aqi} (${aqiLabel})\n`;
    }
    if (attractions && attractions.length > 0) {
      context += `Top attractions: ${attractions.slice(0, 5).join(", ")}\n`;
    }

    const prompt = `Based on the following information about ${place_name}, provide a brief, engaging travel summary. Include:
1. A one-line hook about why someone should visit
2. Best time to visit (considering current conditions)
3. Who should visit and who might want to avoid it right now
4. One unique insider tip

Context:
${context}

Keep the response concise, conversational, and helpful. Format as JSON with keys: hook, bestTime, idealFor, avoidIf, insiderTip`;

    if (!LOVABLE_API_KEY) {
      // Return a default summary if no API key
      return new Response(
        JSON.stringify({
          hook: `Discover the wonders of ${place_name}!`,
          bestTime: weather ? `Current conditions: ${weather.temp}°C, ${weather.condition}` : "Check local weather before visiting",
          idealFor: "Travelers seeking new experiences",
          avoidIf: aqi && aqi > 100 ? "You have respiratory sensitivities" : "You prefer staying home",
          insiderTip: "Ask locals for hidden gems!",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", errorText);
      throw new Error("Failed to generate summary");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    
    let summary;
    try {
      summary = JSON.parse(content);
    } catch {
      summary = {
        hook: `Experience the magic of ${place_name}`,
        bestTime: "Any time is a good time to explore",
        idealFor: "All types of travelers",
        avoidIf: "You're not ready for adventure",
        insiderTip: "Take your time and soak it all in",
      };
    }

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("AI summary error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

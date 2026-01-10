import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatRequest {
  message: string;
  placeContext: {
    name: string;
    address?: string;
    weather?: { temp: number; condition: string; humidity?: number };
    aqi?: { value: number; category: string };
    attractions?: string[];
    restaurants?: string[];
    hotels?: string[];
  };
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, placeContext, history = [] } = await req.json() as ChatRequest;

    if (!message) {
      throw new Error("Message is required");
    }

    console.log("Ask Place:", placeContext.name, "Question:", message);

    // Build context about the place
    let contextInfo = `You are a helpful AI assistant providing information about ${placeContext.name}.`;
    contextInfo += `\n\nCurrent information about this place:`;
    
    if (placeContext.address) {
      contextInfo += `\n- Location: ${placeContext.address}`;
    }
    
    if (placeContext.weather) {
      contextInfo += `\n- Current weather: ${placeContext.weather.temp}°C, ${placeContext.weather.condition}`;
      if (placeContext.weather.humidity) {
        contextInfo += `, ${placeContext.weather.humidity}% humidity`;
      }
    }
    
    if (placeContext.aqi) {
      contextInfo += `\n- Air Quality: AQI ${placeContext.aqi.value} (${placeContext.aqi.category})`;
    }
    
    if (placeContext.attractions && placeContext.attractions.length > 0) {
      contextInfo += `\n- Popular attractions nearby: ${placeContext.attractions.slice(0, 5).join(", ")}`;
    }
    
    if (placeContext.restaurants && placeContext.restaurants.length > 0) {
      contextInfo += `\n- Popular restaurants: ${placeContext.restaurants.slice(0, 3).join(", ")}`;
    }
    
    if (placeContext.hotels && placeContext.hotels.length > 0) {
      contextInfo += `\n- Hotels nearby: ${placeContext.hotels.slice(0, 3).join(", ")}`;
    }

    contextInfo += `\n\nProvide helpful, concise, and friendly responses. If you don't know something specific, say so honestly but try to provide general helpful information. Keep responses conversational and under 200 words unless more detail is specifically requested.`;

    if (!LOVABLE_API_KEY) {
      // Return a helpful response without AI
      return new Response(
        JSON.stringify({
          response: `I can help you learn about ${placeContext.name}! Currently, I have limited information, but I know ${
            placeContext.weather ? `it's ${placeContext.weather.temp}°C and ${placeContext.weather.condition} there` : "the weather conditions"
          }. What would you like to know more about?`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const messages = [
      { role: "system", content: contextInfo },
      ...history.slice(-10), // Keep last 10 messages for context
      { role: "user", content: message },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", errorText);
      throw new Error("Failed to get AI response");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Ask place error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

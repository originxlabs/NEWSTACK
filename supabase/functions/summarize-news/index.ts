import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SummarizeRequest {
  articles: Array<{
    headline: string;
    summary: string;
    content?: string;
    source_name: string;
  }>;
  topic?: string;
  style?: "brief" | "detailed" | "bullet";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articles, topic, style = "brief" } = await req.json() as SummarizeRequest;

    if (!articles || articles.length === 0) {
      throw new Error("No articles provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Build context from articles
    const articlesContext = articles.slice(0, 5).map((a, i) => 
      `[${i + 1}] ${a.headline} (${a.source_name})\n${a.summary || a.content || ""}`
    ).join("\n\n");

    const styleInstructions = {
      brief: "Provide a concise 2-3 sentence summary that captures the key points.",
      detailed: "Provide a comprehensive summary with context and analysis in 4-5 sentences.",
      bullet: "Provide 4-5 bullet points summarizing the key takeaways.",
    };

    const systemPrompt = `You are a professional news analyst for NEWSTACK, a modern news platform. 
Your task is to summarize and synthesize news from multiple sources into clear, unbiased summaries.
Be factual, avoid sensationalism, and highlight what matters most to the reader.
${topic ? `Focus on the ${topic} angle.` : ""}`;

    const userPrompt = `Please analyze and summarize these news articles:

${articlesContext}

${styleInstructions[style]}

Also provide:
1. A "Why This Matters" section (1-2 sentences)
2. Key perspectives or viewpoints mentioned`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "Unable to generate summary";

    return new Response(
      JSON.stringify({ 
        summary,
        articles_analyzed: articles.length,
        style,
        topic,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Summarize error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
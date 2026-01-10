import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TTSRequest {
  text: string;
  language?: string;
}

// Indian languages that should use Sarvam API
const indianLanguages = ["hi", "ta", "te", "kn", "ml", "mr", "gu", "bn", "pa", "or"];

// Sarvam language codes mapping
const sarvamLanguageCodes: Record<string, string> = {
  hi: "hi-IN",
  ta: "ta-IN",
  te: "te-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  bn: "bn-IN",
  pa: "pa-IN",
  or: "or-IN",
  en: "en-IN",
};

async function generateWithSarvam(text: string, language: string): Promise<ArrayBuffer> {
  const SARVAM_API_KEY = Deno.env.get("SARVAM_API_KEY");
  if (!SARVAM_API_KEY) {
    throw new Error("SARVAM_API_KEY not configured");
  }

  const languageCode = sarvamLanguageCodes[language] || "hi-IN";

  console.log(`Sarvam TTS: language=${languageCode}, text length=${text.length}`);

  const response = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: {
      "api-subscription-key": SARVAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: [text],
      target_language_code: languageCode,
      speaker: "anushka",
      model: "bulbul:v2",
      pitch: 0,
      pace: 1.0,
      loudness: 1.5,
      speech_sample_rate: 22050,
      enable_preprocessing: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Sarvam error:", errorText);
    throw new Error(`Sarvam TTS failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  // Sarvam returns base64 encoded audio in audios array
  if (data.audios && data.audios.length > 0) {
    const base64Audio = data.audios[0];
    // Convert base64 to ArrayBuffer
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  throw new Error("No audio data returned from Sarvam");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, language = "en" } = await req.json() as TTSRequest;

    if (!text || text.trim().length === 0) {
      throw new Error("Text is required");
    }

    // Limit text length
    const truncatedText = text.substring(0, 250);

    console.log(`TTS request: language=${language}, isIndian=${indianLanguages.includes(language)}`);

    // Only use Sarvam for Indian languages, otherwise tell client to use browser fallback
    if (indianLanguages.includes(language)) {
      const audioBuffer = await generateWithSarvam(truncatedText, language);
      
      return new Response(audioBuffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": "audio/wav",
          "Content-Length": audioBuffer.byteLength.toString(),
        },
      });
    } else {
      // For non-Indian languages, tell client to use browser TTS
      return new Response(
        JSON.stringify({ 
          useBrowserFallback: true, 
          message: "Use browser speech synthesis for this language" 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("TTS Error:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage, useBrowserFallback: true }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

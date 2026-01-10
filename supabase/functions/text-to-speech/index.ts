import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TTSRequest {
  text: string;
  voiceId?: string;
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

// Sarvam speakers for different languages
const sarvamSpeakers: Record<string, string> = {
  hi: "anushka",
  ta: "anushka",
  te: "anushka",
  kn: "anushka",
  ml: "anushka",
  mr: "anushka",
  gu: "anushka",
  bn: "anushka",
  pa: "anushka",
  or: "anushka",
  en: "anushka",
};

// ElevenLabs voice IDs for non-Indian languages
const elevenLabsVoices: Record<string, string> = {
  en: "JBFqnCBsd6RMkjVDRZzb",
  es: "EXAVITQu4vr4xnSDxMaL",
  fr: "FGY2WhTYpPnrIDTdsKH5",
  de: "nPczCjzI2devNBz1zQrb",
  ja: "Xb7hH8MSUJpSbSDYk0k2",
  zh: "Xb7hH8MSUJpSbSDYk0k2",
  ar: "onwK4e9ZLuTAKqWW03F9",
  pt: "TX3LPaxmHKxFdv7VOQHJ",
  ru: "cjVigY5qzO86Huf0OWal",
  ko: "Xb7hH8MSUJpSbSDYk0k2",
  it: "FGY2WhTYpPnrIDTdsKH5",
};

async function generateWithSarvam(text: string, language: string): Promise<ArrayBuffer> {
  const SARVAM_API_KEY = Deno.env.get("SARVAM_API_KEY");
  if (!SARVAM_API_KEY) {
    throw new Error("SARVAM_API_KEY not configured");
  }

  const languageCode = sarvamLanguageCodes[language] || "hi-IN";
  const speaker = sarvamSpeakers[language] || "anushka";

  console.log(`Sarvam TTS: language=${languageCode}, speaker=${speaker}, text length=${text.length}`);

  const response = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: {
      "api-subscription-key": SARVAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: [text],
      target_language_code: languageCode,
      speaker: speaker,
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

async function generateWithElevenLabs(text: string, language: string, voiceId?: string): Promise<ArrayBuffer> {
  const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
  if (!ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY not configured");
  }

  const selectedVoice = voiceId || elevenLabsVoices[language] || elevenLabsVoices["en"];

  console.log(`ElevenLabs TTS: voice=${selectedVoice}, text length=${text.length}`);

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
          speed: 1.0,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("ElevenLabs error:", errorText);
    throw new Error(`ElevenLabs TTS failed: ${response.status} - ${errorText}`);
  }

  return await response.arrayBuffer();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId, language = "en" } = await req.json() as TTSRequest;

    if (!text || text.trim().length === 0) {
      throw new Error("Text is required");
    }

    // Limit text length to save credits
    const truncatedText = text.substring(0, 250);

    console.log(`TTS request: language=${language}, isIndian=${indianLanguages.includes(language)}`);

    let audioBuffer: ArrayBuffer;
    let contentType = "audio/mpeg";

    // Use Sarvam for Indian languages, ElevenLabs for others
    if (indianLanguages.includes(language)) {
      audioBuffer = await generateWithSarvam(truncatedText, language);
      contentType = "audio/wav"; // Sarvam returns WAV
    } else {
      audioBuffer = await generateWithElevenLabs(truncatedText, language, voiceId);
      contentType = "audio/mpeg";
    }

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("TTS Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

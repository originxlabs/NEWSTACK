import { useState, useCallback, useRef, useEffect } from "react";
import { getCachedAudio, setCachedAudio } from "@/lib/tts-cache";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface UseTTSOptions {
  language?: string;
  maxLength?: number;
}

// Indian languages that use Sarvam API
const indianLanguages = ["hi", "ta", "te", "kn", "ml", "mr", "gu", "bn", "pa", "or"];

// Language codes for browser speech synthesis
const browserVoiceLangs: Record<string, string> = {
  en: "en-US",
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
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  ja: "ja-JP",
  zh: "zh-CN",
  ar: "ar-SA",
  pt: "pt-BR",
  ru: "ru-RU",
  ko: "ko-KR",
  it: "it-IT",
};

export function useTTS(options: UseTTSOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [usingFallback, setUsingFallback] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const maxLength = options.maxLength ?? 250;

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
  }, []);

  const speakWithBrowser = useCallback(async (text: string): Promise<void> => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      throw new Error("Browser speech synthesis not supported");
    }

    window.speechSynthesis.cancel();

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const lang = optionsRef.current.language || "en";
      utterance.lang = browserVoiceLangs[lang] || "en-US";
      utterance.rate = 0.9; // Slightly slower for calm voice
      utterance.pitch = 1.0;

      // Get voices and prefer high-quality ones
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) => v.lang.startsWith(lang) && !v.localService
      ) || voices.find((v) => v.lang.startsWith(lang));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      const wordCount = text.split(/\s+/).length;
      const estimatedDuration = Math.max((wordCount / 130) * 60, 1); // Slower reading

      utterance.onstart = () => {
        setIsPlaying(true);
        setDuration(estimatedDuration);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setProgress(100);
        resolve();
      };

      utterance.onerror = (e) => {
        setIsPlaying(false);
        reject(new Error(e.error || "Speech synthesis error"));
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);

      // Progress simulation
      const startTime = Date.now();
      const interval = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clearInterval(interval);
          return;
        }
        const elapsed = (Date.now() - startTime) / 1000;
        setProgress(Math.min((elapsed / estimatedDuration) * 100, 99));
      }, 200);
    });
  }, []);

  const speak = useCallback(async (text: string) => {
    cleanup();
    setIsLoading(true);
    setError(null);
    setUsingFallback(false);
    setProgress(0);

    const truncatedText = text.length > maxLength
      ? text.substring(0, maxLength).trim() + "..."
      : text;

    const currentLang = optionsRef.current.language || "en";
    const isIndianLanguage = indianLanguages.includes(currentLang);

    // For non-Indian languages, use browser TTS directly (it's free and works well)
    if (!isIndianLanguage) {
      try {
        setUsingFallback(true);
        setIsLoading(false);
        await speakWithBrowser(truncatedText);
        return;
      } catch (err) {
        console.log("Browser TTS failed:", err);
        setError("Speech synthesis not available");
        setIsLoading(false);
        return;
      }
    }

    // For Indian languages, check cache first
    try {
      const cachedBlob = await getCachedAudio(truncatedText, currentLang);
      if (cachedBlob) {
        console.log("Playing from cache");
        const audioUrl = URL.createObjectURL(cachedBlob);
        audioUrlRef.current = audioUrl;

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onloadedmetadata = () => setDuration(audio.duration);
        audio.ontimeupdate = () => {
          if (audio.duration) {
            setProgress((audio.currentTime / audio.duration) * 100);
          }
        };
        audio.onended = () => {
          setIsPlaying(false);
          setProgress(100);
        };
        audio.onerror = () => {
          setError("Failed to play audio");
          setIsPlaying(false);
        };

        await audio.play();
        setIsPlaying(true);
        setIsLoading(false);
        return;
      }
    } catch (cacheErr) {
      console.log("Cache check failed:", cacheErr);
    }

    // Call Sarvam API for Indian languages
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/text-to-speech`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          text: truncatedText,
          language: currentLang,
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      // Check if server says to use browser fallback
      if (contentType.includes("application/json")) {
        const data = await response.json();
        if (data.useBrowserFallback) {
          setUsingFallback(true);
          setIsLoading(false);
          await speakWithBrowser(truncatedText);
          return;
        }
        if (data.error) {
          throw new Error(data.error);
        }
      }

      if (!response.ok) {
        throw new Error(`TTS failed: ${response.status}`);
      }

      const audioBlob = await response.blob();

      // Cache the audio
      try {
        await setCachedAudio(truncatedText, currentLang, audioBlob, "audio/wav");
      } catch (cacheErr) {
        console.log("Failed to cache audio:", cacheErr);
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onloadedmetadata = () => setDuration(audio.duration);
      audio.ontimeupdate = () => {
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      };
      audio.onended = () => {
        setIsPlaying(false);
        setProgress(100);
      };
      audio.onerror = () => {
        setError("Failed to play audio");
        setIsPlaying(false);
      };

      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.log("Sarvam TTS failed, trying browser fallback");
      try {
        setUsingFallback(true);
        await speakWithBrowser(truncatedText);
      } catch {
        const message = err instanceof Error ? err.message : "Failed to generate speech";
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [cleanup, maxLength, speakWithBrowser]);

  const pause = useCallback(() => {
    if (usingFallback && typeof window !== "undefined") {
      window.speechSynthesis?.pause();
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, [usingFallback]);

  const resume = useCallback(() => {
    if (usingFallback && typeof window !== "undefined") {
      window.speechSynthesis?.resume();
    } else if (audioRef.current) {
      audioRef.current.play();
    }
    setIsPlaying(true);
  }, [usingFallback]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [isPlaying, pause, resume]);

  const stop = useCallback(() => {
    cleanup();
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    setUsingFallback(false);
  }, [cleanup]);

  const seek = useCallback((percent: number) => {
    if (!usingFallback && audioRef.current?.duration) {
      audioRef.current.currentTime = (percent / 100) * audioRef.current.duration;
      setProgress(percent);
    }
  }, [usingFallback]);

  const setPlaybackRate = useCallback((rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    speak,
    pause,
    resume,
    toggle,
    stop,
    seek,
    setPlaybackRate,
    isLoading,
    isPlaying,
    error,
    progress,
    duration,
    hasAudio: Boolean(audioRef.current || utteranceRef.current),
    usingFallback,
  };
}

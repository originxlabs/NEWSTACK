import { useState, useCallback, useRef } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface UseTTSOptions {
  language?: string;
  voiceId?: string;
  maxLength?: number; // Max characters to send to TTS
}

// Language codes for browser speech synthesis
const browserVoiceLangs: Record<string, string> = {
  en: "en-US",
  hi: "hi-IN",
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

  const maxLength = options.maxLength || 250; // Default 250 chars to save credits

  const cleanup = useCallback(() => {
    // Cleanup audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    // Cleanup browser speech
    if (utteranceRef.current) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    }
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    setUsingFallback(false);
  }, []);

  // Browser TTS fallback
  const speakWithBrowser = useCallback((text: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!("speechSynthesis" in window)) {
        reject(new Error("Browser speech synthesis not supported"));
        return;
      }

      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = browserVoiceLangs[options.language || "en"] || "en-US";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Try to find a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) => v.lang.startsWith(options.language || "en") && !v.localService
      ) || voices.find((v) => v.lang.startsWith(options.language || "en"));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Estimate duration (rough: 150 words per minute)
      const wordCount = text.split(/\s+/).length;
      const estimatedDuration = (wordCount / 150) * 60;
      setDuration(estimatedDuration);

      let startTime = Date.now();

      utterance.onstart = () => {
        startTime = Date.now();
        setIsPlaying(true);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setProgress(100);
        resolve();
      };

      utterance.onerror = (e) => {
        setIsPlaying(false);
        reject(new Error(e.error));
      };

      // Update progress periodically
      const progressInterval = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          const elapsed = (Date.now() - startTime) / 1000;
          const prog = Math.min((elapsed / estimatedDuration) * 100, 99);
          setProgress(prog);
        } else {
          clearInterval(progressInterval);
        }
      }, 200);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }, [options.language]);

  const speak = useCallback(async (text: string) => {
    cleanup();
    setIsLoading(true);
    setError(null);
    setUsingFallback(false);

    // Truncate text to save credits
    const truncatedText = text.length > maxLength 
      ? text.substring(0, maxLength).trim() + "..."
      : text;

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
          language: options.language || "en",
          voiceId: options.voiceId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `TTS request failed: ${response.status}`;
        
        // Check if it's a quota error - use fallback
        if (errorMsg.includes("quota") || response.status === 401 || response.status === 429) {
          console.log("ElevenLabs quota exceeded, using browser fallback");
          setUsingFallback(true);
          setIsLoading(false);
          await speakWithBrowser(truncatedText);
          return;
        }
        
        throw new Error(errorMsg);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration);
      });

      audio.addEventListener("timeupdate", () => {
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      });

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setProgress(100);
      });

      audio.addEventListener("error", (e) => {
        console.error("Audio playback error:", e);
        setError("Failed to play audio");
        setIsPlaying(false);
      });

      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate speech";
      
      // Try browser fallback for any error
      console.log("ElevenLabs failed, trying browser fallback:", message);
      try {
        setUsingFallback(true);
        await speakWithBrowser(truncatedText);
      } catch (fallbackErr) {
        setError(message);
        console.error("Both TTS methods failed:", fallbackErr);
      }
    } finally {
      setIsLoading(false);
    }
  }, [options.language, options.voiceId, cleanup, maxLength, speakWithBrowser]);

  const pause = useCallback(() => {
    if (usingFallback) {
      window.speechSynthesis.pause();
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, [usingFallback]);

  const resume = useCallback(() => {
    if (usingFallback) {
      window.speechSynthesis.resume();
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
  }, [cleanup]);

  const seek = useCallback((percent: number) => {
    if (!usingFallback && audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (percent / 100) * audioRef.current.duration;
      setProgress(percent);
    }
    // Browser speech synthesis doesn't support seeking
  }, [usingFallback]);

  const setPlaybackRate = useCallback((rate: number) => {
    if (usingFallback && utteranceRef.current) {
      // Can't change rate mid-speech for browser TTS
    } else if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, [usingFallback]);

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
    hasAudio: !!audioRef.current || !!utteranceRef.current,
    usingFallback,
  };
}

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Headphones, Play, Pause, Clock, SkipBack, SkipForward, Volume2, Loader2, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useNews } from "@/hooks/use-news";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface Playlist {
  id: string;
  title: string;
  description: string;
  icon: string;
  topic?: string;
}

const playlists: Playlist[] = [
  { id: "daily-briefing", title: "Today's Briefing", description: "Your personalized morning news digest", icon: "☀️" },
  { id: "business", title: "Business Digest", description: "Markets, companies, and economy", icon: "💼", topic: "business" },
  { id: "tech", title: "Tech Updates", description: "Latest in technology and innovation", icon: "💻", topic: "tech" },
  { id: "sports", title: "Sports Update", description: "Scores, highlights, and analysis", icon: "⚽", topic: "sports" },
  { id: "local", title: "Local News", description: "News from your location", icon: "📍" },
  { id: "world", title: "World Report", description: "Global news and events", icon: "🌍", topic: "world" },
];

const Listen = () => {
  const { country, language } = usePreferences();
  const [currentPlaylist, setCurrentPlaylist] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([75]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [stories, setStories] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Fetch news for the selected topic
  const selectedPlaylist = playlists.find((p) => p.id === currentPlaylist);
  const { data: newsData } = useNews({
    topic: selectedPlaylist?.topic,
    country: selectedPlaylist?.id === "local" ? country?.code : undefined,
    language: language?.code === "en" ? "eng" : language?.code,
    pageSize: 5,
  });

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume]);

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
  }, []);

  const generateAudio = useCallback(async (text: string) => {
    cleanup();
    setIsLoading(true);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/text-to-speech`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          text,
          language: language?.code || "en",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate audio");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audio.volume = volume[0] / 100;
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
        // Play next story
        if (currentStoryIndex < stories.length - 1) {
          setCurrentStoryIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
          setProgress(100);
        }
      });

      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("TTS Error:", error);
      toast.error("Failed to generate audio. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [cleanup, language?.code, volume, currentStoryIndex, stories.length]);

  // Play next story when index changes
  useEffect(() => {
    if (stories.length > 0 && currentStoryIndex < stories.length && isPlaying) {
      generateAudio(stories[currentStoryIndex]);
    }
  }, [currentStoryIndex, stories, isPlaying, generateAudio]);

  const handlePlay = async (playlistId: string) => {
    if (currentPlaylist === playlistId && isPlaying) {
      // Pause current
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (currentPlaylist === playlistId && !isPlaying && audioRef.current) {
      // Resume
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    // Start new playlist
    cleanup();
    setCurrentPlaylist(playlistId);
    setCurrentStoryIndex(0);
    setProgress(0);

    // Build stories from news data
    const articles = newsData?.articles || [];
    if (articles.length === 0) {
      toast.error("No news available for this playlist. Please try again later.");
      return;
    }

    const storyTexts = articles.map((article) => 
      `${article.headline}. ${article.summary || article.ai_analysis || ""}`
    );
    
    setStories(storyTexts);
    
    // Start playing first story
    setIsLoading(true);
    await generateAudio(storyTexts[0]);
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSkipBack = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
    }
  };

  const handleSkipForward = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (value[0] / 100) * audioRef.current.duration;
      setProgress(value[0]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentTime = duration * (progress / 100);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6">
              <Headphones className="h-4 w-4" />
              Spotify for News
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Listen to the World
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              AI-powered audio news briefings with ElevenLabs voices.
              {country && ` Personalized for ${country.flag_emoji} ${country.name}`}
            </p>
          </motion.div>

          {/* Audio Player */}
          {currentPlaylist && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 mb-8"
            >
              <div className="flex items-center gap-6">
                {/* Waveform Animation */}
                <div className="hidden sm:flex items-end gap-1 h-12">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-primary rounded-full"
                      animate={{
                        height: isPlaying ? [8, 24, 16, 32, 12][i % 5] : 8,
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: isPlaying ? Infinity : 0,
                        repeatType: "reverse",
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>

                {/* Now Playing Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold truncate">
                    {selectedPlaylist?.title}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    Story {currentStoryIndex + 1} of {stories.length}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleSkipBack}
                    disabled={currentStoryIndex === 0 || isLoading}
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={handlePlayPause}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5 ml-0.5" />
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleSkipForward}
                    disabled={currentStoryIndex >= stories.length - 1 || isLoading}
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                </div>

                {/* Volume */}
                <div className="hidden md:flex items-center gap-2 w-32">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={volume}
                    onValueChange={setVolume}
                    max={100}
                    step={1}
                    className="w-20"
                  />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <Slider
                  value={[progress]}
                  onValueChange={handleSeek}
                  max={100}
                  step={0.1}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Playlists Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.map((playlist, index) => (
              <motion.div
                key={playlist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`glass-card rounded-xl p-6 cursor-pointer transition-all hover:scale-[1.02] ${
                  currentPlaylist === playlist.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => handlePlay(playlist.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{playlist.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold mb-1">{playlist.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {playlist.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        ~5 min
                      </span>
                      <span>5 stories</span>
                    </div>
                  </div>
                  <Button
                    variant={currentPlaylist === playlist.id && isPlaying ? "default" : "outline"}
                    size="icon"
                    className="shrink-0"
                    disabled={isLoading && currentPlaylist === playlist.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay(playlist.id);
                    }}
                  >
                    {isLoading && currentPlaylist === playlist.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : currentPlaylist === playlist.id && isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4 ml-0.5" />
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Listen;

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Headphones, Play, Pause, Clock, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePreferences } from "@/contexts/PreferencesContext";

interface AudioPlaylist {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: string;
  items: number;
}

const playlists: AudioPlaylist[] = [
  {
    id: "daily-briefing",
    title: "Today's Briefing",
    description: "Your personalized morning news digest",
    duration: "15 min",
    icon: "☀️",
    items: 12,
  },
  {
    id: "business",
    title: "Business Digest",
    description: "Markets, companies, and economy",
    duration: "10 min",
    icon: "💼",
    items: 8,
  },
  {
    id: "tech",
    title: "Tech Updates",
    description: "Latest in technology and innovation",
    duration: "8 min",
    icon: "💻",
    items: 6,
  },
  {
    id: "sports",
    title: "Sports Update",
    description: "Scores, highlights, and analysis",
    duration: "7 min",
    icon: "⚽",
    items: 5,
  },
  {
    id: "local",
    title: "Local News",
    description: "News from your location",
    duration: "5 min",
    icon: "📍",
    items: 4,
  },
  {
    id: "world",
    title: "World Report",
    description: "Global news and events",
    duration: "12 min",
    icon: "🌍",
    items: 10,
  },
];

const Listen = () => {
  const { country } = usePreferences();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState([75]);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const handlePlay = (playlistId: string) => {
    if (currentPlaylist === playlistId) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentPlaylist(playlistId);
      setIsPlaying(true);
      setProgress(0);
    }
  };

  // Simulate progress
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 0 : prev + 0.5));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

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
              AI-powered audio news briefings. Listen while you commute, exercise, or relax.
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
                    {playlists.find((p) => p.id === currentPlaylist)?.title}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {playlists.find((p) => p.id === currentPlaylist)?.description}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <SkipBack className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5 ml-0.5" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon">
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
                  onValueChange={(v) => setProgress(v[0])}
                  max={100}
                  step={0.1}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>
                    {Math.floor((progress / 100) * 15)}:{String(Math.floor(((progress / 100) * 15 * 60) % 60)).padStart(2, "0")}
                  </span>
                  <span>{playlists.find((p) => p.id === currentPlaylist)?.duration}</span>
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
                        {playlist.duration}
                      </span>
                      <span>{playlist.items} stories</span>
                    </div>
                  </div>
                  <Button
                    variant={currentPlaylist === playlist.id && isPlaying ? "default" : "outline"}
                    size="icon"
                    className="shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay(playlist.id);
                    }}
                  >
                    {currentPlaylist === playlist.id && isPlaying ? (
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

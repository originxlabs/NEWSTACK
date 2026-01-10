import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, Headphones, BarChart3, Cpu, Briefcase, DollarSign, Landmark, Heart, Trophy, Film, Rocket, Bitcoin, CloudSun } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Topic {
  id: string;
  slug: string;
  name: string;
  icon: React.ElementType;
  description: string;
  color: string;
  stories: number;
  trending: string[];
}

const topicsData: Topic[] = [
  {
    id: "ai",
    slug: "ai",
    name: "AI & Technology",
    icon: Cpu,
    description: "Artificial Intelligence, Machine Learning, and Tech Innovation",
    color: "#8B5CF6",
    stories: 234,
    trending: ["GPT-5 rumors", "AI regulation", "Robotics breakthrough"],
  },
  {
    id: "business",
    slug: "business",
    name: "Business",
    icon: Briefcase,
    description: "Corporate news, M&A, and business strategy",
    color: "#3B82F6",
    stories: 189,
    trending: ["Tech layoffs", "Q4 earnings", "Supply chain"],
  },
  {
    id: "finance",
    slug: "finance",
    name: "Finance",
    icon: DollarSign,
    description: "Markets, stocks, economy, and personal finance",
    color: "#10B981",
    stories: 312,
    trending: ["Fed rates", "S&P 500", "Inflation data"],
  },
  {
    id: "politics",
    slug: "politics",
    name: "Politics",
    icon: Landmark,
    description: "Political news, governance, and policy",
    color: "#EF4444",
    stories: 156,
    trending: ["Elections 2024", "Policy changes", "International relations"],
  },
  {
    id: "health",
    slug: "health",
    name: "Health",
    icon: Heart,
    description: "Healthcare, wellness, and medical research",
    color: "#14B8A6",
    stories: 98,
    trending: ["New treatments", "Mental health", "Vaccine updates"],
  },
  {
    id: "sports",
    slug: "sports",
    name: "Sports",
    icon: Trophy,
    description: "Sports news, scores, and analysis",
    color: "#EC4899",
    stories: 167,
    trending: ["Premier League", "NBA playoffs", "Olympics"],
  },
  {
    id: "entertainment",
    slug: "entertainment",
    name: "Entertainment",
    icon: Film,
    description: "Movies, music, celebrities, and culture",
    color: "#6366F1",
    stories: 134,
    trending: ["Oscar nominations", "Streaming wars", "Music releases"],
  },
  {
    id: "startups",
    slug: "startups",
    name: "Startups",
    icon: Rocket,
    description: "Startup news, funding, and entrepreneurship",
    color: "#F97316",
    stories: 87,
    trending: ["Unicorn watch", "VC funding", "Tech acquisitions"],
  },
  {
    id: "crypto",
    slug: "crypto",
    name: "Crypto",
    icon: Bitcoin,
    description: "Cryptocurrency, blockchain, and Web3",
    color: "#FBBF24",
    stories: 145,
    trending: ["Bitcoin ETF", "DeFi news", "NFT market"],
  },
  {
    id: "climate",
    slug: "climate",
    name: "Climate",
    icon: CloudSun,
    description: "Climate change, environment, and sustainability",
    color: "#22C55E",
    stories: 76,
    trending: ["COP summit", "Renewable energy", "Carbon markets"],
  },
];

const Topics = () => {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

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
              <Brain className="h-4 w-4" />
              Deep Dives
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Explore Topics
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Dive deep into the topics that matter to you. Each topic has its own feed, audio, analysis, and trends.
            </p>
          </motion.div>

          {/* Selected Topic Detail */}
          {selectedTopic && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-8 mb-12"
              style={{ borderColor: selectedTopic.color, borderWidth: 2 }}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${selectedTopic.color}20` }}
                >
                  <selectedTopic.icon className="h-10 w-10" style={{ color: selectedTopic.color }} />
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-2xl font-bold mb-2">{selectedTopic.name}</h2>
                  <p className="text-muted-foreground mb-4">{selectedTopic.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTopic.trending.map((trend) => (
                      <Badge key={trend} variant="secondary">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {trend}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button>
                    View Feed
                  </Button>
                  <Button variant="outline">
                    <Headphones className="h-4 w-4 mr-2" />
                    Listen
                  </Button>
                  <Button variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analysis
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Topics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {topicsData.map((topic, index) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className={`glass-card rounded-xl p-6 cursor-pointer hover:scale-[1.02] transition-all ${
                  selectedTopic?.id === topic.id ? "ring-2" : ""
                }`}
                style={{
                  borderColor: selectedTopic?.id === topic.id ? topic.color : undefined,
                }}
                onClick={() => setSelectedTopic(topic)}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${topic.color}20` }}
                >
                  <topic.icon className="h-6 w-6" style={{ color: topic.color }} />
                </div>
                <h3 className="font-display font-semibold mb-1">{topic.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {topic.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{topic.stories} stories</span>
                  <TrendingUp className="h-4 w-4" style={{ color: topic.color }} />
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

export default Topics;

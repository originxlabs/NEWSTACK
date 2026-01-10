import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, ChevronRight, Brain, Briefcase, DollarSign, 
  Vote, Rocket, Cpu, Leaf, Heart, Trophy, Film, Microscope, 
  Globe, MapPin, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InterestsOnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
}

const CATEGORIES = [
  { id: "ai", name: "AI", icon: Brain, color: "from-cyan-500 to-blue-500" },
  { id: "business", name: "Business", icon: Briefcase, color: "from-blue-500 to-indigo-500" },
  { id: "finance", name: "Finance", icon: DollarSign, color: "from-green-500 to-emerald-500" },
  { id: "politics", name: "Politics", icon: Vote, color: "from-amber-500 to-orange-500" },
  { id: "startups", name: "Startups", icon: Rocket, color: "from-orange-500 to-red-500" },
  { id: "technology", name: "Technology", icon: Cpu, color: "from-purple-500 to-pink-500" },
  { id: "climate", name: "Climate", icon: Leaf, color: "from-lime-500 to-green-500" },
  { id: "health", name: "Health", icon: Heart, color: "from-rose-500 to-pink-500" },
  { id: "sports", name: "Sports", icon: Trophy, color: "from-red-500 to-orange-500" },
  { id: "entertainment", name: "Entertainment", icon: Film, color: "from-pink-500 to-purple-500" },
  { id: "science", name: "Science", icon: Microscope, color: "from-indigo-500 to-violet-500" },
  { id: "world", name: "World", icon: Globe, color: "from-teal-500 to-cyan-500" },
];

const STORAGE_KEY = "newstack_interests";
const ONBOARDING_SHOWN_KEY = "newstack_interests_onboarding_shown";

export function InterestsOnboarding({ isOpen, onComplete }: InterestsOnboardingProps) {
  const { user } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    if (selectedInterests.length < 3) {
      toast.error("Please select at least 3 interests");
      return;
    }

    setIsSaving(true);

    try {
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedInterests));
      localStorage.setItem(ONBOARDING_SHOWN_KEY, "true");

      // If user is logged in, save to database
      if (user) {
        // Get topic IDs for selected interests
        const { data: topics } = await supabase
          .from("topics")
          .select("id, slug")
          .in("slug", selectedInterests);

        if (topics && topics.length > 0) {
          // Delete existing preferences
          await supabase
            .from("user_topic_preferences")
            .delete()
            .eq("user_id", user.id);

          // Insert new preferences
          const preferences = topics.map((topic) => ({
            user_id: user.id,
            topic_id: topic.id,
            weight: 1,
          }));

          await supabase.from("user_topic_preferences").insert(preferences);
        }
      }

      toast.success("Your interests have been saved!");
      onComplete();
    } catch (err) {
      console.error("Failed to save interests:", err);
      // Still complete even if save fails
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedInterests));
      localStorage.setItem(ONBOARDING_SHOWN_KEY, "true");
      onComplete();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_SHOWN_KEY, "true");
    onComplete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 sm:p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">
              Personalize Your Feed
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select at least 3 topics you're interested in. We'll use this to curate your "For You" feed.
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedInterests.includes(category.id);

              return (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleInterest(category.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 bg-card"
                  }`}
                >
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center mb-2 mx-auto`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium">{category.name}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Selection Counter */}
          <div className="text-center mb-6">
            <span className={`text-sm ${selectedInterests.length >= 3 ? "text-green-500" : "text-muted-foreground"}`}>
              {selectedInterests.length} of 3+ selected
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="sm:flex-1"
            >
              Skip for now
            </Button>
            <Button
              onClick={handleComplete}
              disabled={selectedInterests.length < 3 || isSaving}
              className="sm:flex-1 gap-2"
            >
              {isSaving ? (
                "Saving..."
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

export function useInterestsOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if onboarding was shown
    const wasShown = localStorage.getItem(ONBOARDING_SHOWN_KEY);
    const hasInterests = localStorage.getItem(STORAGE_KEY);

    // Show onboarding after a delay if not shown before and no interests saved
    if (!wasShown && !hasInterests) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [user]);

  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  const getSelectedInterests = (): string[] => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  };

  return {
    showOnboarding,
    setShowOnboarding,
    completeOnboarding,
    getSelectedInterests,
  };
}

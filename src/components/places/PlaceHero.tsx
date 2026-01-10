import { motion } from "framer-motion";
import { Heart, ThumbsUp, Share2, MapPin, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlaceData } from "@/hooks/use-places";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface PlaceHeroProps {
  placeData: PlaceData;
}

export function PlaceHero({ placeData }: PlaceHeroProps) {
  const { user } = useAuth();
  const { place, aiSummary } = placeData;
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && place) {
      checkSavedStatus();
    }
  }, [user, place?.place_id]);

  const checkSavedStatus = async () => {
    if (!user || !place) return;

    const { data } = await supabase
      .from("saved_places")
      .select("id, liked")
      .eq("user_id", user.id)
      .eq("place_id", place.place_id)
      .single();

    if (data) {
      setIsSaved(true);
      setIsLiked(data.liked || false);
    } else {
      setIsSaved(false);
      setIsLiked(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Please sign in to save places");
      return;
    }
    if (!place) return;

    setIsLoading(true);
    try {
      if (isSaved) {
        await supabase
          .from("saved_places")
          .delete()
          .eq("user_id", user.id)
          .eq("place_id", place.place_id);
        setIsSaved(false);
        setIsLiked(false);
        toast.success("Removed from saved places");
      } else {
        await supabase.from("saved_places").insert({
          user_id: user.id,
          place_id: place.place_id,
          place_name: place.name,
          place_address: place.formatted_address,
          place_image_url: place.photos?.[0]?.url,
          place_lat: place.lat,
          place_lng: place.lng,
          place_rating: place.rating,
        });
        setIsSaved(true);
        toast.success("Saved to your places");
      }
    } catch (error) {
      toast.error("Failed to save place");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like places");
      return;
    }
    if (!place) return;

    setIsLoading(true);
    try {
      if (isSaved) {
        await supabase
          .from("saved_places")
          .update({ liked: !isLiked })
          .eq("user_id", user.id)
          .eq("place_id", place.place_id);
        setIsLiked(!isLiked);
      } else {
        await supabase.from("saved_places").insert({
          user_id: user.id,
          place_id: place.place_id,
          place_name: place.name,
          place_address: place.formatted_address,
          place_image_url: place.photos?.[0]?.url,
          place_lat: place.lat,
          place_lng: place.lng,
          place_rating: place.rating,
          liked: true,
        });
        setIsSaved(true);
        setIsLiked(true);
      }
    } catch (error) {
      toast.error("Failed to update");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!place) return;

    const shareData = {
      title: place.name,
      text: `Check out ${place.name} on NEWSTACK`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard");
      }
    } catch (error) {
      // User cancelled share
    }
  };

  if (!place) return null;

  return (
    <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden">
      {/* Background Image */}
      {place.photos?.[0] ? (
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src={place.photos[0].url}
          alt={place.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10" />
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Location Badge */}
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="glass-card border-none">
                <MapPin className="h-3 w-3 mr-1" />
                {place.types?.[0]?.replace(/_/g, " ") || "Place"}
              </Badge>
              {place.rating && (
                <Badge variant="secondary" className="glass-card border-none">
                  <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                  {place.rating} ({place.user_ratings_total?.toLocaleString()})
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-3 text-foreground">
              {place.name}
            </h1>

            {/* Address */}
            <p className="text-lg md:text-xl text-foreground/80 mb-4 max-w-2xl">
              {place.formatted_address}
            </p>

            {/* AI Description */}
            {aiSummary?.hook && (
              <p className="text-base md:text-lg text-foreground/70 mb-6 max-w-2xl italic">
                "{aiSummary.hook}"
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant={isSaved ? "default" : "outline"}
                className="rounded-full glass-card border-white/20 hover:bg-white/20"
                onClick={handleSave}
                disabled={isLoading}
              >
                <Heart className={`h-4 w-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
                {isSaved ? "Saved" : "Save"}
              </Button>
              <Button
                variant={isLiked ? "default" : "outline"}
                className="rounded-full glass-card border-white/20 hover:bg-white/20"
                onClick={handleLike}
                disabled={isLoading}
              >
                <ThumbsUp className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                {isLiked ? "Liked" : "Like"}
              </Button>
              <Button
                variant="outline"
                className="rounded-full glass-card border-white/20 hover:bg-white/20"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Updated timestamp */}
      <div className="absolute top-4 right-4">
        <Badge variant="secondary" className="glass-card border-none text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Live data
        </Badge>
      </div>
    </div>
  );
}

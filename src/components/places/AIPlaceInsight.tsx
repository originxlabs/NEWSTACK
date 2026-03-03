import { motion } from "framer-motion";
import { Sparkles, Users, Sun, AlertCircle } from "lucide-react";
import { PlaceData } from "@/hooks/use-places";

interface AIPlaceInsightProps {
  placeData: PlaceData;
}

export function AIPlaceInsight({ placeData }: AIPlaceInsightProps) {
  const { aiSummary, weather, aqi } = placeData;

  if (!aiSummary) return null;

  // Determine current conditions
  const conditions: string[] = [];
  if (weather?.current) {
    if (weather.current.temp > 30) conditions.push("Hot weather");
    else if (weather.current.temp < 10) conditions.push("Cold weather");
    else conditions.push("Pleasant weather");
  }
  if (aqi?.aqi) {
    if (aqi.aqi <= 50) conditions.push("Good air quality");
    else if (aqi.aqi <= 100) conditions.push("Moderate air quality");
    else conditions.push("Poor air quality - masks recommended");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 border-primary/20"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-display font-semibold">Why this place matters right now</h3>
          <p className="text-xs text-muted-foreground">AI-generated insight</p>
        </div>
      </div>

      {/* Main insight */}
      <p className="text-foreground/90 leading-relaxed mb-6">
        {aiSummary.hook} {conditions.length > 0 && `Current conditions: ${conditions.join(", ")}.`}
      </p>

      {/* Quick facts grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <Sun className="h-5 w-5 text-yellow-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Best Time</p>
            <p className="text-xs text-muted-foreground">{aiSummary.bestTime}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Ideal For</p>
            <p className="text-xs text-muted-foreground">{aiSummary.idealFor}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Consider Avoiding If</p>
            <p className="text-xs text-muted-foreground">{aiSummary.avoidIf}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">Insider Tip</p>
            <p className="text-xs text-muted-foreground">{aiSummary.insiderTip}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

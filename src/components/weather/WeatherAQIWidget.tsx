import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, 
  Thermometer, Eye, Sunrise, Sunset, Loader2, CloudLightning,
  CloudFog, CloudDrizzle, Leaf, AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface WeatherData {
  current: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
    pressure: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    condition: string;
    description: string;
    icon: string;
    icon_url: string;
    clouds: number;
    sunrise: number;
    sunset: number;
    timezone: number;
    city: string;
    country: string;
  };
  forecast: Array<{
    dt: number;
    temp: number;
    feels_like: number;
    condition: string;
    description: string;
    icon: string;
    icon_url: string;
    humidity: number;
    wind_speed: number;
    pop: number;
  }>;
  updated_at: string;
}

interface AQIData {
  aqi: number | null;
  category: string;
  color: string;
  pollutants?: {
    pm25?: { value: number; unit: string } | null;
    pm10?: { value: number; unit: string } | null;
    no2?: { value: number; unit: string } | null;
    o3?: { value: number; unit: string } | null;
    co?: { value: number; unit: string } | null;
    so2?: { value: number; unit: string } | null;
  };
  station?: {
    name: string;
    city?: string;
    country?: string;
  };
  message?: string;
  source?: string;
}

interface WeatherAQIWidgetProps {
  lat: number;
  lng: number;
  cityName?: string;
  compact?: boolean;
  showAQI?: boolean;
}

const WEATHER_ICONS: Record<string, React.ReactNode> = {
  "Clear": <Sun className="w-8 h-8 text-amber-500" />,
  "Clouds": <Cloud className="w-8 h-8 text-slate-400" />,
  "Rain": <CloudRain className="w-8 h-8 text-blue-500" />,
  "Drizzle": <CloudDrizzle className="w-8 h-8 text-blue-400" />,
  "Thunderstorm": <CloudLightning className="w-8 h-8 text-purple-500" />,
  "Snow": <CloudSnow className="w-8 h-8 text-sky-300" />,
  "Mist": <CloudFog className="w-8 h-8 text-slate-300" />,
  "Fog": <CloudFog className="w-8 h-8 text-slate-300" />,
  "Haze": <CloudFog className="w-8 h-8 text-slate-300" />,
};

const AQI_COLORS: Record<string, string> = {
  "green": "bg-green-500",
  "yellow": "bg-yellow-500",
  "orange": "bg-orange-500",
  "red": "bg-red-500",
  "purple": "bg-purple-500",
  "maroon": "bg-rose-900",
  "gray": "bg-gray-400",
};

const AQI_TEXT_COLORS: Record<string, string> = {
  "green": "text-green-600",
  "yellow": "text-yellow-600",
  "orange": "text-orange-600",
  "red": "text-red-600",
  "purple": "text-purple-600",
  "maroon": "text-rose-900",
  "gray": "text-gray-500",
};

function getWeatherIcon(condition: string) {
  return WEATHER_ICONS[condition] || <Cloud className="w-8 h-8 text-slate-400" />;
}

function formatTime(timestamp: number, timezone: number): string {
  const date = new Date((timestamp + timezone) * 1000);
  return date.toLocaleTimeString("en-US", { 
    hour: "2-digit", 
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC"
  });
}

export function WeatherAQIWidget({ 
  lat, 
  lng, 
  cityName, 
  compact = false,
  showAQI = true 
}: WeatherAQIWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [aqi, setAqi] = useState<AQIData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [isLoadingAQI, setIsLoadingAQI] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeather() {
      if (!lat || !lng) return;
      
      setIsLoadingWeather(true);
      setWeatherError(null);
      
      try {
        const { data, error: fetchError } = await supabase.functions.invoke("places-weather", {
          body: { lat, lng }
        });
        
        if (fetchError) throw fetchError;
        if (data?.error) throw new Error(data.error);
        
        setWeather(data);
      } catch (err) {
        console.error("Weather fetch error:", err);
        setWeatherError(err instanceof Error ? err.message : "Failed to load weather");
      } finally {
        setIsLoadingWeather(false);
      }
    }
    
    fetchWeather();
  }, [lat, lng]);

  useEffect(() => {
    async function fetchAQI() {
      if (!lat || !lng || !showAQI) return;
      
      setIsLoadingAQI(true);
      
      try {
        const { data, error: fetchError } = await supabase.functions.invoke("places-aqi", {
          body: { lat, lng }
        });
        
        if (fetchError) throw fetchError;
        
        setAqi(data);
      } catch (err) {
        console.error("AQI fetch error:", err);
        setAqi({ aqi: null, category: "Unavailable", color: "gray" });
      } finally {
        setIsLoadingAQI(false);
      }
    }
    
    fetchAQI();
  }, [lat, lng, showAQI]);

  const isLoading = isLoadingWeather || (showAQI && isLoadingAQI);

  if (isLoading) {
    return (
      <Card className={compact ? "p-3" : "p-4"}>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading weather...</span>
        </div>
      </Card>
    );
  }

  if (weatherError || !weather) {
    return (
      <Card className={compact ? "p-3" : "p-4"}>
        <div className="text-center text-sm text-muted-foreground">
          <Cloud className="w-6 h-6 mx-auto mb-1 opacity-50" />
          <span>Weather unavailable</span>
        </div>
      </Card>
    );
  }

  const { current, forecast } = weather;

  if (compact) {
    return (
      <Card className="p-3">
        <div className="flex items-center gap-3">
          {getWeatherIcon(current.condition)}
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{current.temp}°C</span>
              <span className="text-sm text-muted-foreground capitalize">{current.description}</span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1">
                <Thermometer className="w-3 h-3" />
                Feels {current.feels_like}°
              </span>
              <span className="flex items-center gap-1">
                <Droplets className="w-3 h-3" />
                {current.humidity}%
              </span>
              {showAQI && aqi && aqi.aqi !== null && (
                <span className={cn("flex items-center gap-1", AQI_TEXT_COLORS[aqi.color])}>
                  <Leaf className="w-3 h-3" />
                  AQI {aqi.aqi}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-primary" />
            Weather in {cityName || current.city}
          </span>
          <Badge variant="outline" className="text-[10px]">
            {current.country}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Weather */}
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex-shrink-0"
          >
            {getWeatherIcon(current.condition)}
          </motion.div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{current.temp}°C</span>
              <span className="text-sm text-muted-foreground">
                H:{current.temp_max}° L:{current.temp_min}°
              </span>
            </div>
            <p className="text-sm text-muted-foreground capitalize">{current.description}</p>
          </div>
        </div>

        {/* AQI Section */}
        {showAQI && aqi && (
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Leaf className={cn("w-4 h-4", AQI_TEXT_COLORS[aqi.color])} />
                <span className="text-sm font-medium">Air Quality</span>
              </div>
              {aqi.aqi !== null && (
                <Badge 
                  variant="secondary" 
                  className={cn("text-white text-xs", AQI_COLORS[aqi.color])}
                >
                  AQI {aqi.aqi}
                </Badge>
              )}
            </div>
            
            {aqi.aqi !== null ? (
              <>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={cn("font-medium", AQI_TEXT_COLORS[aqi.color])}>
                    {aqi.category}
                  </span>
                  {aqi.category.includes("Unhealthy") && (
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                  )}
                </div>
                <Progress 
                  value={Math.min(aqi.aqi, 300) / 3} 
                  className="h-1.5"
                />
                
                {/* Pollutants */}
                {aqi.pollutants && (
                  <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] text-muted-foreground">
                    {aqi.pollutants.pm25 && (
                      <div>PM2.5: {aqi.pollutants.pm25.value.toFixed(1)}</div>
                    )}
                    {aqi.pollutants.pm10 && (
                      <div>PM10: {aqi.pollutants.pm10.value.toFixed(1)}</div>
                    )}
                    {aqi.pollutants.o3 && (
                      <div>O₃: {aqi.pollutants.o3.value.toFixed(1)}</div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                {aqi.message || "No data available for this location"}
              </p>
            )}
          </div>
        )}

        {/* Weather Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Thermometer className="w-3.5 h-3.5" />
            <span>Feels like {current.feels_like}°C</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Droplets className="w-3.5 h-3.5" />
            <span>Humidity {current.humidity}%</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wind className="w-3.5 h-3.5" />
            <span>Wind {current.wind_speed} m/s</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Eye className="w-3.5 h-3.5" />
            <span>Visibility {(current.visibility / 1000).toFixed(1)} km</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sunrise className="w-3.5 h-3.5" />
            <span>Sunrise {formatTime(current.sunrise, current.timezone)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sunset className="w-3.5 h-3.5" />
            <span>Sunset {formatTime(current.sunset, current.timezone)}</span>
          </div>
        </div>

        {/* Forecast */}
        {forecast && forecast.length > 0 && (
          <div className="pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2">Next 24 hours</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {forecast.slice(0, 6).map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex-shrink-0 flex flex-col items-center gap-1 px-2 py-1.5 bg-muted/30 rounded-lg min-w-[50px]"
                >
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(item.dt * 1000).toLocaleTimeString("en-US", { 
                      hour: "numeric",
                      hour12: true 
                    })}
                  </span>
                  <img 
                    src={item.icon_url} 
                    alt={item.condition}
                    className="w-6 h-6"
                  />
                  <span className="text-xs font-medium">{item.temp}°</span>
                  {item.pop > 0 && (
                    <span className="text-[9px] text-blue-500">
                      {Math.round(item.pop * 100)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

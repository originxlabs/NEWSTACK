import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WeatherRequest {
  lat: number;
  lng: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENWEATHERMAP_API_KEY = Deno.env.get("OPENWEATHERMAP_API_KEY");
    if (!OPENWEATHERMAP_API_KEY) {
      throw new Error("OPENWEATHERMAP_API_KEY not configured");
    }

    const { lat, lng } = await req.json() as WeatherRequest;

    if (lat === undefined || lng === undefined) {
      throw new Error("lat and lng are required");
    }

    console.log("Getting weather for:", lat, lng);

    // Get current weather
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${OPENWEATHERMAP_API_KEY}`;
    const currentResponse = await fetch(currentUrl);
    const currentData = await currentResponse.json();

    if (currentData.cod && currentData.cod !== 200) {
      throw new Error(currentData.message || "Weather API error");
    }

    // Get forecast (5 day / 3 hour)
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=metric&cnt=8&appid=${OPENWEATHERMAP_API_KEY}`;
    const forecastResponse = await fetch(forecastUrl);
    const forecastData = await forecastResponse.json();

    const result = {
      current: {
        temp: Math.round(currentData.main?.temp || 0),
        feels_like: Math.round(currentData.main?.feels_like || 0),
        temp_min: Math.round(currentData.main?.temp_min || 0),
        temp_max: Math.round(currentData.main?.temp_max || 0),
        humidity: currentData.main?.humidity,
        pressure: currentData.main?.pressure,
        visibility: currentData.visibility,
        wind_speed: currentData.wind?.speed,
        wind_deg: currentData.wind?.deg,
        condition: currentData.weather?.[0]?.main,
        description: currentData.weather?.[0]?.description,
        icon: currentData.weather?.[0]?.icon,
        icon_url: `https://openweathermap.org/img/wn/${currentData.weather?.[0]?.icon}@2x.png`,
        clouds: currentData.clouds?.all,
        sunrise: currentData.sys?.sunrise,
        sunset: currentData.sys?.sunset,
        timezone: currentData.timezone,
        city: currentData.name,
        country: currentData.sys?.country,
      },
      forecast: (forecastData.list || []).map((item: any) => ({
        dt: item.dt,
        temp: Math.round(item.main?.temp || 0),
        feels_like: Math.round(item.main?.feels_like || 0),
        condition: item.weather?.[0]?.main,
        description: item.weather?.[0]?.description,
        icon: item.weather?.[0]?.icon,
        icon_url: `https://openweathermap.org/img/wn/${item.weather?.[0]?.icon}@2x.png`,
        humidity: item.main?.humidity,
        wind_speed: item.wind?.speed,
        pop: item.pop, // Probability of precipitation
      })),
      updated_at: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Weather error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

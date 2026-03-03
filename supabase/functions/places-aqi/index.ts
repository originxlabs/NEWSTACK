import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AQIRequest {
  lat: number;
  lng: number;
  city?: string;
}

interface AQIResult {
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
    distance?: number;
  };
  message?: string;
  updated_at?: string;
}

// Fetch AQI from OpenAQ v3 API
async function fetchFromOpenAQv3(lat: number, lng: number, apiKey?: string): Promise<AQIResult | null> {
  try {
    console.log("Trying OpenAQ v3 API...");
    
    const headers: Record<string, string> = { 
      "Accept": "application/json",
      "Content-Type": "application/json",
    };
    
    if (apiKey) {
      headers["X-API-Key"] = apiKey;
    }

    // Use v3 API with coordinates
    const locationsUrl = `https://api.openaq.org/v3/locations?coordinates=${lat},${lng}&radius=50000&limit=5&order_by=distance`;
    const locationsResponse = await fetch(locationsUrl, { headers });
    
    if (!locationsResponse.ok) {
      console.warn(`OpenAQ v3 locations error: ${locationsResponse.status}`);
      return null;
    }

    const locationsData = await locationsResponse.json();
    const locations = locationsData.results || [];

    if (locations.length === 0) {
      console.log("OpenAQ v3: No locations found nearby");
      return null;
    }

    const location = locations[0];
    
    // Get latest measurements from v3
    const measurementsUrl = `https://api.openaq.org/v3/locations/${location.id}/sensors`;
    const measurementsResponse = await fetch(measurementsUrl, { headers });
    
    if (!measurementsResponse.ok) {
      console.warn(`OpenAQ v3 measurements error: ${measurementsResponse.status}`);
      // Try to use location data directly
    }

    // Extract measurements from sensors or location data
    let pm25: number | undefined;
    let pm10: number | undefined;
    let no2: number | undefined;
    let o3: number | undefined;
    let co: number | undefined;
    let so2: number | undefined;

    // Try sensors endpoint first
    if (measurementsResponse.ok) {
      const sensorsData = await measurementsResponse.json();
      const sensors = sensorsData.results || [];
      
      for (const sensor of sensors) {
        const param = sensor.parameter?.name?.toLowerCase() || sensor.parameter;
        const value = sensor.latest?.value;
        
        if (param === "pm25" || param === "pm2.5") pm25 = value;
        if (param === "pm10") pm10 = value;
        if (param === "no2") no2 = value;
        if (param === "o3") o3 = value;
        if (param === "co") co = value;
        if (param === "so2") so2 = value;
      }
    }

    // Fallback to location parameters
    if (pm25 === undefined && location.parameters) {
      for (const param of location.parameters) {
        const name = param.parameter?.toLowerCase() || param.name?.toLowerCase();
        const value = param.lastValue || param.value;
        
        if (name === "pm25" || name === "pm2.5") pm25 = value;
        if (name === "pm10") pm10 = value;
        if (name === "no2") no2 = value;
        if (name === "o3") o3 = value;
        if (name === "co") co = value;
        if (name === "so2") so2 = value;
      }
    }

    return buildAQIResult(pm25, pm10, no2, o3, co, so2, location);
  } catch (error) {
    console.error("OpenAQ v3 error:", error);
    return null;
  }
}

// Fetch AQI from OpenAQ v2 API (fallback)
async function fetchFromOpenAQv2(lat: number, lng: number, apiKey?: string): Promise<AQIResult | null> {
  try {
    console.log("Trying OpenAQ v2 API...");
    
    const headers: Record<string, string> = { "Accept": "application/json" };
    if (apiKey) {
      headers["X-API-Key"] = apiKey;
    }

    // Search for nearby locations
    const locationsUrl = `https://api.openaq.org/v2/locations?coordinates=${lat},${lng}&radius=50000&limit=5&order_by=distance`;
    const locationsResponse = await fetch(locationsUrl, { headers });
    
    if (!locationsResponse.ok) {
      console.warn(`OpenAQ v2 error: ${locationsResponse.status}`);
      return null;
    }
    
    const locationsData = await locationsResponse.json();

    if (!locationsData.results || locationsData.results.length === 0) {
      console.log("OpenAQ v2: No locations found nearby");
      return null;
    }

    const location = locationsData.results[0];
    
    // Get latest measurements
    const measurementsUrl = `https://api.openaq.org/v2/latest?location_id=${location.id}&limit=1`;
    const measurementsResponse = await fetch(measurementsUrl, { headers });
    
    if (!measurementsResponse.ok) {
      console.warn(`OpenAQ v2 measurements error: ${measurementsResponse.status}`);
    }
    
    const measurementsData = await measurementsResponse.json();
    const measurements = measurementsData.results?.[0]?.measurements || [];
    
    const pm25 = measurements.find((m: { parameter: string }) => m.parameter === "pm25")?.value;
    const pm10 = measurements.find((m: { parameter: string }) => m.parameter === "pm10")?.value;
    const no2 = measurements.find((m: { parameter: string }) => m.parameter === "no2")?.value;
    const o3 = measurements.find((m: { parameter: string }) => m.parameter === "o3")?.value;
    const co = measurements.find((m: { parameter: string }) => m.parameter === "co")?.value;
    const so2 = measurements.find((m: { parameter: string }) => m.parameter === "so2")?.value;

    return buildAQIResult(pm25, pm10, no2, o3, co, so2, location);
  } catch (error) {
    console.error("OpenAQ v2 error:", error);
    return null;
  }
}

// Fetch AQI from WAQI (World Air Quality Index) - no API key needed
async function fetchFromWAQI(lat: number, lng: number): Promise<AQIResult | null> {
  try {
    console.log("Trying WAQI API...");
    
    // WAQI has a free tier with geo location
    const url = `https://api.waqi.info/feed/geo:${lat};${lng}/?token=demo`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`WAQI error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.status !== "ok" || !data.data) {
      console.log("WAQI: No data available");
      return null;
    }

    const aqi = data.data.aqi;
    const iaqi = data.data.iaqi || {};

    let category = "Unknown";
    let color = "gray";

    if (aqi <= 50) {
      category = "Good";
      color = "green";
    } else if (aqi <= 100) {
      category = "Moderate";
      color = "yellow";
    } else if (aqi <= 150) {
      category = "Unhealthy for Sensitive Groups";
      color = "orange";
    } else if (aqi <= 200) {
      category = "Unhealthy";
      color = "red";
    } else if (aqi <= 300) {
      category = "Very Unhealthy";
      color = "purple";
    } else {
      category = "Hazardous";
      color = "maroon";
    }

    return {
      aqi,
      category,
      color,
      pollutants: {
        pm25: iaqi.pm25 ? { value: iaqi.pm25.v, unit: "µg/m³" } : null,
        pm10: iaqi.pm10 ? { value: iaqi.pm10.v, unit: "µg/m³" } : null,
        no2: iaqi.no2 ? { value: iaqi.no2.v, unit: "µg/m³" } : null,
        o3: iaqi.o3 ? { value: iaqi.o3.v, unit: "µg/m³" } : null,
        co: iaqi.co ? { value: iaqi.co.v, unit: "mg/m³" } : null,
        so2: iaqi.so2 ? { value: iaqi.so2.v, unit: "µg/m³" } : null,
      },
      station: {
        name: data.data.city?.name || "Unknown Station",
        city: data.data.city?.name,
        country: data.data.city?.country,
      },
      updated_at: data.data.time?.iso || new Date().toISOString(),
    };
  } catch (error) {
    console.error("WAQI error:", error);
    return null;
  }
}

function buildAQIResult(
  pm25?: number,
  pm10?: number,
  no2?: number,
  o3?: number,
  co?: number,
  so2?: number,
  location?: { name: string; city?: string; country?: string; distance?: number; lastUpdated?: string }
): AQIResult | null {
  // Calculate AQI from PM2.5 (simplified US EPA formula)
  let aqi = 0;
  let aqiCategory = "Unknown";
  let aqiColor = "gray";

  if (pm25 !== undefined && pm25 !== null) {
    // US EPA AQI calculation for PM2.5
    if (pm25 <= 12) {
      aqi = Math.round((50 / 12) * pm25);
    } else if (pm25 <= 35.4) {
      aqi = Math.round(50 + ((100 - 50) / (35.4 - 12)) * (pm25 - 12));
    } else if (pm25 <= 55.4) {
      aqi = Math.round(100 + ((150 - 100) / (55.4 - 35.4)) * (pm25 - 35.4));
    } else if (pm25 <= 150.4) {
      aqi = Math.round(150 + ((200 - 150) / (150.4 - 55.4)) * (pm25 - 55.4));
    } else if (pm25 <= 250.4) {
      aqi = Math.round(200 + ((300 - 200) / (250.4 - 150.4)) * (pm25 - 150.4));
    } else {
      aqi = Math.round(300 + ((500 - 300) / (500.4 - 250.4)) * (pm25 - 250.4));
    }

    // Determine category
    if (aqi <= 50) {
      aqiCategory = "Good";
      aqiColor = "green";
    } else if (aqi <= 100) {
      aqiCategory = "Moderate";
      aqiColor = "yellow";
    } else if (aqi <= 150) {
      aqiCategory = "Unhealthy for Sensitive Groups";
      aqiColor = "orange";
    } else if (aqi <= 200) {
      aqiCategory = "Unhealthy";
      aqiColor = "red";
    } else if (aqi <= 300) {
      aqiCategory = "Very Unhealthy";
      aqiColor = "purple";
    } else {
      aqiCategory = "Hazardous";
      aqiColor = "maroon";
    }
  } else if (pm10 !== undefined && pm10 !== null) {
    // Fallback to PM10 if PM2.5 not available
    if (pm10 <= 54) {
      aqi = Math.round((50 / 54) * pm10);
    } else if (pm10 <= 154) {
      aqi = Math.round(50 + ((100 - 50) / (154 - 54)) * (pm10 - 54));
    } else if (pm10 <= 254) {
      aqi = Math.round(100 + ((150 - 100) / (254 - 154)) * (pm10 - 154));
    } else {
      aqi = Math.round(150 + ((200 - 150) / (354 - 254)) * (pm10 - 254));
    }

    if (aqi <= 50) {
      aqiCategory = "Good";
      aqiColor = "green";
    } else if (aqi <= 100) {
      aqiCategory = "Moderate";
      aqiColor = "yellow";
    } else if (aqi <= 150) {
      aqiCategory = "Unhealthy for Sensitive Groups";
      aqiColor = "orange";
    } else {
      aqiCategory = "Unhealthy";
      aqiColor = "red";
    }
  } else {
    return null;
  }

  return {
    aqi,
    category: aqiCategory,
    color: aqiColor,
    pollutants: {
      pm25: pm25 !== undefined ? { value: pm25, unit: "µg/m³" } : null,
      pm10: pm10 !== undefined ? { value: pm10, unit: "µg/m³" } : null,
      no2: no2 !== undefined ? { value: no2, unit: "µg/m³" } : null,
      o3: o3 !== undefined ? { value: o3, unit: "µg/m³" } : null,
      co: co !== undefined ? { value: co, unit: "mg/m³" } : null,
      so2: so2 !== undefined ? { value: so2, unit: "µg/m³" } : null,
    },
    station: location ? {
      name: location.name,
      city: location.city,
      country: location.country,
      distance: location.distance,
    } : undefined,
    updated_at: location?.lastUpdated || new Date().toISOString(),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAQ_API_KEY = Deno.env.get("OPENAQ_API_KEY");
    const { lat, lng, city } = await req.json() as AQIRequest;

    if (lat === undefined || lng === undefined) {
      throw new Error("lat and lng are required");
    }

    console.log("Getting AQI for:", lat, lng);

    // Try multiple sources in order of preference
    let result: AQIResult | null = null;

    // Try WAQI first (most reliable, no API key needed)
    result = await fetchFromWAQI(lat, lng);
    if (result) {
      console.log("AQI from WAQI:", result.aqi);
      return new Response(
        JSON.stringify({ ...result, source: "waqi" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try OpenAQ v3
    result = await fetchFromOpenAQv3(lat, lng, OPENAQ_API_KEY);
    if (result) {
      console.log("AQI from OpenAQ v3:", result.aqi);
      return new Response(
        JSON.stringify({ ...result, source: "openaq_v3" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try OpenAQ v2 as fallback
    result = await fetchFromOpenAQv2(lat, lng, OPENAQ_API_KEY);
    if (result) {
      console.log("AQI from OpenAQ v2:", result.aqi);
      return new Response(
        JSON.stringify({ ...result, source: "openaq_v2" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No data available
    console.log("No AQI data available from any source");
    return new Response(
      JSON.stringify({
        aqi: null,
        category: "No Data",
        color: "gray",
        message: "No air quality data available for this location. Data coverage varies by region.",
        source: "none",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("AQI error:", message);
    return new Response(
      JSON.stringify({ error: message, aqi: null, category: "Error", color: "gray" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

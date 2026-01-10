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

    // Try OpenAQ API first
    const headers: Record<string, string> = { "Accept": "application/json" };
    if (OPENAQ_API_KEY) {
      headers["X-API-Key"] = OPENAQ_API_KEY;
    }

    // Search for nearby locations
    const locationsUrl = `https://api.openaq.org/v2/locations?coordinates=${lat},${lng}&radius=25000&limit=5&order_by=distance`;
    const locationsResponse = await fetch(locationsUrl, { headers });
    const locationsData = await locationsResponse.json();

    if (locationsData.results && locationsData.results.length > 0) {
      const location = locationsData.results[0];
      
      // Get latest measurements
      const measurementsUrl = `https://api.openaq.org/v2/latest?location_id=${location.id}&limit=1`;
      const measurementsResponse = await fetch(measurementsUrl, { headers });
      const measurementsData = await measurementsResponse.json();

      const measurements = measurementsData.results?.[0]?.measurements || [];
      
      // Calculate AQI from PM2.5 (simplified US EPA formula)
      const pm25 = measurements.find((m: any) => m.parameter === "pm25")?.value;
      const pm10 = measurements.find((m: any) => m.parameter === "pm10")?.value;
      const no2 = measurements.find((m: any) => m.parameter === "no2")?.value;
      const o3 = measurements.find((m: any) => m.parameter === "o3")?.value;
      const co = measurements.find((m: any) => m.parameter === "co")?.value;

      let aqi = 0;
      let aqiCategory = "Unknown";
      let aqiColor = "gray";

      if (pm25 !== undefined) {
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

      const result = {
        aqi,
        category: aqiCategory,
        color: aqiColor,
        pollutants: {
          pm25: pm25 !== undefined ? { value: pm25, unit: "µg/m³" } : null,
          pm10: pm10 !== undefined ? { value: pm10, unit: "µg/m³" } : null,
          no2: no2 !== undefined ? { value: no2, unit: "µg/m³" } : null,
          o3: o3 !== undefined ? { value: o3, unit: "µg/m³" } : null,
          co: co !== undefined ? { value: co, unit: "mg/m³" } : null,
        },
        station: {
          name: location.name,
          city: location.city,
          country: location.country,
          distance: location.distance,
        },
        updated_at: location.lastUpdated || new Date().toISOString(),
      };

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No data available
    return new Response(
      JSON.stringify({
        aqi: null,
        category: "No Data",
        color: "gray",
        message: "No air quality data available for this location",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("AQI error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

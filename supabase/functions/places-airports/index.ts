import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AirportsRequest {
  lat: number;
  lng: number;
  city?: string;
}

// Calculate distance between two points using Haversine formula
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AVIATIONSTACK_API_KEY = Deno.env.get("AVIATIONSTACK_API_KEY");
    const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
    
    const { lat, lng, city } = await req.json() as AirportsRequest;

    if (lat === undefined || lng === undefined) {
      throw new Error("lat and lng are required");
    }

    console.log("Finding airports near:", lat, lng);

    // Use Google Places to find nearby airports if Aviationstack is not available
    if (GOOGLE_PLACES_API_KEY) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=100000&type=airport&key=${GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results?.length > 0) {
        const airports = data.results.slice(0, 5).map((airport: any) => {
          const airportLat = airport.geometry?.location?.lat;
          const airportLng = airport.geometry?.location?.lng;
          const distance = getDistance(lat, lng, airportLat, airportLng);

          return {
            name: airport.name,
            place_id: airport.place_id,
            lat: airportLat,
            lng: airportLng,
            distance_km: Math.round(distance * 10) / 10,
            vicinity: airport.vicinity,
            rating: airport.rating,
          };
        }).sort((a: any, b: any) => a.distance_km - b.distance_km);

        return new Response(
          JSON.stringify({ airports }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fallback: try Aviationstack
    if (AVIATIONSTACK_API_KEY && city) {
      const url = `http://api.aviationstack.com/v1/airports?access_key=${AVIATIONSTACK_API_KEY}&search=${encodeURIComponent(city)}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const airports = data.data.slice(0, 5).map((airport: any) => {
          const distance = getDistance(lat, lng, airport.latitude, airport.longitude);
          return {
            name: airport.airport_name,
            iata_code: airport.iata_code,
            icao_code: airport.icao_code,
            city: airport.city_iata_code,
            country: airport.country_name,
            lat: airport.latitude,
            lng: airport.longitude,
            distance_km: Math.round(distance * 10) / 10,
            timezone: airport.timezone,
          };
        }).sort((a: any, b: any) => a.distance_km - b.distance_km);

        return new Response(
          JSON.stringify({ airports }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ airports: [], message: "No airports found nearby" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Airports error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

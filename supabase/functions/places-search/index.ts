import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PlaceSearchRequest {
  query: string;
  lat?: number;
  lng?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error("GOOGLE_PLACES_API_KEY not configured");
    }

    const { query, lat, lng } = await req.json() as PlaceSearchRequest;

    if (!query || query.trim().length === 0) {
      throw new Error("Query is required");
    }

    // Use Google Places Text Search API
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;
    
    if (lat && lng) {
      url += `&location=${lat},${lng}&radius=50000`;
    }

    console.log("Places search for:", query);

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places error:", data);
      throw new Error(data.error_message || `Places API error: ${data.status}`);
    }

    // Transform results
    const places = (data.results || []).slice(0, 10).map((place: any) => ({
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      types: place.types,
      photo_reference: place.photos?.[0]?.photo_reference,
      icon: place.icon,
      business_status: place.business_status,
    }));

    return new Response(
      JSON.stringify({ places, status: data.status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Places search error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

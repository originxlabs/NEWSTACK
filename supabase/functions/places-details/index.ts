import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PlaceDetailsRequest {
  place_id: string;
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

    const { place_id } = await req.json() as PlaceDetailsRequest;

    if (!place_id) {
      throw new Error("place_id is required");
    }

    const fields = [
      "place_id", "name", "formatted_address", "formatted_phone_number",
      "website", "url", "rating", "user_ratings_total", "reviews",
      "geometry", "photos", "types", "opening_hours", "price_level",
      "vicinity", "address_components", "utc_offset"
    ].join(",");

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=${fields}&key=${GOOGLE_PLACES_API_KEY}`;

    console.log("Getting place details for:", place_id);

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Google Places details error:", data);
      throw new Error(data.error_message || `Places API error: ${data.status}`);
    }

    const place = data.result;

    // Get photo URLs
    const photos = (place.photos || []).slice(0, 5).map((photo: any) => ({
      url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`,
      width: photo.width,
      height: photo.height,
      attributions: photo.html_attributions,
    }));

    const result = {
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      phone: place.formatted_phone_number,
      website: place.website,
      google_maps_url: place.url,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      price_level: place.price_level,
      types: place.types,
      opening_hours: place.opening_hours,
      photos,
      reviews: (place.reviews || []).slice(0, 5).map((review: any) => ({
        author: review.author_name,
        rating: review.rating,
        text: review.text,
        time: review.relative_time_description,
        profile_photo: review.profile_photo_url,
      })),
      address_components: place.address_components,
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Place details error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

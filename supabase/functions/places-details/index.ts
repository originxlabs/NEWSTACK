import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PlaceDetailsRequest {
  place_id: string;
  osm_id?: number;
  osm_type?: string;
  lat?: number;
  lng?: number;
  name?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { place_id, osm_id, osm_type, lat, lng, name } = (await req.json()) as PlaceDetailsRequest;

    if (!place_id) {
      throw new Error("place_id is required");
    }

    console.log("Fetching OSM details for:", { place_id, osm_id, osm_type });

    // Prefer lookup by OSM id if present (more stable than Nominatim place_id)
    let placeDetails: any = null;

    // Nominatim lookup uses prefixed IDs: N/W/R + osm_id
    if (osm_id && osm_type) {
      const prefix = osm_type === "node" ? "N" : osm_type === "way" ? "W" : "R";
      const lookupUrl = `https://nominatim.openstreetmap.org/lookup?osm_ids=${prefix}${osm_id}&format=json&addressdetails=1&extratags=1&namedetails=1`;

      const response = await fetch(lookupUrl, {
        headers: {
          "User-Agent": "NEWSTACK/1.0 (contact@newstack.live)",
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) placeDetails = data[0];
      }
    }

    // If lookup fails and we have coords, reverse geocode
    if (!placeDetails && typeof lat === "number" && typeof lng === "number") {
      const reverseUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&extratags=1&namedetails=1`;
      const response = await fetch(reverseUrl, {
        headers: {
          "User-Agent": "NEWSTACK/1.0 (contact@newstack.live)",
          Accept: "application/json",
        },
      });
      if (response.ok) placeDetails = await response.json();
    }

    // Minimal fallback
    if (!placeDetails) {
      return new Response(
        JSON.stringify({
          place_id,
          osm_id,
          osm_type,
          name: name || "Unknown Place",
          formatted_address: "",
          lat: lat ?? 0,
          lng: lng ?? 0,
          types: [],
          photos: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resolvedName =
      placeDetails.name ||
      placeDetails.namedetails?.name ||
      placeDetails.display_name?.split(",")[0] ||
      name ||
      "Unknown Place";

    const country = placeDetails.address?.country;

    const photos = await getPlacePhotos(resolvedName, country);

    const details = {
      place_id: (placeDetails.place_id ?? place_id).toString(),
      osm_id: placeDetails.osm_id ?? osm_id,
      osm_type: placeDetails.osm_type ?? osm_type,
      name: resolvedName,
      formatted_address: placeDetails.display_name || "",
      lat: parseFloat(placeDetails.lat) || lat,
      lng: parseFloat(placeDetails.lon) || lng,
      country,
      country_code: placeDetails.address?.country_code?.toUpperCase(),
      state: placeDetails.address?.state,
      city: placeDetails.address?.city || placeDetails.address?.town || placeDetails.address?.village,
      types: [placeDetails.type, placeDetails.class].filter(Boolean),
      importance: placeDetails.importance,
      website: placeDetails.extratags?.website || placeDetails.extratags?.url,
      email: placeDetails.extratags?.email,
      phone: placeDetails.extratags?.phone,
      wikipedia: placeDetails.extratags?.wikipedia,
      opening_hours: placeDetails.extratags?.opening_hours
        ? { weekday_text: [placeDetails.extratags.opening_hours] }
        : undefined,
      photos,
      boundingbox: placeDetails.boundingbox,
    };

    return new Response(JSON.stringify(details), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Place details error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function getPlacePhotos(
  placeName: string,
  country?: string
): Promise<Array<{ url: string; width: number; height: number }>> {
  // No API key: use Unsplash Source (random by query).
  const q = encodeURIComponent(`${placeName} ${country || ""} landmark city travel`);
  return [
    { url: `https://source.unsplash.com/1600x900/?${q}`, width: 1600, height: 900 },
    { url: `https://source.unsplash.com/1200x800/?${q},street`, width: 1200, height: 800 },
  ];
}

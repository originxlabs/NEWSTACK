import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PlaceSearchRequest {
  query: string;
  lat?: number;
  lng?: number;
  countryCode?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, lat, lng, countryCode } = await req.json() as PlaceSearchRequest;

    if (!query || query.trim().length === 0) {
      throw new Error("Query is required");
    }

    // Use Nominatim API (OpenStreetMap)
    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=10&extratags=1`;
    
    if (countryCode) {
      url += `&countrycodes=${countryCode}`;
    }
    
    if (lat && lng) {
      // Add viewbox for location bias (50km radius)
      const delta = 0.5; // roughly 50km
      url += `&viewbox=${lng - delta},${lat + delta},${lng + delta},${lat - delta}&bounded=0`;
    }

    console.log("Nominatim search for:", query);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "NEWSTACK/1.0 (contact@newstack.live)",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform Nominatim results to our format
    const places = data.map((place: any) => ({
      place_id: place.place_id.toString(),
      osm_id: place.osm_id,
      osm_type: place.osm_type,
      name: place.name || place.display_name.split(",")[0],
      formatted_address: place.display_name,
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      types: [place.type, place.class].filter(Boolean),
      importance: place.importance,
      country: place.address?.country,
      country_code: place.address?.country_code?.toUpperCase(),
      state: place.address?.state,
      city: place.address?.city || place.address?.town || place.address?.village,
      category: getCategoryFromType(place.type, place.class),
    }));

    return new Response(
      JSON.stringify({ places, status: "OK" }),
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

function getCategoryFromType(type: string, osmClass: string): string {
  const typeMap: Record<string, string> = {
    city: "City",
    town: "Town",
    village: "Village",
    suburb: "Neighborhood",
    neighbourhood: "Neighborhood",
    administrative: "Region",
    country: "Country",
    state: "State",
    county: "County",
    attraction: "Attraction",
    museum: "Museum",
    beach: "Beach",
    park: "Park",
    hotel: "Hotel",
    restaurant: "Restaurant",
    cafe: "Cafe",
    airport: "Airport",
    station: "Station",
  };

  return typeMap[type] || typeMap[osmClass] || "Place";
}

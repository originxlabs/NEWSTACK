import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NearbyRequest {
  lat: number;
  lng: number;
  type?: string; // tourist_attraction, restaurant, lodging, cafe, hospital, airport, station
  radius?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lng, type = "tourist_attraction", radius = 5000 } = (await req.json()) as NearbyRequest;

    if (typeof lat !== "number" || typeof lng !== "number") {
      throw new Error("lat and lng are required");
    }

    console.log("Overpass nearby:", { lat, lng, type, radius });

    const osmTags = getOSMTags(type);
    const overpassQuery = buildOverpassQuery(lat, lng, osmTags, radius);

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();

    const places = (data.elements || [])
      .filter((el: any) => el.tags?.name)
      .slice(0, 15)
      .map((el: any) => {
        const placeLat = el.lat ?? el.center?.lat;
        const placeLng = el.lon ?? el.center?.lon;
        const distance_km =
          typeof placeLat === "number" && typeof placeLng === "number"
            ? calculateDistance(lat, lng, placeLat, placeLng)
            : undefined;

        return {
          place_id: `osm_${el.type}_${el.id}`,
          osm_id: el.id,
          osm_type: el.type,
          name: el.tags.name,
          vicinity: formatVicinity(el.tags),
          lat: placeLat,
          lng: placeLng,
          distance_km,
          category: el.tags.tourism || el.tags.amenity || el.tags.leisure || el.tags.historic || type,
          rating: el.tags.stars ? parseFloat(el.tags.stars) : undefined,
          website: el.tags.website,
          phone: el.tags.phone,
          cuisine: el.tags.cuisine,
          opening_hours: el.tags.opening_hours,
        };
      })
      .sort((a: any, b: any) => (a.distance_km ?? 999) - (b.distance_km ?? 999));

    return new Response(JSON.stringify({ places, type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Nearby places error:", message);
    // Graceful failure: return empty list with 200 so UI can continue.
    return new Response(JSON.stringify({ places: [], error: message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getOSMTags(type: string): string[] {
  const tagMap: Record<string, string[]> = {
    tourist_attraction: [
      "tourism=attraction",
      "tourism=museum",
      "tourism=viewpoint",
      "tourism=artwork",
      "historic=monument",
      "historic=castle",
      "historic=ruins",
      "leisure=park",
      "leisure=garden",
      "amenity=place_of_worship",
    ],
    restaurant: ["amenity=restaurant", "amenity=fast_food", "amenity=food_court"],
    cafe: ["amenity=cafe", "amenity=ice_cream"],
    lodging: [
      "tourism=hotel",
      "tourism=hostel",
      "tourism=motel",
      "tourism=guest_house",
      "tourism=apartment",
    ],
    hospital: ["amenity=hospital", "amenity=clinic", "amenity=doctors"],
    airport: ["aeroway=aerodrome"],
    station: ["railway=station", "public_transport=station", "amenity=bus_station"],
  };

  return tagMap[type] || [`tourism=${type}`, `amenity=${type}`];
}

function buildOverpassQuery(lat: number, lng: number, tags: string[], radius: number): string {
  const tagFilters = tags
    .map((tag) => {
      const [key, value] = tag.split("=");
      return `node["${key}"="${value}"](around:${radius},${lat},${lng});\nway["${key}"="${value}"](around:${radius},${lat},${lng});`;
    })
    .join("\n");

  return `
[out:json][timeout:25];
(
${tagFilters}
);
out center;
`;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function formatVicinity(tags: Record<string, string>): string {
  const street = tags["addr:street"];
  const city = tags["addr:city"] || tags["addr:town"] || tags["addr:village"];
  const suburb = tags["addr:suburb"];
  return [street, suburb, city].filter(Boolean).join(", ");
}

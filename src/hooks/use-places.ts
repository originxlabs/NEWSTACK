import { useState, useCallback } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface Place {
  place_id: string;
  osm_id?: number;
  osm_type?: string;
  name: string;
  formatted_address?: string;
  lat: number;
  lng: number;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  photo_reference?: string;
  country?: string;
  country_code?: string;
  state?: string;
  city?: string;
  category?: string;
  importance?: number;
}

interface PlaceDetails {
  place_id: string;
  osm_id?: number;
  osm_type?: string;
  name: string;
  formatted_address: string;
  phone?: string;
  website?: string;
  email?: string;
  wikipedia?: string;
  lat: number;
  lng: number;
  country?: string;
  country_code?: string;
  state?: string;
  city?: string;
  types?: string[];
  importance?: number;
  opening_hours?: {
    weekday_text?: string[];
  };
  photos?: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  boundingbox?: string[];
}

interface Weather {
  current: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
    wind_speed: number;
    condition: string;
    description: string;
    icon_url: string;
    city: string;
    country: string;
  };
  forecast: Array<{
    dt: number;
    temp: number;
    condition: string;
    icon_url: string;
  }>;
}

interface AQI {
  aqi: number | null;
  category: string;
  color: string;
  pollutants?: {
    pm25?: { value: number; unit: string };
    pm10?: { value: number; unit: string };
  };
  station?: {
    name: string;
    distance: number;
  };
}

interface NearbyPlace {
  place_id: string;
  osm_id?: number;
  osm_type?: string;
  name: string;
  vicinity: string;
  lat: number;
  lng: number;
  distance_km?: number;
  category?: string;
  rating?: number;
  website?: string;
  phone?: string;
  cuisine?: string;
  opening_hours?: string;
}

interface Airport {
  name: string;
  place_id?: string;
  iata_code?: string;
  lat: number;
  lng: number;
  distance_km: number;
}

interface AISummary {
  hook: string;
  bestTime: string;
  idealFor: string;
  avoidIf: string;
  insiderTip: string;
}

export interface PlaceData {
  place: PlaceDetails | null;
  weather: Weather | null;
  aqi: AQI | null;
  nearbyAttractions: NearbyPlace[];
  nearbyRestaurants: NearbyPlace[];
  nearbyHotels: NearbyPlace[];
  airports: Airport[];
  aiSummary: AISummary | null;
}

export function usePlaces() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [placeData, setPlaceData] = useState<PlaceData>({
    place: null,
    weather: null,
    aqi: null,
    nearbyAttractions: [],
    nearbyRestaurants: [],
    nearbyHotels: [],
    airports: [],
    aiSummary: null,
  });

  const fetchAPI = async (endpoint: string, body: object) => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `API error: ${response.status}`);
    }

    return response.json();
  };

  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const data = await fetchAPI("places-search", { query });
      setSearchResults(data.places || []);
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "Search failed");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const selectPlace = useCallback(async (placeId: string, searchResult?: Place) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get place details - pass extra info if we have it from search
      const detailsBody: any = { place_id: placeId };
      if (searchResult) {
        detailsBody.osm_id = searchResult.osm_id;
        detailsBody.osm_type = searchResult.osm_type;
        detailsBody.lat = searchResult.lat;
        detailsBody.lng = searchResult.lng;
        detailsBody.name = searchResult.name;
      }
      
      const details = await fetchAPI("places-details", detailsBody);
      const lat = details.lat;
      const lng = details.lng;

      setPlaceData((prev) => ({ ...prev, place: details }));

      // Fetch all other data in parallel
      const [
        weatherData,
        aqiData,
        attractionsData,
        restaurantsData,
        hotelsData,
        airportsData,
      ] = await Promise.allSettled([
        fetchAPI("places-weather", { lat, lng }),
        fetchAPI("places-aqi", { lat, lng }),
        fetchAPI("places-nearby", { lat, lng, type: "tourist_attraction" }),
        fetchAPI("places-nearby", { lat, lng, type: "restaurant" }),
        fetchAPI("places-nearby", { lat, lng, type: "lodging" }),
        fetchAPI("places-airports", { lat, lng, city: details.name }),
      ]);

      const weather = weatherData.status === "fulfilled" ? weatherData.value : null;
      const aqi = aqiData.status === "fulfilled" ? aqiData.value : null;
      const attractions = attractionsData.status === "fulfilled" ? attractionsData.value.places : [];
      const restaurants = restaurantsData.status === "fulfilled" ? restaurantsData.value.places : [];
      const hotels = hotelsData.status === "fulfilled" ? hotelsData.value.places : [];
      const airports = airportsData.status === "fulfilled" ? airportsData.value.airports : [];

      setPlaceData({
        place: details,
        weather,
        aqi,
        nearbyAttractions: attractions,
        nearbyRestaurants: restaurants,
        nearbyHotels: hotels,
        airports,
        aiSummary: null,
      });

      // Fetch AI summary in background
      try {
        const aiSummary = await fetchAPI("places-ai-summary", {
          place_name: details.name,
          country: details.country,
          weather: weather?.current ? { temp: weather.current.temp, condition: weather.current.condition } : undefined,
          aqi: aqi?.aqi,
          attractions: attractions.slice(0, 5).map((a: NearbyPlace) => a.name),
        });

        setPlaceData((prev) => ({ ...prev, aiSummary }));
      } catch (aiErr) {
        console.log("AI summary failed:", aiErr);
      }
    } catch (err) {
      console.error("Place selection error:", err);
      setError(err instanceof Error ? err.message : "Failed to load place");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearPlace = useCallback(() => {
    setPlaceData({
      place: null,
      weather: null,
      aqi: null,
      nearbyAttractions: [],
      nearbyRestaurants: [],
      nearbyHotels: [],
      airports: [],
      aiSummary: null,
    });
    setSearchResults([]);
  }, []);

  const openInMaps = useCallback((lat: number, lng: number, provider: "google" | "apple" | "mapmyindia" = "google") => {
    let url = "";
    
    switch (provider) {
      case "apple":
        url = `https://maps.apple.com/?ll=${lat},${lng}&z=15`;
        break;
      case "mapmyindia":
        url = `https://maps.mapmyindia.com/direction?lat=${lat}&lng=${lng}&zoom=15`;
        break;
      case "google":
      default:
        url = `https://www.google.com/maps?q=${lat},${lng}`;
        break;
    }
    
    window.open(url, "_blank");
  }, []);

  return {
    searchPlaces,
    selectPlace,
    clearPlace,
    openInMaps,
    searchResults,
    placeData,
    isLoading,
    isSearching,
    error,
  };
}

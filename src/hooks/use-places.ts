import { useState, useCallback } from "react";
import {
  getCachedPlaceDetails,
  setCachedPlaceDetails,
  getCachedWeather,
  setCachedWeather,
  getCachedAQI,
  setCachedAQI,
  getCachedNearby,
  setCachedNearby,
  getCachedAirports,
  setCachedAirports,
  getCachedAISummary,
  setCachedAISummary,
  getCachedSearch,
  setCachedSearch,
} from "@/lib/places-cache";

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
  fetchedAt?: number;
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
  fetchedAt?: number;
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
  dataFreshness?: {
    weather?: boolean;
    aqi?: boolean;
    nearby?: boolean;
  };
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
    dataFreshness: {},
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

    // Check cache first
    const cached = getCachedSearch(query);
    if (cached?.isFresh) {
      setSearchResults(cached.data as Place[]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const data = await fetchAPI("places-search", { query });
      const places = data.places || [];
      setSearchResults(places);
      setCachedSearch(query, places);
    } catch (err) {
      console.error("Search error:", err);
      // Return cached data even if stale
      if (cached?.data) {
        setSearchResults(cached.data as Place[]);
      } else {
        setError(err instanceof Error ? err.message : "Search failed");
        setSearchResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  const selectPlace = useCallback(async (placeId: string, searchResult?: Place) => {
    setIsLoading(true);
    setError(null);

    const lat = searchResult?.lat;
    const lng = searchResult?.lng;
    const placeName = searchResult?.name || placeId;

    try {
      // Check if we have cached place details
      const cachedDetails = getCachedPlaceDetails(placeId);
      let details: PlaceDetails;
      
      if (cachedDetails?.isFresh) {
        details = cachedDetails.data as PlaceDetails;
        setPlaceData((prev) => ({ ...prev, place: details }));
      } else {
        // Fetch fresh details
        const detailsBody: Record<string, unknown> = { place_id: placeId };
        if (searchResult) {
          detailsBody.osm_id = searchResult.osm_id;
          detailsBody.osm_type = searchResult.osm_type;
          detailsBody.lat = searchResult.lat;
          detailsBody.lng = searchResult.lng;
          detailsBody.name = searchResult.name;
        }
        
        details = await fetchAPI("places-details", detailsBody);
        setCachedPlaceDetails(placeId, details);
        setPlaceData((prev) => ({ ...prev, place: details }));
      }

      const finalLat = details.lat || lat;
      const finalLng = details.lng || lng;

      if (!finalLat || !finalLng) {
        throw new Error("Could not determine location coordinates");
      }

      // Check caches for all data types
      const cachedWeather = getCachedWeather(finalLat, finalLng);
      const cachedAqi = getCachedAQI(finalLat, finalLng);
      const cachedAttractions = getCachedNearby(finalLat, finalLng, "tourist_attraction");
      const cachedRestaurants = getCachedNearby(finalLat, finalLng, "restaurant");
      const cachedHotels = getCachedNearby(finalLat, finalLng, "lodging");
      const cachedAirports = getCachedAirports(finalLat, finalLng);
      const cachedAI = getCachedAISummary(placeName);

      // Update with cached data immediately
      setPlaceData((prev) => ({
        ...prev,
        place: details,
        weather: cachedWeather?.data as Weather || null,
        aqi: cachedAqi?.data as AQI || null,
        nearbyAttractions: (cachedAttractions?.data as NearbyPlace[]) || [],
        nearbyRestaurants: (cachedRestaurants?.data as NearbyPlace[]) || [],
        nearbyHotels: (cachedHotels?.data as NearbyPlace[]) || [],
        airports: (cachedAirports?.data as Airport[]) || [],
        aiSummary: cachedAI?.data as AISummary || null,
        dataFreshness: {
          weather: cachedWeather?.isFresh,
          aqi: cachedAqi?.isFresh,
          nearby: cachedAttractions?.isFresh,
        },
      }));

      // Fetch fresh data in parallel (only for stale or missing data)
      const fetchPromises: Promise<void>[] = [];

      if (!cachedWeather?.isFresh) {
        fetchPromises.push(
          fetchAPI("places-weather", { lat: finalLat, lng: finalLng })
            .then((data) => {
              const weatherData = { ...data, fetchedAt: Date.now() };
              setCachedWeather(finalLat, finalLng, weatherData);
              setPlaceData((prev) => ({ 
                ...prev, 
                weather: weatherData as Weather,
                dataFreshness: { ...prev.dataFreshness, weather: true }
              }));
            })
            .catch((err) => console.error("Weather fetch failed:", err))
        );
      }

      if (!cachedAqi?.isFresh) {
        fetchPromises.push(
          fetchAPI("places-aqi", { lat: finalLat, lng: finalLng })
            .then((data) => {
              const aqiData = { ...data, fetchedAt: Date.now() };
              setCachedAQI(finalLat, finalLng, aqiData);
              setPlaceData((prev) => ({ 
                ...prev, 
                aqi: aqiData as AQI,
                dataFreshness: { ...prev.dataFreshness, aqi: true }
              }));
            })
            .catch((err) => console.error("AQI fetch failed:", err))
        );
      }

      if (!cachedAttractions?.isFresh) {
        fetchPromises.push(
          fetchAPI("places-nearby", { lat: finalLat, lng: finalLng, type: "tourist_attraction" })
            .then((data) => {
              setCachedNearby(finalLat, finalLng, "tourist_attraction", data.places || []);
              setPlaceData((prev) => ({ 
                ...prev, 
                nearbyAttractions: data.places || [],
                dataFreshness: { ...prev.dataFreshness, nearby: true }
              }));
            })
            .catch((err) => console.error("Attractions fetch failed:", err))
        );
      }

      if (!cachedRestaurants?.isFresh) {
        fetchPromises.push(
          fetchAPI("places-nearby", { lat: finalLat, lng: finalLng, type: "restaurant" })
            .then((data) => {
              setCachedNearby(finalLat, finalLng, "restaurant", data.places || []);
              setPlaceData((prev) => ({ ...prev, nearbyRestaurants: data.places || [] }));
            })
            .catch((err) => console.error("Restaurants fetch failed:", err))
        );
      }

      if (!cachedHotels?.isFresh) {
        fetchPromises.push(
          fetchAPI("places-nearby", { lat: finalLat, lng: finalLng, type: "lodging" })
            .then((data) => {
              setCachedNearby(finalLat, finalLng, "lodging", data.places || []);
              setPlaceData((prev) => ({ ...prev, nearbyHotels: data.places || [] }));
            })
            .catch((err) => console.error("Hotels fetch failed:", err))
        );
      }

      if (!cachedAirports?.isFresh) {
        fetchPromises.push(
          fetchAPI("places-airports", { lat: finalLat, lng: finalLng, city: details.name })
            .then((data) => {
              setCachedAirports(finalLat, finalLng, data.airports || []);
              setPlaceData((prev) => ({ ...prev, airports: data.airports || [] }));
            })
            .catch((err) => console.error("Airports fetch failed:", err))
        );
      }

      // Wait for all fetches
      await Promise.allSettled(fetchPromises);

      // Fetch AI summary if not cached
      if (!cachedAI?.isFresh) {
        try {
          const currentData = placeData;
          const aiSummary = await fetchAPI("places-ai-summary", {
            place_name: details.name,
            country: details.country,
            weather: currentData.weather?.current 
              ? { temp: currentData.weather.current.temp, condition: currentData.weather.current.condition } 
              : undefined,
            aqi: currentData.aqi?.aqi,
            attractions: currentData.nearbyAttractions.slice(0, 5).map((a) => a.name),
          });
          
          setCachedAISummary(placeName, aiSummary);
          setPlaceData((prev) => ({ ...prev, aiSummary }));
        } catch (aiErr) {
          console.log("AI summary failed:", aiErr);
        }
      }
    } catch (err) {
      console.error("Place selection error:", err);
      setError(err instanceof Error ? err.message : "Failed to load place");
    } finally {
      setIsLoading(false);
    }
  }, [placeData]);

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
      dataFreshness: {},
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
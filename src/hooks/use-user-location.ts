import { useState, useEffect, useCallback } from "react";
import { 
  findLocationByCoordinates, 
  getContinentById, 
  getCountryByCode,
  Continent,
  Country 
} from "@/lib/geo-hierarchy";

interface UserLocation {
  latitude: number;
  longitude: number;
  countryCode?: string;
  country?: Country;
  continent?: Continent;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation>({
    latitude: 0,
    longitude: 0,
    isLoading: true,
    error: null,
    hasPermission: false,
  });

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        isLoading: false,
        error: "Geolocation is not supported by your browser",
      }));
      return;
    }

    setLocation(prev => ({ ...prev, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const geoMatch = findLocationByCoordinates(latitude, longitude);
        
        setLocation({
          latitude,
          longitude,
          countryCode: geoMatch?.countryCode,
          country: geoMatch?.country,
          continent: geoMatch?.continent,
          isLoading: false,
          error: null,
          hasPermission: true,
        });
      },
      (error) => {
        let errorMessage = "Unable to get your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        
        setLocation(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
          hasPermission: false,
        }));
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  }, []);

  useEffect(() => {
    // Check if we have a cached location in localStorage
    const cached = localStorage.getItem("user-location");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const cachedTime = parsed.timestamp || 0;
        const now = Date.now();
        
        // Use cached location if less than 1 hour old
        if (now - cachedTime < 3600000) {
          const geoMatch = findLocationByCoordinates(parsed.latitude, parsed.longitude);
          setLocation({
            latitude: parsed.latitude,
            longitude: parsed.longitude,
            countryCode: geoMatch?.countryCode,
            country: geoMatch?.country,
            continent: geoMatch?.continent,
            isLoading: false,
            error: null,
            hasPermission: true,
          });
          return;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    detectLocation();
  }, [detectLocation]);

  // Save location to cache when successfully detected
  useEffect(() => {
    if (location.hasPermission && location.latitude && location.longitude) {
      localStorage.setItem("user-location", JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: Date.now(),
      }));
    }
  }, [location.hasPermission, location.latitude, location.longitude]);

  return { ...location, refreshLocation: detectLocation };
}

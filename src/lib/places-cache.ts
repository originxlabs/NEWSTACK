// Heavy caching layer for Places data with localStorage and IndexedDB support
// Provides offline support for PWA and mobile browsers

const CACHE_PREFIX = "newstack_places_";
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes for live data
const STATIC_CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours for static data

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Check if localStorage is available
function isLocalStorageAvailable(): boolean {
  try {
    const test = "__test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

// Get cached data from localStorage
export function getCached<T>(key: string): { data: T; isFresh: boolean } | null {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;
    
    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();
    
    // Return data even if expired (stale-while-revalidate pattern)
    return {
      data: entry.data,
      isFresh: now < entry.expiresAt,
    };
  } catch (error) {
    console.error("Cache read error:", error);
    return null;
  }
}

// Set cached data to localStorage
export function setCache<T>(key: string, data: T, durationMs: number = CACHE_DURATION_MS): void {
  if (!isLocalStorageAvailable()) return;
  
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + durationMs,
    };
    
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (error) {
    // Handle quota exceeded - clear old entries
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      clearOldCache();
      try {
        const entry: CacheEntry<T> = {
          data,
          timestamp: Date.now(),
          expiresAt: Date.now() + durationMs,
        };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
      } catch {
        console.error("Cache write failed after cleanup");
      }
    }
  }
}

// Clear old cache entries
export function clearOldCache(): void {
  if (!isLocalStorageAvailable()) return;
  
  const now = Date.now();
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(CACHE_PREFIX)) continue;
    
    try {
      const cached = localStorage.getItem(key);
      if (!cached) continue;
      
      const entry = JSON.parse(cached);
      // Remove entries older than 48 hours
      if (now - entry.timestamp > 48 * 60 * 60 * 1000) {
        keysToRemove.push(key);
      }
    } catch {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

// Generate cache key from params
export function generateCacheKey(endpoint: string, params: object): string {
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return `${endpoint}:${sortedParams}`;
}

// Cache for place searches
export function getCachedSearch(query: string) {
  return getCached<unknown[]>(`search:${query.toLowerCase()}`);
}

export function setCachedSearch(query: string, results: unknown[]) {
  setCache(`search:${query.toLowerCase()}`, results, CACHE_DURATION_MS);
}

// Cache for place details
export function getCachedPlaceDetails(placeId: string) {
  return getCached<unknown>(`details:${placeId}`);
}

export function setCachedPlaceDetails(placeId: string, details: unknown) {
  setCache(`details:${placeId}`, details, STATIC_CACHE_DURATION_MS);
}

// Cache for weather data
export function getCachedWeather(lat: number, lng: number) {
  const key = `weather:${lat.toFixed(2)},${lng.toFixed(2)}`;
  return getCached<unknown>(key);
}

export function setCachedWeather(lat: number, lng: number, data: unknown) {
  const key = `weather:${lat.toFixed(2)},${lng.toFixed(2)}`;
  setCache(key, data, 15 * 60 * 1000); // 15 minutes for weather
}

// Cache for AQI data
export function getCachedAQI(lat: number, lng: number) {
  const key = `aqi:${lat.toFixed(2)},${lng.toFixed(2)}`;
  return getCached<unknown>(key);
}

export function setCachedAQI(lat: number, lng: number, data: unknown) {
  const key = `aqi:${lat.toFixed(2)},${lng.toFixed(2)}`;
  setCache(key, data, 30 * 60 * 1000); // 30 minutes for AQI
}

// Cache for nearby places
export function getCachedNearby(lat: number, lng: number, type: string) {
  const key = `nearby:${type}:${lat.toFixed(2)},${lng.toFixed(2)}`;
  return getCached<unknown[]>(key);
}

export function setCachedNearby(lat: number, lng: number, type: string, data: unknown[]) {
  const key = `nearby:${type}:${lat.toFixed(2)},${lng.toFixed(2)}`;
  setCache(key, data, STATIC_CACHE_DURATION_MS);
}

// Cache for airports
export function getCachedAirports(lat: number, lng: number) {
  const key = `airports:${lat.toFixed(1)},${lng.toFixed(1)}`;
  return getCached<unknown[]>(key);
}

export function setCachedAirports(lat: number, lng: number, data: unknown[]) {
  const key = `airports:${lat.toFixed(1)},${lng.toFixed(1)}`;
  setCache(key, data, STATIC_CACHE_DURATION_MS);
}

// Cache for AI summaries
export function getCachedAISummary(placeName: string) {
  const key = `ai:${placeName.toLowerCase().replace(/\s+/g, "-")}`;
  return getCached<unknown>(key);
}

export function setCachedAISummary(placeName: string, data: unknown) {
  const key = `ai:${placeName.toLowerCase().replace(/\s+/g, "-")}`;
  setCache(key, data, STATIC_CACHE_DURATION_MS);
}

// Get cache stats
export function getCacheStats(): { count: number; sizeKB: number } {
  if (!isLocalStorageAvailable()) return { count: 0, sizeKB: 0 };
  
  let count = 0;
  let totalSize = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(CACHE_PREFIX)) continue;
    
    count++;
    const value = localStorage.getItem(key);
    if (value) totalSize += value.length * 2; // UTF-16 characters
  }
  
  return { count, sizeKB: Math.round(totalSize / 1024) };
}

// Clear all places cache
export function clearAllCache(): void {
  if (!isLocalStorageAvailable()) return;
  
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}
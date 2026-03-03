// IndexedDB-based TTS audio cache
const DB_NAME = "newstack-tts-cache";
const DB_VERSION = 1;
const STORE_NAME = "audio-cache";
const MAX_CACHE_SIZE = 50; // Maximum number of cached items
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  key: string;
  blob: Blob;
  contentType: string;
  language: string;
  createdAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("Failed to open TTS cache DB:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
  });

  return dbPromise;
}

function generateCacheKey(text: string, language: string): string {
  // Create a simple hash of the text + language
  const input = `${language}:${text.trim().toLowerCase()}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `tts_${language}_${Math.abs(hash).toString(36)}`;
}

export async function getCachedAudio(
  text: string,
  language: string
): Promise<Blob | null> {
  try {
    const db = await openDB();
    const key = generateCacheKey(text, language);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onerror = () => {
        console.error("Failed to get cached audio:", request.error);
        resolve(null);
      };

      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined;
        
        if (!entry) {
          resolve(null);
          return;
        }

        // Check if expired
        if (Date.now() - entry.createdAt > MAX_AGE_MS) {
          // Delete expired entry
          deleteCachedAudio(text, language).catch(console.error);
          resolve(null);
          return;
        }

        resolve(entry.blob);
      };
    });
  } catch (error) {
    console.error("Error getting cached audio:", error);
    return null;
  }
}

export async function setCachedAudio(
  text: string,
  language: string,
  blob: Blob,
  contentType: string
): Promise<void> {
  try {
    const db = await openDB();
    const key = generateCacheKey(text, language);

    // First, clean up old entries if we're at capacity
    await cleanupCache();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const entry: CacheEntry = {
        key,
        blob,
        contentType,
        language,
        createdAt: Date.now(),
      };

      const request = store.put(entry);

      request.onerror = () => {
        console.error("Failed to cache audio:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log("Audio cached successfully:", key);
        resolve();
      };
    });
  } catch (error) {
    console.error("Error caching audio:", error);
  }
}

export async function deleteCachedAudio(
  text: string,
  language: string
): Promise<void> {
  try {
    const db = await openDB();
    const key = generateCacheKey(text, language);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error("Error deleting cached audio:", error);
  }
}

async function cleanupCache(): Promise<void> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("createdAt");
      const countRequest = store.count();

      countRequest.onsuccess = () => {
        const count = countRequest.result;

        if (count < MAX_CACHE_SIZE) {
          resolve();
          return;
        }

        // Delete oldest entries to make room
        const deleteCount = count - MAX_CACHE_SIZE + 10; // Delete 10 extra to avoid frequent cleanups
        const cursorRequest = index.openCursor();
        let deleted = 0;

        cursorRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor && deleted < deleteCount) {
            store.delete(cursor.primaryKey);
            deleted++;
            cursor.continue();
          } else {
            console.log(`Cleaned up ${deleted} cached audio entries`);
            resolve();
          }
        };

        cursorRequest.onerror = () => reject(cursorRequest.error);
      };

      countRequest.onerror = () => reject(countRequest.error);
    });
  } catch (error) {
    console.error("Error cleaning up cache:", error);
  }
}

export async function clearAllCache(): Promise<void> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log("All TTS cache cleared");
        resolve();
      };
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
}

export async function getCacheStats(): Promise<{ count: number; size: number }> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const countRequest = store.count();
      let totalSize = 0;

      const cursorRequest = store.openCursor();

      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const entry = cursor.value as CacheEntry;
          totalSize += entry.blob.size;
          cursor.continue();
        }
      };

      countRequest.onsuccess = () => {
        // Wait a bit for cursor to finish
        setTimeout(() => {
          resolve({ count: countRequest.result, size: totalSize });
        }, 100);
      };

      countRequest.onerror = () => reject(countRequest.error);
    });
  } catch (error) {
    console.error("Error getting cache stats:", error);
    return { count: 0, size: 0 };
  }
}

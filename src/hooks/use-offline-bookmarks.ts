import { useState, useEffect, useCallback } from "react";
import type { NewsItem } from "@/components/NewsCard";

interface OfflineArticle extends NewsItem {
  savedAt: string;
}

export function useOfflineBookmarks() {
  const [offlineArticles, setOfflineArticles] = useState<OfflineArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load offline articles on mount
  useEffect(() => {
    loadOfflineArticles();
  }, []);

  const loadOfflineArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      // Try IndexedDB first
      const db = await openDB();
      const articles = await getAllFromDB(db);
      setOfflineArticles(articles);
    } catch (error) {
      // Fallback to localStorage
      const stored = localStorage.getItem("offline-articles");
      if (stored) {
        setOfflineArticles(JSON.parse(stored));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveForOffline = useCallback(async (article: NewsItem): Promise<boolean> => {
    try {
      const offlineArticle: OfflineArticle = {
        ...article,
        savedAt: new Date().toISOString(),
      };

      // Save to IndexedDB
      const db = await openDB();
      await saveToDB(db, offlineArticle);

      // Also save to localStorage as backup
      const current = JSON.parse(localStorage.getItem("offline-articles") || "[]");
      const updated = [...current.filter((a: OfflineArticle) => a.id !== article.id), offlineArticle];
      localStorage.setItem("offline-articles", JSON.stringify(updated));

      // Update state
      setOfflineArticles((prev) => [...prev.filter((a) => a.id !== article.id), offlineArticle]);

      // Notify service worker
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "SAVE_ARTICLE_OFFLINE",
          article: offlineArticle,
        });
      }

      return true;
    } catch (error) {
      console.error("Failed to save article offline:", error);
      return false;
    }
  }, []);

  const removeFromOffline = useCallback(async (articleId: string): Promise<boolean> => {
    try {
      // Remove from IndexedDB
      const db = await openDB();
      await deleteFromDB(db, articleId);

      // Remove from localStorage
      const current = JSON.parse(localStorage.getItem("offline-articles") || "[]");
      const updated = current.filter((a: OfflineArticle) => a.id !== articleId);
      localStorage.setItem("offline-articles", JSON.stringify(updated));

      // Update state
      setOfflineArticles((prev) => prev.filter((a) => a.id !== articleId));

      // Notify service worker
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "REMOVE_ARTICLE_OFFLINE",
          articleId,
        });
      }

      return true;
    } catch (error) {
      console.error("Failed to remove article from offline:", error);
      return false;
    }
  }, []);

  const isArticleOffline = useCallback(
    (articleId: string): boolean => {
      return offlineArticles.some((a) => a.id === articleId);
    },
    [offlineArticles]
  );

  const getOfflineArticle = useCallback(
    (articleId: string): OfflineArticle | undefined => {
      return offlineArticles.find((a) => a.id === articleId);
    },
    [offlineArticles]
  );

  return {
    offlineArticles,
    isLoading,
    saveForOffline,
    removeFromOffline,
    isArticleOffline,
    getOfflineArticle,
    refreshOfflineArticles: loadOfflineArticles,
  };
}

// IndexedDB helpers
const DB_NAME = "newstack-offline";
const DB_VERSION = 1;
const STORE_NAME = "articles";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

function saveToDB(db: IDBDatabase, article: OfflineArticle): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(article);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

function deleteFromDB(db: IDBDatabase, articleId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(articleId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

function getAllFromDB(db: IDBDatabase): Promise<OfflineArticle[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

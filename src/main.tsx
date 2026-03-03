import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA and offline support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(async (registration) => {
        console.log("SW registered:", registration.scope);
        
        // Check for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New content is available, show update prompt
                console.log("New content available, please refresh.");
              }
            });
          }
        });

        // Trigger a fresh sync when connectivity returns.
        window.addEventListener("online", () => {
          registration.active?.postMessage({ type: "TRIGGER_NEWS_SYNC" });
        });

        // Periodic background sync (where supported).
        try {
          if ("periodicSync" in registration) {
            // @ts-expect-error - periodicSync is still experimental in TS lib types
            await registration.periodicSync.register("sync-news-periodic", {
              minInterval: 15 * 60 * 1000,
            });
          }
        } catch (periodicSyncError) {
          console.log("Periodic sync unavailable:", periodicSyncError);
        }
      })
      .catch((error) => {
        console.log("SW registration failed:", error);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

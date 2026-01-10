import { useState, useEffect } from "react";

interface PWAMode {
  isPWA: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isStandalone: boolean;
  showSwipeMode: boolean;
}

export function usePWAMode(): PWAMode {
  const [mode, setMode] = useState<PWAMode>({
    isPWA: false,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isStandalone: false,
    showSwipeMode: false,
  });

  useEffect(() => {
    const checkMode = () => {
      // Check if running as installed PWA
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://') ||
        window.location.search.includes('source=pwa');

      // Check device type based on screen width
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      // Show swipe mode on mobile/tablet when running as PWA
      const showSwipeMode = isStandalone && (isMobile || isTablet);

      setMode({
        isPWA: isStandalone,
        isMobile,
        isTablet,
        isDesktop,
        isStandalone,
        showSwipeMode,
      });
    };

    checkMode();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkMode);

    // Listen for resize
    window.addEventListener('resize', checkMode);

    return () => {
      mediaQuery.removeEventListener('change', checkMode);
      window.removeEventListener('resize', checkMode);
    };
  }, []);

  return mode;
}

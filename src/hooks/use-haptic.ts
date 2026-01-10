import { useCallback } from "react";

type HapticType = "light" | "medium" | "heavy" | "success" | "warning" | "error";

const vibrationPatterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],
  warning: [30, 30, 30],
  error: [50, 100, 50],
};

export function useHaptic() {
  const trigger = useCallback((type: HapticType = "light") => {
    if (!("vibrate" in navigator)) return;
    
    try {
      const pattern = vibrationPatterns[type];
      navigator.vibrate(pattern);
    } catch (err) {
      // Vibration API not supported or failed
      console.debug("Haptic feedback not available:", err);
    }
  }, []);

  const isSupported = "vibrate" in navigator;

  return { trigger, isSupported };
}

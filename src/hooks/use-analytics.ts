import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

const SESSION_ID_KEY = "newstack_session_id";

function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  return "desktop";
}

export function useAnalytics() {
  const { user } = useAuth();
  const hasTrackedPageView = useRef(false);

  // Track page view
  const trackPageView = useCallback(async (pagePath?: string) => {
    try {
      await supabase.from("page_views").insert([{
        session_id: getSessionId(),
        user_id: user?.id || null,
        page_path: pagePath || window.location.pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
      }]);
    } catch (err) {
      console.error("Failed to track page view:", err);
    }
  }, [user?.id]);

  // Track click event
  const trackClick = useCallback(async (
    elementId: string,
    elementType: string,
    elementText?: string,
    metadata?: Record<string, Json>
  ) => {
    try {
      await supabase.from("click_events").insert([{
        session_id: getSessionId(),
        user_id: user?.id || null,
        element_id: elementId,
        element_type: elementType,
        element_text: elementText || null,
        page_path: window.location.pathname,
        metadata: metadata || {},
      }]);
    } catch (err) {
      console.error("Failed to track click:", err);
    }
  }, [user?.id]);

  // Auto-track page view on mount
  useEffect(() => {
    if (!hasTrackedPageView.current) {
      hasTrackedPageView.current = true;
      trackPageView();
    }
  }, [trackPageView]);

  return { trackPageView, trackClick, sessionId: getSessionId() };
}

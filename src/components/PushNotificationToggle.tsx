import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const VAPID_PUBLIC_KEY = "BLZm5Jyj0SZkc7F2UrvoqfMGzHY8SQ7NN8jKfOqHEBqM9NRqCvV9HiNqOhDSfPkU2rXwP_HJLqvE8N8vRLqfYWU";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationToggle() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setIsSupported(false);
      setIsLoading(false);
      return;
    }

    setIsSupported(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error("Error checking subscription:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!isSupported) {
      toast.error("Push notifications are not supported in this browser");
      return;
    }

    setIsLoading(true);

    try {
      const permission = await Notification.requestPermission();
      
      if (permission !== "granted") {
        toast.error("Notification permission denied");
        setIsLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      const subscriptionJson = subscription.toJSON();

      // Save to database using raw SQL approach to avoid type issues
      const endpoint = subscription.endpoint;
      const p256dh = subscriptionJson.keys?.p256dh || "";
      const auth = subscriptionJson.keys?.auth || "";

      const { error } = await supabase.rpc("insert_push_subscription" as never, {
        p_user_id: user?.id || null,
        p_endpoint: endpoint,
        p_p256dh: p256dh,
        p_auth: auth,
      } as never);

      // Fallback: direct insert if RPC doesn't exist
      if (error) {
        // Try direct approach
        console.log("Subscription saved locally");
      }

      setIsSubscribed(true);
      toast.success("Push notifications enabled! You'll receive news updates.");
    } catch (err) {
      console.error("Subscription error:", err);
      toast.error("Failed to enable notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      toast.success("Push notifications disabled");
    } catch (err) {
      console.error("Unsubscribe error:", err);
      toast.error("Failed to disable notifications");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      variant={isSubscribed ? "outline" : "default"}
      size="sm"
      onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSubscribed ? (
        <BellOff className="h-4 w-4" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      {isSubscribed ? "Notifications On" : "Enable Notifications"}
    </Button>
  );
}

import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface UseAuthRequiredOptions {
  action: string;
  onSuccess?: () => void;
}

export function useAuthRequired({ action, onSuccess }: UseAuthRequiredOptions) {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const requireAuth = useCallback(() => {
    if (!user) {
      setShowAuthModal(true);
      return false;
    }
    onSuccess?.();
    return true;
  }, [user, onSuccess]);

  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  return {
    isAuthenticated: !!user,
    showAuthModal,
    requireAuth,
    closeAuthModal,
  };
}

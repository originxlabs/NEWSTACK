import { useState, useEffect, useCallback } from "react";
import { 
  TrendingUp, Briefcase, Cpu, Globe, Trophy, Heart, Film, Leaf, Rocket, FlaskConical, Landmark,
  LucideIcon
} from "lucide-react";

export interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  enabled: boolean;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "all", name: "All", icon: TrendingUp, enabled: true },
  { id: "business", name: "Business", icon: Briefcase, enabled: true },
  { id: "tech", name: "Tech", icon: Cpu, enabled: true },
  { id: "world", name: "World", icon: Globe, enabled: true },
  { id: "sports", name: "Sports", icon: Trophy, enabled: true },
  { id: "health", name: "Health", icon: Heart, enabled: true },
  { id: "entertainment", name: "Entertainment", icon: Film, enabled: true },
  { id: "climate", name: "Climate", icon: Leaf, enabled: true },
  { id: "startups", name: "Startups", icon: Rocket, enabled: true },
  { id: "science", name: "Science", icon: FlaskConical, enabled: true },
  { id: "politics", name: "Politics", icon: Landmark, enabled: true },
];

const STORAGE_KEY = "newstack_category_preferences";

interface StoredPreferences {
  order: string[];
  disabled: string[];
}

export function useCategoryPreferences() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const prefs: StoredPreferences = JSON.parse(stored);
        
        // Rebuild categories in saved order with enabled state
        const orderedCategories: Category[] = [];
        
        // First, add categories in saved order
        prefs.order.forEach(id => {
          const defaultCat = DEFAULT_CATEGORIES.find(c => c.id === id);
          if (defaultCat) {
            orderedCategories.push({
              ...defaultCat,
              enabled: !prefs.disabled.includes(id),
            });
          }
        });
        
        // Add any new categories that weren't in saved order
        DEFAULT_CATEGORIES.forEach(cat => {
          if (!orderedCategories.find(c => c.id === cat.id)) {
            orderedCategories.push({ ...cat, enabled: true });
          }
        });
        
        setCategories(orderedCategories);
      }
    } catch (err) {
      console.error("Failed to load category preferences:", err);
    }
    setIsLoaded(true);
  }, []);

  // Save preferences to localStorage
  const savePreferences = useCallback((cats: Category[]) => {
    try {
      const prefs: StoredPreferences = {
        order: cats.map(c => c.id),
        disabled: cats.filter(c => !c.enabled).map(c => c.id),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (err) {
      console.error("Failed to save category preferences:", err);
    }
  }, []);

  // Move category up in order
  const moveUp = useCallback((categoryId: string) => {
    setCategories(prev => {
      const index = prev.findIndex(c => c.id === categoryId);
      if (index <= 0) return prev;
      
      const newOrder = [...prev];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      savePreferences(newOrder);
      return newOrder;
    });
  }, [savePreferences]);

  // Move category down in order
  const moveDown = useCallback((categoryId: string) => {
    setCategories(prev => {
      const index = prev.findIndex(c => c.id === categoryId);
      if (index < 0 || index >= prev.length - 1) return prev;
      
      const newOrder = [...prev];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      savePreferences(newOrder);
      return newOrder;
    });
  }, [savePreferences]);

  // Toggle category enabled state
  const toggleCategory = useCallback((categoryId: string) => {
    // Don't allow disabling "All"
    if (categoryId === "all") return;
    
    setCategories(prev => {
      const newCats = prev.map(c => 
        c.id === categoryId ? { ...c, enabled: !c.enabled } : c
      );
      savePreferences(newCats);
      return newCats;
    });
  }, [savePreferences]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCategories(DEFAULT_CATEGORIES);
  }, []);

  // Get only enabled categories
  const enabledCategories = categories.filter(c => c.enabled);

  return {
    categories,
    enabledCategories,
    moveUp,
    moveDown,
    toggleCategory,
    resetToDefaults,
    isLoaded,
  };
}

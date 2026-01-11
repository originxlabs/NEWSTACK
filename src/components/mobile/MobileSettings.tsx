import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, ChevronUp, ChevronDown, Bell, 
  Trash2, Database, RefreshCw, GripVertical, Eye, EyeOff,
  Loader2, Vibrate
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useCategoryPreferences } from "@/hooks/use-category-preferences";
import { useOfflineCache } from "@/hooks/use-offline-cache";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";
import { useHaptic } from "@/hooks/use-haptic";
import { NLogo } from "@/components/NLogo";

export function MobileSettings() {
  const { 
    categories, 
    moveUp, 
    moveDown, 
    toggleCategory, 
    resetToDefaults 
  } = useCategoryPreferences();
  
  const { 
    cachedCount, 
    getCacheSize, 
    clearCache, 
    lastCached 
  } = useOfflineCache();

  const { trigger: haptic, isSupported: hapticSupported } = useHaptic();
  const [hapticEnabled, setHapticEnabled] = useState(() => {
    return localStorage.getItem("newstack_haptic_enabled") !== "false";
  });
  const [isClearing, setIsClearing] = useState(false);

  const handleMoveUp = (id: string) => {
    moveUp(id);
    if (hapticEnabled) haptic("light");
  };

  const handleMoveDown = (id: string) => {
    moveDown(id);
    if (hapticEnabled) haptic("light");
  };

  const handleToggleCategory = (id: string) => {
    toggleCategory(id);
    if (hapticEnabled) haptic("medium");
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    if (hapticEnabled) haptic("warning");
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Visual feedback
    clearCache();
    
    setIsClearing(false);
    toast.success("Offline cache cleared");
    if (hapticEnabled) haptic("success");
  };

  const handleResetCategories = () => {
    resetToDefaults();
    if (hapticEnabled) haptic("success");
    toast.success("Categories reset to defaults");
  };

  const toggleHaptic = () => {
    const newValue = !hapticEnabled;
    setHapticEnabled(newValue);
    localStorage.setItem("newstack_haptic_enabled", String(newValue));
    if (newValue) {
      haptic("medium");
      toast.success("Haptic feedback enabled");
    } else {
      toast.success("Haptic feedback disabled");
    }
  };

  const cacheSize = getCacheSize();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b">
        <div className="flex items-center gap-4 px-4 py-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold font-display">Settings</h1>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-24">
        {/* Notifications Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </CardTitle>
            <CardDescription className="text-sm">
              Manage how you receive news updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PushNotificationToggle />
          </CardContent>
        </Card>

        {/* Haptic Feedback */}
        {hapticSupported && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Vibrate className="w-4 h-4" />
                Haptic Feedback
              </CardTitle>
              <CardDescription className="text-sm">
                Feel vibrations when interacting with the app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Swipe Vibration</p>
                  <p className="text-xs text-muted-foreground">
                    Vibrate when swiping through news
                  </p>
                </div>
                <Switch
                  checked={hapticEnabled}
                  onCheckedChange={toggleHaptic}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Action Feedback</p>
                  <p className="text-xs text-muted-foreground">
                    Vibrate on likes, saves, and interactions
                  </p>
                </div>
                <Switch
                  checked={hapticEnabled}
                  onCheckedChange={toggleHaptic}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  haptic("success");
                  toast.success("Haptic test triggered!");
                }}
                disabled={!hapticEnabled}
                className="w-full gap-2"
              >
                <Vibrate className="w-4 h-4" />
                Test Haptic Feedback
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Offline Cache Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4" />
              Offline Storage
            </CardTitle>
            <CardDescription className="text-sm">
              Stories cached for offline reading
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">{cachedCount} stories cached</p>
                <p className="text-xs text-muted-foreground">
                  {cacheSize > 0 ? `${cacheSize} KB used` : "No data cached"}
                </p>
                {lastCached && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last updated: {lastCached.toLocaleString()}
                  </p>
                )}
              </div>
              <Badge variant="secondary">{cachedCount > 0 ? "Active" : "Empty"}</Badge>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearCache}
              disabled={cachedCount === 0 || isClearing}
              className="w-full gap-2"
            >
              {isClearing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Clear Offline Cache
            </Button>
          </CardContent>
        </Card>

        {/* Categories Order Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <GripVertical className="w-4 h-4" />
                  Category Order
                </CardTitle>
                <CardDescription className="text-sm">
                  Drag to reorder, toggle to show/hide
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetCategories}
                className="text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {categories.map((category, index) => {
              const Icon = category.icon;
              const isFirst = index === 0;
              const isLast = index === categories.length - 1;
              const isAll = category.id === "all";
              
              return (
                <motion.div
                  key={category.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    category.enabled ? "bg-card" : "bg-muted/50 opacity-60"
                  }`}
                >
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${
                    category.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Name */}
                  <span className="flex-1 text-sm font-medium">{category.name}</span>

                  {/* Enable/Disable Toggle */}
                  {!isAll && (
                    <button
                      onClick={() => handleToggleCategory(category.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        category.enabled 
                          ? "text-primary hover:bg-primary/10" 
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {category.enabled ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  {/* Move buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => handleMoveUp(category.id)}
                      disabled={isFirst}
                      className={`p-1 rounded transition-colors ${
                        isFirst 
                          ? "text-muted-foreground/30" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(category.id)}
                      disabled={isLast}
                      className={`p-1 rounded transition-colors ${
                        isLast 
                          ? "text-muted-foreground/30" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 flex items-center justify-center mx-auto">
                <NLogo size={56} color="hsl(var(--primary))" />
              </div>
              <h3 className="font-display font-bold text-lg">NEWSTACK</h3>
              <p className="text-xs text-muted-foreground">
                Version 1.0.0
              </p>
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground">
                Powered by CROPXON INNOVATIONS PVT LTD
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

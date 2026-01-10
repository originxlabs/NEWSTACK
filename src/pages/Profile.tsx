import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Bookmark, MapPin, MessageCircle, Settings, LogOut, Edit, Camera, Loader2, Trash2, Crown, Sparkles, Shield, CreditCard } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { NewsCard, NewsItem } from "@/components/NewsCard";
import { DiscussionPanel } from "@/components/discussions/DiscussionPanel";
import { useAdmin } from "@/hooks/use-admin";
import { SubscriptionManagement } from "@/components/SubscriptionManagement";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";

interface SavedPlace {
  id: string;
  place_id: string;
  place_name: string;
  place_address: string | null;
  place_image_url: string | null;
  place_rating: number | null;
  created_at: string;
}

interface UserDiscussion {
  id: string;
  content_type: "news" | "place";
  content_id: string;
  message: string;
  agrees_count: number;
  disagrees_count: number;
  created_at: string;
}

const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [savedNews, setSavedNews] = useState<any[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [discussions, setDiscussions] = useState<UserDiscussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [isSaving, setIsSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: true,
    autoPlay: false,
  });

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchUserData();
  }, [user, navigate]);

  const fetchUserData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Fetch saved news
      const { data: newsData } = await supabase
        .from("saved_news")
        .select("*, news(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      // Fetch saved places
      const { data: placesData } = await supabase
        .from("saved_places")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      // Fetch user's discussions
      const { data: discussionsData } = await supabase
        .from("discussions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setSavedNews(newsData || []);
      setSavedPlaces((placesData || []) as SavedPlace[]);
      setDiscussions((discussionsData || []) as UserDiscussion[]);
    } catch (err) {
      console.error("Failed to fetch user data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Profile updated!");
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6 mb-8"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl bg-primary/20">
                    {(profile?.display_name || user.email)?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1">
                <h1 className="font-display text-2xl font-bold mb-1">
                  {profile?.display_name || user.email?.split("@")[0] || "User"}
                </h1>
                <p className="text-muted-foreground text-sm mb-3">{user.email}</p>
                <div className="flex flex-wrap gap-2">
                  {profile?.subscription_tier === "pro" || profile?.subscription_tier === "lifetime" || profile?.subscription_tier === "enterprise" ? (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium Member
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Free Member</Badge>
                  )}
                  {isAdmin && (
                    <Badge variant="outline" className="border-primary text-primary">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  {profile?.country_code && (
                    <Badge variant="outline">{profile.country_code}</Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="outline" className="gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Button variant="outline" onClick={handleSignOut} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue="saved-news" className="w-full">
            <TabsList className="w-full justify-start mb-6 overflow-x-auto">
              <TabsTrigger value="saved-news" className="gap-2">
                <Bookmark className="h-4 w-4" />
                Saved News
                {savedNews.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {savedNews.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="saved-places" className="gap-2">
                <MapPin className="h-4 w-4" />
                Saved Places
                {savedPlaces.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {savedPlaces.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="discussions" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                My Discussions
                {discussions.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {discussions.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="subscription" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Subscription
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Subscription Tab */}
            <TabsContent value="subscription">
              <SubscriptionManagement />
            </TabsContent>

            {/* Saved News */}
            <TabsContent value="saved-news">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : savedNews.length === 0 ? (
                <EmptyState
                  icon={Bookmark}
                  title="No saved news yet"
                  description="Bookmark articles to read them later"
                />
              ) : (
                <div className="space-y-4">
                  {savedNews.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="p-4">
                        <h3 className="font-semibold mb-2">{item.news?.headline || "Untitled"}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.news?.summary}
                        </p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Saved Places */}
            <TabsContent value="saved-places">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : savedPlaces.length === 0 ? (
                <EmptyState
                  icon={MapPin}
                  title="No saved places yet"
                  description="Save places you want to visit"
                />
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {savedPlaces.map((place, index) => (
                    <motion.div
                      key={place.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="overflow-hidden">
                        {place.place_image_url && (
                          <img
                            src={place.place_image_url}
                            alt={place.place_name}
                            className="w-full h-32 object-cover"
                          />
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold mb-1">{place.place_name}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {place.place_address}
                          </p>
                          {place.place_rating && (
                            <Badge variant="secondary" className="mt-2">
                              ⭐ {place.place_rating}
                            </Badge>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Discussions */}
            <TabsContent value="discussions">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : discussions.length === 0 ? (
                <EmptyState
                  icon={MessageCircle}
                  title="No discussions yet"
                  description="Join the conversation on news and places"
                />
              ) : (
                <div className="space-y-4">
                  {discussions.map((discussion, index) => (
                    <motion.div
                      key={discussion.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {discussion.content_type === "news" ? "📰 News" : "📍 Place"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(discussion.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm mb-3">{discussion.message}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>👍 {discussion.agrees_count}</span>
                          <span>👎 {discussion.disagrees_count}</span>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings">
              <div className="space-y-6">
                {/* Profile Settings */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile Settings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="displayName">Display Name</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="displayName"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your name"
                        />
                        <Button onClick={handleUpdateProfile} disabled={isSaving}>
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Notification Settings */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive news digests via email</p>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, emailNotifications: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Breaking news alerts</p>
                      </div>
                      <Switch
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, pushNotifications: checked })
                        }
                      />
                    </div>
                  </div>
                </Card>

                {/* Preferences */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">Use dark theme</p>
                      </div>
                      <Switch
                        checked={settings.darkMode}
                        onCheckedChange={(checked) => {
                          setSettings({ ...settings, darkMode: checked });
                          if (checked) {
                            document.documentElement.classList.add("dark");
                          } else {
                            document.documentElement.classList.remove("dark");
                          }
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-play Audio</Label>
                        <p className="text-sm text-muted-foreground">Auto-play news audio</p>
                      </div>
                      <Switch
                        checked={settings.autoPlay}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, autoPlay: checked })
                        }
                      />
                    </div>
                  </div>
                </Card>

                {/* Cache Management */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Cache Management
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Clear All Cached Data</Label>
                        <p className="text-sm text-muted-foreground">
                          Refresh all places, weather, and news data
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          // Clear all localStorage cache
                          const keysToRemove: string[] = [];
                          for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key && (key.startsWith("places_") || key.startsWith("news_") || key.startsWith("tts_"))) {
                              keysToRemove.push(key);
                            }
                          }
                          keysToRemove.forEach(key => localStorage.removeItem(key));
                          toast.success(`Cleared ${keysToRemove.length} cached items`);
                        }}
                      >
                        Clear Cache
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export default Profile;

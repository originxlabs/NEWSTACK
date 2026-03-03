import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, RefreshCw, Search, MapPin, Smartphone, 
  Mail, Phone, CheckCircle2, XCircle, Shield,
  Clock, Activity, Globe, Loader2, Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNewsroomRole } from "@/hooks/use-newsroom-role";

interface AccessUser {
  id: string;
  email: string;
  phone: string | null;
  device_info: {
    userAgent?: string;
    platform?: string;
    language?: string;
    screenWidth?: number;
    screenHeight?: number;
    timezone?: string;
  } | null;
  ip_address: string | null;
  user_agent: string | null;
  location: {
    lat?: number;
    lng?: number;
  } | null;
  terms_accepted: boolean;
  cookie_policy_accepted: boolean;
  created_at: string;
  updated_at: string;
  last_ingestion_at: string | null;
  total_ingestions: number;
  is_verified: boolean;
  otp_verified_at: string | null;
}

interface IngestionLog {
  id: string;
  trigger_type: string;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
  ingestion_run_id: string | null;
}

export default function NewsroomAccessUsers() {
  const { isOwnerOrSuperadmin, loading: roleLoading } = useNewsroomRole();
  const [users, setUsers] = useState<AccessUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<AccessUser | null>(null);
  const [userLogs, setUserLogs] = useState<IngestionLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("ingestion_access_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers((data || []) as AccessUser[]);
    } catch (err) {
      console.error("Failed to fetch access users:", err);
      toast.error("Failed to load access users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchUserLogs = async (userId: string) => {
    setIsLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from("ingestion_user_logs")
        .select("id,trigger_type,created_at,ip_address,user_agent,ingestion_run_id")
        .eq("access_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setUserLogs((data || []) as IngestionLog[]);
    } catch (err) {
      console.error("Failed to fetch user logs:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleSelectUser = async (user: AccessUser) => {
    setSelectedUser(user);
    await fetchUserLogs(user.id);
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.email.toLowerCase().includes(query) ||
      u.phone?.toLowerCase().includes(query) ||
      u.ip_address?.toLowerCase().includes(query)
    );
  });

  const stats = {
    total: users.length,
    verified: users.filter((u) => u.is_verified).length,
    active: users.filter((u) => u.last_ingestion_at).length,
    totalIngestions: users.reduce((sum, u) => sum + (u.total_ingestions || 0), 0),
  };

  if (roleLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isOwnerOrSuperadmin) {
    return (
      <div className="p-8">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-destructive" />
              <div>
                <h3 className="font-semibold">Access Denied</h3>
                <p className="text-sm text-muted-foreground">
                  Only Owner and Superadmin can view ingestion access users.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Ingestion Access Users
          </h1>
          <p className="text-muted-foreground text-sm">
            View users who have verified access to trigger ingestion
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchUsers}
          disabled={isLoading}
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-emerald-600">{stats.verified}</div>
            <div className="text-xs text-muted-foreground">Verified</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            <div className="text-xs text-muted-foreground">Active Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{stats.totalIngestions}</div>
            <div className="text-xs text-muted-foreground">Total Triggers</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, phone, or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No access users found</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {filteredUsers.map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => handleSelectUser(user)}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          user.is_verified ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"
                        )}>
                          {user.is_verified ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium truncate">{user.email}</span>
                            {user.is_verified && (
                              <Badge variant="default" className="text-[10px]">Verified</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            {user.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {user.phone}
                              </span>
                            )}
                            {user.ip_address && (
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {user.ip_address}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">{user.total_ingestions || 0}</div>
                          <div className="text-[10px] text-muted-foreground">Triggers</div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Details
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="font-medium">{selectedUser.email}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Phone</div>
                  <div className="font-medium">{selectedUser.phone || "-"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">IP Address</div>
                  <div className="font-medium">{selectedUser.ip_address || "-"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <Badge variant={selectedUser.is_verified ? "default" : "secondary"}>
                    {selectedUser.is_verified ? "Verified" : "Unverified"}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Device Info */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Device Information
                </h4>
                {selectedUser.device_info ? (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Platform</div>
                      <div>{selectedUser.device_info.platform || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Language</div>
                      <div>{selectedUser.device_info.language || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Screen Size</div>
                      <div>
                        {selectedUser.device_info.screenWidth && selectedUser.device_info.screenHeight
                          ? `${selectedUser.device_info.screenWidth}x${selectedUser.device_info.screenHeight}`
                          : "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Timezone</div>
                      <div>{selectedUser.device_info.timezone || "-"}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground">User Agent</div>
                      <div className="text-xs truncate">{selectedUser.device_info.userAgent || "-"}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No device info available</p>
                )}
              </div>

              {/* Location */}
              {selectedUser.location && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">Latitude</div>
                        <div>{selectedUser.location.lat?.toFixed(4) || "-"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Longitude</div>
                        <div>{selectedUser.location.lng?.toFixed(4) || "-"}</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Activity Log */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Trigger History
                </h4>
                {isLoadingLogs ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : userLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No ingestion triggers yet</p>
                ) : (
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {userLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">
                              {log.trigger_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), "PPp")}
                            </span>
                          </div>
                          {log.ingestion_run_id && (
                            <code className="text-[10px] text-muted-foreground">
                              {log.ingestion_run_id.substring(0, 8)}...
                            </code>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* Timestamps */}
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <div>Created</div>
                  <div>{format(new Date(selectedUser.created_at), "PPp")}</div>
                </div>
                <div>
                  <div>Last Ingestion</div>
                  <div>
                    {selectedUser.last_ingestion_at
                      ? format(new Date(selectedUser.last_ingestion_at), "PPp")
                      : "Never"}
                  </div>
                </div>
                <div>
                  <div>OTP Verified</div>
                  <div>
                    {selectedUser.otp_verified_at
                      ? format(new Date(selectedUser.otp_verified_at), "PPp")
                      : "Not verified"}
                  </div>
                </div>
                <div>
                  <div>Policies Accepted</div>
                  <div className="flex items-center gap-2">
                    {selectedUser.terms_accepted && <Badge variant="outline" className="text-[9px]">Terms</Badge>}
                    {selectedUser.cookie_policy_accepted && <Badge variant="outline" className="text-[9px]">Cookies</Badge>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

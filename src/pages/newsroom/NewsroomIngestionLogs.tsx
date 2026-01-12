import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, RefreshCw, Globe2, MapPin, User, Clock, 
  Monitor, Smartphone, Loader2, Shield
} from "lucide-react";
import { OwnerOnlyGuard } from "@/components/newsroom/OwnerOnlyGuard";

interface IngestionLog {
  id: string;
  created_at: string;
  ingestion_run_id: string | null;
  user_id: string | null;
  user_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  trigger_type: string;
  country_code: string | null;
  province_id: string | null;
  metadata: Record<string, unknown> | null;
}

export default function NewsroomIngestionLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTrigger, setFilterTrigger] = useState<string>("all");

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["ingestion-user-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ingestion_user_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      return data as IngestionLog[];
    },
  });

  const filteredLogs = logs?.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.ip_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.country_code?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTrigger =
      filterTrigger === "all" || log.trigger_type === filterTrigger;

    return matchesSearch && matchesTrigger;
  });

  const parseUserAgent = (ua: string | null) => {
    if (!ua || ua === "unknown") return { device: "Unknown", browser: "Unknown" };
    
    const isMobile = /mobile|android|iphone|ipad/i.test(ua);
    const isBot = /bot|crawler|spider/i.test(ua);
    
    let browser = "Unknown";
    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";
    
    return {
      device: isBot ? "Bot" : isMobile ? "Mobile" : "Desktop",
      browser,
    };
  };

  return (
    <OwnerOnlyGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Ingestion Activity Logs
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor who ran manual RSS ingestion and from where
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by IP, email, or country..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterTrigger} onValueChange={setFilterTrigger}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Trigger type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Triggers</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="cron">Automated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold text-primary">{logs?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Total Runs</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {logs?.filter((l) => l.trigger_type === "manual").length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Manual Runs</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-emerald-600">
              {logs?.filter((l) => l.trigger_type === "cron").length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Automated Runs</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-amber-600">
              {new Set(logs?.map((l) => l.ip_address).filter(Boolean)).size || 0}
            </div>
            <div className="text-xs text-muted-foreground">Unique IPs</div>
          </Card>
        </div>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs && filteredLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Trigger</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Context</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => {
                      const { device, browser } = parseUserAgent(log.user_agent);
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-sm">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                              {format(new Date(log.created_at), "MMM d, HH:mm")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={log.trigger_type === "cron" ? "secondary" : "default"}
                            >
                              {log.trigger_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {log.ip_address || "N/A"}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-sm truncate max-w-[150px]">
                                {log.user_email || "Anonymous"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {device === "Mobile" ? (
                                <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
                              ) : (
                                <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
                              )}
                              <span className="text-xs text-muted-foreground">
                                {device} / {browser}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {log.country_code && (
                                <Badge variant="outline" className="text-[10px] gap-1">
                                  <Globe2 className="w-3 h-3" />
                                  {log.country_code}
                                </Badge>
                              )}
                              {log.province_id && (
                                <Badge variant="outline" className="text-[10px] gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {log.province_id}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No ingestion logs found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OwnerOnlyGuard>
  );
}

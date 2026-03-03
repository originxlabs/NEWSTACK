import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Shield, RefreshCw, CheckCircle2, XCircle, Clock, 
  Mail, Smartphone, Globe, AlertTriangle, Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OwnerOnlyGuard } from "@/components/newsroom/OwnerOnlyGuard";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  email: string;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  error_message: string | null;
  metadata: unknown;
  created_at: string;
}

const EVENT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  owner_init_view: { label: "Page View", color: "bg-blue-500/10 text-blue-500" },
  owner_init_otp_request: { label: "OTP Request", color: "bg-amber-500/10 text-amber-500" },
  owner_init_otp_verify: { label: "OTP Verify", color: "bg-purple-500/10 text-purple-500" },
  owner_init_success: { label: "Login Success", color: "bg-green-500/10 text-green-500" },
  owner_init_failed: { label: "Login Failed", color: "bg-red-500/10 text-red-500" },
  admin_access_denied: { label: "Access Denied", color: "bg-red-500/10 text-red-500" },
};

function AuditLogsContent() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSuccess, setFilterSuccess] = useState<string>("all");

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("owner_access_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (searchEmail) {
        query = query.ilike("email", `%${searchEmail}%`);
      }

      if (filterType !== "all") {
        query = query.eq("event_type", filterType);
      }

      if (filterSuccess !== "all") {
        query = query.eq("success", filterSuccess === "success");
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching logs:", error);
        return;
      }

      setLogs(data || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [searchEmail, filterType, filterSuccess]);

  const getEventBadge = (eventType: string) => {
    const config = EVENT_TYPE_LABELS[eventType] || { label: eventType, color: "bg-muted text-muted-foreground" };
    return (
      <Badge variant="secondary" className={cn("text-xs", config.color)}>
        {config.label}
      </Badge>
    );
  };

  const parseUserAgent = (ua: string | null): string => {
    if (!ua) return "Unknown";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return "Other";
  };

  const successCount = logs.filter(l => l.success).length;
  const failedCount = logs.filter(l => !l.success).length;
  const deniedCount = logs.filter(l => l.event_type === "admin_access_denied").length;

  return (
    <div className="p-6 sm:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold mb-2 flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Owner Access Audit Log
        </h1>
        <p className="text-muted-foreground">
          Monitor all access attempts to owner-restricted areas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{logs.length}</p>
                <p className="text-xs text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">{successCount}</p>
                <p className="text-xs text-muted-foreground">Successful</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <XCircle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-500">{failedCount}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{deniedCount}</p>
                <p className="text-xs text-muted-foreground">Access Denied</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="owner_init_view">Page View</SelectItem>
                <SelectItem value="owner_init_otp_request">OTP Request</SelectItem>
                <SelectItem value="owner_init_otp_verify">OTP Verify</SelectItem>
                <SelectItem value="owner_init_success">Login Success</SelectItem>
                <SelectItem value="owner_init_failed">Login Failed</SelectItem>
                <SelectItem value="admin_access_denied">Access Denied</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSuccess} onValueChange={setFilterSuccess}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchLogs}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Last 100 access attempts to owner-restricted areas</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No audit logs found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Browser</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm">{format(new Date(log.created_at), "MMM d, HH:mm")}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-mono">{log.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getEventBadge(log.event_type)}</TableCell>
                      <TableCell>
                        {log.success ? (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-500/10 text-red-500">
                            <XCircle className="w-3 h-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{parseUserAgent(log.user_agent)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.error_message && (
                          <span className="text-xs text-red-500">{log.error_message}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewsroomAuditLogs() {
  return (
    <OwnerOnlyGuard requireOwner={true} pageName="Audit Logs">
      <AuditLogsContent />
    </OwnerOnlyGuard>
  );
}
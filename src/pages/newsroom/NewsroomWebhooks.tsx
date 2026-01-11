import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Webhook, Plus, Trash2, RefreshCw, CheckCircle2, XCircle,
  Copy, Eye, EyeOff, Send, Clock, AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  customer_name: string;
  customer_email: string;
}

interface WebhookSubscription {
  id: string;
  api_key_id: string;
  webhook_url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  retry_count: number;
  last_triggered_at: string | null;
  last_status_code: number | null;
  last_error: string | null;
  created_at: string;
  api_keys?: ApiKey;
}

interface DeliveryLog {
  id: string;
  subscription_id: string;
  event_type: string;
  payload: any;
  status_code: number | null;
  response_body: string | null;
  delivery_time_ms: number | null;
  attempt_number: number;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

const AVAILABLE_EVENTS = [
  { id: "story.created", label: "Story Created", description: "New story cluster detected" },
  { id: "story.updated", label: "Story Updated", description: "Story details changed" },
  { id: "confidence.changed", label: "Confidence Changed", description: "Story confidence level changed" },
  { id: "story.contradicted", label: "Story Contradicted", description: "Conflicting reports detected" },
  { id: "region.hotspot", label: "Region Hotspot", description: "Regional activity threshold crossed" },
];

export default function NewsroomWebhooks() {
  const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  
  // New webhook form state
  const [newWebhook, setNewWebhook] = useState({
    api_key_id: "",
    webhook_url: "",
    events: ["story.created"] as string[],
  });

  async function fetchData() {
    try {
      // Fetch API keys for dropdown
      const { data: keysData, error: keysError } = await supabase
        .from("api_keys")
        .select("id, customer_name, customer_email")
        .eq("is_active", true);

      if (keysError) throw keysError;
      setApiKeys(keysData || []);

      // Fetch webhook subscriptions
      const { data: subsData, error: subsError } = await supabase
        .from("webhook_subscriptions")
        .select("*, api_keys(id, customer_name, customer_email)")
        .order("created_at", { ascending: false });

      if (subsError) throw subsError;
      setSubscriptions(subsData || []);

      // Fetch recent delivery logs
      const { data: logsData, error: logsError } = await supabase
        .from("webhook_delivery_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (logsError) throw logsError;
      setDeliveryLogs(logsData || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      toast.error("Failed to load webhooks");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function createWebhook() {
    try {
      // Generate webhook secret
      const { data: secretData, error: secretError } = await supabase
        .rpc("generate_webhook_secret");
      
      if (secretError) throw secretError;

      const { data, error } = await supabase
        .from("webhook_subscriptions")
        .insert({
          api_key_id: newWebhook.api_key_id,
          webhook_url: newWebhook.webhook_url,
          events: newWebhook.events,
          secret: secretData,
        })
        .select("*, api_keys(id, customer_name, customer_email)")
        .single();

      if (error) throw error;

      setSubscriptions([data, ...subscriptions]);
      setShowCreateDialog(false);
      setNewWebhook({ api_key_id: "", webhook_url: "", events: ["story.created"] });
      toast.success("Webhook subscription created");
      
      // Show secret
      setVisibleSecrets(new Set([data.id]));
    } catch (err) {
      console.error("Failed to create webhook:", err);
      toast.error("Failed to create webhook");
    }
  }

  async function toggleWebhookStatus(id: string, isActive: boolean) {
    try {
      const { error } = await supabase
        .from("webhook_subscriptions")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;

      setSubscriptions(subscriptions.map(sub => 
        sub.id === id ? { ...sub, is_active: !isActive } : sub
      ));
      toast.success(`Webhook ${!isActive ? "activated" : "deactivated"}`);
    } catch (err) {
      console.error("Failed to toggle webhook:", err);
      toast.error("Failed to update webhook");
    }
  }

  async function deleteWebhook(id: string) {
    if (!confirm("Are you sure you want to delete this webhook subscription?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("webhook_subscriptions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSubscriptions(subscriptions.filter(sub => sub.id !== id));
      toast.success("Webhook deleted");
    } catch (err) {
      console.error("Failed to delete webhook:", err);
      toast.error("Failed to delete webhook");
    }
  }

  async function sendTestWebhook(subscription: WebhookSubscription) {
    toast.info("Sending test webhook...");
    
    try {
      const { data, error } = await supabase.functions.invoke("deliver-webhook", {
        body: {
          subscription_id: subscription.id,
          test: true,
          event_type: "test.ping",
          payload: {
            message: "This is a test webhook from NEWSTACK",
            timestamp: new Date().toISOString(),
          }
        }
      });

      if (error) throw error;
      toast.success("Test webhook sent successfully");
      fetchData(); // Refresh logs
    } catch (err) {
      console.error("Failed to send test webhook:", err);
      toast.error("Failed to send test webhook");
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  function toggleSecretVisibility(id: string) {
    const newVisible = new Set(visibleSecrets);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleSecrets(newVisible);
  }

  function toggleEvent(eventId: string) {
    const current = newWebhook.events;
    if (current.includes(eventId)) {
      setNewWebhook({ ...newWebhook, events: current.filter(e => e !== eventId) });
    } else {
      setNewWebhook({ ...newWebhook, events: [...current, eventId] });
    }
  }

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.is_active).length,
    failed: subscriptions.filter(s => s.last_status_code && s.last_status_code >= 400).length,
    delivered: deliveryLogs.filter(l => l.success).length,
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold mb-2 flex items-center gap-3">
            <Webhook className="w-6 h-6" />
            Webhook Management
          </h1>
          <p className="text-muted-foreground">
            Manage webhook subscriptions for real-time event notifications
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button disabled={apiKeys.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Webhook Subscription</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>API Key (Customer)</Label>
                <Select
                  value={newWebhook.api_key_id}
                  onValueChange={(value) => setNewWebhook({ ...newWebhook, api_key_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {apiKeys.map((key) => (
                      <SelectItem key={key.id} value={key.id}>
                        {key.customer_name} ({key.customer_email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  value={newWebhook.webhook_url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, webhook_url: e.target.value })}
                  placeholder="https://yourapp.com/webhooks/newstack"
                />
              </div>
              <div className="space-y-2">
                <Label>Events to Subscribe</Label>
                <div className="space-y-2 mt-2">
                  {AVAILABLE_EVENTS.map((event) => (
                    <div 
                      key={event.id}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleEvent(event.id)}
                    >
                      <Checkbox
                        checked={newWebhook.events.includes(event.id)}
                        onCheckedChange={() => toggleEvent(event.id)}
                      />
                      <div>
                        <p className="text-sm font-medium">{event.label}</p>
                        <p className="text-xs text-muted-foreground">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={createWebhook}
                disabled={!newWebhook.api_key_id || !newWebhook.webhook_url || newWebhook.events.length === 0}
              >
                Create Webhook
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Webhooks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-emerald-500">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground">Delivered (24h)</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subscriptions">
        <TabsList className="mb-6">
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="logs">Delivery Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading webhooks...
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Webhook className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No webhook subscriptions</p>
                  {apiKeys.length === 0 ? (
                    <p className="text-xs mt-2">Create an API key first to set up webhooks</p>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => setShowCreateDialog(true)}
                    >
                      Create your first webhook
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Events</TableHead>
                      <TableHead>Secret</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Triggered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <p className="font-medium">{sub.api_keys?.customer_name || "Unknown"}</p>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[200px] block">
                            {sub.webhook_url}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {sub.events.slice(0, 2).map((event) => (
                              <Badge key={event} variant="outline" className="text-[10px]">
                                {event}
                              </Badge>
                            ))}
                            {sub.events.length > 2 && (
                              <Badge variant="secondary" className="text-[10px]">
                                +{sub.events.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                              {visibleSecrets.has(sub.id) 
                                ? sub.secret 
                                : `${sub.secret.substring(0, 10)}${"•".repeat(20)}`
                              }
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => toggleSecretVisibility(sub.id)}
                            >
                              {visibleSecrets.has(sub.id) ? (
                                <EyeOff className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(sub.secret)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={sub.is_active ? "default" : "secondary"}
                              className={cn(
                                sub.is_active 
                                  ? "bg-emerald-500/10 text-emerald-500" 
                                  : ""
                              )}
                            >
                              {sub.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {sub.last_status_code && sub.last_status_code >= 400 && (
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {sub.last_triggered_at 
                              ? formatDistanceToNow(new Date(sub.last_triggered_at), { addSuffix: true })
                              : "Never"
                            }
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => sendTestWebhook(sub)}
                              title="Send test webhook"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleWebhookStatus(sub.id, sub.is_active)}
                            >
                              {sub.is_active ? (
                                <XCircle className="w-4 h-4 text-amber-500" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500"
                              onClick={() => deleteWebhook(sub.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Deliveries</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {deliveryLogs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No delivery logs yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Response Time</TableHead>
                      <TableHead>Attempt</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveryLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant="outline">{log.event_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={log.success ? "default" : "destructive"}
                            className={log.success ? "bg-emerald-500/10 text-emerald-500" : ""}
                          >
                            {log.status_code || "Error"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.delivery_time_ms ? `${log.delivery_time_ms}ms` : "-"}
                        </TableCell>
                        <TableCell>#{log.attempt_number}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

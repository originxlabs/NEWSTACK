import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Webhook, Plus, Trash2, Edit, Copy, Eye, EyeOff,
  CheckCircle2, XCircle, Clock, RefreshCw, Send,
  AlertTriangle, ExternalLink, Settings, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface WebhookSubscription {
  id: string;
  webhook_url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  last_triggered_at: string | null;
  last_status_code: number | null;
  last_error: string | null;
  retry_count: number;
  created_at: string;
}

const AVAILABLE_EVENTS = [
  { id: "story.created", name: "Story Created", description: "New story cluster detected" },
  { id: "story.updated", name: "Story Updated", description: "Existing story received new information" },
  { id: "confidence.changed", name: "Confidence Changed", description: "Story confidence level changed" },
  { id: "story.contradicted", name: "Story Contradicted", description: "Conflicting reports detected" },
  { id: "region.hotspot", name: "Region Hotspot", description: "Regional activity threshold crossed" },
];

export function WebhookManagement({ apiKeyId }: { apiKeyId: string }) {
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  // Form state
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch webhooks
  useEffect(() => {
    fetchWebhooks();
  }, [apiKeyId]);

  const fetchWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from("webhook_subscriptions")
        .select("*")
        .eq("api_key_id", apiKeyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWebhooks(data || []);
    } catch (err) {
      console.error("Failed to fetch webhooks:", err);
      toast.error("Failed to load webhooks");
    } finally {
      setIsLoading(false);
    }
  };

  const createWebhook = async () => {
    if (!newWebhookUrl || selectedEvents.length === 0) {
      toast.error("Please provide a URL and select at least one event");
      return;
    }

    try {
      // Validate URL
      new URL(newWebhookUrl);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsCreating(true);
    try {
      // Generate secret using database function
      const { data: secretData, error: secretError } = await supabase.rpc("generate_webhook_secret");
      if (secretError) throw secretError;

      const { data, error } = await supabase
        .from("webhook_subscriptions")
        .insert({
          api_key_id: apiKeyId,
          webhook_url: newWebhookUrl,
          events: selectedEvents,
          secret: secretData,
        })
        .select()
        .single();

      if (error) throw error;

      setWebhooks([data, ...webhooks]);
      setNewWebhookUrl("");
      setSelectedEvents([]);
      setShowCreateDialog(false);
      toast.success("Webhook created successfully!");
    } catch (err) {
      console.error("Failed to create webhook:", err);
      toast.error("Failed to create webhook");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleWebhookStatus = async (webhookId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("webhook_subscriptions")
        .update({ is_active: !currentStatus })
        .eq("id", webhookId);

      if (error) throw error;

      setWebhooks(webhooks.map(w => 
        w.id === webhookId ? { ...w, is_active: !currentStatus } : w
      ));
      toast.success(`Webhook ${!currentStatus ? "activated" : "deactivated"}`);
    } catch (err) {
      console.error("Failed to toggle webhook:", err);
      toast.error("Failed to update webhook");
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    try {
      const { error } = await supabase
        .from("webhook_subscriptions")
        .delete()
        .eq("id", webhookId);

      if (error) throw error;

      setWebhooks(webhooks.filter(w => w.id !== webhookId));
      toast.success("Webhook deleted");
    } catch (err) {
      console.error("Failed to delete webhook:", err);
      toast.error("Failed to delete webhook");
    }
  };

  const testWebhook = async (webhook: WebhookSubscription) => {
    setTestingWebhook(webhook.id);
    try {
      const { data, error } = await supabase.functions.invoke("deliver-webhook", {
        body: {
          subscription_id: webhook.id,
          event_type: "test.ping",
          payload: {
            message: "Test webhook from NEWSTACK",
            timestamp: new Date().toISOString(),
          },
          is_test: true,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Test webhook delivered successfully!");
        fetchWebhooks(); // Refresh to get updated status
      } else {
        toast.error(`Test failed: ${data?.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Failed to test webhook:", err);
      toast.error("Failed to send test webhook");
    } finally {
      setTestingWebhook(null);
    }
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success("Secret copied to clipboard");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Webhook className="w-5 h-5 text-primary" />
            Webhook Subscriptions
          </h3>
          <p className="text-sm text-muted-foreground">
            Receive real-time notifications when stories change
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Webhook</DialogTitle>
              <DialogDescription>
                Set up a new webhook endpoint to receive event notifications.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  placeholder="https://your-app.com/webhooks/newstack"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <Label>Events to Subscribe</Label>
                <div className="space-y-2">
                  {AVAILABLE_EVENTS.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50">
                      <Checkbox
                        id={event.id}
                        checked={selectedEvents.includes(event.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedEvents([...selectedEvents, event.id]);
                          } else {
                            setSelectedEvents(selectedEvents.filter(e => e !== event.id));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <Label htmlFor={event.id} className="font-medium cursor-pointer">
                          {event.name}
                        </Label>
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
              <Button onClick={createWebhook} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Webhook"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webhook List */}
      {webhooks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Webhook className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-semibold mb-2">No Webhooks Yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first webhook to receive real-time event notifications.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <motion.div
              key={webhook.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={cn(
                "transition-colors",
                !webhook.is_active && "opacity-60"
              )}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-sm font-mono truncate bg-muted px-2 py-1 rounded">
                          {webhook.webhook_url}
                        </code>
                        <Badge
                          variant={webhook.is_active ? "default" : "secondary"}
                          className={cn(
                            "flex-shrink-0",
                            webhook.is_active && "bg-emerald-500/10 text-emerald-600"
                          )}
                        >
                          {webhook.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      {/* Events */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>

                      {/* Secret */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-muted-foreground">Secret:</span>
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {showSecret[webhook.id] ? webhook.secret : "whsec_" + "•".repeat(20)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setShowSecret({ ...showSecret, [webhook.id]: !showSecret[webhook.id] })}
                        >
                          {showSecret[webhook.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copySecret(webhook.secret)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {webhook.last_triggered_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Last triggered {formatDistanceToNow(new Date(webhook.last_triggered_at), { addSuffix: true })}
                          </span>
                        )}
                        {webhook.last_status_code && (
                          <span className={cn(
                            "flex items-center gap-1",
                            webhook.last_status_code < 400 ? "text-emerald-600" : "text-destructive"
                          )}>
                            {webhook.last_status_code < 400 ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {webhook.last_status_code}
                          </span>
                        )}
                        {webhook.retry_count > 0 && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <AlertTriangle className="w-3 h-3" />
                            {webhook.retry_count} retries
                          </span>
                        )}
                      </div>
                      
                      {webhook.last_error && (
                        <p className="text-xs text-destructive mt-2 bg-destructive/10 px-2 py-1 rounded">
                          {webhook.last_error}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={webhook.is_active}
                        onCheckedChange={() => toggleWebhookStatus(webhook.id, webhook.is_active)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testWebhook(webhook)}
                        disabled={testingWebhook === webhook.id || !webhook.is_active}
                      >
                        {testingWebhook === webhook.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this webhook subscription. You will no longer receive events at this endpoint.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteWebhook(webhook.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Usage Info */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Webhook Signature Verification
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            All webhook payloads are signed using HMAC SHA-256. Verify signatures using the <code className="bg-muted px-1 rounded">X-NewStack-Signature</code> header.
          </p>
          <pre className="bg-zinc-950 text-zinc-100 p-4 rounded-lg text-xs overflow-x-auto font-mono">
{`const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

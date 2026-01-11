import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Key, Plus, Copy, Eye, EyeOff, Trash2, RefreshCw,
  CheckCircle2, XCircle, Clock, BarChart3, Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  customer_name: string;
  customer_email: string;
  api_key: string;
  plan: string;
  is_active: boolean;
  is_sandbox: boolean;
  requests_limit: number;
  requests_used: number;
  rate_limit_per_second: number;
  allowed_endpoints: string[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  notes: string | null;
}

const PLAN_LIMITS = {
  starter: { requests: 100000, rate: 10, endpoints: ["news"] },
  pro: { requests: 1000000, rate: 50, endpoints: ["news", "world", "places"] },
  enterprise: { requests: 10000000, rate: 200, endpoints: ["news", "world", "places", "streaming", "webhooks"] },
};

export default function NewsroomApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  
  // New key form state
  const [newKey, setNewKey] = useState({
    customer_name: "",
    customer_email: "",
    plan: "starter",
    is_sandbox: false,
    notes: "",
  });

  async function fetchApiKeys() {
    try {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (err) {
      console.error("Failed to fetch API keys:", err);
      toast.error("Failed to load API keys");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchApiKeys();
  }, []);

  async function createApiKey() {
    try {
      // Generate API key using database function
      const { data: keyData, error: keyError } = await supabase
        .rpc("generate_api_key");
      
      if (keyError) throw keyError;

      const planConfig = PLAN_LIMITS[newKey.plan as keyof typeof PLAN_LIMITS];
      
      const { data, error } = await supabase
        .from("api_keys")
        .insert({
          customer_name: newKey.customer_name,
          customer_email: newKey.customer_email,
          api_key: keyData,
          plan: newKey.plan,
          is_sandbox: newKey.is_sandbox,
          requests_limit: planConfig.requests,
          rate_limit_per_second: planConfig.rate,
          allowed_endpoints: planConfig.endpoints,
          notes: newKey.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      setApiKeys([data, ...apiKeys]);
      setShowCreateDialog(false);
      setNewKey({ customer_name: "", customer_email: "", plan: "starter", is_sandbox: false, notes: "" });
      toast.success("API key created successfully");
      
      // Auto-show the new key
      setVisibleKeys(new Set([data.id]));
    } catch (err) {
      console.error("Failed to create API key:", err);
      toast.error("Failed to create API key");
    }
  }

  async function toggleKeyStatus(id: string, isActive: boolean) {
    try {
      const { error } = await supabase
        .from("api_keys")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;

      setApiKeys(apiKeys.map(key => 
        key.id === id ? { ...key, is_active: !isActive } : key
      ));
      toast.success(`API key ${!isActive ? "activated" : "deactivated"}`);
    } catch (err) {
      console.error("Failed to toggle key status:", err);
      toast.error("Failed to update API key");
    }
  }

  async function deleteApiKey(id: string) {
    if (!confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("api_keys")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setApiKeys(apiKeys.filter(key => key.id !== id));
      toast.success("API key deleted");
    } catch (err) {
      console.error("Failed to delete API key:", err);
      toast.error("Failed to delete API key");
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  function toggleKeyVisibility(id: string) {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleKeys(newVisible);
  }

  const filteredKeys = apiKeys.filter(key => 
    key.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    key.customer_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: apiKeys.length,
    active: apiKeys.filter(k => k.is_active).length,
    sandbox: apiKeys.filter(k => k.is_sandbox).length,
    totalRequests: apiKeys.reduce((sum, k) => sum + k.requests_used, 0),
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold mb-2 flex items-center gap-3">
            <Key className="w-6 h-6" />
            API Key Management
          </h1>
          <p className="text-muted-foreground">
            Create and manage API keys for NEWSTACK Intelligence API customers
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input
                  value={newKey.customer_name}
                  onChange={(e) => setNewKey({ ...newKey, customer_name: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <Label>Customer Email</Label>
                <Input
                  type="email"
                  value={newKey.customer_email}
                  onChange={(e) => setNewKey({ ...newKey, customer_email: e.target.value })}
                  placeholder="api@acme.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select
                  value={newKey.plan}
                  onValueChange={(value) => setNewKey({ ...newKey, plan: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter ($299/mo - 100k requests)</SelectItem>
                    <SelectItem value="pro">Pro ($1,200/mo - 1M requests)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (Custom)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Sandbox Mode</Label>
                <Switch
                  checked={newKey.is_sandbox}
                  onCheckedChange={(checked) => setNewKey({ ...newKey, is_sandbox: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={newKey.notes}
                  onChange={(e) => setNewKey({ ...newKey, notes: e.target.value })}
                  placeholder="Internal notes about this customer..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={createApiKey}
                disabled={!newKey.customer_name || !newKey.customer_email}
              >
                Create Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Keys</p>
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
            <div className="text-2xl font-bold text-amber-500">{stats.sandbox}</div>
            <p className="text-xs text-muted-foreground">Sandbox</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total Requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers..."
            className="pl-10"
          />
        </div>
      </div>

      {/* API Keys Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading API keys...
            </div>
          ) : filteredKeys.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No API keys found</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => setShowCreateDialog(true)}
              >
                Create your first API key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{key.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{key.customer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {visibleKeys.has(key.id) 
                            ? key.api_key 
                            : `${key.api_key.substring(0, 8)}${"•".repeat(24)}`
                          }
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleKeyVisibility(key.id)}
                        >
                          {visibleKeys.has(key.id) ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(key.api_key)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {key.plan}
                        </Badge>
                        {key.is_sandbox && (
                          <Badge variant="secondary" className="text-[10px]">
                            Sandbox
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {key.requests_used.toLocaleString()} / {key.requests_limit.toLocaleString()}
                        </p>
                        <div className="w-24 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all",
                              key.requests_used / key.requests_limit > 0.9 
                                ? "bg-red-500" 
                                : key.requests_used / key.requests_limit > 0.7 
                                  ? "bg-amber-500" 
                                  : "bg-emerald-500"
                            )}
                            style={{ width: `${Math.min(100, (key.requests_used / key.requests_limit) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={key.is_active ? "default" : "secondary"}
                        className={cn(
                          key.is_active 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" 
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {key.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {key.last_used_at 
                          ? formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true })
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
                          onClick={() => toggleKeyStatus(key.id, key.is_active)}
                        >
                          {key.is_active ? (
                            <XCircle className="w-4 h-4 text-amber-500" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => deleteApiKey(key.id)}
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

      {/* Domain Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">API Domains</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-mono text-sm">https://api.newstack.online/v1</p>
                <p className="text-xs text-muted-foreground">Sandbox API (testing)</p>
              </div>
              <Badge variant="secondary">Sandbox</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-mono text-sm">https://api.newstack.live/v1</p>
                <p className="text-xs text-muted-foreground">Production API (primary)</p>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-500">Production</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-mono text-sm">https://api.newstack.world/v1</p>
                <p className="text-xs text-muted-foreground">Production API (alternate)</p>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-500">Production</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

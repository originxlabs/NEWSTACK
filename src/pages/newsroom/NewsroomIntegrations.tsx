import { 
  Plug, Code, Webhook, Database, 
  ExternalLink, CheckCircle2, Settings, Key
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const integrations = [
  {
    id: "api",
    name: "REST API",
    description: "Access story intelligence programmatically",
    icon: Code,
    status: "active",
    details: "Full read access to stories, timelines, and confidence data",
  },
  {
    id: "webhooks",
    name: "Webhooks",
    description: "Receive real-time updates for story events",
    icon: Webhook,
    status: "available",
    details: "Push notifications for breaking news, contradictions, and updates",
  },
  {
    id: "database",
    name: "Database Sync",
    description: "Mirror story data to your own systems",
    icon: Database,
    status: "available",
    details: "Scheduled exports or real-time replication",
  },
];

const apiEndpoints = [
  { method: "GET", path: "/api/stories", description: "List all stories" },
  { method: "GET", path: "/api/stories/:id", description: "Get story details" },
  { method: "GET", path: "/api/stories/:id/timeline", description: "Get story timeline" },
  { method: "GET", path: "/api/stories/:id/sources", description: "Get story sources" },
  { method: "GET", path: "/api/breaking", description: "List breaking stories" },
];

export default function NewsroomIntegrations() {
  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold mb-2 flex items-center gap-2">
          <Plug className="w-6 h-6 text-primary" />
          Integrations
        </h1>
        <p className="text-muted-foreground">
          Connect the newsroom to your existing workflows and systems
        </p>
      </div>

      {/* Integration Options */}
      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        {integrations.map((integration) => (
          <Card key={integration.id} className={cn(
            integration.status === "active" && "border-primary/30"
          )}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <integration.icon className="w-8 h-8 text-primary" />
                <Badge 
                  variant={integration.status === "active" ? "default" : "outline"}
                  className={integration.status === "active" ? "bg-emerald-500" : ""}
                >
                  {integration.status === "active" ? "Active" : "Available"}
                </Badge>
              </div>
              <CardTitle className="text-lg mt-4">{integration.name}</CardTitle>
              <CardDescription>{integration.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{integration.details}</p>
              <Button 
                variant={integration.status === "active" ? "outline" : "default"} 
                className="w-full"
              >
                {integration.status === "active" ? "Configure" : "Enable"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Code className="w-5 h-5" />
            API Reference
          </CardTitle>
          <CardDescription>
            Available endpoints for programmatic access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {apiEndpoints.map((endpoint) => (
              <div
                key={endpoint.path}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 font-mono text-sm"
              >
                <Badge 
                  variant="outline" 
                  className={cn(
                    "w-14 justify-center",
                    endpoint.method === "GET" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  )}
                >
                  {endpoint.method}
                </Badge>
                <span className="text-primary">{endpoint.path}</span>
                <span className="text-muted-foreground ml-auto hidden sm:block">
                  {endpoint.description}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-4">
            <Button variant="outline" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              View Full Documentation
            </Button>
            <Button variant="outline" className="gap-2">
              <Key className="w-4 h-4" />
              Manage API Keys
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Key */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Keys
          </CardTitle>
          <CardDescription>
            Manage authentication credentials for API access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Production Key</p>
                <p className="text-sm text-muted-foreground font-mono">
                  ns_live_••••••••••••••••
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/10 text-emerald-600">Active</Badge>
                <Button variant="ghost" size="sm">Reveal</Button>
                <Button variant="ghost" size="sm">Rotate</Button>
              </div>
            </div>
          </div>

          <Button variant="outline" className="mt-4">
            Generate New Key
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

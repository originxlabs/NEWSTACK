import { useState } from "react";
import { 
  Bell, AlertTriangle, Zap, CheckCircle2, 
  Clock, Settings, Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const alertTypes = [
  {
    id: "breaking",
    name: "Breaking News",
    description: "Alert when a story breaks with high velocity",
    icon: Zap,
    color: "text-red-500",
    enabled: true,
  },
  {
    id: "contradiction",
    name: "Contradictions",
    description: "Alert when conflicting reports are detected",
    icon: AlertTriangle,
    color: "text-amber-500",
    enabled: true,
  },
  {
    id: "verified",
    name: "Story Verified",
    description: "Alert when a story reaches high confidence",
    icon: CheckCircle2,
    color: "text-emerald-500",
    enabled: false,
  },
  {
    id: "stale",
    name: "Stale Single Source",
    description: "Alert when single-source stories remain unconfirmed",
    icon: Clock,
    color: "text-blue-500",
    enabled: true,
  },
];

const recentAlerts = [
  {
    id: "1",
    type: "breaking",
    title: "High velocity story detected",
    description: "Multiple sources reporting on new development",
    time: "5 minutes ago",
    read: false,
  },
  {
    id: "2",
    type: "contradiction",
    title: "Conflicting reports detected",
    description: "Sources disagree on key details",
    time: "23 minutes ago",
    read: false,
  },
  {
    id: "3",
    type: "verified",
    title: "Story reached high confidence",
    description: "4+ verified sources now reporting",
    time: "1 hour ago",
    read: true,
  },
];

export default function NewsroomAlerts() {
  const [alerts, setAlerts] = useState(alertTypes);

  const toggleAlert = (id: string) => {
    setAlerts(prev => 
      prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a)
    );
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold mb-2 flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" />
          Alert Center
        </h1>
        <p className="text-muted-foreground">
          Configure notifications for critical editorial events
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Alert Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alert Settings</CardTitle>
            <CardDescription>
              Choose which events trigger notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <alert.icon className={cn("w-5 h-5", alert.color)} />
                  <div>
                    <p className="font-medium">{alert.name}</p>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                  </div>
                </div>
                <Switch
                  checked={alert.enabled}
                  onCheckedChange={() => toggleAlert(alert.id)}
                />
              </div>
            ))}

            <Button variant="outline" className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Add Custom Alert
            </Button>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Alerts</CardTitle>
              <CardDescription>Latest notifications</CardDescription>
            </div>
            <Button variant="ghost" size="sm">Mark all read</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAlerts.map((alert) => {
              const alertConfig = alertTypes.find(a => a.id === alert.type);
              const Icon = alertConfig?.icon || Bell;
              const color = alertConfig?.color || "text-primary";

              return (
                <div
                  key={alert.id}
                  className={cn(
                    "p-4 rounded-lg border transition-colors cursor-pointer",
                    alert.read 
                      ? "border-border bg-transparent" 
                      : "border-primary/20 bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={cn("w-5 h-5 mt-0.5", color)} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{alert.title}</p>
                        {!alert.read && (
                          <Badge variant="outline" className="text-[10px]">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {alert.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {alert.time}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Delivery Settings */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Delivery Preferences</CardTitle>
          <CardDescription>
            How and where you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <Label htmlFor="email-alerts">Email Alerts</Label>
              <Switch id="email-alerts" defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <Label htmlFor="push-alerts">Push Notifications</Label>
              <Switch id="push-alerts" defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <Label htmlFor="slack-alerts">Slack Integration</Label>
              <Switch id="slack-alerts" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

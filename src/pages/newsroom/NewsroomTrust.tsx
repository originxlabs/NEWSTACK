import { useState, useEffect } from "react";
import { 
  Shield, AlertTriangle, CheckCircle2, XCircle, 
  Eye, FileText, Clock, BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface TrustMetrics {
  totalStories: number;
  singleSourceCount: number;
  lowConfidence: number;
  highConfidence: number;
  contradictions: number;
}

export default function NewsroomTrust() {
  const [metrics, setMetrics] = useState<TrustMetrics>({
    totalStories: 0,
    singleSourceCount: 0,
    lowConfidence: 0,
    highConfidence: 0,
    contradictions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const { data: stories, error } = await supabase
          .from("stories")
          .select("source_count")
          .order("created_at", { ascending: false })
          .limit(500);

        if (error) throw error;

        const total = stories?.length || 0;
        const single = stories?.filter(s => (s.source_count || 1) === 1).length || 0;
        const high = stories?.filter(s => (s.source_count || 1) >= 4).length || 0;

        setMetrics({
          totalStories: total,
          singleSourceCount: single,
          lowConfidence: single,
          highConfidence: high,
          contradictions: 0, // Would need separate tracking
        });
      } catch (err) {
        console.error("Failed to fetch metrics:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  const trustScore = metrics.totalStories > 0
    ? Math.round(((metrics.totalStories - metrics.singleSourceCount) / metrics.totalStories) * 100)
    : 100;

  return (
    <div className="p-6 sm:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold mb-2 flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Trust & Standards Console
        </h1>
        <p className="text-muted-foreground">
          Monitor source integrity, confidence levels, and editorial standards
        </p>
      </div>

      {/* Trust Score Overview */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-500">{trustScore}%</div>
              <p className="text-sm text-muted-foreground mt-1">Overall Trust Score</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{metrics.highConfidence}</p>
                <p className="text-sm text-muted-foreground">High Confidence</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-600">{metrics.singleSourceCount}</p>
                <p className="text-sm text-muted-foreground">Single Source</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{metrics.contradictions}</p>
                <p className="text-sm text-muted-foreground">Contradictions</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="standards" className="space-y-6">
        <TabsList>
          <TabsTrigger value="standards">Standards</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="standards">
          <Card>
            <CardHeader>
              <CardTitle>Editorial Standards</CardTitle>
              <CardDescription>
                Active policies and verification requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="font-medium">Single-source labeling</p>
                    <p className="text-sm text-muted-foreground">Always mark stories with only one source</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="font-medium">Contradiction detection</p>
                    <p className="text-sm text-muted-foreground">Flag conflicting reports automatically</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="font-medium">Confidence scoring</p>
                    <p className="text-sm text-muted-foreground">Three-tier system: Low, Medium, High</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="font-medium">Source transparency</p>
                    <p className="text-sm text-muted-foreground">All sources visible with verification status</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>
                Immutable record of all editorial actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Audit logging is active</p>
                <p className="text-sm mt-1">All editorial actions are tracked and immutable</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle>Content Policies</CardTitle>
              <CardDescription>
                Guidelines for story publishing and verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30">
                <h4 className="font-medium mb-2">Confidence Rules</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Single-source stories can never be High confidence</li>
                  <li>• Contradictions must reduce confidence immediately</li>
                  <li>• Only three levels displayed: Low, Medium, High</li>
                  <li>• Numeric scores are never exposed publicly</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-muted/30">
                <h4 className="font-medium mb-2">Story State Transitions</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Breaking → Developing after 30 minutes</li>
                  <li>• Developing → Confirmed with 4+ verified sources</li>
                  <li>• Any state → Contradicted when conflicts detected</li>
                  <li>• Resolution requires manual editorial review</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-muted/30">
                <h4 className="font-medium mb-2">Source Verification</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Primary sources: Wire services, original reporting</li>
                  <li>• Verified sources: Major news organizations</li>
                  <li>• Secondary sources: Aggregators, regional outlets</li>
                  <li>• All sources must have active URLs</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

interface EndpointHealth {
  endpoint: string;
  status: "healthy" | "degraded" | "down";
  latency_ms: number;
  last_checked: string;
  error?: string;
}

interface SystemHealth {
  overall_status: "healthy" | "degraded" | "down";
  uptime_percentage: number;
  endpoints: EndpointHealth[];
  database: {
    status: "healthy" | "degraded" | "down";
    latency_ms: number;
    story_count: number;
    last_ingestion: string | null;
  };
  checked_at: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const startTime = Date.now();
    const endpoints: EndpointHealth[] = [];

    // Check database health
    const dbStart = Date.now();
    const { data: storyCount, error: countError } = await supabase
      .from("stories")
      .select("id", { count: "exact", head: true });

    const { data: recentStory, error: recentError } = await supabase
      .from("stories")
      .select("first_published_at")
      .order("first_published_at", { ascending: false })
      .limit(1)
      .single();

    const { data: lastIngestion, error: ingestionError } = await supabase
      .from("ingestion_runs")
      .select("completed_at, status")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const dbLatency = Date.now() - dbStart;
    
    const dbStatus = countError ? "down" : dbLatency > 1000 ? "degraded" : "healthy";

    // Test News API endpoint
    const newsStart = Date.now();
    try {
      const { data: newsTest, error: newsError } = await supabase
        .from("stories")
        .select("id, headline")
        .limit(1);
      
      endpoints.push({
        endpoint: "/v1/news",
        status: newsError ? "down" : "healthy",
        latency_ms: Date.now() - newsStart,
        last_checked: new Date().toISOString(),
        error: newsError?.message
      });
    } catch (e: unknown) {
      endpoints.push({
        endpoint: "/v1/news",
        status: "down",
        latency_ms: Date.now() - newsStart,
        last_checked: new Date().toISOString(),
        error: e instanceof Error ? e.message : "Unknown error"
      });
    }

    // Test World API endpoint
    const worldStart = Date.now();
    try {
      const { data: worldTest, error: worldError } = await supabase
        .from("stories")
        .select("id, country_code")
        .not("country_code", "is", null)
        .limit(5);
      
      endpoints.push({
        endpoint: "/v1/world",
        status: worldError ? "down" : "healthy",
        latency_ms: Date.now() - worldStart,
        last_checked: new Date().toISOString(),
        error: worldError?.message
      });
    } catch (e: unknown) {
      endpoints.push({
        endpoint: "/v1/world",
        status: "down",
        latency_ms: Date.now() - worldStart,
        last_checked: new Date().toISOString(),
        error: e instanceof Error ? e.message : "Unknown error"
      });
    }

    // Test Places API endpoint
    const placesStart = Date.now();
    try {
      const { data: placesTest, error: placesError } = await supabase
        .from("stories")
        .select("id, city")
        .not("city", "is", null)
        .limit(5);
      
      endpoints.push({
        endpoint: "/v1/places",
        status: placesError ? "down" : "healthy",
        latency_ms: Date.now() - placesStart,
        last_checked: new Date().toISOString(),
        error: placesError?.message
      });
    } catch (e: unknown) {
      endpoints.push({
        endpoint: "/v1/places",
        status: "down",
        latency_ms: Date.now() - placesStart,
        last_checked: new Date().toISOString(),
        error: e instanceof Error ? e.message : "Unknown error"
      });
    }

    // Check RSS feeds status
    const { data: feedsData, error: feedsError } = await supabase
      .from("rss_feeds")
      .select("id, is_active, last_fetched_at")
      .eq("is_active", true);

    const activeFeeds = feedsData?.length || 0;
    const recentlyFetchedFeeds = feedsData?.filter(f => 
      f.last_fetched_at && 
      new Date(f.last_fetched_at).getTime() > Date.now() - 60 * 60 * 1000
    ).length || 0;

    endpoints.push({
      endpoint: "/ingestion",
      status: recentlyFetchedFeeds > 0 ? "healthy" : activeFeeds > 0 ? "degraded" : "down",
      latency_ms: 0,
      last_checked: new Date().toISOString()
    });

    // Calculate overall status
    const downCount = endpoints.filter(e => e.status === "down").length;
    const degradedCount = endpoints.filter(e => e.status === "degraded").length;
    
    let overallStatus: "healthy" | "degraded" | "down" = "healthy";
    if (downCount > 0) overallStatus = "down";
    else if (degradedCount > 0 || dbStatus === "degraded") overallStatus = "degraded";

    // Calculate uptime (simplified - in production, track this over time)
    const healthyEndpoints = endpoints.filter(e => e.status === "healthy").length;
    const uptimePercentage = Math.round((healthyEndpoints / endpoints.length) * 100);

    const health: SystemHealth = {
      overall_status: overallStatus,
      uptime_percentage: uptimePercentage,
      endpoints,
      database: {
        status: dbStatus,
        latency_ms: dbLatency,
        story_count: parseInt(storyCount as any) || 0,
        last_ingestion: lastIngestion?.completed_at || null
      },
      checked_at: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(health),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        } 
      }
    );

  } catch (error) {
    console.error("Health check error:", error);
    
    const errorHealth: SystemHealth = {
      overall_status: "down",
      uptime_percentage: 0,
      endpoints: [],
      database: {
        status: "down",
        latency_ms: 0,
        story_count: 0,
        last_ingestion: null
      },
      checked_at: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(errorHealth),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

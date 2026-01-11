import { useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, FileJson } from "lucide-react";
import { Link } from "react-router-dom";

export default function ApiDocs() {
  const swaggerContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Swagger UI CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css";
    document.head.appendChild(link);

    // Load Swagger UI JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js";
    script.onload = () => {
      if (swaggerContainer.current && (window as any).SwaggerUIBundle) {
        (window as any).SwaggerUIBundle({
          url: "/openapi.yaml",
          dom_id: "#swagger-ui",
          deepLinking: true,
          presets: [
            (window as any).SwaggerUIBundle.presets.apis,
            (window as any).SwaggerUIBundle.SwaggerUIStandalonePreset,
          ],
          plugins: [
            (window as any).SwaggerUIBundle.plugins.DownloadUrl,
          ],
          layout: "StandaloneLayout",
          defaultModelsExpandDepth: 2,
          defaultModelExpandDepth: 2,
          docExpansion: "list",
          filter: true,
          showExtensions: true,
          showCommonExtensions: true,
          tryItOutEnabled: false, // Disable try-it-out since we have our own tester
          syntaxHighlight: {
            activate: true,
            theme: "monokai",
          },
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-14">
        {/* Header Section */}
        <div className="border-b border-border bg-card/50">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link to="/api">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to API
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold">API Documentation</h1>
                  <p className="text-sm text-muted-foreground">
                    Interactive OpenAPI 3.0.3 specification
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <a href="/openapi.yaml" download>
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileJson className="w-4 h-4" />
                    Download Spec
                  </Button>
                </a>
                <Link to="/api">
                  <Button size="sm" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Try API Live
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* API Info Banner */}
        <div className="border-b border-border bg-primary/5">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Base URL:</span>
                <code className="bg-background px-2 py-1 rounded font-mono text-xs">
                  https://api.newstack.online/v1
                </code>
              </div>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="font-medium">Environment:</span>
                <span className="text-muted-foreground">
                  Determined by API key prefix (nsk_test_* or nsk_live_*)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Swagger UI Container */}
        <div 
          ref={swaggerContainer}
          id="swagger-ui" 
          className="swagger-ui-container min-h-[800px]"
        />
      </main>

      <Footer />

      {/* Custom Swagger UI Styling */}
      <style>{`
        .swagger-ui-container {
          padding: 0;
        }
        
        .swagger-ui .topbar {
          display: none;
        }
        
        .swagger-ui .info {
          margin: 20px 0;
        }
        
        .swagger-ui .info .title {
          font-family: inherit;
        }
        
        .swagger-ui .opblock-tag {
          font-family: inherit;
          border-bottom: 1px solid hsl(var(--border));
        }
        
        .swagger-ui .opblock {
          border-radius: 8px;
          border: 1px solid hsl(var(--border));
          margin-bottom: 12px;
        }
        
        .swagger-ui .opblock .opblock-summary {
          border-radius: 8px;
        }
        
        .swagger-ui .opblock.opblock-get {
          border-color: hsl(142 76% 36%);
          background: hsl(142 76% 36% / 0.05);
        }
        
        .swagger-ui .opblock.opblock-get .opblock-summary-method {
          background: hsl(142 76% 36%);
        }
        
        .swagger-ui .opblock.opblock-post {
          border-color: hsl(221 83% 53%);
          background: hsl(221 83% 53% / 0.05);
        }
        
        .swagger-ui .opblock.opblock-post .opblock-summary-method {
          background: hsl(221 83% 53%);
        }
        
        .swagger-ui .opblock.opblock-delete {
          border-color: hsl(0 84% 60%);
          background: hsl(0 84% 60% / 0.05);
        }
        
        .swagger-ui .opblock.opblock-delete .opblock-summary-method {
          background: hsl(0 84% 60%);
        }
        
        .swagger-ui .btn {
          border-radius: 6px;
        }
        
        .swagger-ui select {
          border-radius: 6px;
        }
        
        .swagger-ui input[type=text] {
          border-radius: 6px;
        }
        
        .swagger-ui .model-box {
          border-radius: 8px;
        }
        
        .swagger-ui section.models {
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
        }
        
        .swagger-ui .wrapper {
          max-width: 1200px;
          padding: 0 20px;
        }

        /* Dark mode adjustments */
        .dark .swagger-ui {
          filter: invert(88%) hue-rotate(180deg);
        }
        
        .dark .swagger-ui .opblock-body pre {
          filter: invert(100%) hue-rotate(180deg);
        }
        
        .dark .swagger-ui img {
          filter: invert(100%) hue-rotate(180deg);
        }
      `}</style>
    </div>
  );
}

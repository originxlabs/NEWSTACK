import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(
        generateHtmlPage("Error", "Invalid unsubscribe link. Please try again or contact support.", false),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "text/html" } 
        }
      );
    }

    // Decode the email from the token
    let email: string;
    try {
      email = atob(token);
    } catch {
      return new Response(
        generateHtmlPage("Error", "Invalid unsubscribe link. The link may be corrupted.", false),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "text/html" } 
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        generateHtmlPage("Error", "Invalid email address in unsubscribe link.", false),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "text/html" } 
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update the subscriber to inactive
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .update({ is_active: false })
      .eq("email", email)
      .select()
      .single();

    if (error) {
      console.error("Error unsubscribing:", error);
      
      // Check if the email doesn't exist
      if (error.code === "PGRST116") {
        return new Response(
          generateHtmlPage("Not Found", "This email address is not subscribed to our newsletter.", false),
          { 
            status: 404, 
            headers: { ...corsHeaders, "Content-Type": "text/html" } 
          }
        );
      }
      
      return new Response(
        generateHtmlPage("Error", "Failed to unsubscribe. Please try again later.", false),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "text/html" } 
        }
      );
    }

    console.log(`Successfully unsubscribed: ${email}`);

    return new Response(
      generateHtmlPage(
        "Unsubscribed Successfully", 
        `You have been successfully unsubscribed from NEWSTACK Daily Digest. You will no longer receive our daily email updates.`,
        true,
        email
      ),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "text/html" } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Unsubscribe error:", errorMessage);
    
    return new Response(
      generateHtmlPage("Error", "An unexpected error occurred. Please try again later.", false),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "text/html" } 
      }
    );
  }
});

function generateHtmlPage(title: string, message: string, success: boolean, email?: string): string {
  const iconColor = success ? "#22c55e" : "#ef4444";
  const icon = success 
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - NEWSTACK</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 48px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .icon {
      margin-bottom: 24px;
    }
    h1 {
      font-size: 24px;
      color: #1f2937;
      margin-bottom: 16px;
      font-weight: 700;
    }
    p {
      color: #6b7280;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .email {
      background: #f3f4f6;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      color: #374151;
      margin-bottom: 24px;
      word-break: break-all;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px -10px rgba(99, 102, 241, 0.5);
    }
    .resubscribe {
      margin-top: 24px;
      font-size: 14px;
      color: #9ca3af;
    }
    .resubscribe a {
      color: #6366f1;
      text-decoration: none;
    }
    .resubscribe a:hover {
      text-decoration: underline;
    }
    .logo {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 32px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">📰 NEWSTACK</div>
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    ${email ? `<div class="email">${email}</div>` : ''}
    <a href="https://newstack.app" class="button">Visit NEWSTACK</a>
    ${success ? `
    <p class="resubscribe">
      Changed your mind? <a href="https://newstack.app">Resubscribe anytime</a> on our website.
    </p>
    ` : ''}
  </div>
</body>
</html>
  `;
}

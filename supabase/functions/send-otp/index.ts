import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOtpRequest {
  email: string;
  purpose?: "login" | "signup" | "password_reset" | "email_verification";
}

// Generate a 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, purpose = "login" }: SendOtpRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Invalidate any existing OTPs for this email and purpose
    await supabase
      .from("email_otps")
      .update({ expires_at: new Date().toISOString() })
      .eq("email", email.toLowerCase())
      .eq("purpose", purpose)
      .is("verified_at", null);

    // Generate new OTP
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    const { error: insertError } = await supabase
      .from("email_otps")
      .insert({
        email: email.toLowerCase(),
        otp_code: otpCode,
        purpose,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get purpose-specific content
    const purposeConfig = {
      login: {
        subject: "🔐 Your Newstack Login Code",
        heading: "Sign In to Newstack",
        message: "Use this code to sign in to your Newstack account:",
      },
      signup: {
        subject: "🎉 Welcome to Newstack - Verify Your Email",
        heading: "Verify Your Email",
        message: "Use this code to complete your Newstack registration:",
      },
      password_reset: {
        subject: "🔑 Reset Your Newstack Password",
        heading: "Password Reset",
        message: "Use this code to reset your password:",
      },
      email_verification: {
        subject: "✉️ Verify Your Email - Newstack",
        heading: "Email Verification",
        message: "Use this code to verify your email address:",
      },
    };

    const config = purposeConfig[purpose] || purposeConfig.login;

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Newstack <no-reply@newstack.live>",
      to: [email],
      subject: config.subject,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="max-width: 480px; background: linear-gradient(145deg, #1a1a2e 0%, #0f0f1a 100%); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <div style="font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                NEWSTACK
              </div>
              <div style="color: rgba(255,255,255,0.5); font-size: 12px; margin-top: 4px; letter-spacing: 2px;">
                INTELLIGENT NEWS
              </div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0 0 16px; text-align: center;">
                ${config.heading}
              </h1>
              <p style="color: rgba(255,255,255,0.7); font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                ${config.message}
              </p>
              
              <!-- OTP Code -->
              <div style="background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2)); border: 2px solid rgba(139,92,246,0.3); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 40px; font-weight: 800; letter-spacing: 8px; color: #ffffff; font-family: 'SF Mono', Monaco, 'Courier New', monospace;">
                  ${otpCode}
                </div>
              </div>
              
              <p style="color: rgba(255,255,255,0.5); font-size: 14px; text-align: center; margin: 0;">
                This code expires in <strong style="color: #f59e0b;">10 minutes</strong>
              </p>
            </td>
          </tr>
          
          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: 16px;">
                <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 0; line-height: 1.5;">
                  🔒 <strong>Security tip:</strong> Never share this code with anyone. Newstack will never ask for your code via phone or message.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.05);">
              <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 0; text-align: center; line-height: 1.6;">
                If you didn't request this code, you can safely ignore this email.
                <br><br>
                © ${new Date().getFullYear()} Newstack. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    console.log("OTP email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent successfully",
        expiresAt: expiresAt.toISOString()
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

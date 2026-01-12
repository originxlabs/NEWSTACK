import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email configuration
const FROM_EMAIL = "Newstack <no-reply@newstack.live>";
const SUPPORT_EMAIL = "support@newstack.live";

// Generate email HTML based on type
function generateEmailHTML(type: string, email: string, token: string, tokenHash: string, redirectTo: string): { subject: string; html: string } {
  const currentYear = new Date().getFullYear();
  
  switch (type) {
    case "signup":
      return {
        subject: "Verify your Newstack account",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f4f4f5;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" width="100%" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 32px 40px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">NEWSTACK</h1>
                        <p style="margin: 8px 0 0; color: #a1a1aa; font-size: 14px;">News Intelligence Platform</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 16px; color: #18181b; font-size: 20px; font-weight: 600;">Verify Your Email</h2>
                        <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.5;">
                          Welcome to Newstack! Use the code below to verify your email address.
                        </p>
                        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                          <span style="font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #18181b;">${token}</span>
                        </div>
                        <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.5;">
                          This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #fafafa; padding: 24px 40px; border-top: 1px solid #e4e4e7;">
                        <p style="margin: 0; color: #71717a; font-size: 12px; text-align: center;">
                          © ${currentYear} Newstack. All rights reserved.
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
      };

    case "recovery":
    case "magiclink":
      return {
        subject: type === "recovery" ? "Reset your Newstack password" : "Your Newstack login code",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f4f4f5;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" width="100%" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 32px 40px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">NEWSTACK</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 16px; color: #18181b; font-size: 20px; font-weight: 600;">
                          ${type === "recovery" ? "Reset Your Password" : "Login Code"}
                        </h2>
                        <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.5;">
                          ${type === "recovery" 
                            ? "Use the code below to reset your password." 
                            : "Use this code to sign in to your Newstack account."}
                        </p>
                        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                          <span style="font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #18181b;">${token}</span>
                        </div>
                        <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.5;">
                          This code expires in 10 minutes. If you didn't request this, please ignore this email.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #fafafa; padding: 24px 40px; border-top: 1px solid #e4e4e7;">
                        <p style="margin: 0; color: #71717a; font-size: 12px; text-align: center;">
                          © ${currentYear} Newstack. All rights reserved.
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
      };

    case "email_change":
      return {
        subject: "Confirm your new email address - Newstack",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f4f4f5;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" width="100%" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 32px 40px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">NEWSTACK</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 16px; color: #18181b; font-size: 20px; font-weight: 600;">Confirm Email Change</h2>
                        <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.5;">
                          Use this code to confirm your new email address.
                        </p>
                        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                          <span style="font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #18181b;">${token}</span>
                        </div>
                        <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.5;">
                          If you didn't request this change, please contact ${SUPPORT_EMAIL} immediately.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #fafafa; padding: 24px 40px; border-top: 1px solid #e4e4e7;">
                        <p style="margin: 0; color: #71717a; font-size: 12px; text-align: center;">
                          © ${currentYear} Newstack. All rights reserved.
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
      };

    case "invite":
      return {
        subject: "You've been invited to Newstack",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f4f4f5;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" width="100%" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 32px 40px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">NEWSTACK</h1>
                        <p style="margin: 8px 0 0; color: #a1a1aa; font-size: 14px;">News Intelligence Platform</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 16px; color: #18181b; font-size: 20px; font-weight: 600;">You're Invited! 🎉</h2>
                        <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.5;">
                          You've been invited to join Newstack. Use the code below to get started.
                        </p>
                        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                          <span style="font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #18181b;">${token}</span>
                        </div>
                        <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.5;">
                          This invitation expires in 7 days.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #fafafa; padding: 24px 40px; border-top: 1px solid #e4e4e7;">
                        <p style="margin: 0; color: #71717a; font-size: 12px; text-align: center;">
                          © ${currentYear} Newstack. All rights reserved.
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
      };

    default:
      // Generic OTP email
      return {
        subject: "Your Newstack verification code",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f4f4f5;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" width="100%" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 32px 40px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">NEWSTACK</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 16px; color: #18181b; font-size: 20px; font-weight: 600;">Verification Code</h2>
                        <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.5;">
                          Here's your verification code:
                        </p>
                        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                          <span style="font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #18181b;">${token}</span>
                        </div>
                        <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.5;">
                          This code expires in 10 minutes.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #fafafa; padding: 24px 40px; border-top: 1px solid #e4e4e7;">
                        <p style="margin: 0; color: #71717a; font-size: 12px; text-align: center;">
                          © ${currentYear} Newstack. All rights reserved.
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
      };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Auth hook payload:", JSON.stringify(payload, null, 2));

    // Extract data from Supabase Auth hook payload
    const { user, email_data } = payload;
    const userEmail = user?.email || email_data?.email;
    const emailType = email_data?.email_action_type || payload.email_action_type || "default";
    const token = email_data?.token || payload.token || "";
    const tokenHash = email_data?.token_hash || payload.token_hash || "";
    const redirectTo = email_data?.redirect_to || payload.redirect_to || "https://newstack.live";

    if (!userEmail) {
      console.error("No email found in payload");
      return new Response(
        JSON.stringify({ error: "No email provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending ${emailType} email to ${userEmail} with token: ${token}`);

    const { subject, html } = generateEmailHTML(emailType, userEmail, token, tokenHash, redirectTo);

    const emailResponse = await resend.emails.send({
      from: FROM_EMAIL,
      to: [userEmail],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    // Return success response for Supabase Auth hook
    return new Response(
      JSON.stringify({ 
        success: true, 
        id: (emailResponse as any)?.id || "sent",
        // Tell Supabase we handled the email
        email_sent: true
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("Custom email hook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

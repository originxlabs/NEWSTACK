import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email configuration
const FROM_EMAIL = "Newstack <no-reply@newstack.live>";
const SUPPORT_EMAIL = "support@newstack.live";

// Email templates
const emailTemplates = {
  otp: (otp: string, expiryMinutes: number = 10) => ({
    subject: "Your Newstack Verification Code",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f4f4f5;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" width="100%" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 32px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">NEWSTACK</h1>
                    <p style="margin: 8px 0 0; color: #a1a1aa; font-size: 14px;">News Intelligence Platform</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px; color: #18181b; font-size: 20px; font-weight: 600;">Verification Code</h2>
                    <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.5;">
                      Use the following code to verify your identity. This code will expire in ${expiryMinutes} minutes.
                    </p>
                    <!-- OTP Box -->
                    <div style="background-color: #f4f4f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                      <span style="font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #18181b;">${otp}</span>
                    </div>
                    <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.5;">
                      If you didn't request this code, you can safely ignore this email. Someone may have typed your email address by mistake.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #fafafa; padding: 24px 40px; border-top: 1px solid #e4e4e7;">
                    <p style="margin: 0; color: #71717a; font-size: 12px; text-align: center;">
                      This email was sent by Newstack. Please do not reply to this email.
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
  }),

  welcome: (name: string) => ({
    subject: "Welcome to Newstack - Your News Intelligence Platform",
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
              <table role="presentation" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Welcome to NEWSTACK</h1>
                    <p style="margin: 12px 0 0; color: #a1a1aa; font-size: 16px;">Your trusted source for verified news intelligence</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px; color: #18181b; font-size: 22px; font-weight: 600;">Hello${name ? ` ${name}` : ''}! 👋</h2>
                    <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.6;">
                      Thank you for joining Newstack. We're excited to have you on board!
                    </p>
                    
                    <h3 style="margin: 0 0 16px; color: #18181b; font-size: 18px; font-weight: 600;">What you can do:</h3>
                    <ul style="margin: 0 0 24px; padding-left: 20px; color: #52525b; font-size: 15px; line-height: 1.8;">
                      <li>📰 Access verified news with confidence scores</li>
                      <li>🌍 Explore world intelligence by region</li>
                      <li>📍 Get place-specific news and insights</li>
                      <li>🎧 Listen to news with text-to-speech</li>
                      <li>🔔 Set up personalized alerts</li>
                    </ul>
                    
                    <a href="https://newstack.live" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Start Exploring →
                    </a>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #fafafa; padding: 24px 40px; border-top: 1px solid #e4e4e7;">
                    <p style="margin: 0 0 8px; color: #52525b; font-size: 14px; text-align: center;">
                      Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color: #18181b;">${SUPPORT_EMAIL}</a>
                    </p>
                    <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;">
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
  }),

  passwordReset: (resetLink: string) => ({
    subject: "Reset Your Newstack Password",
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
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 32px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">NEWSTACK</h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px; color: #18181b; font-size: 20px; font-weight: 600;">Reset Your Password</h2>
                    <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.5;">
                      We received a request to reset your password. Click the button below to create a new password. This link will expire in 1 hour.
                    </p>
                    
                    <a href="${resetLink}" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Reset Password
                    </a>
                    
                    <p style="margin: 24px 0 0; color: #71717a; font-size: 14px; line-height: 1.5;">
                      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #fafafa; padding: 24px 40px; border-top: 1px solid #e4e4e7;">
                    <p style="margin: 0; color: #71717a; font-size: 12px; text-align: center;">
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
  }),

  newsroomInvite: (inviterName: string, role: string, inviteLink: string) => ({
    subject: `You've been invited to join Newstack Newsroom`,
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
              <table role="presentation" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">NEWSTACK NEWSROOM</h1>
                    <p style="margin: 8px 0 0; color: #fecaca; font-size: 14px;">Enterprise News Intelligence</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px; color: #18181b; font-size: 20px; font-weight: 600;">You're Invited! 🎉</h2>
                    <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.5;">
                      <strong>${inviterName}</strong> has invited you to join the Newstack Newsroom as a <strong>${role}</strong>.
                    </p>
                    
                    <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                      <p style="margin: 0 0 8px; color: #52525b; font-size: 14px;"><strong>Your Role:</strong> ${role}</p>
                      <p style="margin: 0; color: #71717a; font-size: 13px;">
                        ${role === 'owner' || role === 'superadmin' ? 'Full access to all Newsroom features' :
                          role === 'admin' ? 'Manage API keys, webhooks, and team settings' :
                          role === 'editor' ? 'Create and manage content and alerts' :
                          'View dashboards and analytics'}
                      </p>
                    </div>
                    
                    <a href="${inviteLink}" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Accept Invitation
                    </a>
                    
                    <p style="margin: 24px 0 0; color: #71717a; font-size: 14px; line-height: 1.5;">
                      This invitation will expire in 7 days. If you have questions, contact ${SUPPORT_EMAIL}.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #fafafa; padding: 24px 40px; border-top: 1px solid #e4e4e7;">
                    <p style="margin: 0; color: #71717a; font-size: 12px; text-align: center;">
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
  }),

  apiKeyCreated: (keyName: string, plan: string, maskedKey: string) => ({
    subject: "Your Newstack API Key Has Been Created",
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
              <table role="presentation" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 32px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">NEWSTACK API</h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px; color: #18181b; font-size: 20px; font-weight: 600;">API Key Created 🔑</h2>
                    <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.5;">
                      Your new API key has been successfully created and is ready to use.
                    </p>
                    
                    <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                      <p style="margin: 0 0 8px; color: #52525b; font-size: 14px;"><strong>Key Name:</strong> ${keyName}</p>
                      <p style="margin: 0 0 8px; color: #52525b; font-size: 14px;"><strong>Plan:</strong> ${plan}</p>
                      <p style="margin: 0; color: #52525b; font-size: 14px;"><strong>Key:</strong> <code style="background: #e4e4e7; padding: 2px 6px; border-radius: 4px;">${maskedKey}</code></p>
                    </div>
                    
                    <p style="margin: 0 0 16px; color: #52525b; font-size: 15px; line-height: 1.5;">
                      <strong>Base URL:</strong> <code style="background: #e4e4e7; padding: 2px 6px; border-radius: 4px;">https://api.newstack.online/v1</code>
                    </p>
                    
                    <a href="https://newstack.live/api/docs" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      View API Documentation
                    </a>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #fafafa; padding: 24px 40px; border-top: 1px solid #e4e4e7;">
                    <p style="margin: 0; color: #71717a; font-size: 12px; text-align: center;">
                      Keep your API key secure. Never share it publicly.
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
  }),

  passkey: (passkey: string, purpose: string) => ({
    subject: `Your Newstack ${purpose} Passkey`,
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
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">NEWSTACK NEWSROOM</h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px; color: #18181b; font-size: 20px; font-weight: 600;">${purpose} Passkey</h2>
                    <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.5;">
                      Use this passkey to ${purpose.toLowerCase()}. Keep it secure - you'll need it to access your account.
                    </p>
                    <!-- Passkey Box -->
                    <div style="background-color: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                      <span style="font-family: monospace; font-size: 20px; font-weight: 700; letter-spacing: 2px; color: #dc2626; word-break: break-all;">${passkey}</span>
                    </div>
                    <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.5;">
                      ⚠️ <strong>Important:</strong> Save this passkey securely. You will need it each time you log in to the Newsroom.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #fafafa; padding: 24px 40px; border-top: 1px solid #e4e4e7;">
                    <p style="margin: 0; color: #71717a; font-size: 12px; text-align: center;">
                      This is a secure message from Newstack. Do not share this passkey with anyone.
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
  }),
};

// Email types
type EmailType = "otp" | "welcome" | "passwordReset" | "newsroomInvite" | "apiKeyCreated" | "passkey" | "custom";

interface EmailRequest {
  type: EmailType;
  to: string | string[];
  data?: Record<string, any>;
  // For custom emails
  subject?: string;
  html?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data, subject, html }: EmailRequest = await req.json();

    if (!to) {
      return new Response(
        JSON.stringify({ error: "Recipient email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const recipients = Array.isArray(to) ? to : [to];
    let emailContent: { subject: string; html: string };

    switch (type) {
      case "otp":
        if (!data?.otp) {
          return new Response(
            JSON.stringify({ error: "OTP is required for otp email type" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        emailContent = emailTemplates.otp(data.otp, data.expiryMinutes || 10);
        break;

      case "welcome":
        emailContent = emailTemplates.welcome(data?.name || "");
        break;

      case "passwordReset":
        if (!data?.resetLink) {
          return new Response(
            JSON.stringify({ error: "Reset link is required for passwordReset email type" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        emailContent = emailTemplates.passwordReset(data.resetLink);
        break;

      case "newsroomInvite":
        if (!data?.inviterName || !data?.role || !data?.inviteLink) {
          return new Response(
            JSON.stringify({ error: "inviterName, role, and inviteLink are required for newsroomInvite email type" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        emailContent = emailTemplates.newsroomInvite(data.inviterName, data.role, data.inviteLink);
        break;

      case "apiKeyCreated":
        if (!data?.keyName || !data?.plan || !data?.maskedKey) {
          return new Response(
            JSON.stringify({ error: "keyName, plan, and maskedKey are required for apiKeyCreated email type" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        emailContent = emailTemplates.apiKeyCreated(data.keyName, data.plan, data.maskedKey);
        break;

      case "passkey":
        if (!data?.passkey || !data?.purpose) {
          return new Response(
            JSON.stringify({ error: "passkey and purpose are required for passkey email type" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        emailContent = emailTemplates.passkey(data.passkey, data.purpose);
        break;

      case "custom":
        if (!subject || !html) {
          return new Response(
            JSON.stringify({ error: "subject and html are required for custom email type" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        emailContent = { subject, html };
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown email type: ${type}` }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
    }

    const emailResponse = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipients,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, id: emailResponse.data?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

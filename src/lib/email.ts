import { supabase } from "@/integrations/supabase/client";

export type EmailType = 
  | "otp" 
  | "welcome" 
  | "passwordReset" 
  | "newsroomInvite" 
  | "apiKeyCreated" 
  | "passkey" 
  | "custom";

interface SendEmailParams {
  type: EmailType;
  to: string | string[];
  data?: Record<string, any>;
  subject?: string;
  html?: string;
}

interface SendEmailResponse {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResponse> {
  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: params,
    });

    if (error) {
      console.error("Error sending email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error("Error invoking send-email function:", err);
    return { success: false, error: err.message || "Failed to send email" };
  }
}

// Convenience functions for common email types
export const sendOtpEmail = (to: string, otp: string, expiryMinutes: number = 10) =>
  sendEmail({ type: "otp", to, data: { otp, expiryMinutes } });

export const sendWelcomeEmail = (to: string, name?: string) =>
  sendEmail({ type: "welcome", to, data: { name } });

export const sendPasswordResetEmail = (to: string, resetLink: string) =>
  sendEmail({ type: "passwordReset", to, data: { resetLink } });

export const sendNewsroomInviteEmail = (
  to: string, 
  inviterName: string, 
  role: string, 
  inviteLink: string
) =>
  sendEmail({ 
    type: "newsroomInvite", 
    to, 
    data: { inviterName, role, inviteLink } 
  });

export const sendApiKeyCreatedEmail = (
  to: string, 
  keyName: string, 
  plan: string, 
  maskedKey: string
) =>
  sendEmail({ 
    type: "apiKeyCreated", 
    to, 
    data: { keyName, plan, maskedKey } 
  });

export const sendPasskeyEmail = (to: string, passkey: string, purpose: string) =>
  sendEmail({ type: "passkey", to, data: { passkey, purpose } });

export const sendCustomEmail = (to: string | string[], subject: string, html: string) =>
  sendEmail({ type: "custom", to, subject, html });

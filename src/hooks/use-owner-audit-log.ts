import { supabase } from "@/integrations/supabase/client";

type AuditEventType = 
  | "owner_init_view"
  | "owner_init_otp_request"
  | "owner_init_otp_verify"
  | "owner_init_success"
  | "owner_init_failed"
  | "admin_access_denied";

interface LogOptions {
  email: string;
  eventType: AuditEventType;
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export async function logOwnerAccessAttempt({
  email,
  eventType,
  success = false,
  errorMessage,
  metadata = {},
}: LogOptions): Promise<void> {
  try {
    // Get user agent from navigator
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "unknown";

    await supabase.from("owner_access_logs").insert({
      email: email.toLowerCase(),
      event_type: eventType,
      user_agent: userAgent,
      success,
      error_message: errorMessage,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        url: typeof window !== "undefined" ? window.location.href : undefined,
      },
    });
  } catch (err) {
    console.error("Failed to log owner access attempt:", err);
  }
}

export function useOwnerAuditLog() {
  return {
    logView: (email: string) =>
      logOwnerAccessAttempt({
        email,
        eventType: "owner_init_view",
        success: true,
      }),

    logOtpRequest: (email: string, success: boolean, error?: string) =>
      logOwnerAccessAttempt({
        email,
        eventType: "owner_init_otp_request",
        success,
        errorMessage: error,
      }),

    logOtpVerify: (email: string, success: boolean, error?: string) =>
      logOwnerAccessAttempt({
        email,
        eventType: "owner_init_otp_verify",
        success,
        errorMessage: error,
      }),

    logSuccess: (email: string) =>
      logOwnerAccessAttempt({
        email,
        eventType: "owner_init_success",
        success: true,
      }),

    logFailed: (email: string, error: string) =>
      logOwnerAccessAttempt({
        email,
        eventType: "owner_init_failed",
        success: false,
        errorMessage: error,
      }),

    logAccessDenied: (email: string, role: string | null, page: string) =>
      logOwnerAccessAttempt({
        email,
        eventType: "admin_access_denied",
        success: false,
        errorMessage: `Role '${role}' attempted to access ${page}`,
        metadata: { role, page },
      }),
  };
}
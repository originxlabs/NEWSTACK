import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOtpRequest {
  email: string;
  otp: string;
  purpose?: "login" | "signup" | "password_reset" | "email_verification";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp, purpose = "login" }: VerifyOtpRequest = await req.json();

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: "Email and OTP are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the OTP record
    const { data: otpRecord, error: fetchError } = await supabase
      .from("email_otps")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("purpose", purpose)
      .is("verified_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No valid OTP found. Please request a new code." 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check max attempts
    if (otpRecord.attempts >= otpRecord.max_attempts) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Too many failed attempts. Please request a new code." 
        }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify OTP
    if (otpRecord.otp_code !== otp) {
      // Increment attempts
      await supabase
        .from("email_otps")
        .update({ attempts: otpRecord.attempts + 1 })
        .eq("id", otpRecord.id);

      const remainingAttempts = otpRecord.max_attempts - otpRecord.attempts - 1;
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.` 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark OTP as verified
    await supabase
      .from("email_otps")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", otpRecord.id);

    // For login/signup, create or get user and generate session
    let session = null;
    let user = null;

    if (purpose === "login" || purpose === "signup") {
      // Check if user exists
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const foundUser = existingUser?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );

      if (foundUser) {
        // User exists, generate magic link token for session
        const { data: signInData, error: signInError } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: email.toLowerCase(),
        });

        if (!signInError && signInData) {
          user = foundUser;
          // Return the token for client-side session creation
          session = {
            token_hash: signInData.properties?.hashed_token,
            email: email.toLowerCase(),
            verified: true,
          };
        }
      } else if (purpose === "signup") {
        // Create new user
        const tempPassword = crypto.randomUUID();
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: email.toLowerCase(),
          password: tempPassword,
          email_confirm: true,
        });

        if (!createError && newUser) {
          user = newUser.user;
          
          // Generate session for new user
          const { data: signInData } = await supabase.auth.admin.generateLink({
            type: "magiclink",
            email: email.toLowerCase(),
          });

          if (signInData) {
            session = {
              token_hash: signInData.properties?.hashed_token,
              email: email.toLowerCase(),
              verified: true,
              isNewUser: true,
            };
          }
        }
      } else {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "No account found with this email. Please sign up first." 
          }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP verified successfully",
        session,
        user: user ? { id: user.id, email: user.email } : null,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

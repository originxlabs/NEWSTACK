import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdatePasswordRequest {
  email: string;
  newPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, newPassword }: UpdatePasswordRequest = await req.json();

    if (!email || !newPassword) {
      return new Response(
        JSON.stringify({ error: "Email and new password are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify that there's a recently verified OTP (for password_reset, login, or signup)
    // This allows setting password after verifying any OTP type
    const { data: otpRecord, error: fetchError } = await supabase
      .from("email_otps")
      .select("*")
      .eq("email", email.toLowerCase())
      .in("purpose", ["password_reset", "login", "signup"])
      .not("verified_at", "is", null)
      .gt("verified_at", new Date(Date.now() - 15 * 60 * 1000).toISOString()) // Within last 15 minutes
      .order("verified_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      console.log("OTP lookup failed:", fetchError?.message, "for email:", email.toLowerCase());
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No verified OTP found. Please verify your passkey first." 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Found verified OTP:", otpRecord.id, "purpose:", otpRecord.purpose);

    // Find the user - if they don't exist and this is a signup flow, create them
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    let foundUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    // If user doesn't exist and this was a signup OTP, create the user
    if (!foundUser && otpRecord.purpose === "signup") {
      console.log("Creating new user for signup flow:", email.toLowerCase());
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password: newPassword,
        email_confirm: true,
      });

      if (createError) {
        console.error("Error creating user:", createError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Failed to create account. Please try again." 
          }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      foundUser = newUser?.user;
    }

    if (!foundUser) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No account found with this email." 
        }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update the user's password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      foundUser.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to update password. Please try again." 
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Invalidate the used OTP record
    await supabase
      .from("email_otps")
      .update({ expires_at: new Date().toISOString() })
      .eq("id", otpRecord.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Password updated successfully"
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in update-password function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

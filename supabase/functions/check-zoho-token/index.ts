const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Zoho Token Health Check
 * Tests if the current refresh token can obtain a valid access token.
 * Call manually or via cron to detect token expiry before it breaks invoicing.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("ZOHO_CLIENT_ID");
    const clientSecret = Deno.env.get("ZOHO_CLIENT_SECRET");
    const refreshToken = Deno.env.get("ZOHO_REFRESH_TOKEN");

    if (!clientId || !clientSecret || !refreshToken) {
      return new Response(
        JSON.stringify({ healthy: false, error: "Missing Zoho credentials in secrets" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const params = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch("https://accounts.zoho.in/oauth/v2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await res.json();

    if (data.access_token) {
      console.log("✅ Zoho token is healthy");
      return new Response(
        JSON.stringify({ healthy: true, message: "Zoho refresh token is valid and working" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Token is expired or revoked
    console.error("❌ Zoho token unhealthy:", JSON.stringify(data));

    // Try to send alert email via Brevo
    const brevoKey = Deno.env.get("BREVO_API_KEY");
    if (brevoKey) {
      try {
        await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": brevoKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: { name: "Second Chance", email: "secondchancestorre@gmail.com" },
            to: [{ email: "secondchancestorre@gmail.com", name: "Admin" }],
            subject: "⚠️ URGENT: Zoho Token Expired — Invoices Will Fail",
            htmlContent: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <h1 style="font-size: 24px; margin-bottom: 16px;">⚠️ Zoho Token Expired</h1>
                <p style="color: #666; line-height: 1.6;">
                  The Zoho Books refresh token has expired or been revoked. Invoice generation will fail until this is fixed.
                </p>
                <h3 style="margin-top: 24px;">How to fix:</h3>
                <ol style="color: #666; line-height: 1.8;">
                  <li>Go to <a href="https://api-console.zoho.in">Zoho API Console</a></li>
                  <li>Open your Server-based app</li>
                  <li>Generate a new authorization code with scope: <code>ZohoBooks.fullaccess.all</code></li>
                  <li>Exchange it for a new refresh token</li>
                  <li>Update the <strong>ZOHO_REFRESH_TOKEN</strong> secret in Lovable Cloud</li>
                </ol>
                <p style="color: #999; font-size: 12px; margin-top: 32px;">
                  Zoho error: ${JSON.stringify(data).substring(0, 200)}
                </p>
              </div>
            `,
          }),
        });
        console.log("Alert email sent to admin");
      } catch (emailErr) {
        console.error("Failed to send alert email:", emailErr);
      }
    }

    return new Response(
      JSON.stringify({
        healthy: false,
        error: data.error || "Token refresh failed",
        details: data,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Health check error:", err);
    return new Response(
      JSON.stringify({ healthy: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

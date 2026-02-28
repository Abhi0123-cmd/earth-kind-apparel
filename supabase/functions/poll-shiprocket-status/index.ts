import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SHIPROCKET_BASE = "https://apiv2.shiprocket.in/v1/external";

/**
 * Get a valid Shiprocket token.
 * 1. Try the stored SHIPROCKET_TOKEN first.
 * 2. If expired/invalid, re-login with email/password for a fresh one.
 */
async function getShiprocketToken(): Promise<string> {
  const storedToken = Deno.env.get("SHIPROCKET_TOKEN") || "";
  if (storedToken) {
    const check = await fetch(`${SHIPROCKET_BASE}/account/details`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    });
    if (check.status === 200) {
      console.log("Using stored SHIPROCKET_TOKEN (valid)");
      await check.text();
      return storedToken;
    }
    console.log(`Stored token expired (status ${check.status}), re-authenticating...`);
    await check.text();
  }

  const res = await fetch(`${SHIPROCKET_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: Deno.env.get("SHIPROCKET_EMAIL"),
      password: Deno.env.get("SHIPROCKET_PASSWORD"),
    }),
  });
  const data = await res.json();
  if (!data.token) {
    throw new Error(`Shiprocket auth failed: ${JSON.stringify(data)}`);
  }
  console.log("Re-authenticated with email/password, got fresh token");
  return data.token;
}

function mapShiprocketStatus(statusCode: number): string {
  if (statusCode === 6) return "picked_up";
  if (statusCode === 18 || statusCode === 17) return "in_transit";
  if (statusCode === 21) return "out_for_delivery";
  if (statusCode === 7) return "delivered";
  if (statusCode === 8 || statusCode === 9) return "failed";
  if (statusCode === 13 || statusCode === 14 || statusCode === 15) return "returned";
  return "in_transit";
}

function mapToOrderStatus(shipmentStatus: string): string | null {
  switch (shipmentStatus) {
    case "picked_up":
    case "in_transit":
    case "out_for_delivery":
      return "shipped";
    case "delivered":
      return "delivered";
    default:
      return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: shipments, error: shipErr } = await supabase
      .from("shipments")
      .select("id, order_id, awb_number, status")
      .not("awb_number", "is", null)
      .not("status", "in", '("delivered","failed","returned")');

    if (shipErr) {
      console.error("Error fetching shipments:", shipErr.message);
      return new Response(JSON.stringify({ error: shipErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!shipments || shipments.length === 0) {
      console.log("No active shipments to poll");
      return new Response(JSON.stringify({ ok: true, polled: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = await getShiprocketToken();
    let updated = 0;

    for (const shipment of shipments) {
      try {
        const trackRes = await fetch(
          `${SHIPROCKET_BASE}/courier/track/awb/${shipment.awb_number}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const trackData = await trackRes.json();

        const statusCode =
          trackData?.tracking_data?.shipment_track?.[0]?.current_status_id;

        if (statusCode === undefined) {
          console.log(`No status for AWB ${shipment.awb_number}, skipping`);
          continue;
        }

        const newStatus = mapShiprocketStatus(statusCode);
        if (newStatus === shipment.status) continue;

        const updateData: Record<string, unknown> = { status: newStatus };
        if (newStatus === "picked_up") updateData.shipped_at = new Date().toISOString();
        if (newStatus === "delivered") updateData.delivered_at = new Date().toISOString();

        await supabase
          .from("shipments")
          .update(updateData)
          .eq("id", shipment.id);

        const orderStatus = mapToOrderStatus(newStatus);
        if (orderStatus) {
          await supabase
            .from("orders")
            .update({ status: orderStatus })
            .eq("id", shipment.order_id);
        }

        console.log(`Shipment ${shipment.id} (AWB: ${shipment.awb_number}): ${shipment.status} → ${newStatus}`);
        updated++;
      } catch (trackErr) {
        console.error(`Error tracking AWB ${shipment.awb_number}:`, trackErr);
      }
    }

    console.log(`Polling complete: ${updated}/${shipments.length} shipments updated`);

    return new Response(
      JSON.stringify({ ok: true, polled: shipments.length, updated }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Polling error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

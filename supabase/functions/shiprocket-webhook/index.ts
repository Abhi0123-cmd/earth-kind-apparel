import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map Shiprocket status codes to our shipment_status enum
function mapShiprocketStatus(statusCode: number): string {
  // Shiprocket status codes: https://apidocs.shiprocket.in/#702f7ee4-18c4-4a2f-a39c-8c69cf7a09e6
  if (statusCode === 6) return "picked_up";
  if (statusCode === 18 || statusCode === 17) return "in_transit";
  if (statusCode === 21) return "out_for_delivery";
  if (statusCode === 7) return "delivered";
  if (statusCode === 8 || statusCode === 9) return "failed"; // RTO / cancelled
  if (statusCode === 13 || statusCode === 14 || statusCode === 15) return "returned";
  return "in_transit"; // default for intermediate statuses
}

// Map shipment status to order status
function mapToOrderStatus(shipmentStatus: string): string | null {
  switch (shipmentStatus) {
    case "picked_up":
    case "in_transit":
    case "out_for_delivery":
      return "shipped";
    case "delivered":
      return "delivered";
    case "failed":
    case "returned":
      return null; // don't auto-change order status for these
    default:
      return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await req.json();
    console.log("Shiprocket webhook received:", JSON.stringify(payload));

    const awb = payload.awb || payload.awb_code;
    const statusCode = payload.current_status_id || payload.status_code;
    const currentStatus = payload.current_status;

    if (!awb || statusCode === undefined) {
      console.log("Shiprocket webhook: missing awb or status_code");
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find shipment by AWB
    const { data: shipment, error: shipErr } = await supabase
      .from("shipments")
      .select("id, order_id, status")
      .eq("awb_number", awb)
      .maybeSingle();

    if (shipErr || !shipment) {
      console.log(`Shipment not found for AWB: ${awb}`);
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Skip if already delivered (terminal state)
    if (shipment.status === "delivered") {
      console.log(`Shipment ${shipment.id} already delivered, skipping`);
      return new Response(JSON.stringify({ ok: true, idempotent: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newStatus = mapShiprocketStatus(statusCode);

    // Update shipment
    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === "picked_up") {
      updateData.shipped_at = new Date().toISOString();
    }
    if (newStatus === "delivered") {
      updateData.delivered_at = new Date().toISOString();
    }

    await supabase
      .from("shipments")
      .update(updateData)
      .eq("id", shipment.id);

    // Update order status if applicable
    const orderStatus = mapToOrderStatus(newStatus);
    if (orderStatus) {
      await supabase
        .from("orders")
        .update({ status: orderStatus })
        .eq("id", shipment.order_id);
    }

    console.log(`Shipment ${shipment.id} updated: ${newStatus} (Shiprocket status: ${statusCode} - ${currentStatus})`);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Shiprocket webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

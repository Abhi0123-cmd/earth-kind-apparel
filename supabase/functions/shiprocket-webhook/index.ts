import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

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
    case "failed":
    case "returned":
      return null;
    default:
      return null;
  }
}

function getEmailTemplateForStatus(status: string): { template: string; subject: string } | null {
  switch (status) {
    case "picked_up":
    case "in_transit":
    case "out_for_delivery":
      return { template: "shipping_update", subject: "Your Order Has Been Shipped" };
    case "delivered":
      return { template: "delivery_confirmation", subject: "Your Order Has Been Delivered" };
    default:
      return null;
  }
}

async function sendEmail(
  template: string,
  to: string,
  toName: string,
  subject: string,
  data: Record<string, unknown>
) {
  try {
    const res = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-brevo-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ to, to_name: toName, subject, template, data }),
      }
    );
    const result = await res.json();
    console.log(`Email sent (${template} to ${to}):`, JSON.stringify(result));
  } catch (emailErr) {
    console.error(`Email send failed (${template} to ${to}):`, emailErr);
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

    const { data: shipment, error: shipErr } = await supabase
      .from("shipments")
      .select("id, order_id, status, tracking_number, carrier")
      .eq("awb_number", awb)
      .maybeSingle();

    if (shipErr || !shipment) {
      console.log(`Shipment not found for AWB: ${awb}`);
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (shipment.status === "delivered") {
      console.log(`Shipment ${shipment.id} already delivered, skipping`);
      return new Response(JSON.stringify({ ok: true, idempotent: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newStatus = mapShiprocketStatus(statusCode);

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

    // Send email notification if status changed
    if (newStatus !== shipment.status) {
      const emailInfo = getEmailTemplateForStatus(newStatus);
      if (emailInfo) {
        const { data: order } = await supabase
          .from("orders")
          .select("id, email, shipping_full_name")
          .eq("id", shipment.order_id)
          .single();

        if (order?.email) {
          await sendEmail(
            emailInfo.template,
            order.email,
            order.shipping_full_name || "",
            `${emailInfo.subject} — #${order.id.slice(0, 8).toUpperCase()}`,
            {
              order_id: order.id,
              tracking_number: shipment.tracking_number || awb,
              carrier: shipment.carrier || "Shiprocket",
            }
          );
        }
      }
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

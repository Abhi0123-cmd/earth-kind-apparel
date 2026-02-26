import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-razorpay-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return expected === signature;
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
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;
    const signature = req.headers.get("x-razorpay-signature");
    const rawBody = await req.text();

    if (!signature) {
      console.error("Missing x-razorpay-signature header");
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(rawBody, signature, RAZORPAY_KEY_SECRET);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const entity = payload.payload?.payment?.entity;

    if (!entity) {
      console.log("Webhook event without payment entity:", event);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const gatewayOrderId = entity.order_id;
    const gatewayPaymentId = entity.id;
    const method = entity.method || null;

    // Find the payment record by gateway_order_id
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id, order_id, status")
      .eq("gateway_order_id", gatewayOrderId)
      .single();

    if (paymentError || !payment) {
      console.error("Payment not found for gateway_order_id:", gatewayOrderId);
      // Return 200 to prevent Razorpay from retrying for unknown orders
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency: skip if already in terminal state
    if (payment.status === "captured" || payment.status === "refunded") {
      console.log(`Payment ${payment.id} already ${payment.status}, skipping`);
      return new Response(JSON.stringify({ ok: true, idempotent: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    switch (event) {
      case "payment.captured": {
        await supabase
          .from("payments")
          .update({
            gateway_payment_id: gatewayPaymentId,
            status: "captured",
            method_display: method,
          })
          .eq("id", payment.id);

        await supabase
          .from("orders")
          .update({ status: "paid", payment_id: gatewayPaymentId })
          .eq("id", payment.order_id);

        // Deduct inventory atomically
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("variant_id, quantity")
          .eq("order_id", payment.order_id);

        if (orderItems) {
          for (const item of orderItems) {
            const { error: stockErr } = await supabase.rpc("decrement_stock", {
              p_variant_id: item.variant_id,
              p_quantity: item.quantity,
            });
            if (stockErr) {
              console.error(`Stock decrement failed for variant ${item.variant_id}:`, stockErr.message);
            }
          }
        }

        console.log(`Payment captured + inventory deducted: ${payment.id} for order ${payment.order_id}`);
        break;
      }

      case "payment.failed": {
        await supabase
          .from("payments")
          .update({
            gateway_payment_id: gatewayPaymentId,
            status: "failed",
            method_display: method,
          })
          .eq("id", payment.id);

        // Don't cancel the order — user can retry payment
        console.log(`Payment failed: ${payment.id} for order ${payment.order_id}`);
        break;
      }

      case "refund.created":
      case "refund.processed": {
        const refundEntity = payload.payload?.refund?.entity;
        if (refundEntity) {
          // Check if refund record already exists (idempotency)
          const { data: existingRefund } = await supabase
            .from("refunds")
            .select("id")
            .eq("gateway_refund_id", refundEntity.id)
            .maybeSingle();

          if (!existingRefund) {
            await supabase.from("refunds").insert({
              order_id: payment.order_id,
              amount: Math.round(refundEntity.amount / 100), // paise to rupees
              status: event === "refund.processed" ? "completed" : "processing",
              gateway_refund_id: refundEntity.id,
              reason: refundEntity.notes?.reason || "Razorpay refund",
            });
          } else if (event === "refund.processed") {
            await supabase
              .from("refunds")
              .update({ status: "completed" })
              .eq("gateway_refund_id", refundEntity.id);
          }

          // Update payment status if fully refunded + restore stock
          if (event === "refund.processed") {
            await supabase
              .from("payments")
              .update({ status: "refunded" })
              .eq("id", payment.id);

            await supabase
              .from("orders")
              .update({ status: "refunded" })
              .eq("id", payment.order_id);

            // Restore inventory
            const { data: orderItems } = await supabase
              .from("order_items")
              .select("variant_id, quantity")
              .eq("order_id", payment.order_id);

            if (orderItems) {
              for (const item of orderItems) {
                await supabase.rpc("restore_stock", {
                  p_variant_id: item.variant_id,
                  p_quantity: item.quantity,
                });
              }
            }
          }

          console.log(`Refund ${event}: ${refundEntity.id} for order ${payment.order_id}`);
        }
        break;
      }

      default:
        console.log("Unhandled webhook event:", event);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

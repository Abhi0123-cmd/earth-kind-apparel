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
 * 2. If it's expired / returns 401, re-login with email/password to get a fresh one.
 */
async function getShiprocketToken(): Promise<string> {
  // First try the stored token
  const storedToken = Deno.env.get("SHIPROCKET_TOKEN") || "";
  if (storedToken) {
    // Quick validation: hit a lightweight endpoint
    const check = await fetch(`${SHIPROCKET_BASE}/account/details`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    });
    if (check.status === 200) {
      console.log("Using stored SHIPROCKET_TOKEN (valid)");
      // consume body
      await check.text();
      return storedToken;
    }
    console.log(`Stored token expired/invalid (status ${check.status}), re-authenticating...`);
    await check.text();
  }

  // Fallback: login with email/password to get a fresh token
  const email = Deno.env.get("SHIPROCKET_EMAIL") || "";
  const password = Deno.env.get("SHIPROCKET_PASSWORD") || "";

  const res = await fetch(`${SHIPROCKET_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.token) {
    throw new Error(`Shiprocket auth failed: ${JSON.stringify(data)}`);
  }
  console.log("Re-authenticated with email/password, got fresh token");
  return data.token;
}

async function shiprocketRequest(token: string, path: string, body: Record<string, unknown>) {
  const res = await fetch(`${SHIPROCKET_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return new Response(JSON.stringify({ error: "Missing order_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      console.error("Order not found:", order_id);
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency check
    const { data: existingShipment } = await supabase
      .from("shipments")
      .select("id")
      .eq("order_id", order_id)
      .maybeSingle();

    if (existingShipment) {
      console.log(`Shipment already exists for order ${order_id}, skipping`);
      return new Response(JSON.stringify({ ok: true, idempotent: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_name, quantity, price, sku:variant_label")
      .eq("order_id", order_id);

    if (!orderItems || orderItems.length === 0) {
      return new Response(JSON.stringify({ error: "No order items found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get valid token (auto-regenerates if expired)
    const token = await getShiprocketToken();

    // Build Shiprocket order payload
    const now = new Date();
    const orderDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const shiprocketPayload = {
      order_id: order_id.substring(0, 20),
      order_date: orderDate,
      pickup_location: "Primary",
      billing_customer_name: order.shipping_full_name?.split(" ")[0] || "Customer",
      billing_last_name: order.shipping_full_name?.split(" ").slice(1).join(" ") || "",
      billing_address: order.shipping_address_line_1 || "",
      billing_address_2: order.shipping_address_line_2 || "",
      billing_city: order.shipping_city || "",
      billing_pincode: order.shipping_postal_code || "",
      billing_state: order.shipping_state || "",
      billing_country: order.shipping_country || "India",
      billing_email: order.email || "",
      billing_phone: order.shipping_phone || "",
      shipping_is_billing: true,
      order_items: orderItems.map((item) => ({
        name: item.product_name,
        sku: item.sku || "DEFAULT",
        units: item.quantity,
        selling_price: item.price,
        discount: 0,
        tax: 0,
      })),
      payment_method: "Prepaid",
      sub_total: order.subtotal,
      length: 25,
      breadth: 20,
      height: 5,
      weight: 0.5,
    };

    const createResult = await shiprocketRequest(token, "/orders/create/adhoc", shiprocketPayload);

    if (!createResult.order_id) {
      console.error("Shiprocket order creation failed:", JSON.stringify(createResult));
      return new Response(
        JSON.stringify({ error: "Shiprocket order creation failed", details: createResult }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const shiprocketOrderId = createResult.order_id;
    const shipmentId = createResult.shipment_id;
    console.log(`Shiprocket order created: ${shiprocketOrderId}, shipment: ${shipmentId}`);

    // Request AWB assignment
    let awbNumber: string | null = null;
    let carrier: string | null = null;

    if (shipmentId) {
      const awbResult = await shiprocketRequest(token, "/courier/assign/awb", {
        shipment_id: shipmentId,
      });

      if (awbResult.response?.data?.awb_code) {
        awbNumber = awbResult.response.data.awb_code;
        carrier = awbResult.response.data.courier_name || null;
        console.log(`AWB assigned: ${awbNumber}, carrier: ${carrier}`);

        await shiprocketRequest(token, "/courier/generate/pickup", {
          shipment_id: [shipmentId],
        });
      } else {
        console.warn("AWB assignment failed, will be assigned later:", JSON.stringify(awbResult));
      }
    }

    // Save shipment record
    await supabase.from("shipments").insert({
      order_id: order_id,
      tracking_number: String(shiprocketOrderId),
      awb_number: awbNumber,
      carrier: carrier,
      status: "pending",
    });

    await supabase
      .from("orders")
      .update({ status: "processing", tracking_id: awbNumber })
      .eq("id", order_id);

    return new Response(
      JSON.stringify({
        ok: true,
        shiprocket_order_id: shiprocketOrderId,
        shipment_id: shipmentId,
        awb_number: awbNumber,
        carrier: carrier,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Shiprocket order error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

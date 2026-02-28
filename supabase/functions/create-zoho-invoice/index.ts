import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Zoho OAuth token refresh ────────────────────────────────────────
async function getAccessToken(): Promise<string> {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: Deno.env.get("ZOHO_CLIENT_ID")!,
    client_secret: Deno.env.get("ZOHO_CLIENT_SECRET")!,
    refresh_token: Deno.env.get("ZOHO_REFRESH_TOKEN")!,
  });

  const res = await fetch("https://accounts.zoho.in/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`Zoho token refresh failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

// ── Zoho API helper ─────────────────────────────────────────────────
async function zohoApi(
  token: string,
  method: string,
  path: string,
  body?: Record<string, unknown>
) {
  const orgId = Deno.env.get("ZOHO_ORG_ID")!;
  const url = `https://www.zohoapis.in/books/v3${path}?organization_id=${orgId}`;

  const opts: RequestInit = {
    method,
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const data = await res.json();
  if (data.code !== 0) {
    console.error(`Zoho API error (${path}):`, JSON.stringify(data));
  }
  return data;
}

// ── Find or create Zoho contact ─────────────────────────────────────
async function findOrCreateContact(
  token: string,
  email: string,
  name: string,
  phone?: string
): Promise<string> {
  // Search by email
  const search = await zohoApi(token, "GET", `/contacts?email=${encodeURIComponent(email)}`);
  if (search.contacts?.length > 0) {
    return search.contacts[0].contact_id;
  }

  // Create new contact
  const create = await zohoApi(token, "POST", "/contacts", {
    contact_name: name || email,
    contact_type: "customer",
    email,
    phone: phone || "",
  });

  if (!create.contact?.contact_id) {
    throw new Error(`Failed to create Zoho contact: ${JSON.stringify(create)}`);
  }
  return create.contact.contact_id;
}

// ── Main handler ────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch order + items
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, email, total, subtotal, shipping_cost, shipping_full_name, shipping_phone, shipping_address_line_1, shipping_city, shipping_state, shipping_postal_code")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: items } = await supabase
      .from("order_items")
      .select("product_name, variant_label, quantity, price")
      .eq("order_id", order_id);

    // Get Zoho access token
    const token = await getAccessToken();

    // Find or create customer in Zoho
    const contactId = await findOrCreateContact(
      token,
      order.email || "",
      order.shipping_full_name || "",
      order.shipping_phone || undefined
    );

    // Build line items (price stored in paisa → convert to rupees)
    const lineItems = (items || []).map((item) => ({
      name: `${item.product_name} — ${item.variant_label}`,
      quantity: item.quantity,
      rate: item.price / 100,
    }));

    // Add shipping as a line item if > 0
    if (order.shipping_cost > 0) {
      lineItems.push({
        name: "Shipping",
        quantity: 1,
        rate: order.shipping_cost / 100,
      });
    }

    // Create invoice
    const invoiceRes = await zohoApi(token, "POST", "/invoices", {
      customer_id: contactId,
      reference_number: order.id.slice(0, 8).toUpperCase(),
      line_items: lineItems,
      notes: `Order ${order.id}`,
      is_inclusive_tax: false,
    });

    if (!invoiceRes.invoice?.invoice_id) {
      throw new Error(`Invoice creation failed: ${JSON.stringify(invoiceRes)}`);
    }

    const invoiceId = invoiceRes.invoice.invoice_id;
    console.log(`Zoho invoice created: ${invoiceId} for order ${order_id}`);

    // Mark invoice as sent
    await zohoApi(token, "POST", `/invoices/${invoiceId}/status/sent`);

    return new Response(
      JSON.stringify({ ok: true, invoice_id: invoiceId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Zoho invoice error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const SENDER_EMAIL = "secondchancestorre@gmail.com";
const SENDER_NAME = "Second Chance";

interface EmailRequest {
  to: string;
  to_name?: string;
  subject: string;
  template: "order_confirmation" | "shipping_update" | "delivery_confirmation" | "refund_notification" | "return_update";
  data: Record<string, unknown>;
}

function buildHtml(template: string, data: Record<string, unknown>): string {
  const headerStyle = `style="background:#000;color:#fff;padding:32px 24px;text-align:center;font-family:'Helvetica Neue',Arial,sans-serif"`;
  const bodyStyle = `style="padding:24px;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;line-height:1.6"`;
  const footerStyle = `style="padding:24px;text-align:center;font-size:12px;color:#888;font-family:'Helvetica Neue',Arial,sans-serif"`;
  const btnStyle = `style="display:inline-block;background:#000;color:#fff;padding:12px 32px;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;margin:16px 0"`;

  const header = `<div ${headerStyle}><h1 style="margin:0;font-size:20px;letter-spacing:4px">SECOND CHANCE</h1></div>`;
  const footer = `<div ${footerStyle}><p>Thank you for choosing Second Chance.</p><p style="margin-top:8px">© ${new Date().getFullYear()} Second Chance. All rights reserved.</p></div>`;

  let content = "";

  switch (template) {
    case "order_confirmation": {
      const { order_id, total, items_summary } = data;
      content = `
        <h2 style="font-size:18px;letter-spacing:2px">ORDER CONFIRMED</h2>
        <p>Your order <strong>#${(order_id as string).slice(0, 8).toUpperCase()}</strong> has been placed successfully.</p>
        ${items_summary ? `<div style="background:#f5f5f5;padding:16px;margin:16px 0">${items_summary}</div>` : ""}
        <p><strong>Total: ₹${total}</strong></p>
        <p>We'll notify you once your order is shipped.</p>
      `;
      break;
    }
    case "shipping_update": {
      const { order_id: oid, tracking_number, carrier } = data;
      content = `
        <h2 style="font-size:18px;letter-spacing:2px">ORDER SHIPPED</h2>
        <p>Great news! Your order <strong>#${(oid as string).slice(0, 8).toUpperCase()}</strong> is on its way.</p>
        ${carrier ? `<p>Carrier: <strong>${carrier}</strong></p>` : ""}
        ${tracking_number ? `<p>Tracking Number: <strong>${tracking_number}</strong></p>` : ""}
        <a href="https://earth-kind-apparel.lovable.app/orders" ${btnStyle}>TRACK ORDER</a>
      `;
      break;
    }
    case "delivery_confirmation": {
      const { order_id: did } = data;
      content = `
        <h2 style="font-size:18px;letter-spacing:2px">ORDER DELIVERED</h2>
        <p>Your order <strong>#${(did as string).slice(0, 8).toUpperCase()}</strong> has been delivered.</p>
        <p>We hope you love your purchase! If you have any concerns, don't hesitate to reach out.</p>
        <a href="https://earth-kind-apparel.lovable.app/orders" ${btnStyle}>VIEW ORDER</a>
      `;
      break;
    }
    case "refund_notification": {
      const { order_id: rid, amount, reason } = data;
      content = `
        <h2 style="font-size:18px;letter-spacing:2px">REFUND PROCESSED</h2>
        <p>A refund of <strong>₹${amount}</strong> has been initiated for order <strong>#${(rid as string).slice(0, 8).toUpperCase()}</strong>.</p>
        ${reason ? `<p>Reason: ${reason}</p>` : ""}
        <p>The amount will be credited to your original payment method within 5-7 business days.</p>
      `;
      break;
    }
    case "return_update": {
      const { order_id: retid, status } = data;
      content = `
        <h2 style="font-size:18px;letter-spacing:2px">RETURN UPDATE</h2>
        <p>Your return for order <strong>#${(retid as string).slice(0, 8).toUpperCase()}</strong> has been updated.</p>
        <p>Current status: <strong>${(status as string).replace(/_/g, " ").toUpperCase()}</strong></p>
        <a href="https://earth-kind-apparel.lovable.app/orders" ${btnStyle}>VIEW DETAILS</a>
      `;
      break;
    }
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#ffffff">${header}<div ${bodyStyle}>${content}</div>${footer}</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY not configured");
    }

    const { to, to_name, subject, template, data } = (await req.json()) as EmailRequest;

    if (!to || !subject || !template) {
      return new Response(JSON.stringify({ error: "Missing required fields: to, subject, template" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const htmlContent = buildHtml(template, data || {});

    const brevoPayload = {
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: to, name: to_name || to }],
      subject,
      htmlContent,
    };

    const brevoRes = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(brevoPayload),
    });

    const brevoData = await brevoRes.json();

    if (!brevoRes.ok) {
      console.error("Brevo API error:", brevoData);
      return new Response(JSON.stringify({ error: "Failed to send email", details: brevoData }), {
        status: brevoRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Email sent: ${template} to ${to}`);
    return new Response(JSON.stringify({ success: true, messageId: brevoData.messageId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-brevo-email error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

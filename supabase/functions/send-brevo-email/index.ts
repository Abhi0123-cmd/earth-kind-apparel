import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const SENDER_EMAIL = "secondchancestorre@gmail.com";
const SENDER_NAME = "Second Chance";
const SITE_URL = "https://www.seconddchance.com";
const SUPPORT_EMAIL = "secondchancestorre@gmail.com";
const SUPPORT_PHONE = "+91 80560 66050";

interface EmailAttachment {
  name: string;
  content: string; // base64
}

interface EmailRequest {
  to: string;
  to_name?: string;
  subject: string;
  template:
    | "order_confirmation"
    | "shipping_update"
    | "out_for_delivery"
    | "delivery_confirmation"
    | "refund_notification"
    | "return_update"
    | "return_pickup_scheduled"
    | "return_picked_up"
    | "return_received"
    | "return_completed"
    | "return_rejected"
    | "replacement_update"
    | "invoice";
  data: Record<string, unknown>;
  attachments?: EmailAttachment[];
}

function buildHtml(template: string, data: Record<string, unknown>): string {
  const headerStyle = `style="background:#000;color:#fff;padding:32px 24px;text-align:center;font-family:'Helvetica Neue',Arial,sans-serif"`;
  const bodyStyle = `style="padding:24px;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;line-height:1.6"`;
  const footerStyle = `style="padding:24px;text-align:center;font-size:12px;color:#888;font-family:'Helvetica Neue',Arial,sans-serif;border-top:1px solid #eee;margin-top:24px"`;
  const btnStyle = `style="display:inline-block;background:#000;color:#fff;padding:12px 32px;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;margin:16px 0"`;
  const spamNote = `<p style="background:#f9f9f9;padding:12px 16px;border-left:3px solid #000;margin:20px 0;font-size:13px;color:#555">📧 <strong>Can't find our emails?</strong> Please check your spam or junk folder and mark emails from ${SUPPORT_EMAIL} as "Not Spam" to ensure you receive all updates.</p>`;

  const header = `<div ${headerStyle}><h1 style="margin:0;font-size:20px;letter-spacing:4px">SECOND CHANCE</h1></div>`;
  const footer = `<div ${footerStyle}>
    <p>Thank you for choosing Second Chance.</p>
    <p style="margin-top:12px">For any order-related queries, please reach out to us:</p>
    <p style="margin:4px 0"><strong>Email:</strong> <a href="mailto:${SUPPORT_EMAIL}" style="color:#000">${SUPPORT_EMAIL}</a></p>
    <p style="margin:4px 0"><strong>Phone:</strong> <a href="tel:${SUPPORT_PHONE.replace(/\s/g, '')}" style="color:#000">${SUPPORT_PHONE}</a></p>
    <p style="margin-top:16px;color:#aaa">© ${new Date().getFullYear()} Second Chance. All rights reserved.</p>
  </div>`;

  const orderId = data.order_id ? (data.order_id as string).slice(0, 8).toUpperCase() : "";
  let content = "";

  switch (template) {
    case "order_confirmation": {
      const { total, items_summary } = data;
      const formattedTotal = typeof total === "number" ? `₹${Math.round(total / 100)}` : `₹${total}`;
      content = `
        <h2 style="font-size:18px;letter-spacing:2px">ORDER CONFIRMED</h2>
        <p>Your order <strong>#${orderId}</strong> has been placed successfully.</p>
        ${items_summary ? `<div style="background:#f5f5f5;padding:16px;margin:16px 0">${items_summary}</div>` : ""}
        <p><strong>Total: ${formattedTotal}</strong></p>
        <p>We'll notify you once your order is shipped.</p>
        ${spamNote}
      `;
      break;
    }
    case "shipping_update": {
      const { tracking_number, carrier } = data;
      content = `
        <h2 style="font-size:18px;letter-spacing:2px">YOUR ORDER HAS BEEN SHIPPED</h2>
        <p>Great news! Your order <strong>#${orderId}</strong> is on its way to you.</p>
        ${carrier ? `<p><strong>Carrier:</strong> ${carrier}</p>` : ""}
        ${tracking_number ? `<p><strong>Tracking Number:</strong> ${tracking_number}</p>` : ""}
        <p>You can track your order anytime from your account.</p>
        <a href="${SITE_URL}/orders" ${btnStyle}>TRACK ORDER</a>
        ${spamNote}
      `;
      break;
    }
    case "out_for_delivery": {
      content = `
        <h2 style="font-size:18px;letter-spacing:2px">OUT FOR DELIVERY</h2>
        <p>Your order <strong>#${orderId}</strong> is out for delivery and will reach you today!</p>
        <p>Please ensure someone is available to receive the package.</p>
        <a href="${SITE_URL}/orders" ${btnStyle}>VIEW ORDER</a>
        ${spamNote}
      `;
      break;
    }
    case "delivery_confirmation": {
      content = `
        <h2 style="font-size:18px;letter-spacing:2px">ORDER DELIVERED</h2>
        <p>Your order <strong>#${orderId}</strong> has been delivered successfully.</p>
        <p>We hope you love your purchase! If you have any concerns or need to initiate a return, please visit your orders page.</p>
        <a href="${SITE_URL}/orders" ${btnStyle}>VIEW ORDER</a>
        ${spamNote}
      `;
      break;
    }
    case "refund_notification": {
      const { amount, reason } = data;
      content = `
        <h2 style="font-size:18px;letter-spacing:2px">REFUND PROCESSED</h2>
        <p>A refund of <strong>₹${amount}</strong> has been initiated for order <strong>#${orderId}</strong>.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
        <p>The amount will be credited to your original payment method within 5–7 business days.</p>
        ${spamNote}
      `;
      break;
    }
    case "return_update": {
      const { status } = data;
      content = `
        <h2 style="font-size:18px;letter-spacing:2px">RETURN UPDATE</h2>
        <p>Your return request for order <strong>#${orderId}</strong> has been updated.</p>
        <p>Current status: <strong>${(status as string).replace(/_/g, " ").toUpperCase()}</strong></p>
        <a href="${SITE_URL}/orders" ${btnStyle}>VIEW DETAILS</a>
        ${spamNote}
      `;
      break;
    }
    case "return_pickup_scheduled": {
      content = `
        <h2 style="font-size:18px;letter-spacing:2px">RETURN PICKUP SCHEDULED</h2>
        <p>A pickup has been scheduled for your return on order <strong>#${orderId}</strong>.</p>
        <p>Please keep the item packed and ready. Our courier partner will arrive to collect it soon.</p>
        <a href="${SITE_URL}/orders" ${btnStyle}>VIEW RETURN STATUS</a>
        ${spamNote}
      `;
      break;
    }
    case "return_picked_up": {
      content = `
        <h2 style="font-size:18px;letter-spacing:2px">RETURN PICKED UP</h2>
        <p>Your return for order <strong>#${orderId}</strong> has been picked up by our courier partner.</p>
        <p>We'll inspect the item once it reaches our warehouse and notify you about the next steps.</p>
        <a href="${SITE_URL}/orders" ${btnStyle}>VIEW RETURN STATUS</a>
        ${spamNote}
      `;
      break;
    }
    case "return_received": {
      content = `
        <h2 style="font-size:18px;letter-spacing:2px">RETURN RECEIVED</h2>
        <p>We've received your return for order <strong>#${orderId}</strong> at our warehouse.</p>
        <p>Our team is inspecting the item. You'll receive an update about your refund or replacement shortly.</p>
        <a href="${SITE_URL}/orders" ${btnStyle}>VIEW RETURN STATUS</a>
        ${spamNote}
      `;
      break;
    }
    case "return_completed": {
      content = `
        <h2 style="font-size:18px;letter-spacing:2px">RETURN COMPLETED</h2>
        <p>Your return for order <strong>#${orderId}</strong> has been successfully completed.</p>
        <p>If a refund was applicable, it will be processed to your original payment method within 5–7 business days.</p>
        <a href="${SITE_URL}/orders" ${btnStyle}>VIEW ORDER</a>
        ${spamNote}
      `;
      break;
    }
    case "return_rejected": {
      const { reason: rejReason } = data;
      content = `
        <h2 style="font-size:18px;letter-spacing:2px">RETURN REQUEST UPDATE</h2>
        <p>Unfortunately, your return request for order <strong>#${orderId}</strong> could not be approved.</p>
        ${rejReason ? `<p><strong>Reason:</strong> ${rejReason}</p>` : ""}
        <p>If you have questions, please reach out to our support team.</p>
        <a href="${SITE_URL}/customer-service" ${btnStyle}>CONTACT SUPPORT</a>
        ${spamNote}
      `;
      break;
    }
    case "replacement_update": {
      const { status: repStatus } = data;
      content = `
        <h2 style="font-size:18px;letter-spacing:2px">REPLACEMENT UPDATE</h2>
        <p>Your replacement request for order <strong>#${orderId}</strong> has been updated.</p>
        <p>Current status: <strong>${(repStatus as string || "").replace(/_/g, " ").toUpperCase()}</strong></p>
        <a href="${SITE_URL}/orders" ${btnStyle}>VIEW DETAILS</a>
        ${spamNote}
      `;
      break;
    }
    case "invoice": {
      content = `
        <h2 style="font-size:18px;letter-spacing:2px">YOUR INVOICE</h2>
        <p>Please find attached the invoice for your order <strong>#${orderId}</strong>.</p>
        <p>If you have any questions about this invoice, feel free to reach out to us.</p>
        <a href="${SITE_URL}/orders" ${btnStyle}>VIEW ORDER</a>
        ${spamNote}
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

    const { to, to_name, subject, template, data, attachments } = (await req.json()) as EmailRequest;

    if (!to || !subject || !template) {
      return new Response(JSON.stringify({ error: "Missing required fields: to, subject, template" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const htmlContent = buildHtml(template, data || {});

    const brevoPayload: Record<string, unknown> = {
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: to, name: to_name || to }],
      subject,
      htmlContent,
    };

    if (attachments?.length) {
      brevoPayload.attachment = attachments.map((a) => ({
        name: a.name,
        content: a.content,
      }));
    }

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

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const sections = [
  {
    id: "terms",
    title: "Terms of Service",
    content: `By accessing and using the Second Chance website, you agree to be bound by these Terms of Service. All purchases are subject to product availability. We reserve the right to refuse service to anyone for any reason at any time.

All content on this site including text, graphics, logos, images, and software is the property of Second Chance and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our explicit written permission.

Prices are listed in Indian Rupees (INR) and are subject to change without notice. We make every effort to display accurate pricing, but errors may occur. In such cases, we will notify you before processing your order.`,
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    content: `Second Chance is committed to protecting your personal data. We collect only the minimum information necessary to process your orders:

• Name, email address, and phone number
• Shipping address
• Payment transaction ID (we never store card numbers, CVV, or UPI PINs)

Your data is encrypted in transit (TLS/HTTPS) and at rest. We do not sell or share your personal information with third parties except as necessary to fulfill your orders (e.g., shipping partners).

You have the right to:
• Request a copy of your personal data
• Request deletion of your account and all associated data
• Opt out of marketing communications at any time

For data requests, contact us at secondchancestorre@gmail.com.`,
  },
  {
    id: "shipping",
    title: "Shipping Policy",
    content: `We offer free standard shipping on all domestic orders across India. Orders are typically processed within 1-2 business days and delivered within 5-7 business days.

International shipping is available at calculated rates during checkout. International delivery typically takes 10-15 business days.

Once your order ships, you'll receive a tracking number via email and WhatsApp. You can track your order status at any time through our website.

We are not responsible for delays caused by customs, weather, or carrier issues. If your package is lost or significantly delayed, please contact our support team.`,
  },
  {
    id: "returns",
    title: "Returns & Refund Policy",
    content: `We want you to love your Second Chance purchase. If you're not completely satisfied, you may initiate a return within 15 days of delivery.

Eligibility:
• Item must be unworn, unwashed, and in original condition with tags attached
• Items marked as final sale are not eligible for return

Process:
1. Initiate a return through your order page or contact support
2. Select your reason and upload photos if applicable
3. We'll arrange a pickup from your address
4. Once received and inspected, your refund will be processed within 5-7 business days

Refunds are issued to the original payment method. For replacements, a new shipment will be dispatched once the return is received.

If an order fails due to a system error, payment will be refunded automatically and immediately.`,
  },
  {
    id: "replacement",
    title: "Replacement Policy",
    content: `If you receive a defective, damaged, or incorrect product, you are eligible for a free replacement.

Eligibility:
• Replacement requests must be raised within 7 days of delivery
• The item must not have been altered, washed, or worn beyond initial try-on
• Photo evidence of the defect or issue is required

Process:
1. Go to Customer Service and select "Replacement"
2. Enter your Order ID and describe the issue
3. Our team will review and approve within 24-48 hours
4. A reverse pickup will be arranged at no extra cost
5. Once we receive and verify the returned item, a replacement will be shipped immediately

If the same product/variant is out of stock, we will offer a full refund instead. You will be notified at every step via email.`,
  },
];

export default function Policies() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash.slice(1));
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [hash]);

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-16">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-5xl md:text-7xl mb-8"
        >
          POLICIES
        </motion.h1>

        <nav className="flex flex-wrap gap-2 mb-16">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="text-xs font-body uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 transition-colors"
            >
              {s.title}
            </a>
          ))}
        </nav>

        <div className="space-y-20">
          {sections.map((section) => (
            <motion.section
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="font-display text-3xl mb-6">{section.title}</h2>
              <div className="text-muted-foreground font-body text-sm leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </motion.section>
          ))}
        </div>
      </div>
    </div>
  );
}

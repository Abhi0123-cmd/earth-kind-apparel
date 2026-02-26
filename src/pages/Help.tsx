import { motion } from "framer-motion";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function Help() {
  return (
    <div className="min-h-screen pt-16">
      <div className="relative overflow-hidden bg-primary text-primary-foreground py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto px-6 lg:px-12 text-center"
        >
          <h1 className="font-display text-6xl md:text-8xl mb-6">HELP</h1>
          <p className="font-body text-primary-foreground/70 text-lg">We're here for you</p>
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-12 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <a
            href="mailto:secondchancestorre@gmail.com"
            className="border border-border p-8 hover:bg-secondary transition-colors group"
          >
            <Mail className="w-8 h-8 mb-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <h3 className="font-display text-2xl mb-2">EMAIL</h3>
            <p className="text-muted-foreground font-body text-sm">secondchancestorre@gmail.com</p>
          </a>

          <a
            href="tel:+918056066050"
            className="border border-border p-8 hover:bg-secondary transition-colors group"
          >
            <Phone className="w-8 h-8 mb-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <h3 className="font-display text-2xl mb-2">PHONE</h3>
            <p className="text-muted-foreground font-body text-sm">+91 80560 66050</p>
          </a>

          <Link
            to="/customer-service"
            className="border border-border p-8 hover:bg-secondary transition-colors group"
          >
            <MessageCircle className="w-8 h-8 mb-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <h3 className="font-display text-2xl mb-2">RAISE A QUERY</h3>
            <p className="text-muted-foreground font-body text-sm">Returns, refunds, replacements & support tickets</p>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 border border-border p-8"
        >
          <h3 className="font-display text-2xl mb-4">FREQUENTLY ASKED QUESTIONS</h3>
          <div className="space-y-6 font-body text-sm">
            {[
              { q: "How long does shipping take?", a: "Standard shipping takes 5-7 business days across India." },
              { q: "What is your return policy?", a: "You can initiate a return within 15 days of delivery. Items must be unworn with tags attached." },
              { q: "How do I track my order?", a: "Once shipped, you'll receive a tracking link via email. You can also check your order status on the Orders page." },
            ].map((faq, i) => (
              <div key={i}>
                <p className="font-medium text-foreground mb-1">{faq.q}</p>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

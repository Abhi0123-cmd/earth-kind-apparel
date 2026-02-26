import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

export default function OrderConfirmation() {
  return (
    <div className="min-h-screen pt-16 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg"
      >
        <CheckCircle className="w-16 h-16 mx-auto mb-6 text-success" />
        <h1 className="font-display text-5xl mb-4">ORDER CONFIRMED</h1>
        <p className="text-muted-foreground font-body text-lg mb-2">
          Thank you for shopping with Second Chance.
        </p>
        <p className="text-muted-foreground font-body text-sm mb-8">
          You'll receive a confirmation email and WhatsApp message with your order details and tracking information shortly.
        </p>
        <Link
          to="/shop"
          className="inline-block bg-primary text-primary-foreground px-10 py-4 text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity font-body"
        >
          Continue Shopping
        </Link>
      </motion.div>
    </div>
  );
}

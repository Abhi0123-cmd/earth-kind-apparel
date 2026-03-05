import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function WaitingListConfirmation() {
  return (
    <div className="min-h-screen pt-16 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <CheckCircle className="w-16 h-16 text-success mx-auto mb-6" />
        <h1 className="font-display text-4xl md:text-5xl mb-4">YOU'RE ON THE LIST</h1>
        <p className="text-muted-foreground font-body text-sm mb-2">
          You are now officially on the waiting list. We'll notify you as soon as the product is available for purchase.
        </p>
        <p className="text-muted-foreground font-body text-xs mb-8">
          📧 Please check your email's spam folder for updates on the product's release.
        </p>
        <Link
          to="/shop"
          className="inline-block bg-primary text-primary-foreground px-10 py-4 text-sm font-medium uppercase tracking-widest font-body"
        >
          Continue Browsing
        </Link>
      </div>
    </div>
  );
}

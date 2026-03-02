import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPublicAppUrl } from "@/lib/auth-urls";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getPublicAppUrl()}/reset-password`,
    });

    if (error) {
      const msg = error.message?.toLowerCase() ?? "";
      if (msg.includes("failed to fetch") || msg.includes("network") || msg.includes("fetch")) {
        setError("Unable to reach the server. Please check your connection and try again.");
      } else if (msg.includes("rate limit") || msg.includes("too many")) {
        setError("Too many attempts. Please wait a moment and try again.");
      } else {
        setError(error.message);
      }
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  const inputClass =
    "w-full border border-border bg-background px-4 py-3 text-sm font-body focus:outline-none focus:border-foreground transition-colors";

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link to="/auth" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-body mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>

        <h1 className="font-display text-4xl mb-2">RESET PASSWORD</h1>
        <p className="text-muted-foreground font-body text-sm mb-8">
          Enter your email and we'll send you a link to reset your password.
        </p>

    {sent ? (
          <div className="space-y-2">
            <p className="text-success font-body text-sm">Check your email for a password reset link.</p>
            <p className="text-muted-foreground font-body text-xs">📧 Can't find it? Please check your spam or junk folder and mark emails from secondchancestorre@gmail.com as "Not Spam".</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
            {error && <p className="text-destructive text-sm font-body">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground py-4 text-sm font-medium uppercase tracking-widest font-body disabled:opacity-50">
              {loading ? "..." : "Send Reset Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase v2 puts recovery tokens in the URL hash or as query params
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const hasRecovery = hash.includes("type=recovery") || params.get("type") === "recovery";
    if (!hasRecovery && !hash.includes("access_token")) {
      // No recovery token found — but don't redirect immediately, 
      // Supabase may still be processing the token exchange
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      navigate("/");
    }
    setLoading(false);
  };

  const inputClass =
    "w-full border border-border bg-background px-4 py-3 text-sm font-body focus:outline-none focus:border-foreground transition-colors";

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="font-display text-4xl mb-2">NEW PASSWORD</h1>
        <p className="text-muted-foreground font-body text-sm mb-8">Enter your new password below.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className={inputClass} />
          {error && <p className="text-destructive text-sm font-body">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground py-4 text-sm font-medium uppercase tracking-widest font-body disabled:opacity-50">
            {loading ? "..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Eye, EyeOff } from "lucide-react";
import type { AuthError } from "@supabase/supabase-js";

/** Map Supabase auth error codes/messages to user-friendly text */
function friendlyError(err: AuthError): string {
  const msg = err.message?.toLowerCase() ?? "";
  const status = (err as any).status as number | undefined;

  // Rate limiting
  if (status === 429 || msg.includes("rate limit") || msg.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  // Invalid credentials
  if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials")) {
    return "Incorrect email or password.";
  }

  // Email not confirmed
  if (msg.includes("email not confirmed")) {
    return "Your email hasn't been verified yet. Please check your inbox.";
  }

  // User not found
  if (msg.includes("user not found")) {
    return "No account found with this email.";
  }

  // Signup: user already exists
  if (msg.includes("user already registered") || msg.includes("already been registered")) {
    return "An account with this email already exists. Please sign in instead.";
  }

  // Weak password
  if (msg.includes("password") && (msg.includes("weak") || msg.includes("short") || msg.includes("at least"))) {
    return "Password is too weak. Use at least 6 characters.";
  }

  // Network / fetch failures
  if (msg.includes("failed to fetch") || msg.includes("network") || msg.includes("fetch")) {
    return "Unable to reach the server. Please check your connection and try again.";
  }

  // Fallback
  return err.message || "Something went wrong. Please try again.";
}

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const validatePassword = (pw: string): string[] => {
    const errors: string[] = [];
    if (pw.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(pw)) errors.push("1 uppercase letter");
    if (!/[0-9]/.test(pw)) errors.push("1 number");
    if (!/[^A-Za-z0-9]/.test(pw)) errors.push("1 symbol");
    return errors;
  };

  // No signOut on mount — it triggers a network call that fails if
  // Supabase is briefly unreachable, causing "Unable to reach server".

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (isSignUp) {
      const pwErrors = validatePassword(password);
      if (pwErrors.length > 0) {
        setPasswordErrors(pwErrors);
        setLoading(false);
        return;
      }
      setPasswordErrors([]);
      const { error } = await signUp(email, password, fullName);
      if (error) {
        setError(friendlyError(error as AuthError));
      } else {
        navigate("/verify-email", { state: { email } });
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(friendlyError(error));
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;

        let nextPath = "/";

        if (userId) {
          const { data: hasAdminRole } = await supabase.rpc("has_role", {
            _user_id: userId,
            _role: "admin",
          });

          if (hasAdminRole) nextPath = "/admin";
        }

        navigate(nextPath);
      }
    }
    setLoading(false);
  };

  const inputClass =
    "w-full border border-border bg-background px-4 py-3 text-sm font-body focus:outline-none focus:border-foreground transition-colors";

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="font-display text-4xl md:text-5xl text-center mb-2">
          {isSignUp ? "JOIN US" : "WELCOME BACK"}
        </h1>
        <p className="text-center text-muted-foreground font-body text-sm mb-8">
          {isSignUp ? "Create your Second Chance account" : "Sign in to your account"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <input
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className={inputClass}
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (isSignUp && passwordErrors.length > 0) setPasswordErrors(validatePassword(e.target.value));
              }}
              required
              minLength={8}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {isSignUp && passwordErrors.length > 0 && (
            <div className="text-destructive text-sm font-body space-y-0.5">
              <p className="font-medium">Password must include:</p>
              {passwordErrors.map((e) => <p key={e}>• {e}</p>)}
            </div>
          )}
          {error && <p className="text-destructive text-sm font-body">{error}</p>}
          {message && <p className="text-success text-sm font-body">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-4 text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity font-body disabled:opacity-50"
          >
            {loading ? "..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-body uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          type="button"
          onClick={async () => {
            setError("");
            const { error } = await lovable.auth.signInWithOAuth("google", {
              redirect_uri: window.location.origin,
            });
            if (error) setError(error.message || "Google sign-in failed.");
          }}
          className="w-full flex items-center justify-center gap-3 border border-border py-3 text-sm font-medium font-body uppercase tracking-widest hover:bg-accent transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
              setMessage("");
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body underline"
          >
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>

        {!isSignUp && (
          <div className="mt-2 text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body underline"
            >
              Forgot your password?
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

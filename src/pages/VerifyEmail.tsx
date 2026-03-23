import { useLocation, Link } from "react-router-dom";
import { Mail } from "lucide-react";

export default function VerifyEmail() {
  const location = useLocation();
  const email = location.state?.email || "your email";

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-foreground" />
        </div>
        <h1 className="font-display text-4xl md:text-5xl mb-4">VERIFY EMAIL</h1>
        <p className="text-muted-foreground font-body text-sm leading-relaxed mb-4">
          We've sent a verification link to <span className="text-foreground font-medium">{email}</span>. Please check your <span className="text-foreground font-medium">inbox and spam/junk folder</span> and click the link to complete your registration.
        </p>
        <p className="text-muted-foreground font-body text-xs leading-relaxed mb-8">
          The email may take a few minutes to arrive. If you don't see it in your inbox, be sure to check your spam or junk folder.
        </p>
        <Link
          to="/auth"
          className="inline-block bg-primary text-primary-foreground px-8 py-4 text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity font-body"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}

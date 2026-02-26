import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export function useAdminGuard() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }

    supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data, error }) => {
        if (error) {
          setIsAdmin(false);
          navigate("/");
          return;
        }

        if (data) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          navigate("/");
        }
      });
  }, [user, authLoading, navigate]);

  return { isAdmin, loading: authLoading || isAdmin === null };
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAdminGuard();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return <>{children}</>;
}

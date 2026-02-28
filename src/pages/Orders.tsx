import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Package, ArrowLeft, Loader2 } from "lucide-react";

interface OrderRow {
  id: string;
  status: string;
  total: number;
  created_at: string;
  shipping_full_name: string | null;
}

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("id, status, total, created_at, shipping_full_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders(data || []);
        setLoading(false);
      });
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl mb-4">SIGN IN TO VIEW ORDERS</h1>
          <Link to="/auth" className="inline-block bg-primary text-primary-foreground px-10 py-4 text-sm font-medium uppercase tracking-widest font-body">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-4xl mx-auto px-6 lg:px-12 py-12">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-body mb-8">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
        <h1 className="font-display text-5xl mb-12">YOUR ORDERS</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-body">No orders yet</p>
            <Link to="/shop" className="inline-block mt-4 bg-primary text-primary-foreground px-8 py-3 text-sm uppercase tracking-widest font-body">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order.id} to={`/orders/${order.id}`} className="border border-border p-6 flex justify-between items-center hover:bg-secondary/50 transition-colors group">
                <div>
                  <p className="text-sm font-body font-medium group-hover:underline">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-body font-medium">₹{(order.total / 100).toFixed(0)}</p>
                  <span className="inline-block mt-1 px-3 py-1 text-xs font-body uppercase tracking-wider bg-secondary text-secondary-foreground">
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

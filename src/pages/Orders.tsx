import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Package, ArrowLeft, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

interface OrderRow {
  id: string;
  status: string;
  total: number;
  created_at: string;
  shipping_full_name: string | null;
  email: string | null;
}

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("id, status, total, created_at, shipping_full_name, email")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders(data || []);
        setLoading(false);
      });
  }, [user]);

  const requestInvoice = async (orderId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSendingInvoice(orderId);
    try {
      const { data, error } = await supabase.functions.invoke("create-zoho-invoice", {
        body: { order_id: orderId },
      });
      if (error) throw error;
      toast.success("Invoice sent to your email!");
    } catch (err: any) {
      toast.error("Could not generate invoice. Please try again later.");
      console.error("Invoice error:", err);
    } finally {
      setSendingInvoice(null);
    }
  };

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

  const paidStatuses = ["paid", "processing", "shipped", "delivered"];

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
                <div className="flex items-center gap-4">
                  {paidStatuses.includes(order.status) && (
                    <button
                      onClick={(e) => requestInvoice(order.id, e)}
                      disabled={sendingInvoice === order.id}
                      className="flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      title="Email invoice PDF"
                    >
                      {sendingInvoice === order.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                      Invoice
                    </button>
                  )}
                  <div className="text-right">
                    <p className="text-sm font-body font-medium">₹{(order.total / 100).toFixed(0)}</p>
                    <span className="inline-block mt-1 px-3 py-1 text-xs font-body uppercase tracking-wider bg-secondary text-secondary-foreground">
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

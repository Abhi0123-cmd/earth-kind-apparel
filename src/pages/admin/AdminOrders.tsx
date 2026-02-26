import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/hooks/useAdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-primary/10 text-primary",
  paid: "bg-success/10 text-success",
  processing: "bg-primary/10 text-primary",
  shipped: "bg-primary/10 text-primary",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
  refunded: "bg-muted text-muted-foreground",
  return_requested: "bg-warning/10 text-warning",
  return_approved: "bg-warning/10 text-warning",
  returned: "bg-muted text-muted-foreground",
};

const statusFlow: OrderStatus[] = ["pending", "confirmed", "paid", "processing", "shipped", "delivered"];

function AdminOrdersContent() {
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <h1 className="font-display text-4xl mb-8">ORDERS</h1>

      {(!orders || orders.length === 0) ? (
        <p className="text-muted-foreground font-body">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Order</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Customer</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Total</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Status</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Date</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="py-3 px-2 font-medium">#{order.id.slice(0, 8)}</td>
                  <td className="py-3 px-2">
                    <div>{order.shipping_full_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{order.email || "—"}</div>
                  </td>
                  <td className="py-3 px-2">₹{(order.total / 100).toFixed(0)}</td>
                  <td className="py-3 px-2">
                    <span className={`inline-block px-2 py-1 text-xs uppercase tracking-wider ${statusColors[order.status]}`}>
                      {order.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-2">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus.mutate({ id: order.id, status: e.target.value as OrderStatus })}
                      className="border border-border bg-background px-2 py-1 text-xs font-body focus:outline-none"
                    >
                      {statusFlow.map((s) => (
                        <option key={s} value={s}>{s.replace("_", " ")}</option>
                      ))}
                      <option value="cancelled">cancelled</option>
                      <option value="refunded">refunded</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminOrders() {
  return (
    <AdminGuard>
      <AdminLayout>
        <AdminOrdersContent />
      </AdminLayout>
    </AdminGuard>
  );
}

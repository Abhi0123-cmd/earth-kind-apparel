import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/hooks/useAdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type RefundStatus = Database["public"]["Enums"]["refund_status"];

const refundStatusColors: Record<RefundStatus, string> = {
  pending: "bg-warning/10 text-warning",
  processing: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  failed: "bg-destructive/10 text-destructive",
};

function AdminRefundsContent() {
  const { data: refunds, isLoading } = useQuery({
    queryKey: ["admin-refunds"],
    queryFn: async () => {
      const { data } = await supabase
        .from("refunds")
        .select("*, orders(id, email, shipping_full_name)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const totalRefunded = (refunds || []).filter((r: any) => r.status === "completed").reduce((s: number, r: any) => s + r.amount, 0);

  return (
    <div>
      <h1 className="font-display text-4xl mb-8">REFUNDS</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="border border-border p-4">
          <p className="text-xs text-muted-foreground font-body uppercase tracking-widest">Total Refunded</p>
          <p className="text-2xl font-display mt-1">₹{(totalRefunded / 100).toLocaleString()}</p>
        </div>
        <div className="border border-border p-4">
          <p className="text-xs text-muted-foreground font-body uppercase tracking-widest">Pending Refunds</p>
          <p className="text-2xl font-display mt-1 text-warning">
            {(refunds || []).filter((r: any) => r.status === "pending" || r.status === "processing").length}
          </p>
        </div>
      </div>

      {(!refunds || refunds.length === 0) ? (
        <p className="text-muted-foreground font-body">No refunds yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Refund ID</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Order</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Customer</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Amount</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Reason</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Status</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((refund: any) => (
                <tr key={refund.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="py-3 px-2 font-medium">#{refund.id.slice(0, 8)}</td>
                  <td className="py-3 px-2">#{refund.order_id.slice(0, 8)}</td>
                  <td className="py-3 px-2">{refund.orders?.shipping_full_name || refund.orders?.email || "—"}</td>
                  <td className="py-3 px-2">₹{(refund.amount / 100).toFixed(0)}</td>
                  <td className="py-3 px-2 text-muted-foreground">{refund.reason || "—"}</td>
                  <td className="py-3 px-2">
                    <span className={`inline-block px-2 py-1 text-xs uppercase tracking-wider ${refundStatusColors[refund.status as RefundStatus]}`}>
                      {refund.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">{new Date(refund.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminRefunds() {
  return (
    <AdminGuard>
      <AdminLayout>
        <AdminRefundsContent />
      </AdminLayout>
    </AdminGuard>
  );
}

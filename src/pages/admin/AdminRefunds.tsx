import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/hooks/useAdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { Loader2, Search } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type RefundStatus = Database["public"]["Enums"]["refund_status"];

const refundStatusColors: Record<RefundStatus, string> = {
  pending: "bg-warning/10 text-warning",
  processing: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  failed: "bg-destructive/10 text-destructive",
};

const allRefundStatuses: RefundStatus[] = ["pending", "processing", "completed", "failed"];

function AdminRefundsContent() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  const filtered = (refunds || []).filter((r: any) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.order_id.toLowerCase().includes(q) ||
        (r.orders?.shipping_full_name || "").toLowerCase().includes(q) ||
        (r.orders?.email || "").toLowerCase().includes(q) ||
        (r.reason || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalRefunded = filtered.filter((r: any) => r.status === "completed").reduce((s: number, r: any) => s + r.amount, 0);

  return (
    <div>
      <h1 className="font-display text-4xl mb-6">REFUNDS</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="border border-border p-4">
          <p className="text-xs text-muted-foreground font-body uppercase tracking-widest">Total Refunded</p>
          <p className="text-2xl font-display mt-1">₹{(totalRefunded / 100).toLocaleString()}</p>
        </div>
        <div className="border border-border p-4">
          <p className="text-xs text-muted-foreground font-body uppercase tracking-widest">Pending Refunds</p>
          <p className="text-2xl font-display mt-1 text-warning">
            {filtered.filter((r: any) => r.status === "pending" || r.status === "processing").length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search refunds..."
            className="w-full border border-border bg-background pl-9 pr-3 py-2 text-sm font-body focus:outline-none focus:border-foreground" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-border bg-background px-3 py-2 text-sm font-body focus:outline-none">
          <option value="all">All statuses</option>
          {allRefundStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground font-body">No refunds found.</p>
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
              {filtered.map((refund: any) => (
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
      <p className="text-xs text-muted-foreground font-body mt-4">{filtered.length} of {(refunds || []).length} refunds</p>
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

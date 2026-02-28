import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/hooks/useAdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { logActivity } from "@/lib/activity-log";
import { Loader2, Search, ExternalLink } from "lucide-react";
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

const allStatuses: OrderStatus[] = ["pending", "confirmed", "paid", "processing", "shipped", "delivered", "cancelled", "refunded", "return_requested", "return_approved", "returned"];
const statusFlow: OrderStatus[] = ["pending", "confirmed", "paid", "processing", "shipped", "delivered"];

function AdminOrdersContent() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("processing");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      return data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, oldStatus }: { id: string; status: OrderStatus; oldStatus: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
      await logActivity(`Order status changed`, "order", id, { from: oldStatus, to: status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  const bulkUpdate = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).in("id", ids);
      if (error) throw error;
      for (const id of ids) {
        await logActivity(`Bulk status update`, "order", id, { to: status });
      }
    },
    onSuccess: () => {
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });

  const filtered = (orders || []).filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        (o.shipping_full_name || "").toLowerCase().includes(q) ||
        (o.email || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((o) => o.id)));
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <h1 className="font-display text-4xl mb-6">ORDERS</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders..."
            className="w-full border border-border bg-background pl-9 pr-3 py-2 text-sm font-body focus:outline-none focus:border-foreground"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-border bg-background px-3 py-2 text-sm font-body focus:outline-none"
        >
          <option value="all">All statuses</option>
          {allStatuses.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 border border-border bg-secondary">
          <span className="text-sm font-body font-medium">{selected.size} selected</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as OrderStatus)}
            className="border border-border bg-background px-2 py-1 text-xs font-body"
          >
            {statusFlow.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
            <option value="cancelled">cancelled</option>
          </select>
          <button
            onClick={() => bulkUpdate.mutate({ ids: Array.from(selected), status: bulkStatus })}
            disabled={bulkUpdate.isPending}
            className="bg-primary text-primary-foreground px-4 py-1.5 text-xs font-body uppercase tracking-widest disabled:opacity-50"
          >
            {bulkUpdate.isPending ? "Updating..." : "Apply"}
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-muted-foreground font-body hover:text-foreground ml-auto">
            Clear
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-muted-foreground font-body">No orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-2 w-8">
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="accent-primary" />
                </th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Order</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Customer</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Total</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Status</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Date</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="py-3 px-2">
                    <input type="checkbox" checked={selected.has(order.id)} onChange={() => toggleSelect(order.id)} className="accent-primary" />
                  </td>
                  <td className="py-3 px-2">
                    <Link to={`/admin/orders/${order.id}`} className="font-medium hover:underline inline-flex items-center gap-1">
                      #{order.id.slice(0, 8)} <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                  <td className="py-3 px-2">
                    <div>{order.shipping_full_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{order.email || "—"}</div>
                  </td>
                  <td className="py-3 px-2">₹{(order.total / 100).toFixed(0)}</td>
                  <td className="py-3 px-2">
                    <span className={`inline-block px-2 py-1 text-xs uppercase tracking-wider ${statusColors[order.status]}`}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-2">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus.mutate({ id: order.id, status: e.target.value as OrderStatus, oldStatus: order.status })}
                      className="border border-border bg-background px-2 py-1 text-xs font-body focus:outline-none"
                    >
                      {statusFlow.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
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
      <p className="text-xs text-muted-foreground font-body mt-4">{filtered.length} of {(orders || []).length} orders</p>
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

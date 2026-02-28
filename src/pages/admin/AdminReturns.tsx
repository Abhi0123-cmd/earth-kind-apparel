import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/hooks/useAdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { logActivity } from "@/lib/activity-log";
import { Loader2, Search } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ReturnStatus = Database["public"]["Enums"]["return_status"];

const returnStatusColors: Record<ReturnStatus, string> = {
  requested: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  pickup_scheduled: "bg-primary/10 text-primary",
  picked_up: "bg-primary/10 text-primary",
  received: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
  completed: "bg-muted text-muted-foreground",
};

const allReturnStatuses: ReturnStatus[] = ["requested", "approved", "pickup_scheduled", "picked_up", "received", "rejected", "completed"];

function AdminReturnsContent() {
  const queryClient = useQueryClient();
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<ReturnStatus>("approved");

  const { data: returns, isLoading } = useQuery({
    queryKey: ["admin-returns"],
    queryFn: async () => {
      const { data } = await supabase
        .from("returns")
        .select("*, orders(id, email, shipping_full_name, total)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const updateReturn = useMutation({
    mutationFn: async ({ id, status, admin_notes, oldStatus }: { id: string; status: ReturnStatus; admin_notes?: string; oldStatus?: string }) => {
      const update: any = { status };
      if (admin_notes !== undefined) update.admin_notes = admin_notes;
      const { error } = await supabase.from("returns").update(update).eq("id", id);
      if (error) throw error;
      if (oldStatus && oldStatus !== status) {
        await logActivity("Return status changed", "return", id, { from: oldStatus, to: status });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-returns"] }),
  });

  const bulkUpdate = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: ReturnStatus }) => {
      const { error } = await supabase.from("returns").update({ status }).in("id", ids);
      if (error) throw error;
      for (const id of ids) {
        await logActivity("Bulk return status update", "return", id, { to: status });
      }
    },
    onSuccess: () => {
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
    },
  });

  const filtered = (returns || []).filter((r: any) => {
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

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleAll = () => {
    selected.size === filtered.length ? setSelected(new Set()) : setSelected(new Set(filtered.map((r: any) => r.id)));
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <h1 className="font-display text-4xl mb-6">RETURNS</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search returns..."
            className="w-full border border-border bg-background pl-9 pr-3 py-2 text-sm font-body focus:outline-none focus:border-foreground" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-border bg-background px-3 py-2 text-sm font-body focus:outline-none">
          <option value="all">All statuses</option>
          {allReturnStatuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 border border-border bg-secondary">
          <span className="text-sm font-body font-medium">{selected.size} selected</span>
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as ReturnStatus)}
            className="border border-border bg-background px-2 py-1 text-xs font-body">
            {allReturnStatuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
          <button onClick={() => bulkUpdate.mutate({ ids: Array.from(selected), status: bulkStatus })}
            disabled={bulkUpdate.isPending}
            className="bg-primary text-primary-foreground px-4 py-1.5 text-xs font-body uppercase tracking-widest disabled:opacity-50">
            {bulkUpdate.isPending ? "Updating..." : "Apply"}
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-muted-foreground font-body hover:text-foreground ml-auto">Clear</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-muted-foreground font-body">No return requests found.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((ret: any) => (
            <div key={ret.id} className="border border-border p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={selected.has(ret.id)} onChange={() => toggleSelect(ret.id)} className="accent-primary mt-1" />
                  <div>
                    <p className="text-sm font-body font-medium">Return #{ret.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      Order #{ret.order_id.slice(0, 8)} • {ret.orders?.shipping_full_name || ret.orders?.email || "—"}
                    </p>
                    <p className="text-sm font-body mt-2">{ret.reason || "No reason provided"}</p>
                    {ret.admin_notes && <p className="text-xs text-muted-foreground font-body mt-2 italic">Admin: {ret.admin_notes}</p>}
                    <p className="text-xs text-muted-foreground font-body mt-2">{new Date(ret.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <span className={`inline-block px-2 py-1 text-xs uppercase tracking-wider text-center ${returnStatusColors[ret.status as ReturnStatus]}`}>
                    {ret.status.replace(/_/g, " ")}
                  </span>
                  <select value={ret.status}
                    onChange={(e) => updateReturn.mutate({ id: ret.id, status: e.target.value as ReturnStatus, oldStatus: ret.status })}
                    className="border border-border bg-background px-2 py-1.5 text-xs font-body focus:outline-none">
                    {allReturnStatuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                  </select>
                  <input placeholder="Admin notes..."
                    value={adminNotes[ret.id] ?? ret.admin_notes ?? ""}
                    onChange={(e) => setAdminNotes((p) => ({ ...p, [ret.id]: e.target.value }))}
                    onBlur={() => {
                      const note = adminNotes[ret.id];
                      if (note !== undefined && note !== ret.admin_notes) {
                        updateReturn.mutate({ id: ret.id, status: ret.status, admin_notes: note });
                      }
                    }}
                    className="border border-border bg-background px-2 py-1.5 text-xs font-body focus:outline-none" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground font-body mt-4">{filtered.length} of {(returns || []).length} returns</p>
    </div>
  );
}

export default function AdminReturns() {
  return (
    <AdminGuard>
      <AdminLayout>
        <AdminReturnsContent />
      </AdminLayout>
    </AdminGuard>
  );
}

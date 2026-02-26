import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/hooks/useAdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { Loader2 } from "lucide-react";
import { useState } from "react";
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

function AdminReturnsContent() {
  const queryClient = useQueryClient();
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

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
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: ReturnStatus; admin_notes?: string }) => {
      const update: any = { status };
      if (admin_notes !== undefined) update.admin_notes = admin_notes;
      const { error } = await supabase.from("returns").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-returns"] }),
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <h1 className="font-display text-4xl mb-8">RETURNS</h1>

      {(!returns || returns.length === 0) ? (
        <p className="text-muted-foreground font-body">No return requests yet.</p>
      ) : (
        <div className="space-y-4">
          {returns.map((ret: any) => (
            <div key={ret.id} className="border border-border p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-body font-medium">Return #{ret.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    Order #{ret.order_id.slice(0, 8)} • {ret.orders?.shipping_full_name || ret.orders?.email || "—"}
                  </p>
                  <p className="text-sm font-body mt-2">{ret.reason || "No reason provided"}</p>
                  {ret.admin_notes && (
                    <p className="text-xs text-muted-foreground font-body mt-2 italic">Admin: {ret.admin_notes}</p>
                  )}
                  <p className="text-xs text-muted-foreground font-body mt-2">
                    {new Date(ret.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <span className={`inline-block px-2 py-1 text-xs uppercase tracking-wider text-center ${returnStatusColors[ret.status as ReturnStatus]}`}>
                    {ret.status.replace("_", " ")}
                  </span>
                  <select
                    value={ret.status}
                    onChange={(e) => updateReturn.mutate({ id: ret.id, status: e.target.value as ReturnStatus })}
                    className="border border-border bg-background px-2 py-1.5 text-xs font-body focus:outline-none"
                  >
                    {(["requested", "approved", "pickup_scheduled", "picked_up", "received", "rejected", "completed"] as ReturnStatus[]).map((s) => (
                      <option key={s} value={s}>{s.replace("_", " ")}</option>
                    ))}
                  </select>
                  <input
                    placeholder="Admin notes..."
                    value={adminNotes[ret.id] ?? ret.admin_notes ?? ""}
                    onChange={(e) => setAdminNotes((p) => ({ ...p, [ret.id]: e.target.value }))}
                    onBlur={() => {
                      const note = adminNotes[ret.id];
                      if (note !== undefined && note !== ret.admin_notes) {
                        updateReturn.mutate({ id: ret.id, status: ret.status, admin_notes: note });
                      }
                    }}
                    className="border border-border bg-background px-2 py-1.5 text-xs font-body focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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

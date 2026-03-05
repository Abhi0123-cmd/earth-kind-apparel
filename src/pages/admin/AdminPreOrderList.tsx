import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/hooks/useAdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { Loader2, Download } from "lucide-react";

function PreOrderListContent() {
  const { data: signups, isLoading } = useQuery({
    queryKey: ["admin-pre-order-signups"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pre_order_signups")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const exportCSV = () => {
    if (!signups || signups.length === 0) return;
    const headers = ["Name", "Email", "Phone", "Address", "City", "State", "Postal Code", "Country", "Date"];
    const rows = signups.map((s: any) => [
      s.full_name || "",
      s.email,
      s.phone || "",
      [s.address_line_1, s.address_line_2].filter(Boolean).join(", "),
      s.city || "",
      s.state || "",
      s.postal_code || "",
      s.country || "",
      new Date(s.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c: string) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pre-order-list-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-4xl">PRE-ORDER LIST</h1>
        {signups && signups.length > 0 && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 text-xs font-body uppercase tracking-widest border border-border hover:bg-accent transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        )}
      </div>

      <p className="text-muted-foreground font-body text-sm mb-6">
        {signups?.length || 0} people on the waiting list
      </p>

      {!signups || signups.length === 0 ? (
        <p className="text-muted-foreground font-body">No pre-order signups yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Name</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Email</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Phone</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Address</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">City</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">State</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">PIN</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {signups.map((s: any) => (
                <tr key={s.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="py-3 px-2">{s.full_name || "—"}</td>
                  <td className="py-3 px-2">{s.email}</td>
                  <td className="py-3 px-2">{s.phone || "—"}</td>
                  <td className="py-3 px-2 text-xs">{[s.address_line_1, s.address_line_2].filter(Boolean).join(", ") || "—"}</td>
                  <td className="py-3 px-2">{s.city || "—"}</td>
                  <td className="py-3 px-2">{s.state || "—"}</td>
                  <td className="py-3 px-2">{s.postal_code || "—"}</td>
                  <td className="py-3 px-2 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminPreOrderList() {
  return (
    <AdminGuard>
      <AdminLayout>
        <PreOrderListContent />
      </AdminLayout>
    </AdminGuard>
  );
}

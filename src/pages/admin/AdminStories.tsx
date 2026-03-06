import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/hooks/useAdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { Loader2, Download } from "lucide-react";

function StoriesContent() {
  const { data: stories, isLoading } = useQuery({
    queryKey: ["admin-customer-stories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("customer_stories" as any)
        .select("*")
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const exportCSV = () => {
    if (!stories || stories.length === 0) return;
    const headers = ["Order ID", "Product ID", "Story", "Date"];
    const rows = stories.map((s: any) => [
      s.order_id || "—",
      s.product_id || "",
      `"${(s.story || "").replace(/"/g, '""')}"`,
      new Date(s.created_at).toLocaleDateString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stories-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-4xl">CUSTOMER STORIES</h1>
        {stories && stories.length > 0 && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 text-xs font-body uppercase tracking-widest border border-border hover:bg-accent transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        )}
      </div>

      <p className="text-muted-foreground font-body text-sm mb-6">
        {stories?.length || 0} stories submitted
      </p>

      {!stories || stories.length === 0 ? (
        <p className="text-muted-foreground font-body">No stories submitted yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Order ID</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Story</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {stories.map((s: any) => (
                <tr key={s.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="py-3 px-2 font-mono text-xs">{s.order_id ? s.order_id.slice(0, 8) + "…" : "—"}</td>
                  <td className="py-3 px-2 max-w-md">
                    <p className="line-clamp-3 text-xs">{s.story}</p>
                  </td>
                  <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminStories() {
  return (
    <AdminGuard>
      <AdminLayout>
        <StoriesContent />
      </AdminLayout>
    </AdminGuard>
  );
}

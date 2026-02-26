import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/hooks/useAdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { Loader2, Save } from "lucide-react";
import { useState } from "react";

function AdminInventoryContent() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState(0);

  const { data: variants, isLoading } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_variants")
        .select("*, products(name, slug)")
        .order("product_id")
        .order("color")
        .order("size");
      return data || [];
    },
  });

  const updateStock = useMutation({
    mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
      const { error } = await supabase.from("product_variants").update({ stock }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      setEditingId(null);
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const totalStock = (variants || []).reduce((s, v) => s + v.stock, 0);
  const lowStock = (variants || []).filter((v) => v.stock < 10 && v.stock > 0).length;
  const outOfStock = (variants || []).filter((v) => v.stock === 0).length;

  return (
    <div>
      <h1 className="font-display text-4xl mb-8">INVENTORY</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="border border-border p-4">
          <p className="text-xs text-muted-foreground font-body uppercase tracking-widest">Total Units</p>
          <p className="text-2xl font-display mt-1">{totalStock}</p>
        </div>
        <div className="border border-border p-4">
          <p className="text-xs text-muted-foreground font-body uppercase tracking-widest">Low Stock</p>
          <p className="text-2xl font-display mt-1 text-warning">{lowStock}</p>
        </div>
        <div className="border border-border p-4">
          <p className="text-xs text-muted-foreground font-body uppercase tracking-widest">Out of Stock</p>
          <p className="text-2xl font-display mt-1 text-destructive">{outOfStock}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Product</th>
              <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">SKU</th>
              <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Color</th>
              <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Size</th>
              <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Stock</th>
              <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Status</th>
              <th className="text-left py-3 px-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(variants || []).map((v: any) => (
              <tr key={v.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                <td className="py-3 px-2 font-medium">{v.products?.name || "—"}</td>
                <td className="py-3 px-2 text-muted-foreground">{v.sku}</td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border border-border inline-block" style={{ backgroundColor: v.color_hex }} />
                    {v.color}
                  </div>
                </td>
                <td className="py-3 px-2">{v.size}</td>
                <td className="py-3 px-2">
                  {editingId === v.id ? (
                    <input
                      type="number"
                      value={editStock}
                      onChange={(e) => setEditStock(Number(e.target.value))}
                      className="w-20 border border-border bg-background px-2 py-1 text-sm font-body focus:outline-none"
                      min={0}
                    />
                  ) : (
                    <span className={v.stock === 0 ? "text-destructive font-medium" : v.stock < 10 ? "text-warning font-medium" : ""}>
                      {v.stock}
                    </span>
                  )}
                </td>
                <td className="py-3 px-2">
                  <span className={`inline-block px-2 py-1 text-xs uppercase tracking-wider ${
                    v.stock === 0 ? "bg-destructive/10 text-destructive" : v.stock < 10 ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                  }`}>
                    {v.stock === 0 ? "Out" : v.stock < 10 ? "Low" : "In stock"}
                  </span>
                </td>
                <td className="py-3 px-2">
                  {editingId === v.id ? (
                    <button
                      onClick={() => updateStock.mutate({ id: v.id, stock: editStock })}
                      className="p-1 text-success hover:text-success/80 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => { setEditingId(v.id); setEditStock(v.stock); }}
                      className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminInventory() {
  return (
    <AdminGuard>
      <AdminLayout>
        <AdminInventoryContent />
      </AdminLayout>
    </AdminGuard>
  );
}

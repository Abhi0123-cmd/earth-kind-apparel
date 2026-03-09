import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/hooks/useAdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { ShoppingCart, Package, RotateCcw, CreditCard, MessageSquare, IndianRupee, Loader2, Pencil, Check, X } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  subtitle?: string;
  isEditing?: boolean;
  editValue?: string;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  onChangeValue?: (v: string) => void;
}

function StatCard({ title, value, icon: Icon, subtitle, isEditing, editValue, onEdit, onSave, onCancel, onChangeValue }: StatCardProps) {
  return (
    <div className="border border-border p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground font-body uppercase tracking-widest">{title}</p>
          {isEditing ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={editValue}
                onChange={(e) => onChangeValue?.(e.target.value)}
                className="text-2xl font-display bg-transparent border-b border-foreground outline-none w-full"
                autoFocus
              />
              <button onClick={onSave} className="p-1 text-green-600 hover:text-green-500">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={onCancel} className="p-1 text-destructive hover:text-destructive/80">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2">
              <p className="text-3xl font-display">{value}</p>
              <button onClick={onEdit} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {subtitle && <p className="text-xs text-muted-foreground font-body mt-1">{subtitle}</p>}
        </div>
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
    </div>
  );
}

function DashboardContent() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [orders, returns, refunds, tickets, revenue, products] = await Promise.all([
        supabase.from("orders").select("id, status", { count: "exact" }),
        supabase.from("returns").select("id", { count: "exact" }),
        supabase.from("refunds").select("id", { count: "exact" }),
        supabase.from("support_tickets").select("id, status", { count: "exact" }),
        supabase.from("orders").select("total").in("status", ["paid", "processing", "shipped", "delivered"]),
        supabase.from("products").select("id", { count: "exact" }).eq("is_active", true),
      ]);

      const totalRevenue = (revenue.data || []).reduce((s, o) => s + o.total, 0);
      const pendingOrders = (orders.data || []).filter((o) => ["pending", "confirmed", "paid", "processing"].includes(o.status)).length;
      const openTickets = (tickets.data || []).filter((t) => ["open", "in_progress"].includes(t.status)).length;

      return {
        totalOrders: orders.count || 0,
        pendingOrders,
        totalReturns: returns.count || 0,
        totalRefunds: refunds.count || 0,
        openTickets,
        totalRevenue,
        activeProducts: products.count || 0,
      };
    },
  });

  const { data: activityLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["admin-activity-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  // Editable overrides stored locally per session
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState("");

  const getDisplayValue = (key: string, original: string | number) => {
    return overrides[key] !== undefined ? overrides[key] : String(original);
  };

  const startEdit = (key: string, currentDisplay: string) => {
    setEditing(key);
    setEditBuffer(currentDisplay);
  };

  const saveEdit = (key: string) => {
    setOverrides((prev) => ({ ...prev, [key]: editBuffer }));
    setEditing(null);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditBuffer("");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const revenueDisplay = `₹${((stats?.totalRevenue || 0) / 100).toLocaleString()}`;

  const cards = [
    { key: "revenue", title: "Total Revenue", value: revenueDisplay, icon: IndianRupee },
    { key: "orders", title: "Total Orders", value: stats?.totalOrders || 0, icon: ShoppingCart, subtitle: `${stats?.pendingOrders || 0} pending` },
    { key: "returns", title: "Returns", value: stats?.totalReturns || 0, icon: RotateCcw },
    { key: "refunds", title: "Refunds", value: stats?.totalRefunds || 0, icon: CreditCard },
    { key: "tickets", title: "Open Tickets", value: stats?.openTickets || 0, icon: MessageSquare },
    { key: "products", title: "Products", value: stats?.activeProducts || 0, icon: Package, subtitle: "Active in catalog" },
  ];

  return (
    <div>
      <h1 className="font-display text-4xl mb-8">DASHBOARD</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => {
          const displayed = getDisplayValue(c.key, c.value);
          return (
            <StatCard
              key={c.key}
              title={c.title}
              value={displayed}
              icon={c.icon}
              subtitle={c.subtitle}
              isEditing={editing === c.key}
              editValue={editBuffer}
              onEdit={() => startEdit(c.key, displayed)}
              onSave={() => saveEdit(c.key)}
              onCancel={cancelEdit}
              onChangeValue={setEditBuffer}
            />
          );
        })}
      </div>

      <div className="mt-12">
        <h2 className="font-display text-2xl mb-4">RECENT ACTIVITY</h2>
        {logsLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        ) : !activityLogs || activityLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body">No activity yet. Actions like status updates will appear here.</p>
        ) : (
          <div className="space-y-2">
            {activityLogs.map((log) => {
              const meta = log.metadata as Record<string, any> | null;
              return (
                <div key={log.id} className="border border-border px-4 py-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-body font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">
                      {log.entity_type && <span className="uppercase">{log.entity_type}</span>}
                      {log.entity_id && <span> #{log.entity_id.slice(0, 8)}</span>}
                      {meta?.from && meta?.to && (
                        <span> — {String(meta.from).replace(/_/g, " ")} → {String(meta.to).replace(/_/g, " ")}</span>
                      )}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-body whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminGuard>
      <AdminLayout>
        <DashboardContent />
      </AdminLayout>
    </AdminGuard>
  );
}

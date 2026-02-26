import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/hooks/useAdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { ShoppingCart, Package, RotateCcw, CreditCard, MessageSquare, IndianRupee } from "lucide-react";
import { Loader2 } from "lucide-react";

function StatCard({ title, value, icon: Icon, subtitle }: { title: string; value: string | number; icon: any; subtitle?: string }) {
  return (
    <div className="border border-border p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-body uppercase tracking-widest">{title}</p>
          <p className="text-3xl font-display mt-2">{value}</p>
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
      const [orders, returns, refunds, tickets, revenue] = await Promise.all([
        supabase.from("orders").select("id, status", { count: "exact" }),
        supabase.from("returns").select("id", { count: "exact" }),
        supabase.from("refunds").select("id", { count: "exact" }),
        supabase.from("support_tickets").select("id, status", { count: "exact" }),
        supabase.from("orders").select("total").in("status", ["paid", "processing", "shipped", "delivered"]),
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
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-4xl mb-8">DASHBOARD</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Revenue" value={`₹${((stats?.totalRevenue || 0) / 100).toLocaleString()}`} icon={IndianRupee} />
        <StatCard title="Total Orders" value={stats?.totalOrders || 0} icon={ShoppingCart} subtitle={`${stats?.pendingOrders || 0} pending`} />
        <StatCard title="Returns" value={stats?.totalReturns || 0} icon={RotateCcw} />
        <StatCard title="Refunds" value={stats?.totalRefunds || 0} icon={CreditCard} />
        <StatCard title="Open Tickets" value={stats?.openTickets || 0} icon={MessageSquare} />
        <StatCard title="Products" value="1" icon={Package} subtitle="Active in catalog" />
      </div>

      <div className="mt-12">
        <h2 className="font-display text-2xl mb-4">RECENT ACTIVITY</h2>
        <p className="text-sm text-muted-foreground font-body">Activity logs will appear here as orders come in.</p>
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

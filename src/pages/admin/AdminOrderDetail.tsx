import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/hooks/useAdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { Loader2, ArrowLeft } from "lucide-react";

function AdminOrderDetailContent() {
  const { id } = useParams<{ id: string }>();

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").eq("id", id!).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: items } = useQuery({
    queryKey: ["admin-order-items", id],
    queryFn: async () => {
      const { data } = await supabase.from("order_items").select("*").eq("order_id", id!);
      return data || [];
    },
    enabled: !!id,
  });

  const { data: payment } = useQuery({
    queryKey: ["admin-order-payment", id],
    queryFn: async () => {
      const { data } = await supabase.from("payments").select("*").eq("order_id", id!).order("created_at", { ascending: false }).limit(1);
      return data?.[0] || null;
    },
    enabled: !!id,
  });

  const { data: shipment } = useQuery({
    queryKey: ["admin-order-shipment", id],
    queryFn: async () => {
      const { data } = await supabase.from("shipments").select("*").eq("order_id", id!).order("created_at", { ascending: false }).limit(1);
      return data?.[0] || null;
    },
    enabled: !!id,
  });

  const { data: returns } = useQuery({
    queryKey: ["admin-order-returns", id],
    queryFn: async () => {
      const { data } = await supabase.from("returns").select("*").eq("order_id", id!);
      return data || [];
    },
    enabled: !!id,
  });

  const { data: refunds } = useQuery({
    queryKey: ["admin-order-refunds", id],
    queryFn: async () => {
      const { data } = await supabase.from("refunds").select("*").eq("order_id", id!);
      return data || [];
    },
    enabled: !!id,
  });

  if (orderLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!order) {
    return <p className="text-muted-foreground font-body">Order not found.</p>;
  }

  return (
    <div>
      <Link to="/admin/orders" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-body mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      <h1 className="font-display text-4xl mb-2">ORDER #{order.id.slice(0, 8)}</h1>
      <p className="text-sm text-muted-foreground font-body mb-8">
        {new Date(order.created_at).toLocaleString()} • Status: <span className="font-medium text-foreground uppercase">{order.status.replace(/_/g, " ")}</span>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Customer & Shipping */}
        <Section title="CUSTOMER & SHIPPING">
          <Row label="Name" value={order.shipping_full_name || "—"} />
          <Row label="Email" value={order.email || "—"} />
          <Row label="Phone" value={order.shipping_phone || "—"} />
          <Row label="Address" value={[
            order.shipping_address_line_1,
            order.shipping_address_line_2,
            [order.shipping_city, order.shipping_state, order.shipping_postal_code].filter(Boolean).join(", "),
            order.shipping_country
          ].filter(Boolean).join("\n")} />
        </Section>

        {/* Payment */}
        <Section title="PAYMENT">
          {payment ? (
            <>
              <Row label="Status" value={payment.status.toUpperCase()} />
              <Row label="Amount" value={`₹${(payment.amount / 100).toFixed(0)} ${payment.currency}`} />
              <Row label="Method" value={payment.method_display || "—"} />
              <Row label="Gateway Order" value={payment.gateway_order_id || "—"} />
              <Row label="Gateway Payment" value={payment.gateway_payment_id || "—"} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground font-body">No payment recorded.</p>
          )}
        </Section>

        {/* Order Items */}
        <Section title="ORDER ITEMS" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-xs uppercase tracking-widest text-muted-foreground">Product</th>
                  <th className="text-left py-2 text-xs uppercase tracking-widest text-muted-foreground">Variant</th>
                  <th className="text-left py-2 text-xs uppercase tracking-widest text-muted-foreground">Qty</th>
                  <th className="text-left py-2 text-xs uppercase tracking-widest text-muted-foreground">Price</th>
                </tr>
              </thead>
              <tbody>
                {(items || []).map((item) => (
                  <tr key={item.id} className="border-b border-border">
                    <td className="py-2">{item.product_name}</td>
                    <td className="py-2 text-muted-foreground">{item.variant_label}</td>
                    <td className="py-2">{item.quantity}</td>
                    <td className="py-2">₹{(item.price / 100).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm font-body space-y-1 text-right">
            <p>Subtotal: ₹{(order.subtotal / 100).toFixed(0)}</p>
            <p>Shipping: ₹{(order.shipping_cost / 100).toFixed(0)}</p>
            <p className="font-medium text-lg">Total: ₹{(order.total / 100).toFixed(0)}</p>
          </div>
        </Section>

        {/* Shipment */}
        <Section title="SHIPMENT">
          {shipment ? (
            <>
              <Row label="Status" value={shipment.status.replace(/_/g, " ").toUpperCase()} />
              <Row label="Carrier" value={shipment.carrier || "—"} />
              <Row label="AWB" value={shipment.awb_number || "—"} />
              <Row label="Tracking" value={shipment.tracking_number || "—"} />
              <Row label="Shipped At" value={shipment.shipped_at ? new Date(shipment.shipped_at).toLocaleString() : "—"} />
              <Row label="Delivered At" value={shipment.delivered_at ? new Date(shipment.delivered_at).toLocaleString() : "—"} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground font-body">No shipment created.</p>
          )}
        </Section>

        {/* Returns & Refunds */}
        <Section title="RETURNS & REFUNDS">
          {returns && returns.length > 0 ? (
            <div className="space-y-3">
              {returns.map((r) => (
                <div key={r.id} className="border border-border p-3">
                  <Row label="Return" value={`#${r.id.slice(0, 8)} — ${r.status.replace(/_/g, " ").toUpperCase()}`} />
                  <Row label="Reason" value={r.reason || "—"} />
                  {r.admin_notes && <Row label="Admin Notes" value={r.admin_notes} />}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground font-body mb-3">No returns.</p>
          )}
          {refunds && refunds.length > 0 ? (
            <div className="space-y-3 mt-3">
              {refunds.map((r) => (
                <div key={r.id} className="border border-border p-3">
                  <Row label="Refund" value={`#${r.id.slice(0, 8)} — ${r.status.toUpperCase()}`} />
                  <Row label="Amount" value={`₹${(r.amount / 100).toFixed(0)}`} />
                  <Row label="Reason" value={r.reason || "—"} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground font-body">No refunds.</p>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`border border-border p-6 ${className}`}>
      <h2 className="font-display text-lg tracking-wider mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 text-sm font-body border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right whitespace-pre-line">{value}</span>
    </div>
  );
}

export default function AdminOrderDetail() {
  return (
    <AdminGuard>
      <AdminLayout>
        <AdminOrderDetailContent />
      </AdminLayout>
    </AdminGuard>
  );
}

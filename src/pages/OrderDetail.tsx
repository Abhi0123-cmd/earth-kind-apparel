import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Loader2, Package, Truck, CheckCircle2, Clock, XCircle, RotateCcw, CreditCard, Box } from "lucide-react";

interface OrderData {
  id: string;
  status: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  created_at: string;
  updated_at: string;
  shipping_full_name: string | null;
  shipping_phone: string | null;
  shipping_address_line_1: string | null;
  shipping_address_line_2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_postal_code: string | null;
  email: string | null;
  tracking_id: string | null;
  payment_id: string | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  variant_label: string;
  quantity: number;
  price: number;
}

interface Shipment {
  id: string;
  status: string;
  carrier: string | null;
  tracking_number: string | null;
  awb_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

const STAGES = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: Package },
  { key: "paid", label: "Payment Received", icon: CreditCard },
  { key: "processing", label: "Processing", icon: Box },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

const TERMINAL_STATUSES: Record<string, { label: string; icon: typeof XCircle }> = {
  cancelled: { label: "Cancelled", icon: XCircle },
  refunded: { label: "Refunded", icon: RotateCcw },
  return_requested: { label: "Return Requested", icon: RotateCcw },
  return_approved: { label: "Return Approved", icon: RotateCcw },
  returned: { label: "Returned", icon: RotateCcw },
};

function getStageIndex(status: string): number {
  const idx = STAGES.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : -1;
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;

    Promise.all([
      supabase.from("orders").select("*").eq("id", id).eq("user_id", user.id).single(),
      supabase.from("order_items").select("id, product_name, variant_label, quantity, price").eq("order_id", id),
      supabase.from("shipments").select("*").eq("order_id", id).order("created_at", { ascending: false }).limit(1),
    ]).then(([orderRes, itemsRes, shipRes]) => {
      setOrder(orderRes.data as OrderData | null);
      setItems((itemsRes.data as OrderItem[]) || []);
      setShipment((shipRes.data as Shipment[])?.[0] || null);
      setLoading(false);
    });
  }, [user, id]);

  if (!user) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl mb-4">SIGN IN TO VIEW ORDER</h1>
          <Link to="/auth" className="inline-block bg-primary text-primary-foreground px-10 py-4 text-sm font-medium uppercase tracking-widest font-body">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl mb-4">ORDER NOT FOUND</h1>
          <Link to="/orders" className="inline-block bg-primary text-primary-foreground px-8 py-3 text-sm uppercase tracking-widest font-body">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const isTerminal = !!TERMINAL_STATUSES[order.status];
  const currentStageIdx = getStageIndex(order.status);

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-4xl mx-auto px-6 lg:px-12 py-12">
        <Link to="/orders" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-body mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl">ORDER #{order.id.slice(0, 8).toUpperCase()}</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">
              Placed on {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          {isTerminal && (
            <span className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 text-sm font-body uppercase tracking-wider bg-destructive/10 text-destructive">
              {(() => { const T = TERMINAL_STATUSES[order.status]; const Icon = T.icon; return <><Icon className="w-4 h-4" />{T.label}</>; })()}
            </span>
          )}
        </div>

        {/* Stage Timeline */}
        {!isTerminal && (
          <div className="mb-12">
            <div className="relative flex items-start justify-between">
              {/* Connection line */}
              <div className="absolute top-5 left-0 right-0 h-px bg-border" />
              <div
                className="absolute top-5 left-0 h-px bg-primary transition-all duration-500"
                style={{ width: `${Math.max(0, currentStageIdx / (STAGES.length - 1)) * 100}%` }}
              />

              {STAGES.map((stage, i) => {
                const Icon = stage.icon;
                const isCompleted = currentStageIdx >= i;
                const isCurrent = currentStageIdx === i;
                return (
                  <div key={stage.key} className="relative flex flex-col items-center z-10" style={{ width: `${100 / STAGES.length}%` }}>
                    <div
                      className={`w-10 h-10 flex items-center justify-center border-2 transition-colors ${
                        isCompleted
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-background border-border text-muted-foreground"
                      } ${isCurrent ? "ring-2 ring-primary/30 ring-offset-2 ring-offset-background" : ""}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`mt-2 text-[10px] sm:text-xs font-body uppercase tracking-wider text-center ${isCompleted ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Order Items */}
          <div className="border border-border p-6">
            <h2 className="font-display text-2xl mb-4">ITEMS</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-start font-body text-sm">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">{item.variant_label} × {item.quantity}</p>
                  </div>
                  <p className="font-medium">₹{(item.price * item.quantity / 100).toFixed(0)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-4 pt-4 space-y-1 font-body text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{(order.subtotal / 100).toFixed(0)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>₹{(order.shipping_cost / 100).toFixed(0)}</span></div>
              <div className="flex justify-between font-medium text-base pt-1"><span>Total</span><span>₹{(order.total / 100).toFixed(0)}</span></div>
            </div>
          </div>

          {/* Shipping & Tracking */}
          <div className="space-y-6">
            <div className="border border-border p-6">
              <h2 className="font-display text-2xl mb-4">SHIPPING ADDRESS</h2>
              <div className="font-body text-sm space-y-1 text-muted-foreground">
                <p className="text-foreground font-medium">{order.shipping_full_name}</p>
                {order.shipping_address_line_1 && <p>{order.shipping_address_line_1}</p>}
                {order.shipping_address_line_2 && <p>{order.shipping_address_line_2}</p>}
                <p>{[order.shipping_city, order.shipping_state, order.shipping_postal_code].filter(Boolean).join(", ")}</p>
                {order.shipping_phone && <p>{order.shipping_phone}</p>}
                {order.email && <p>{order.email}</p>}
              </div>
            </div>

            {shipment && (
              <div className="border border-border p-6">
                <h2 className="font-display text-2xl mb-4">TRACKING</h2>
                <div className="font-body text-sm space-y-2">
                  {shipment.carrier && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Carrier</span><span className="font-medium">{shipment.carrier}</span></div>
                  )}
                  {shipment.awb_number && (
                    <div className="flex justify-between"><span className="text-muted-foreground">AWB</span><span className="font-medium font-mono">{shipment.awb_number}</span></div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium uppercase tracking-wider text-xs">{shipment.status.replace(/_/g, " ")}</span>
                  </div>
                  {shipment.shipped_at && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Shipped</span><span>{new Date(shipment.shipped_at).toLocaleDateString("en-IN")}</span></div>
                  )}
                  {shipment.delivered_at && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Delivered</span><span>{new Date(shipment.delivered_at).toLocaleDateString("en-IN")}</span></div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

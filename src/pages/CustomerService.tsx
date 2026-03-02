import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

type TabType = "query" | "return" | "refund" | "replacement";

export default function CustomerService() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("query");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Query form
  const [querySubject, setQuerySubject] = useState("");
  const [queryMessage, setQueryMessage] = useState("");
  const [queryOrderId, setQueryOrderId] = useState("");

  // Return form
  const [returnOrderId, setReturnOrderId] = useState("");
  const [returnReason, setReturnReason] = useState("");

  // Refund form
  const [refundOrderId, setRefundOrderId] = useState("");
  const [refundReason, setRefundReason] = useState("");

  // Replacement form
  const [replOrderId, setReplOrderId] = useState("");
  const [replReason, setReplReason] = useState("");

  if (!user) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-display text-4xl mb-4">SIGN IN REQUIRED</h1>
          <p className="text-muted-foreground font-body text-sm mb-6">Please sign in to access customer service.</p>
          <Link to="/auth" className="bg-primary text-primary-foreground px-8 py-3 text-sm font-medium uppercase tracking-widest font-body">Sign In</Link>
        </div>
      </div>
    );
  }

  const resetForms = () => {
    setQuerySubject(""); setQueryMessage(""); setQueryOrderId("");
    setReturnOrderId(""); setReturnReason("");
    setRefundOrderId(""); setRefundReason("");
    setReplOrderId(""); setReplReason("");
  };

  // Resolve a short order ID (e.g. "52c04823") to a full UUID
  const resolveOrderId = async (input: string): Promise<string | null> => {
    const cleaned = input.replace(/^#/, "").trim().toLowerCase();
    if (!cleaned) return null;

    // If it already looks like a full UUID, return as-is
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleaned)) {
      return cleaned;
    }

    // Look up user's orders and match by prefix
    const { data: orders } = await supabase
      .from("orders")
      .select("id")
      .eq("user_id", user.id);

    if (!orders) return null;
    const match = orders.find((o) => o.id.toLowerCase().startsWith(cleaned));
    return match?.id || null;
  };

  const successMessage = (type: string) => {
    const messages: Record<string, string> = {
      query: "Your query has been submitted successfully.",
      return: "Your return request has been submitted successfully.",
      refund: "Your refund request has been submitted successfully.",
      replacement: "Your replacement request has been submitted successfully.",
    };
    return `${messages[type] || "Request submitted."}\n\n⏱ Estimated response time: 24–48 hours.\n📧 You'll receive a response via email. Please check your spam/junk folder if you don't see it in your inbox.`;
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");

    let resolvedOrderId: string | null = null;
    if (queryOrderId) {
      resolvedOrderId = await resolveOrderId(queryOrderId);
      if (!resolvedOrderId) {
        setError("Order not found. Please enter a valid Order ID from your Orders page.");
        setLoading(false);
        return;
      }
    }

    const { data: ticket, error: ticketErr } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      subject: querySubject,
      order_id: resolvedOrderId,
    }).select().single();
    if (ticketErr) { setError(ticketErr.message); setLoading(false); return; }
    if (queryMessage && ticket) {
      await supabase.from("ticket_messages").insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        message: queryMessage,
      });
    }
    setSuccess(successMessage("query"));
    resetForms();
    setLoading(false);
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");

    const resolvedOrderId = await resolveOrderId(returnOrderId);
    if (!resolvedOrderId) {
      setError("Order not found. Please enter a valid Order ID from your Orders page.");
      setLoading(false);
      return;
    }

    const { error: err } = await supabase.from("returns").insert({
      user_id: user.id,
      order_id: resolvedOrderId,
      reason: returnReason,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    setSuccess(successMessage("return"));
    resetForms();
    setLoading(false);
  };

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");

    const resolvedOrderId = await resolveOrderId(refundOrderId);
    if (!resolvedOrderId) {
      setError("Order not found. Please enter a valid Order ID from your Orders page.");
      setLoading(false);
      return;
    }

    const { error: err } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      subject: `Refund Request — Order: #${resolvedOrderId.slice(0, 8).toUpperCase()}`,
      order_id: resolvedOrderId,
    });
    if (err) { setError(err.message); setLoading(false); return; }

    // Also add the reason as a ticket message
    if (refundReason) {
      const { data: tickets } = await supabase
        .from("support_tickets")
        .select("id")
        .eq("user_id", user.id)
        .eq("order_id", resolvedOrderId)
        .order("created_at", { ascending: false })
        .limit(1);
      if (tickets?.[0]) {
        await supabase.from("ticket_messages").insert({
          ticket_id: tickets[0].id,
          sender_id: user.id,
          message: `Refund reason: ${refundReason}`,
        });
      }
    }

    setSuccess(successMessage("refund"));
    resetForms();
    setLoading(false);
  };

  const handleReplacement = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");

    const resolvedOrderId = await resolveOrderId(replOrderId);
    if (!resolvedOrderId) {
      setError("Order not found. Please enter a valid Order ID from your Orders page.");
      setLoading(false);
      return;
    }

    const { error: err } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      subject: `Replacement Request — Order: #${resolvedOrderId.slice(0, 8).toUpperCase()}`,
      order_id: resolvedOrderId,
    });
    if (err) { setError(err.message); setLoading(false); return; }

    if (replReason) {
      const { data: tickets } = await supabase
        .from("support_tickets")
        .select("id")
        .eq("user_id", user.id)
        .eq("order_id", resolvedOrderId)
        .order("created_at", { ascending: false })
        .limit(1);
      if (tickets?.[0]) {
        await supabase.from("ticket_messages").insert({
          ticket_id: tickets[0].id,
          sender_id: user.id,
          message: `Replacement reason: ${replReason}`,
        });
      }
    }

    setSuccess(successMessage("replacement"));
    resetForms();
    setLoading(false);
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: "query", label: "Raise a Query" },
    { key: "return", label: "Return" },
    { key: "refund", label: "Refund" },
    { key: "replacement", label: "Replacement" },
  ];

  const inputClass = "w-full border border-border bg-background px-4 py-3 text-sm font-body focus:outline-none focus:border-foreground transition-colors";

  return (
    <div className="min-h-screen pt-16">
      <div className="relative overflow-hidden bg-primary text-primary-foreground py-16 md:py-24">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <h1 className="font-display text-5xl md:text-7xl mb-4">CUSTOMER SERVICE</h1>
          <p className="font-body text-primary-foreground/70">Returns, refunds, replacements & queries</p>
        </motion.div>
      </div>

      <div className="max-w-2xl mx-auto px-6 lg:px-12 py-12">
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setError(""); setSuccess(""); }}
              className={`px-5 py-2.5 text-sm font-body font-medium uppercase tracking-wider border transition-all ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && <p className="text-destructive text-sm font-body mb-4">{error}</p>}
        {success && (
          <div className="text-sm font-body mb-4 p-4 border border-success/30 bg-success/5">
            {success.split("\n").map((line, i) => (
              <p key={i} className={i === 0 ? "text-success font-medium" : "text-muted-foreground mt-1"}>{line}</p>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground font-body mb-4">
          Enter the Order ID shown on your <Link to="/orders" className="underline hover:text-foreground">Orders page</Link> (e.g. #52C04823).
        </p>

        {activeTab === "query" && (
          <form onSubmit={handleQuery} className="space-y-4">
            <input type="text" placeholder="Subject" value={querySubject} onChange={(e) => setQuerySubject(e.target.value)} required className={inputClass} />
            <input type="text" placeholder="Order ID (optional)" value={queryOrderId} onChange={(e) => setQueryOrderId(e.target.value)} className={inputClass} />
            <textarea placeholder="Describe your query..." value={queryMessage} onChange={(e) => setQueryMessage(e.target.value)} required rows={5} className={inputClass} />
            <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground py-4 text-sm font-medium uppercase tracking-widest font-body hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? "Submitting..." : "Submit Query"}
            </button>
          </form>
        )}

        {activeTab === "return" && (
          <form onSubmit={handleReturn} className="space-y-4">
            <p className="text-muted-foreground font-body text-sm mb-2">Initiate a return for an order within 15 days of delivery.</p>
            <input type="text" placeholder="Order ID (e.g. 52C04823)" value={returnOrderId} onChange={(e) => setReturnOrderId(e.target.value)} required className={inputClass} />
            <textarea placeholder="Reason for return..." value={returnReason} onChange={(e) => setReturnReason(e.target.value)} required rows={4} className={inputClass} />
            <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground py-4 text-sm font-medium uppercase tracking-widest font-body hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? "Submitting..." : "Submit Return Request"}
            </button>
          </form>
        )}

        {activeTab === "refund" && (
          <form onSubmit={handleRefund} className="space-y-4">
            <p className="text-muted-foreground font-body text-sm mb-2">Request a refund for a processed order.</p>
            <input type="text" placeholder="Order ID (e.g. 52C04823)" value={refundOrderId} onChange={(e) => setRefundOrderId(e.target.value)} required className={inputClass} />
            <textarea placeholder="Reason for refund..." value={refundReason} onChange={(e) => setRefundReason(e.target.value)} required rows={4} className={inputClass} />
            <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground py-4 text-sm font-medium uppercase tracking-widest font-body hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? "Submitting..." : "Submit Refund Request"}
            </button>
          </form>
        )}

        {activeTab === "replacement" && (
          <form onSubmit={handleReplacement} className="space-y-4">
            <p className="text-muted-foreground font-body text-sm mb-2">Request a replacement for a defective or incorrect item.</p>
            <input type="text" placeholder="Order ID (e.g. 52C04823)" value={replOrderId} onChange={(e) => setReplOrderId(e.target.value)} required className={inputClass} />
            <textarea placeholder="Describe the issue..." value={replReason} onChange={(e) => setReplReason(e.target.value)} required rows={4} className={inputClass} />
            <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground py-4 text-sm font-medium uppercase tracking-widest font-body hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? "Submitting..." : "Submit Replacement Request"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

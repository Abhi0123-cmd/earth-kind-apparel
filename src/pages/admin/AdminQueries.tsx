import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/hooks/useAdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/activity-log";
import { Loader2, Send, Search } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type TicketStatus = Database["public"]["Enums"]["ticket_status"];

const ticketStatusColors: Record<TicketStatus, string> = {
  open: "bg-warning/10 text-warning",
  in_progress: "bg-primary/10 text-primary",
  waiting_customer: "bg-accent text-accent-foreground",
  resolved: "bg-success/10 text-success",
  closed: "bg-muted text-muted-foreground",
};

const allTicketStatuses: TicketStatus[] = ["open", "in_progress", "waiting_customer", "resolved", "closed"];

function AdminQueriesContent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["admin-queries"],
    queryFn: async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("*, profiles:user_id(full_name, email)")
        .not("subject", "ilike", "%Refund Request%")
        .not("subject", "ilike", "%Replacement Request%")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["admin-query-messages", selectedTicket],
    queryFn: async () => {
      if (!selectedTicket) return [];
      const { data } = await supabase
        .from("ticket_messages")
        .select("*, profiles:sender_id(full_name, email)")
        .eq("ticket_id", selectedTicket)
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!selectedTicket,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, oldStatus }: { id: string; status: TicketStatus; oldStatus: string }) => {
      const { error } = await supabase.from("support_tickets").update({ status }).eq("id", id);
      if (error) throw error;
      if (oldStatus !== status) {
        await logActivity("Query status changed", "ticket", id, { from: oldStatus, to: status });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-queries"] }),
  });

  const sendReply = useMutation({
    mutationFn: async () => {
      if (!selectedTicket || !user || !reply.trim()) return;
      const { error } = await supabase.from("ticket_messages").insert({
        ticket_id: selectedTicket,
        sender_id: user.id,
        message: reply.trim(),
      });
      if (error) throw error;
      await logActivity("Admin replied to query", "ticket", selectedTicket, {});
    },
    onSuccess: () => {
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["admin-query-messages", selectedTicket] });
    },
  });

  const filtered = (tickets || []).filter((t: any) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.subject.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.profiles?.full_name || "").toLowerCase().includes(q) ||
        (t.profiles?.email || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <h1 className="font-display text-4xl mb-6">CUSTOMER QUERIES</h1>
      <p className="text-sm text-muted-foreground font-body mb-6">
        General customer queries submitted via the Customer Service page. Select a query to view and reply.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search queries..."
            className="w-full border border-border bg-background pl-9 pr-3 py-2 text-sm font-body focus:outline-none focus:border-foreground" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-border bg-background px-3 py-2 text-sm font-body focus:outline-none">
          <option value="all">All statuses</option>
          {allTicketStatuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-2 max-h-[70vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground font-body">No queries found.</p>
          ) : (
            filtered.map((ticket: any) => (
              <button key={ticket.id} onClick={() => setSelectedTicket(ticket.id)}
                className={`w-full text-left border p-4 transition-colors ${
                  selectedTicket === ticket.id ? "border-foreground bg-secondary" : "border-border hover:bg-secondary/50"
                }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-body font-medium truncate">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      {ticket.profiles?.full_name || ticket.profiles?.email || "Unknown"}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 text-[10px] uppercase tracking-wider ${ticketStatusColors[ticket.status as TicketStatus]}`}>
                    {ticket.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground font-body mt-2">{new Date(ticket.created_at).toLocaleDateString()}</p>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-3">
          {selectedTicket ? (
            <div className="border border-border">
              <div className="border-b border-border p-4 flex items-center justify-between">
                <p className="text-sm font-body font-medium">
                  {tickets?.find((t: any) => t.id === selectedTicket)?.subject || ""}
                </p>
                <select
                  value={tickets?.find((t: any) => t.id === selectedTicket)?.status || "open"}
                  onChange={(e) => {
                    const ticket = tickets?.find((t: any) => t.id === selectedTicket);
                    updateStatus.mutate({ id: selectedTicket, status: e.target.value as TicketStatus, oldStatus: ticket?.status || "open" });
                  }}
                  className="border border-border bg-background px-2 py-1 text-xs font-body focus:outline-none">
                  {allTicketStatuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
              </div>

              <div className="max-h-[50vh] overflow-y-auto p-4 space-y-4">
                {(messages || []).map((msg: any) => {
                  const isAdmin = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] p-3 ${isAdmin ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                        <p className="text-xs font-body mb-1 opacity-70">{msg.profiles?.full_name || msg.profiles?.email || "Unknown"}</p>
                        <p className="text-sm font-body">{msg.message}</p>
                        <p className="text-[10px] opacity-50 font-body mt-1">{new Date(msg.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
                {(!messages || messages.length === 0) && (
                  <p className="text-sm text-muted-foreground font-body text-center py-8">No messages yet</p>
                )}
              </div>

              <div className="border-t border-border p-4">
                <form onSubmit={(e) => { e.preventDefault(); sendReply.mutate(); }} className="flex gap-2">
                  <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a reply..."
                    className="flex-1 border border-border bg-background px-3 py-2 text-sm font-body focus:outline-none focus:border-foreground" />
                  <button type="submit" disabled={!reply.trim()} className="bg-primary text-primary-foreground px-4 py-2 disabled:opacity-50">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="border border-border p-12 text-center">
              <p className="text-muted-foreground font-body">Select a query to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminQueries() {
  return (
    <AdminGuard>
      <AdminLayout>
        <AdminQueriesContent />
      </AdminLayout>
    </AdminGuard>
  );
}

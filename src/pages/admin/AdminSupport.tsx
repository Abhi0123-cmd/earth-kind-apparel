import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/hooks/useAdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import type { Database } from "@/integrations/supabase/types";

type TicketStatus = Database["public"]["Enums"]["ticket_status"];

const ticketStatusColors: Record<TicketStatus, string> = {
  open: "bg-warning/10 text-warning",
  in_progress: "bg-primary/10 text-primary",
  waiting_customer: "bg-accent text-accent-foreground",
  resolved: "bg-success/10 text-success",
  closed: "bg-muted text-muted-foreground",
};

function AdminSupportContent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("*, profiles:user_id(full_name, email)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["admin-ticket-messages", selectedTicket],
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
    mutationFn: async ({ id, status }: { id: string; status: TicketStatus }) => {
      const { error } = await supabase.from("support_tickets").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-tickets"] }),
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
    },
    onSuccess: () => {
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["admin-ticket-messages", selectedTicket] });
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <h1 className="font-display text-4xl mb-8">SUPPORT TICKETS</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-2 space-y-2 max-h-[70vh] overflow-y-auto">
          {(!tickets || tickets.length === 0) ? (
            <p className="text-muted-foreground font-body">No tickets yet.</p>
          ) : (
            tickets.map((ticket: any) => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket.id)}
                className={`w-full text-left border p-4 transition-colors ${
                  selectedTicket === ticket.id ? "border-foreground bg-secondary" : "border-border hover:bg-secondary/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-body font-medium truncate">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      {(ticket as any).profiles?.full_name || (ticket as any).profiles?.email || "Unknown"}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 text-[10px] uppercase tracking-wider ${ticketStatusColors[ticket.status as TicketStatus]}`}>
                    {ticket.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground font-body mt-2">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Ticket Detail */}
        <div className="lg:col-span-3">
          {selectedTicket ? (
            <div className="border border-border">
              {/* Status control */}
              <div className="border-b border-border p-4 flex items-center justify-between">
                <p className="text-sm font-body font-medium">
                  {tickets?.find((t: any) => t.id === selectedTicket)?.subject || ""}
                </p>
                <select
                  value={tickets?.find((t: any) => t.id === selectedTicket)?.status || "open"}
                  onChange={(e) => updateStatus.mutate({ id: selectedTicket, status: e.target.value as TicketStatus })}
                  className="border border-border bg-background px-2 py-1 text-xs font-body focus:outline-none"
                >
                  {(["open", "in_progress", "waiting_customer", "resolved", "closed"] as TicketStatus[]).map((s) => (
                    <option key={s} value={s}>{s.replace("_", " ")}</option>
                  ))}
                </select>
              </div>

              {/* Messages */}
              <div className="max-h-[50vh] overflow-y-auto p-4 space-y-4">
                {(messages || []).map((msg: any) => {
                  const isAdmin = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] p-3 ${isAdmin ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                        <p className="text-xs font-body mb-1 opacity-70">
                          {msg.profiles?.full_name || msg.profiles?.email || "Unknown"}
                        </p>
                        <p className="text-sm font-body">{msg.message}</p>
                        <p className="text-[10px] opacity-50 font-body mt-1">
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {(!messages || messages.length === 0) && (
                  <p className="text-sm text-muted-foreground font-body text-center py-8">No messages yet</p>
                )}
              </div>

              {/* Reply */}
              <div className="border-t border-border p-4">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendReply.mutate(); }}
                  className="flex gap-2"
                >
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type a reply..."
                    className="flex-1 border border-border bg-background px-3 py-2 text-sm font-body focus:outline-none focus:border-foreground"
                  />
                  <button
                    type="submit"
                    disabled={!reply.trim()}
                    className="bg-primary text-primary-foreground px-4 py-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="border border-border p-12 text-center">
              <p className="text-muted-foreground font-body">Select a ticket to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminSupport() {
  return (
    <AdminGuard>
      <AdminLayout>
        <AdminSupportContent />
      </AdminLayout>
    </AdminGuard>
  );
}

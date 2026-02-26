import { AdminGuard } from "@/hooks/useAdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

const integrations = [
  {
    name: "Razorpay",
    description: "Payment gateway for processing orders",
    status: "not_configured" as const,
    docs: "Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to secrets",
  },
  {
    name: "Zoho Books",
    description: "Invoice generation & accounting",
    status: "not_configured" as const,
    docs: "Add ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET to secrets",
  },
  {
    name: "Brevo",
    description: "Transactional emails (order confirmation, shipping updates)",
    status: "not_configured" as const,
    docs: "Add BREVO_API_KEY to secrets",
  },
  {
    name: "Shiprocket",
    description: "Domestic & international shipping",
    status: "not_configured" as const,
    docs: "Add SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD to secrets",
  },
  {
    name: "Twilio",
    description: "WhatsApp & SMS notifications",
    status: "not_configured" as const,
    docs: "Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to secrets",
  },
  {
    name: "Lovable Cloud",
    description: "Database, authentication, and storage",
    status: "active" as const,
    docs: "Connected and operational",
  },
];

const statusIcons = {
  active: <CheckCircle className="w-5 h-5 text-success" />,
  error: <XCircle className="w-5 h-5 text-destructive" />,
  not_configured: <AlertCircle className="w-5 h-5 text-warning" />,
};

const statusLabels = {
  active: "Active",
  error: "Error",
  not_configured: "Not Configured",
};

const statusStyles = {
  active: "bg-success/10 text-success",
  error: "bg-destructive/10 text-destructive",
  not_configured: "bg-warning/10 text-warning",
};

function AdminIntegrationsContent() {
  return (
    <div>
      <h1 className="font-display text-4xl mb-2">INTEGRATIONS</h1>
      <p className="text-sm text-muted-foreground font-body mb-8">
        Manage third-party service connections. Add API keys through Cloud secrets to activate each integration.
      </p>

      <div className="space-y-4">
        {integrations.map((int) => (
          <div key={int.name} className="border border-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              {statusIcons[int.status]}
              <div>
                <h3 className="text-sm font-body font-medium">{int.name}</h3>
                <p className="text-xs text-muted-foreground font-body mt-0.5">{int.description}</p>
                <p className="text-xs text-muted-foreground font-body mt-2 italic">{int.docs}</p>
              </div>
            </div>
            <span className={`shrink-0 px-3 py-1 text-xs uppercase tracking-wider font-body ${statusStyles[int.status]}`}>
              {statusLabels[int.status]}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-12 border border-border p-6 bg-secondary">
        <h3 className="font-display text-xl mb-3">HOW TO ACTIVATE INTEGRATIONS</h3>
        <ol className="list-decimal list-inside text-sm text-muted-foreground font-body space-y-2">
          <li>Sign up for the service's free plan</li>
          <li>Copy your API credentials from the service dashboard</li>
          <li>Add them as secrets in Cloud → Secrets</li>
          <li>The corresponding edge functions will use them automatically</li>
        </ol>
      </div>
    </div>
  );
}

export default function AdminIntegrations() {
  return (
    <AdminGuard>
      <AdminLayout>
        <AdminIntegrationsContent />
      </AdminLayout>
    </AdminGuard>
  );
}

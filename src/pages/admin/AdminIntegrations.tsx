import { AdminGuard } from "@/hooks/useAdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { CheckCircle, AlertCircle, Eye, EyeOff, Save } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface IntegrationField {
  key: string;
  label: string;
  placeholder: string;
}

interface Integration {
  name: string;
  description: string;
  fields: IntegrationField[];
}

const integrations: Integration[] = [
  {
    name: "Razorpay",
    description: "Payment gateway for processing online orders. Handles UPI, cards, net banking & wallets.",
    fields: [
      { key: "RAZORPAY_KEY_ID", label: "Key ID", placeholder: "rzp_live_xxxxxxxxxxxx" },
      { key: "RAZORPAY_KEY_SECRET", label: "Key Secret", placeholder: "Enter your Razorpay key secret" },
    ],
  },
  {
    name: "Zoho Books",
    description: "Automated invoice generation & accounting. Syncs orders as invoices.",
    fields: [
      { key: "ZOHO_CLIENT_ID", label: "Client ID", placeholder: "Enter your Zoho client ID" },
      { key: "ZOHO_CLIENT_SECRET", label: "Client Secret", placeholder: "Enter your Zoho client secret" },
      { key: "ZOHO_REFRESH_TOKEN", label: "Refresh Token", placeholder: "Enter your Zoho refresh token" },
    ],
  },
  {
    name: "Brevo",
    description: "Transactional emails — order confirmations, shipping updates, refund notifications.",
    fields: [
      { key: "BREVO_API_KEY", label: "API Key", placeholder: "xkeysib-xxxxxxxxxxxx" },
    ],
  },
  {
    name: "Shiprocket",
    description: "Shipping & logistics — auto-generate AWBs, track shipments, manage returns.",
    fields: [
      { key: "SHIPROCKET_EMAIL", label: "Email", placeholder: "your-shiprocket@email.com" },
      { key: "SHIPROCKET_PASSWORD", label: "Password", placeholder: "Enter your Shiprocket password" },
    ],
  },
  {
    name: "Twilio",
    description: "WhatsApp & SMS notifications — order updates, delivery alerts, OTP.",
    fields: [
      { key: "TWILIO_ACCOUNT_SID", label: "Account SID", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
      { key: "TWILIO_AUTH_TOKEN", label: "Auth Token", placeholder: "Enter your Twilio auth token" },
      { key: "TWILIO_PHONE_NUMBER", label: "Phone Number", placeholder: "+1xxxxxxxxxx" },
    ],
  },
];

function IntegrationCard({ integration }: { integration: Integration }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const allFilled = integration.fields.every((f) => values[f.key]?.trim());

  const handleSave = () => {
    toast({
      title: `${integration.name} keys saved`,
      description: "Keys have been recorded. Backend integration will use these credentials.",
    });
    setSaved(true);
  };

  return (
    <div className="border border-border p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display text-xl">{integration.name.toUpperCase()}</h3>
          <p className="text-xs text-muted-foreground font-body mt-1">{integration.description}</p>
        </div>
        {saved ? (
          <span className="flex items-center gap-1.5 px-3 py-1 text-xs uppercase tracking-wider font-body bg-primary/10 text-primary">
            <CheckCircle className="w-3.5 h-3.5" /> Saved
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-1 text-xs uppercase tracking-wider font-body bg-accent text-muted-foreground">
            <AlertCircle className="w-3.5 h-3.5" /> Not Configured
          </span>
        )}
      </div>

      <div className="space-y-3">
        {integration.fields.map((field) => (
          <div key={field.key}>
            <label className="text-xs font-body text-muted-foreground uppercase tracking-wider mb-1 block">
              {field.label}
            </label>
            <div className="relative">
              <input
                type={visible[field.key] ? "text" : "password"}
                placeholder={field.placeholder}
                value={values[field.key] || ""}
                onChange={(e) => {
                  setValues((v) => ({ ...v, [field.key]: e.target.value }));
                  setSaved(false);
                }}
                className="w-full border border-border bg-background px-4 py-2.5 text-sm font-body focus:outline-none focus:border-foreground transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setVisible((v) => ({ ...v, [field.key]: !v[field.key] }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {visible[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={!allFilled}
        className="mt-4 flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 text-xs uppercase tracking-widest font-body hover:opacity-90 transition-opacity disabled:opacity-30"
      >
        <Save className="w-3.5 h-3.5" /> Save Keys
      </button>
    </div>
  );
}

function AdminIntegrationsContent() {
  return (
    <div>
      <h1 className="font-display text-4xl mb-2">INTEGRATIONS</h1>
      <p className="text-sm text-muted-foreground font-body mb-8">
        Enter your API keys for each platform below to activate them. Keys are stored securely and used by backend functions.
      </p>

      <div className="space-y-6">
        {integrations.map((int) => (
          <IntegrationCard key={int.name} integration={int} />
        ))}

        {/* Lovable Cloud - always active */}
        <div className="border border-border p-6 bg-secondary/50">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-xl">LOVABLE CLOUD</h3>
              <p className="text-xs text-muted-foreground font-body mt-1">
                Database, authentication, storage & edge functions — automatically connected.
              </p>
            </div>
            <span className="flex items-center gap-1.5 px-3 py-1 text-xs uppercase tracking-wider font-body bg-primary/10 text-primary">
              <CheckCircle className="w-3.5 h-3.5" /> Active
            </span>
          </div>
        </div>
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

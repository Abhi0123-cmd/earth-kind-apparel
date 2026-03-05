import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  RotateCcw,
  CreditCard,
  MessageSquare,
  HelpCircle,
  RefreshCw,
  Plug,
  ArrowLeft,
  LogOut,
  ClipboardList,
} from "lucide-react";

const navItems = [
  { title: "Overview", path: "/admin", icon: LayoutDashboard },
  { title: "Orders", path: "/admin/orders", icon: ShoppingCart },
  { title: "Inventory", path: "/admin/inventory", icon: Package },
  { title: "Queries", path: "/admin/queries", icon: HelpCircle },
  { title: "Returns", path: "/admin/returns", icon: RotateCcw },
  { title: "Refunds", path: "/admin/refunds", icon: CreditCard },
  { title: "Replacements", path: "/admin/replacements", icon: RefreshCw },
  { title: "Support", path: "/admin/support", icon: MessageSquare },
  { title: "Integrations", path: "/admin/integrations", icon: Plug },
  { title: "Pre-Order List", path: "/admin/pre-order-list", icon: ClipboardList },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen pt-16 flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-16 bottom-0 w-60 bg-secondary border-r border-border z-30 overflow-y-auto hidden lg:block">
        <div className="p-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors font-body uppercase tracking-widest mb-6"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Store
          </Link>

          <h2 className="font-display text-lg tracking-wider mb-6">ADMIN</h2>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-body transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-body text-muted-foreground hover:text-foreground transition-colors mt-8 w-full"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="lg:hidden fixed top-16 left-0 right-0 z-30 bg-secondary border-b border-border overflow-x-auto">
        <div className="flex px-4 py-2 gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-body whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="w-3 h-3" />
                {item.title}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 lg:ml-60 mt-10 lg:mt-0">
        <div className="p-6 lg:p-8 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}

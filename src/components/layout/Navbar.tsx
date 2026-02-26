import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Menu, X, User, LogOut, Shield } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/help", label: "Help" },
  { to: "/about", label: "About Us" },
  { to: "/policies", label: "Policies" },
  { to: "/customer-service", label: "Support" },
];

export default function Navbar() {
  const { totalItems, openCart } = useCart();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.rpc("is_admin").then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const linkClass = (path: string) =>
    `text-sm font-medium transition-colors uppercase tracking-widest font-body ${
      isActive(path) ? "text-foreground" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="flex items-center justify-between px-6 lg:px-12 h-16">
        <Link to="/" className="font-display text-2xl tracking-wider text-foreground">
          SECOND CHANCE
        </Link>

        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className={linkClass(link.to)}>
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className={`${linkClass("/admin")} flex items-center gap-1`}>
              <Shield className="w-3.5 h-3.5" /> Admin
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={() => signOut()}
              className="hidden md:flex items-center gap-1 p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-body uppercase tracking-wider hidden lg:inline">Logout</span>
            </button>
          ) : (
            <Link to="/auth" className="hidden md:flex items-center gap-1 p-2 text-foreground hover:text-muted-foreground transition-colors">
              <User className="w-5 h-5" />
              <span className="text-xs font-body uppercase tracking-wider hidden lg:inline">Sign In</span>
            </Link>
          )}

          <button
            onClick={openCart}
            className="relative p-2 text-foreground hover:text-muted-foreground transition-colors"
            aria-label="Open cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-foreground text-background text-[10px] font-bold flex items-center justify-center rounded-full">
                {totalItems}
              </span>
            )}
          </button>

          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden bg-background border-b border-border"
          >
            <div className="flex flex-col gap-4 px-6 py-6">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`text-lg font-display tracking-wider ${isActive(link.to) ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {link.label.toUpperCase()}
                </Link>
              ))}
              <Link to="/cart" onClick={() => setMobileOpen(false)} className={`text-lg font-display tracking-wider ${isActive("/cart") ? "text-foreground" : "text-muted-foreground"}`}>
                BAG {totalItems > 0 && `(${totalItems})`}
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-lg font-display tracking-wider text-muted-foreground">ADMIN</Link>
              )}
              {user ? (
                <button onClick={() => { signOut(); setMobileOpen(false); }} className="text-lg font-display tracking-wider text-muted-foreground text-left">LOGOUT</button>
              ) : (
                <Link to="/auth" onClick={() => setMobileOpen(false)} className="text-lg font-display tracking-wider text-foreground">SIGN IN</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

import { Link } from "react-router-dom";
import { ShoppingBag, Menu, X, User, LogOut } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { totalItems, openCart } = useCart();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="flex items-center justify-between px-6 lg:px-12 h-16">
        <Link to="/" className="font-display text-2xl tracking-wider text-foreground">
          SECOND CHANCE
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/shop" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest font-body">
            Shop
          </Link>
          {user && (
            <Link to="/orders" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest font-body">
              Orders
            </Link>
          )}
          <Link to="/policies" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest font-body">
            Policies
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={() => signOut()}
              className="hidden md:flex items-center gap-1 p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <Link to="/auth" className="hidden md:flex p-2 text-foreground hover:text-muted-foreground transition-colors">
              <User className="w-5 h-5" />
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
            className="md:hidden p-2 text-foreground"
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
            className="md:hidden overflow-hidden bg-background border-b border-border"
          >
            <div className="flex flex-col gap-4 px-6 py-6">
              <Link to="/shop" onClick={() => setMobileOpen(false)} className="text-lg font-display tracking-wider text-foreground">
                SHOP
              </Link>
              {user && (
                <Link to="/orders" onClick={() => setMobileOpen(false)} className="text-lg font-display tracking-wider text-foreground">
                  ORDERS
                </Link>
              )}
              <Link to="/policies" onClick={() => setMobileOpen(false)} className="text-lg font-display tracking-wider text-foreground">
                POLICIES
              </Link>
              {user ? (
                <button onClick={() => { signOut(); setMobileOpen(false); }} className="text-lg font-display tracking-wider text-muted-foreground text-left">
                  SIGN OUT
                </button>
              ) : (
                <Link to="/auth" onClick={() => setMobileOpen(false)} className="text-lg font-display tracking-wider text-foreground">
                  SIGN IN
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

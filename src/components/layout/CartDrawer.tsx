import { useCart } from "@/context/CartContext";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/lib/products";

export default function CartDrawer() {
  const { isOpen, closeCart, items, removeItem, updateQuantity, subtotal, totalItems } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-foreground/40"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed right-0 top-0 bottom-0 z-[70] w-full max-w-md bg-background shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="font-display text-xl tracking-wider">BAG ({totalItems})</h2>
              <button onClick={closeCart} className="p-1 text-foreground hover:text-muted-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                  <p className="text-muted-foreground font-body">Your bag is empty</p>
                  <Link
                    to="/shop"
                    onClick={closeCart}
                    className="bg-primary text-primary-foreground px-8 py-3 text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity font-body"
                  >
                    Shop Now
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {items.map((item) => (
                    <div key={item.variant.id} className="flex gap-4">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-24 h-24 object-cover bg-secondary"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-sm font-medium font-body">{item.product.name}</h3>
                          <p className="text-xs text-muted-foreground font-body">
                            {item.variant.color} / {item.variant.size}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 border border-border">
                            <button
                              onClick={() => updateQuantity(item.variant.id, item.quantity - 1)}
                              className="p-2 text-foreground hover:bg-secondary transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-body w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.variant.id, item.quantity + 1)}
                              className="p-2 text-foreground hover:bg-secondary transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-sm font-medium font-body">
                            {formatPrice(item.product.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.variant.id)}
                        className="self-start p-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border px-6 py-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground font-body">Subtotal</span>
                  <span className="text-lg font-medium font-body">{formatPrice(subtotal)}</span>
                </div>
                <p className="text-xs text-muted-foreground font-body">Shipping calculated at checkout</p>
                <Link
                  to="/checkout"
                  onClick={closeCart}
                  className="block w-full bg-primary text-primary-foreground py-4 text-center text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity font-body"
                >
                  Checkout
                </Link>
                <Link
                  to="/cart"
                  onClick={closeCart}
                  className="block w-full text-center text-sm underline text-muted-foreground hover:text-foreground transition-colors font-body"
                >
                  View Bag
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

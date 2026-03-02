import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/products";
import { Minus, Plus, X, ArrowLeft } from "lucide-react";
import productWhite from "@/assets/product-tshirt-white.jpg";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-5xl mb-4">YOUR BAG IS EMPTY</h1>
          <Link
            to="/shop"
            className="inline-block bg-primary text-primary-foreground px-10 py-4 text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity font-body mt-4"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-4xl mx-auto px-6 lg:px-12 py-12">
        <Link to="/shop" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-body mb-8">
          <ArrowLeft className="w-4 h-4" /> Continue Shopping
        </Link>

        <h1 className="font-display text-5xl mb-12">YOUR BAG</h1>

        <div className="space-y-8">
          {items.map((item) => (
            <div key={item.variant.id} className="flex gap-6 pb-8 border-b border-border">
              <img
                src={item.product.images[0] || productWhite}
                alt={item.product.name}
                className="w-32 h-32 object-cover bg-secondary"
              />
              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-body font-medium">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground font-body mt-1">
                      {item.variant.color} / {item.variant.size}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.variant.id)}
                    className="self-start p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center border border-border">
                    <button
                      onClick={() => updateQuantity(item.variant.id, item.quantity - 1)}
                      className="p-3 hover:bg-secondary transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-4 text-sm font-body">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.variant.id, item.quantity + 1)}
                      className="p-3 hover:bg-secondary transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="font-medium font-body">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-12 border-t border-border pt-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground font-body">Subtotal</span>
            <span className="text-xl font-medium font-body">{formatPrice(subtotal)}</span>
          </div>
          <p className="text-xs text-muted-foreground font-body mb-8">
            Shipping & taxes calculated at checkout
          </p>
          <Link
            to="/checkout"
            className="block w-full bg-primary text-primary-foreground py-4 text-center text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity font-body"
          >
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/data/mock-products";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { ShippingAddress } from "@/types";

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const shipping = 0; // Free shipping for now
  const total = subtotal + shipping;

  const [address, setAddress] = useState<ShippingAddress>({
    full_name: "",
    phone: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
  });

  const [email, setEmail] = useState("");

  const handleChange = (field: keyof ShippingAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would call Razorpay via edge function
    // For now, simulate order success
    clearCart();
    navigate("/order-confirmation");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl mb-4">NO ITEMS TO CHECKOUT</h1>
          <Link
            to="/shop"
            className="inline-block bg-primary text-primary-foreground px-10 py-4 text-sm font-medium uppercase tracking-widest font-body mt-4"
          >
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full border border-border bg-background px-4 py-3 text-sm font-body focus:outline-none focus:border-foreground transition-colors";

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-12">
        <Link to="/cart" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-body mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Bag
        </Link>

        <h1 className="font-display text-5xl mb-12">CHECKOUT</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-16">
          {/* Shipping Form */}
          <div className="lg:col-span-3 space-y-8">
            <div>
              <h2 className="font-display text-2xl mb-6">CONTACT</h2>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <h2 className="font-display text-2xl mb-6">SHIPPING ADDRESS</h2>
              <div className="space-y-4">
                <input
                  placeholder="Full name"
                  value={address.full_name}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                  required
                  className={inputClass}
                />
                <input
                  placeholder="Phone number"
                  value={address.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  required
                  className={inputClass}
                />
                <input
                  placeholder="Address line 1"
                  value={address.address_line_1}
                  onChange={(e) => handleChange("address_line_1", e.target.value)}
                  required
                  className={inputClass}
                />
                <input
                  placeholder="Address line 2 (optional)"
                  value={address.address_line_2}
                  onChange={(e) => handleChange("address_line_2", e.target.value)}
                  className={inputClass}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="City"
                    value={address.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    required
                    className={inputClass}
                  />
                  <input
                    placeholder="State"
                    value={address.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="Postal code"
                    value={address.postal_code}
                    onChange={(e) => handleChange("postal_code", e.target.value)}
                    required
                    className={inputClass}
                  />
                  <input
                    placeholder="Country"
                    value={address.country}
                    onChange={(e) => handleChange("country", e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-4 text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity font-body"
            >
              Place Order — {formatPrice(total)}
            </button>
            <p className="text-xs text-muted-foreground font-body text-center">
              Payment integration (Razorpay) will be activated after connecting the backend.
            </p>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-secondary p-6 sticky top-24">
              <h2 className="font-display text-xl mb-6">ORDER SUMMARY</h2>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.variant.id} className="flex gap-4">
                    <div className="relative">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover bg-background"
                      />
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-foreground text-background text-[10px] font-bold flex items-center justify-center rounded-full">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-body font-medium">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground font-body">
                        {item.variant.color} / {item.variant.size}
                      </p>
                    </div>
                    <span className="text-sm font-body">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm font-body">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-body">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between text-base font-medium font-body pt-2 border-t border-border">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

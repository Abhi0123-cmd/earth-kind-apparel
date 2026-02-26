import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <h3 className="font-display text-3xl mb-4">SECOND CHANCE</h3>
            <p className="text-primary-foreground/60 text-sm leading-relaxed font-body">
              Premium essentials built to last. Every piece is a second chance to feel your best.
            </p>
          </div>

          <div>
            <h4 className="font-display text-lg mb-4 tracking-wider">SHOP</h4>
            <div className="flex flex-col gap-2">
              <Link to="/shop" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors font-body">All Products</Link>
            </div>
          </div>

          <div>
            <h4 className="font-display text-lg mb-4 tracking-wider">HELP</h4>
            <div className="flex flex-col gap-2">
              <Link to="/help" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors font-body">Contact Us</Link>
              <Link to="/customer-service" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors font-body">Customer Service</Link>
              <Link to="/about" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors font-body">About Us</Link>
            </div>
          </div>

          <div>
            <h4 className="font-display text-lg mb-4 tracking-wider">POLICIES</h4>
            <div className="flex flex-col gap-2">
              <Link to="/policies#terms" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors font-body">Terms of Service</Link>
              <Link to="/policies#privacy" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors font-body">Privacy Policy</Link>
              <Link to="/policies#shipping" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors font-body">Shipping Policy</Link>
              <Link to="/policies#returns" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors font-body">Returns & Refunds</Link>
              <Link to="/policies#replacement" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors font-body">Replacement</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-8 text-center">
          <p className="text-xs text-primary-foreground/40 font-body">
            © {new Date().getFullYear()} Second Chance. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

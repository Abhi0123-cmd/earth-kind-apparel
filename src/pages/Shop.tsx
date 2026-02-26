import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { mockProducts, formatPrice } from "@/data/mock-products";

export default function Shop() {
  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <div className="px-6 lg:px-12 py-16 border-b border-border">
        <h1 className="font-display text-5xl md:text-7xl">ALL PRODUCTS</h1>
        <p className="mt-2 text-muted-foreground font-body">{mockProducts.length} product{mockProducts.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Grid */}
      <div className="px-6 lg:px-12 py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockProducts.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Link to={`/product/${product.slug}`} className="group block">
                <div className="aspect-square overflow-hidden bg-secondary mb-4">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-body text-sm font-medium">{product.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-body">{formatPrice(product.price)}</span>
                  {product.compare_at_price && (
                    <span className="text-sm text-muted-foreground line-through font-body">
                      {formatPrice(product.compare_at_price)}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 mt-2">
                  {[...new Set(product.variants.map((v) => v.color_hex))].map((hex) => (
                    <span
                      key={hex}
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, formatPrice } from "@/lib/products";
import { mockProducts, formatPrice as mockFormatPrice } from "@/data/mock-products";
import { Loader2 } from "lucide-react";

export default function Shop() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const allProducts = products && products.length > 0 ? products : mockProducts;
  const priceFormatter = products && products.length > 0 ? formatPrice : mockFormatPrice;

  return (
    <div className="min-h-screen pt-16">
      <div className="px-6 lg:px-12 py-16 border-b border-border">
        <h1 className="font-display text-5xl md:text-7xl">ALL PRODUCTS</h1>
        <p className="mt-2 text-muted-foreground font-body">{allProducts.length} product{allProducts.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="px-6 lg:px-12 py-12">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {allProducts.map((product, i) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }}>
                <Link to={`/product/${product.slug}`} className="group block">
                  <div className="aspect-square overflow-hidden bg-secondary mb-4">
                    <img
                      src={product.images[0] || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="font-body text-sm font-medium">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-body">{priceFormatter(product.price)}</span>
                    {product.compare_at_price && (
                      <span className="text-sm text-muted-foreground line-through font-body">{priceFormatter(product.compare_at_price)}</span>
                    )}
                  </div>
                  <div className="flex gap-1 mt-2">
                    {[...new Set(product.variants.map((v) => v.color_hex))].map((hex) => (
                      <span key={hex} className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: hex }} />
                    ))}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

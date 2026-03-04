import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, formatPrice } from "@/lib/products";
import { mockProducts, formatPrice as mockFormatPrice } from "@/data/mock-products";
import productWhite from "@/assets/product-tshirt-white.jpg";
import { ArrowRight } from "lucide-react";
import { usePreOrderMode } from "@/hooks/usePreOrderMode";

const Index = () => {
  const isPreOrder = usePreOrderMode();

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts
  });

  const allProducts = products && products.length > 0 ? products : mockProducts;
  const featured = allProducts[0];
  const priceFormatter = products && products.length > 0 ? formatPrice : mockFormatPrice;

  return (
    <div className="min-h-screen">
      {/* Hero — pure black, premium typography */}
      <section className="relative h-screen w-full overflow-hidden bg-black">
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")', backgroundSize: '128px 128px' }} />

        {/* Minimal accent lines */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-32 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-32 bg-gradient-to-t from-transparent via-white/10 to-transparent" />

        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-8 md:px-16 lg:px-24 pt-24 md:pt-28"
        >
          <p className="text-white/20 text-[10px] md:text-xs uppercase tracking-[0.5em] font-body">
            Est. 2026
          </p>
          <p className="text-white/20 text-[10px] md:text-xs uppercase tracking-[0.5em] font-body">
            {isPreOrder ? "Pre-Order Now" : "Drop 001"}
          </p>
        </motion.div>

        {/* Center-stage typography */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-display text-[clamp(4rem,15vw,14rem)] leading-[0.85] text-white tracking-tight">
              SECOND
            </h1>
            <h1 className="font-display text-[clamp(4rem,15vw,14rem)] leading-[0.85] text-white tracking-tight -mt-2 md:-mt-4">
              CHANCE
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-white/30 text-xs md:text-sm uppercase tracking-[0.4em] font-body mt-8 md:mt-12"
          >
            Everyone deserves one
          </motion.p>

          {isPreOrder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="mt-4"
            >
              <span className="inline-block border border-white/20 text-white/50 px-4 py-1.5 text-[10px] uppercase tracking-[0.4em] font-body">
                Pre-Order Open
              </span>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="mt-10 md:mt-14"
          >
            <Link
              to="/shop"
              className="group relative inline-flex items-center gap-4 border border-white/20 text-white px-10 py-4 text-xs md:text-sm font-body uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all duration-500"
            >
              {isPreOrder ? "Pre-Order Now" : "Explore the Collection"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </motion.div>
        </div>

        {/* Bottom accent line */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent z-10"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2, delay: 1.5, ease: "easeOut" }}
        />

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        >
          <span className="text-white/15 text-[9px] uppercase tracking-[0.4em] font-body">Scroll</span>
          <div className="w-[1px] h-6 bg-white/15" />
        </motion.div>
      </section>

      {/* Featured Product */}
      {featured && (
        <section className="py-24 md:py-32 px-8 md:px-16 lg:px-24">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center">
            <motion.div
              className="md:col-span-7"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="aspect-[4/5] overflow-hidden bg-secondary">
                <img
                  src={featured.images.length > 0 ? featured.images[0] : productWhite}
                  alt={featured.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            </motion.div>
            <motion.div
              className="md:col-span-5"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-xs text-muted-foreground uppercase tracking-[0.3em] font-body mb-3">
                {isPreOrder ? "Pre-Order" : "Featured"}
              </p>
              <h2 className="font-display text-5xl md:text-7xl mb-4">{featured.name}</h2>
              <p className="text-muted-foreground font-body text-base leading-relaxed mb-8 max-w-sm">
                {featured.description}
              </p>
              <div className="flex items-baseline gap-3 mb-10">
                <span className="text-3xl font-display">{priceFormatter(featured.price)}</span>
                {featured.compare_at_price && (
                  <span className="text-lg text-muted-foreground line-through font-body">
                    {priceFormatter(featured.compare_at_price)}
                  </span>
                )}
              </div>
              <Link
                to={`/product/${featured.slug}`}
                className="group inline-flex items-center gap-3 bg-primary text-primary-foreground px-10 py-4 text-sm font-medium uppercase tracking-[0.2em] font-body hover:opacity-90 transition-opacity"
              >
                {isPreOrder ? "Pre-Order" : "View Product"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Brand manifesto */}
      <section className="bg-primary text-primary-foreground py-24 md:py-32 px-8 md:px-16 lg:px-24">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-primary-foreground/40 text-xs uppercase tracking-[0.4em] font-body mb-6">
              The Philosophy
            </p>
            <h2 className="font-display text-5xl md:text-8xl leading-[0.95] mb-8">
              Second chance is not a moment in time — it's an identity
            </h2>
            <p className="text-primary-foreground/50 font-body text-lg max-w-xl mx-auto leading-relaxed">
              Born from resilience. Worn with conviction. Every thread carries the weight of redemption and the lightness of new beginnings.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;

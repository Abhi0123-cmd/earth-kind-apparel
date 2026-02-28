import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, formatPrice } from "@/lib/products";
import { mockProducts, formatPrice as mockFormatPrice } from "@/data/mock-products";
import heroImage from "@/assets/hero-image.jpg";
import productWhite from "@/assets/product-tshirt-white.jpg";
import { ArrowRight } from "lucide-react";

const Index = () => {
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts
  });

  const allProducts = products && products.length > 0 ? products : mockProducts;
  const featured = allProducts[0];
  const priceFormatter = products && products.length > 0 ? formatPrice : mockFormatPrice;

  return (
    <div className="min-h-screen">
      {/* Hero — full-bleed editorial */}
      <section className="relative h-screen w-full overflow-hidden">
        <img
          src={heroImage}
          alt="Second Chance — everyone deserves one"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        {/* Cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

        {/* Content pinned bottom-left, editorial style */}
        <div className="relative z-10 flex flex-col justify-end h-full px-8 md:px-16 lg:px-24 pb-16 md:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            <p className="text-white/50 text-xs md:text-sm uppercase tracking-[0.3em] font-body mb-4">
              Drop 001 — Limited Edition
            </p>
            <h1 className="font-display text-[clamp(3rem,10vw,9rem)] leading-[0.9] text-white">
              SECOND<br />CHANCE
            </h1>
            <p className="mt-6 text-white/60 text-base md:text-lg font-body max-w-md leading-relaxed">
              Everyone deserves one — whether they know it or not.
            </p>
            <div className="flex items-center gap-6 mt-10">
              <Link
                to="/shop"
                className="group inline-flex items-center gap-3 bg-white text-black px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] font-body hover:bg-white/90 transition-colors"
              >
                Shop the Drop
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/about"
                className="text-white/50 text-sm font-body uppercase tracking-widest hover:text-white transition-colors"
              >
                Our Story
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Subtle scroll indicator */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <div className="w-[1px] h-8 bg-white/30" />
        </motion.div>
      </section>

      {/* Featured Product — asymmetric editorial layout */}
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
                Featured
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
                View Product
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Brand manifesto — editorial full-width band */}
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

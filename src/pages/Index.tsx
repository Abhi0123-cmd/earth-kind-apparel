import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, formatPrice } from "@/lib/products";
import { mockProducts, formatPrice as mockFormatPrice } from "@/data/mock-products";
import heroImage from "@/assets/hero-image.jpg";
import productBlack from "@/assets/product-tshirt-black.jpg";

const Index = () => {
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts
  });

  // Use DB products if available, fallback to mock
  const allProducts = products && products.length > 0 ? products : mockProducts;
  const featured = allProducts[0];
  const priceFormatter = products && products.length > 0 ? formatPrice : mockFormatPrice;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-screen w-full overflow-hidden">
        <img src={heroImage} alt="Second Chance hero" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end h-full px-6 lg:px-12 pb-20">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <h1 className="font-display text-6xl md:text-8xl lg:text-9xl text-background leading-none">
              EVERYONE<br />DESERVES A<br />SECOND CHANCE
            </h1>
            <p className="mt-4 text-background/70 text-lg md:text-xl font-body max-w-xl">"Whether they know it or not"

            </p>
            <Link to="/shop" className="inline-block mt-8 bg-background text-foreground px-10 py-4 text-sm font-medium uppercase tracking-widest hover:bg-background/90 transition-colors font-body">
              Shop Now
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Product */}
      {featured &&
      <section className="py-24 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <img
              src={featured.images.length > 0 ? featured.images[0] : productBlack}
              alt={featured.name}
              className="w-full aspect-square object-cover bg-secondary" />

            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}>
              <p className="text-sm text-muted-foreground uppercase tracking-widest font-body mb-2">Featured</p>
              <h2 className="font-display text-5xl md:text-6xl mb-4">{featured.name}</h2>
              <p className="text-muted-foreground font-body text-lg leading-relaxed mb-6">{featured.description}</p>
              <div className="flex items-center gap-3 mb-8">
                <span className="text-2xl font-medium font-body">{priceFormatter(featured.price)}</span>
                {featured.compare_at_price &&
              <span className="text-lg text-muted-foreground line-through font-body">{priceFormatter(featured.compare_at_price)}</span>
              }
              </div>
              <Link to={`/product/${featured.slug}`} className="inline-block bg-primary text-primary-foreground px-10 py-4 text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity font-body">
                View Product
              </Link>
            </motion.div>
          </div>
        </section>
      }

      {/* Brand Story */}
      <section className="bg-primary text-primary-foreground py-24 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="font-display text-5xl md:text-7xl mb-6">There's always a second chance</h2>
            <p className="text-primary-foreground/60 font-body text-lg leading-relaxed max-w-2xl mx-auto">second chance is not a moment in time, it's an identity.


            </p>
          </motion.div>
        </div>
      </section>
    </div>);

};

export default Index;
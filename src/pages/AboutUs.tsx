import { motion } from "framer-motion";

export default function AboutUs() {
  return (
    <div className="min-h-screen pt-16">
      <div className="relative overflow-hidden bg-primary text-primary-foreground py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto px-6 lg:px-12 text-center"
        >
          <h1 className="font-display text-6xl md:text-8xl mb-6">ABOUT US</h1>
          <div className="w-16 h-px bg-primary-foreground/30 mx-auto" />
        </motion.div>
      </div>

      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-8"
        >
          <h2 className="font-display text-4xl md:text-5xl">OUR STORY</h2>
          <div className="w-12 h-px bg-foreground" />
          <p className="text-muted-foreground font-body text-lg leading-relaxed">
            We believe everyone deserves a second chance, whether they know it or not. You're now a part of this growing community of individuals committed to finding their second chance in life.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[
            { title: "COMMUNITY", desc: "Built by people, for people. Every purchase supports a vision of renewal." },
            { title: "QUALITY", desc: "Premium essentials crafted with care. Made to last, designed to inspire." },
            { title: "PURPOSE", desc: "More than a brand — a movement towards embracing new beginnings." },
          ].map((item, i) => (
            <div key={i} className="border border-border p-8">
              <h3 className="font-display text-2xl mb-3">{item.title}</h3>
              <p className="text-muted-foreground font-body text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

import { useParams, Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchProductBySlug, formatPrice } from "@/lib/products";
import { getProduct, formatPrice as mockFormatPrice } from "@/data/mock-products";
import { useCart } from "@/context/CartContext";
import { usePreOrderMode } from "@/hooks/usePreOrderMode";
import { Check, Loader2, Minus, Plus } from "lucide-react";
import StoryInput from "@/components/product/StoryInput";
import TShirtBackPreview from "@/components/product/TShirtBackPreview";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const isPreOrder = usePreOrderMode();

  const { data: dbProduct, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductBySlug(slug || ""),
    enabled: !!slug,
  });

  const mockProduct = getProduct(slug || "");
  const product = dbProduct || mockProduct || null;
  const priceFormatter = dbProduct ? formatPrice : mockFormatPrice;

  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [imageIndex, setImageIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showMaxStock, setShowMaxStock] = useState(false);
  const [viewMode, setViewMode] = useState<"front" | "back">("front");
  const [submittedStory, setSubmittedStory] = useState("");

  const colors = useMemo(() => {
    if (!product) return [];
    const map = new Map<string, { color: string; hex: string }>();
    product.variants.forEach((v) => {
      if (v.is_active) map.set(v.color, { color: v.color, hex: v.color_hex });
    });
    return Array.from(map.values());
  }, [product]);

  const sizes = useMemo(() => {
    if (!product || !selectedColor) return [];
    return product.variants
      .filter((v) => v.color === selectedColor && v.is_active)
      .map((v) => ({ size: v.size, stock: v.stock }));
  }, [product, selectedColor]);

  if (product && colors.length > 0 && !selectedColor) {
    setSelectedColor(colors[0].color);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl mb-4">PRODUCT NOT FOUND</h1>
          <Link to="/shop" className="text-sm underline text-muted-foreground hover:text-foreground font-body">Back to Shop</Link>
        </div>
      </div>
    );
  }

  const selectedVariant = product.variants.find((v) => v.color === selectedColor && v.size === selectedSize);

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addItem(product, selectedVariant, quantity);
    setAdded(true);
    setQuantity(1);
    setTimeout(() => setAdded(false), 2000);
  };

  const maxQty = selectedVariant ? selectedVariant.stock : 1;
  const fallbackImages = mockProduct?.images && mockProduct.images.length > 0 ? mockProduct.images : ["/placeholder.svg"];
  const productImages = product.images && product.images.length > 0 ? product.images : fallbackImages;

  return (
    <div className="min-h-screen pt-16">
      <div className="px-6 lg:px-12 py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-body mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-foreground transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            {/* Front/Back Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setViewMode("front")}
                className={`px-4 py-2 text-xs font-body uppercase tracking-widest transition-all border ${
                  viewMode === "front" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground"
                }`}
              >
                Front
              </button>
              <button
                onClick={() => setViewMode("back")}
                className={`px-4 py-2 text-xs font-body uppercase tracking-widest transition-all border ${
                  viewMode === "back" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground"
                }`}
              >
                Back
              </button>
            </div>

            {viewMode === "front" ? (
              <>
                <div className="aspect-square bg-secondary overflow-hidden mb-4">
                  <img src={productImages[imageIndex]} alt={product.name} className="w-full h-full object-cover" />
                </div>
                {productImages.length > 1 && (
                  <div className="flex gap-2">
                    {productImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setImageIndex(i)}
                        className={`w-20 h-20 bg-secondary overflow-hidden border-2 transition-colors ${i === imageIndex ? "border-foreground" : "border-transparent"}`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <TShirtBackPreview story={submittedStory} productName={product.name} />
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex flex-col">
            {isPreOrder && (
              <span className="inline-block w-fit border border-border text-muted-foreground px-3 py-1 text-[10px] uppercase tracking-[0.3em] font-body mb-3">
                Pre-Order
              </span>
            )}
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-body mb-1">{product.category}</p>
            <h1 className="font-display text-4xl md:text-5xl mb-4">{product.name}</h1>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl font-medium font-body">{priceFormatter(product.price)}</span>
              {product.compare_at_price && (
                <span className="text-lg text-muted-foreground line-through font-body">{priceFormatter(product.compare_at_price)}</span>
              )}
            </div>
            <p className="text-muted-foreground font-body leading-relaxed mb-8">{product.description}</p>

            {/* Colors */}
            {colors.length > 1 && (
              <div className="mb-6">
                <p className="text-sm font-medium font-body mb-3">Color — <span className="text-muted-foreground">{selectedColor}</span></p>
                <div className="flex gap-3">
                  {colors.map((c) => (
                    <button
                      key={c.color}
                      onClick={() => { setSelectedColor(c.color); setSelectedSize(""); }}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === c.color ? "border-foreground scale-110" : "border-border"}`}
                      style={{ backgroundColor: c.hex }}
                      title={c.color}
                    />
                  ))}
                </div>
              </div>
            )}
            {colors.length === 1 && (
              <div className="mb-6">
                <p className="text-sm font-medium font-body">Color — <span className="text-muted-foreground">{selectedColor}</span></p>
              </div>
            )}

            {/* Sizes */}
            <div className="mb-6">
              <p className="text-sm font-medium font-body mb-3">Size</p>
              <div className="flex gap-2 flex-wrap">
                {sizes.map((s) => (
                  <button
                    key={s.size}
                    onClick={() => setSelectedSize(s.size)}
                    disabled={s.stock === 0}
                    className={`px-6 py-3 border text-sm font-body font-medium transition-all ${
                      selectedSize === s.size
                        ? "bg-primary text-primary-foreground border-primary"
                        : s.stock === 0
                        ? "bg-muted text-muted-foreground border-border cursor-not-allowed line-through"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {s.size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-8">
              <p className="text-sm font-medium font-body mb-3">Quantity</p>
              <div className="flex items-center border border-border w-fit">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 text-muted-foreground hover:text-foreground transition-colors" disabled={quantity <= 1}>
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-6 py-3 font-body text-sm font-medium min-w-[3rem] text-center">{quantity}</span>
                <button
                  onClick={() => {
                    if (quantity >= maxQty) { setShowMaxStock(true); setTimeout(() => setShowMaxStock(false), 2000); }
                    else { setQuantity(quantity + 1); setShowMaxStock(false); }
                  }}
                  className="px-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {showMaxStock && <p className="text-xs text-destructive font-body mt-1 animate-in fade-in">Max stock reached</p>}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant}
              className={`w-full py-4 text-sm font-medium uppercase tracking-widest font-body transition-all ${
                !selectedVariant ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : added ? "bg-green-700 text-white"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {added ? (
                <span className="flex items-center justify-center gap-2"><Check className="w-4 h-4" /> {isPreOrder ? "Added to Pre-Order" : "Added to Bag"}</span>
              ) : !selectedSize ? "Select a Size" : isPreOrder ? "Pre-Order Now" : "Add to Bag"}
            </button>

            {selectedVariant && selectedVariant.stock < 10 && (
              <p className="mt-3 text-sm text-destructive font-body">Only {selectedVariant.stock} left in stock</p>
            )}
          </motion.div>
        </div>

        {/* Story Section */}
        <div className="max-w-7xl mx-auto mt-16">
          <StoryInput productId={product.id} onStorySubmit={(story) => { setSubmittedStory(story); setViewMode("back"); }} />
        </div>
      </div>
    </div>
  );
}

import type { Product } from "@/types";
import productWhite from "@/assets/product-tshirt-white.jpg";

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Essential Tee",
    slug: "essential-tee",
    description:
      "The Essential Tee is crafted from 100% organic cotton with a relaxed fit that drapes effortlessly. Built to last, designed to feel like a second skin. This is the t-shirt you'll reach for every single day.",
    price: 999,
    compare_at_price: null,
    category: "T-Shirts",
    images: [productWhite],
    is_active: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: "v5", product_id: "1", size: "S", color: "White", color_hex: "#F5F5F5", sku: "ESS-WHT-S", stock: 30, is_active: true },
      { id: "v6", product_id: "1", size: "M", color: "White", color_hex: "#F5F5F5", sku: "ESS-WHT-M", stock: 45, is_active: true },
      { id: "v7", product_id: "1", size: "L", color: "White", color_hex: "#F5F5F5", sku: "ESS-WHT-L", stock: 38, is_active: true },
      { id: "v8", product_id: "1", size: "XL", color: "White", color_hex: "#F5F5F5", sku: "ESS-WHT-XL", stock: 22, is_active: true },
    ],
  },
];

export function getProduct(slug: string) {
  return mockProducts.find((p) => p.slug === slug);
}

export function formatPrice(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

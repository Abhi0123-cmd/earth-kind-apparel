import type { Product } from "@/types";
import productBlack from "@/assets/product-tshirt-black.jpg";
import productWhite from "@/assets/product-tshirt-white.jpg";

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Essential Tee",
    slug: "essential-tee",
    description:
      "The Essential Tee is crafted from 100% organic cotton with a relaxed fit that drapes effortlessly. Built to last, designed to feel like a second skin. This is the t-shirt you'll reach for every single day.",
    price: 1499,
    compare_at_price: 1999,
    category: "T-Shirts",
    images: [productBlack, productWhite],
    is_active: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: "v1", product_id: "1", size: "S", color: "Black", color_hex: "#111111", sku: "ESS-BLK-S", stock: 25, is_active: true },
      { id: "v2", product_id: "1", size: "M", color: "Black", color_hex: "#111111", sku: "ESS-BLK-M", stock: 40, is_active: true },
      { id: "v3", product_id: "1", size: "L", color: "Black", color_hex: "#111111", sku: "ESS-BLK-L", stock: 35, is_active: true },
      { id: "v4", product_id: "1", size: "XL", color: "Black", color_hex: "#111111", sku: "ESS-BLK-XL", stock: 20, is_active: true },
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

export function formatPrice(paise: number) {
  return `₹${(paise / 100).toFixed(0)}`;
}

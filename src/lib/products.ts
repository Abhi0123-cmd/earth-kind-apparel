import { supabase } from "@/integrations/supabase/client";
import type { Product, ProductVariant } from "@/types";

export async function fetchProducts(): Promise<Product[]> {
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !products) return [];

  const { data: variants } = await supabase
    .from("product_variants")
    .select("*")
    .eq("is_active", true);

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description || "",
    price: p.price,
    compare_at_price: p.compare_at_price || undefined,
    category: p.category,
    images: p.images || [],
    is_active: p.is_active,
    created_at: p.created_at,
    variants: (variants || [])
      .filter((v) => v.product_id === p.id)
      .map((v) => ({
        id: v.id,
        product_id: v.product_id,
        size: v.size,
        color: v.color,
        color_hex: v.color_hex,
        sku: v.sku,
        stock: v.stock,
        is_active: v.is_active,
      })),
  }));
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data: p } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!p) return null;

  const { data: variants } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", p.id)
    .eq("is_active", true);

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description || "",
    price: p.price,
    compare_at_price: p.compare_at_price || undefined,
    category: p.category,
    images: p.images || [],
    is_active: p.is_active,
    created_at: p.created_at,
    variants: (variants || []).map((v) => ({
      id: v.id,
      product_id: v.product_id,
      size: v.size,
      color: v.color,
      color_hex: v.color_hex,
      sku: v.sku,
      stock: v.stock,
      is_active: v.is_active,
    })),
  };
}

export function formatPrice(paise: number) {
  return `₹${(paise / 100).toFixed(0)}`;
}

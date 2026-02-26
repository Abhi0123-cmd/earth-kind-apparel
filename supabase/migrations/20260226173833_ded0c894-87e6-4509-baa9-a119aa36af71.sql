
-- Atomic stock decrement: reduces stock for a variant, fails if insufficient
CREATE OR REPLACE FUNCTION public.decrement_stock(p_variant_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_stock integer;
BEGIN
  -- Lock the row to prevent race conditions
  SELECT stock INTO current_stock
  FROM product_variants
  WHERE id = p_variant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variant % not found', p_variant_id;
  END IF;

  IF current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock for variant %. Available: %, Requested: %', p_variant_id, current_stock, p_quantity;
  END IF;

  UPDATE product_variants
  SET stock = stock - p_quantity
  WHERE id = p_variant_id;
END;
$$;

-- Restore stock (for failed payments or cancellations)
CREATE OR REPLACE FUNCTION public.restore_stock(p_variant_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE product_variants
  SET stock = stock + p_quantity
  WHERE id = p_variant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variant % not found', p_variant_id;
  END IF;
END;
$$;

-- Bulk stock check: returns variants with insufficient stock
CREATE OR REPLACE FUNCTION public.check_stock(p_items jsonb)
RETURNS TABLE(variant_id uuid, requested integer, available integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (item->>'variant_id')::uuid AS variant_id,
    (item->>'quantity')::integer AS requested,
    pv.stock AS available
  FROM jsonb_array_elements(p_items) AS item
  JOIN product_variants pv ON pv.id = (item->>'variant_id')::uuid
  WHERE pv.stock < (item->>'quantity')::integer;
END;
$$;

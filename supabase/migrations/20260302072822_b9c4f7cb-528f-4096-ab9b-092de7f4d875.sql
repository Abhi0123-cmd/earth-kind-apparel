
-- Update existing White variant stocks to match user's requested breakdown
UPDATE product_variants SET stock = 6 WHERE product_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND color = 'White' AND size = 'S';
UPDATE product_variants SET stock = 10 WHERE product_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND color = 'White' AND size = 'M';
UPDATE product_variants SET stock = 12 WHERE product_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND color = 'White' AND size = 'L';
UPDATE product_variants SET stock = 10 WHERE product_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND color = 'White' AND size = 'XL';

-- Add 2XL variant for White Essential Tee
INSERT INTO product_variants (product_id, size, color, color_hex, sku, stock, is_active)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2XL', 'White', '#F5F5F5', 'ESS-WHT-2XL', 8, true);

-- Add 3XL variant for White Essential Tee
INSERT INTO product_variants (product_id, size, color, color_hex, sku, stock, is_active)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '3XL', 'White', '#F5F5F5', 'ESS-WHT-3XL', 4, true);

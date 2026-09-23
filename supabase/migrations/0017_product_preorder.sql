-- ============================================================================
-- Pre-order support: a seller can mark a product as available for pre-order
-- so customers can order it ahead of (or regardless of) current stock --
-- e.g. a new arrival that hasn't landed yet. This deliberately bypasses the
-- normal stock-quantity gating in src/lib/cart.ts and src/lib/orders.ts, so
-- it's a separate flag rather than reusing track_inventory=false (a seller
-- may still want to track how many units are coming in).
-- ============================================================================

alter table products
  add column is_preorder boolean not null default false,
  add column preorder_note text;

-- Snapshotted onto the order item (like product_name) so a past order still
-- shows it was a pre-order even if the flag is later turned off once stock
-- arrives.
alter table order_items
  add column is_preorder boolean not null default false;

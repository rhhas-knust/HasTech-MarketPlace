export interface StockLike {
  track_inventory: boolean;
  stock_quantity: number;
  low_stock_threshold: number | null;
  is_preorder: boolean;
}

export function isOutOfStock(product: StockLike): boolean {
  return product.track_inventory && !product.is_preorder && product.stock_quantity <= 0;
}

export function isLowStock(product: StockLike, storeDefaultThreshold: number): boolean {
  if (!product.track_inventory || product.is_preorder) return false;
  const threshold = product.low_stock_threshold ?? storeDefaultThreshold;
  return product.stock_quantity > 0 && product.stock_quantity <= threshold;
}

export interface StatsData {
  totalProducts: number;
  reorderAlertsCount: number;
  forecastedMonthlySales: number;
  totalStockValue: number;
}

export interface SalePoint {
  date: string;      // '2026-04-01'
  quantity: number;
}

export interface AbcItem {
  productId: number;
  productName: string;
  abcClass: 'A' | 'B' | 'C';
  revenue: number;
}

export interface ReorderItem {
  productId: number;
  productName: string;
  sku: string;
  eoq: number;
  safetyStock: number;
  reorderPoint: number;
  currentStock: number;
  recommendation: string;
}

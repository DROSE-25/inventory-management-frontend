export interface DataPoint {
  date: string;
  value: number;
}

export interface ForecastResult {
  method: string;
  forecast: DataPoint[];
  mae: number;
  mape: number;
  rmse: number;
  description?: string;
}

export interface CompareResponse {
  productId: number;
  productName: string;
  horizon: number;
  results: ForecastResult[];
  best: ForecastResult;
}

export interface ProductOption {
  id: number;
  name: string;
  sku: string;
}


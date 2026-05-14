import { apiClient } from './client';
import type { CompareResponse, ForecastResult, ProductOption }
  from '@/types/forecast';

export const getProducts = async (): Promise<ProductOption[]> => {
  const res = await apiClient.get('/products');
  return res.data.content ?? res.data;
};

export const compareMethods = async (
  productId: number, horizon = 30
): Promise<CompareResponse> => {
  const res = await apiClient.post(
    '/forecast/compare/' + productId + '?horizon=' + horizon
  );
  return res.data;
};

export const getBestForecast = async (
  productId: number
): Promise<ForecastResult> => {
  const res = await apiClient.get('/forecast/best/' + productId);
  return res.data;
};


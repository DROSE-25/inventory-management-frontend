import { apiClient } from './client';
import type { Product, ProductForm, Page } from '@/types/product';

export const getProducts = async (
  page = 0,
  size = 20,
  search = ''
): Promise<Page<Product>> => {
  const params: Record<string, any> = { page, size };
  if (search) params.search = search;
  const res = await apiClient.get('/products', { params });
  // якщо бекенд повертає масив (не Page) — обгорнути
  if (Array.isArray(res.data)) {
    return { content: res.data, totalPages: 1, totalElements: res.data.length, number: 0, size: res.data.length };
  }
  return res.data;
};

export const createProduct = async (data: ProductForm): Promise<Product> => {
  const res = await apiClient.post('/products', data);
  return res.data;
};

export const updateProduct = async (id: number, data: ProductForm): Promise<Product> => {
  const res = await apiClient.put(`/products/${id}`, data);
  return res.data;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await apiClient.delete(`/products/${id}`);
};

export const getAllSuppliers = async () => {
  const res = await apiClient.get('/suppliers');
  return Array.isArray(res.data) ? res.data : res.data.content ?? [];
};
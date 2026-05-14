import { apiClient } from './client';

// Утиліта для генерації CSV і скачування
export const downloadCsv = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;

  // Заголовки — перший об'єкт
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(r =>
    Object.values(r).map(v =>
      typeof v === 'string' && v.includes(',') ? `"${v}"` : v
    ).join(',')
  );
  const csv = '\uFEFF' + [headers, ...rows].join('\n'); // BOM для кирилиці

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ABC/XYZ дані
export const getAbcXyzReport = async () => {
  const res = await apiClient.get('/analysis/abc-xyz');
  return res.data;
};

// Критичні залишки
export const getReorderAlertsReport = async () => {
  const res = await apiClient.get('/optimization/reorder-alerts');
  return res.data;
};

// Продажі за останні 30 днів
export const getProductsReport = async () => {
  const res = await apiClient.get('/products', { params: { page: 0, size: 100 } });
  return Array.isArray(res.data) ? res.data : res.data.content ?? [];
};
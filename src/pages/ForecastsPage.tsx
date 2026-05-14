import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CompareTable from '@/components/forecasts/CompareTable';
import MethodCompareChart from '@/components/forecasts/MethodCompareChart';
import { getProducts, compareMethods } from '@/api/forecast';
import type { CompareResponse, ProductOption } from '@/types/forecast';

export default function ForecastsPage() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult]     = useState<CompareResponse | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    getProducts().then(setProducts).catch(console.error);
  }, []);

  const handleCompare = async () => {
    if (!selected) return;
    setLoading(true); setError(null);
    try {
      const data = await compareMethods(selected);
      setResult(data);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Недостатньо даних');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Прогнозування попиту</h1>
        <p className="text-slate-500">
          Порівняння методів для обраного товару
        </p>
      </div>
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Оберіть товар</label>
              <select
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                value={selected ?? ''}
                onChange={e => setSelected(Number(e.target.value))}
              >
                <option value=''>-- оберіть товар --</option>
                {products.map(prod => (
                  <option key={prod.id} value={prod.id}>
                    {prod.name} ({prod.sku})
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={handleCompare}
              disabled={!selected || loading}>
              {loading ? 'Розраховую...' : 'Порівняти методи'}
            </Button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>
      {result && (
        <>
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-800 font-medium">
              Найкращий метод для {result.productName}:
              {result.best.method}
              (MAPE: {result.best.mape.toFixed(2)}%)
            </p>
          </div>
          <MethodCompareChart results={result.results} />
          <CompareTable
            results={result.results}
            bestMethod={result.best.method}
          />
        </>
      )}
    </div>
  );
}


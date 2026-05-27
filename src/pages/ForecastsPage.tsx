import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await compareMethods(selected);
      setResult(data);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Недостатньо даних для прогнозу (потрібно мінімум 2 записи продажів)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Прогнозування попиту</h1>
        <p className="text-slate-500 text-sm">
          Порівняння методів прогнозування для обраного товару
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Оберіть товар для аналізу</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Select
                value={selected ? String(selected) : ''}
                onValueChange={val => { setSelected(Number(val)); setResult(null); setError(null); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-- оберіть товар --" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(prod => (
                    <SelectItem key={prod.id} value={String(prod.id)}>
                      {prod.name} ({prod.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleCompare}
              disabled={!selected || loading}
              className="shrink-0"
            >
              {loading ? 'Розраховую...' : 'Порівняти методи'}
            </Button>
          </div>

          {error && (
            <div className="mt-3 rounded-md bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <>
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-green-800 font-semibold text-sm">
                Найкращий метод для «{result.productName}»
              </p>
              <p className="text-green-700 text-sm mt-0.5">
                <span className="font-mono font-bold">{result.best.method}</span>
                {' '} — MAPE: <strong>{result.best.mape.toFixed(2)}%</strong>,
                MAE: {result.best.mae.toFixed(2)},
                RMSE: {result.best.rmse.toFixed(2)}
              </p>
            </div>
            <Badge className="bg-green-600 text-white shrink-0">BEST</Badge>
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

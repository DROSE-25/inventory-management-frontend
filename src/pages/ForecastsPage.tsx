import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Loader2, AlertCircle, Trophy } from 'lucide-react';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
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
    setLoading(true); setError(null); setResult(null);
    try {
      setResult(await compareMethods(selected));
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Недостатньо даних для прогнозу (потрібно мінімум 2 записи продажів)');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => p.id === selected);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="rounded-lg overflow-hidden" style={{
        background: 'linear-gradient(135deg, #1A0E2E 0%, #1E293B 60%, #0F1628 100%)',
        padding: '24px 28px',
      }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #C084FC)' }}>
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Прогнозування попиту</h1>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Порівняння 6 методів прогнозування для обраного товару
            </p>
          </div>
        </div>

        {/* Method badges */}
        <div className="flex flex-wrap gap-2 mt-5">
          {['SMA', 'WMA', 'SES', 'Holt', 'Linear Regression', 'Naive'].map(m => (
            <span key={m} className="text-xs px-2.5 py-1 rounded font-medium"
              style={{ background: 'rgba(124,58,237,0.2)', color: '#C084FC', border: '1px solid rgba(124,58,237,0.3)' }}>
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Product selector */}
      <div className="rounded-md border bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-700 mb-3">Оберіть товар для аналізу</p>
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <Select
              value={selected ? String(selected) : ''}
              onValueChange={val => { setSelected(Number(val)); setResult(null); setError(null); }}
            >
              <SelectTrigger className="h-10">
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
          <button
            onClick={handleCompare}
            disabled={!selected || loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-semibold transition-all shrink-0"
            style={{
              background: !selected || loading
                ? '#E2E8F0'
                : 'linear-gradient(135deg, #7C3AED, #C084FC)',
              color: !selected || loading ? '#94A3B8' : 'white',
              border: 'none',
              cursor: !selected || loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Розраховую...</>
              : <><TrendingUp className="h-4 w-4" /> Порівняти методи</>
            }
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Best method banner */}
          <div className="rounded-md overflow-hidden" style={{
            background: 'linear-gradient(135deg, #14532D, #15803D)',
            padding: '20px 24px',
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-yellow-300" />
                </div>
                <div>
                  <p className="text-white font-bold text-base">
                    Найкращий метод для «{result.productName}»
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-white/90 text-sm font-mono font-bold">
                      {result.best.method}
                    </span>
                    <span className="text-white/60 text-xs">·</span>
                    <span className="text-white/80 text-sm">
                      MAPE: <strong className="text-white">{result.best.mape.toFixed(2)}%</strong>
                    </span>
                    <span className="text-white/60 text-xs">·</span>
                    <span className="text-white/80 text-sm">
                      MAE: <strong className="text-white">{result.best.mae.toFixed(2)}</strong>
                    </span>
                    <span className="text-white/60 text-xs">·</span>
                    <span className="text-white/80 text-sm">
                      RMSE: <strong className="text-white">{result.best.rmse.toFixed(2)}</strong>
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                BEST
              </span>
            </div>
          </div>

          <MethodCompareChart results={result.results} />
          <CompareTable results={result.results} bestMethod={result.best.method} />
        </>
      )}

      {/* Empty state — no product selected */}
      {!result && !loading && !error && (
        <div className="rounded-md border bg-white p-12 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.08)' }}>
            <BarChart3 className="h-8 w-8 text-purple-400" />
          </div>
          <p className="text-slate-600 font-medium mb-1">Оберіть товар для аналізу</p>
          <p className="text-slate-400 text-sm">
            Система порівняє 6 методів прогнозування і визначить найточніший
          </p>
        </div>
      )}
    </div>
  );
}

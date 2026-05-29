import { useState, useEffect, useMemo, useRef } from 'react';
import { Package, TrendingUp, TrendingDown, Minus, Loader2, AlertCircle, ChevronDown, ChevronUp, ShoppingCart, Calendar, Target, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getProducts, compareMethods } from '@/api/forecast';
import { apiClient } from '@/api/client';
import type { CompareResponse, ProductOption } from '@/types/forecast';

const accuracy = (mape: number) => Math.max(0, Math.round(100 - mape));

function AccuracyBar({ value }: { value: number }) {
  const color = value >= 75 ? '#0891B2' : value >= 55 ? '#F59E0B' : '#DC2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 8, background: '#E8E9EC', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color, minWidth: 36 }}>{value}%</span>
    </div>
  );
}

function TrendIcon({ slope, bright }: { slope: number; bright?: boolean }) {
  const c = bright ? 'white' : undefined;
  if (slope > 0.05) return <TrendingUp className="h-5 w-5" style={{ color: c || '#F59E0B' }} />;
  if (slope < -0.05) return <TrendingDown className="h-5 w-5" style={{ color: c || '#DC2626' }} />;
  return <Minus className="h-5 w-5" style={{ color: c || '#64748B' }} />;
}

function ForecastChart({ forecast }: { forecast: { date: string; value: number }[] }) {
  if (!forecast.length) return null;
  const W = 900, H = 220;
  const PAD = { top: 20, right: 20, bottom: 36, left: 50 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;
  const vals = forecast.map(p => p.value);
  const minV = Math.max(0, Math.min(...vals) * 0.8);
  const maxV = Math.max(...vals) * 1.2;
  const xS = (i: number) => PAD.left + (i / (forecast.length - 1)) * iW;
  const yS = (v: number) => PAD.top + iH - ((v - minV) / (maxV - minV || 1)) * iH;
  const pts = forecast.map((p, i) => `${xS(i)},${yS(p.value)}`).join(' ');
  const upper = forecast.map((p, i) => `${xS(i)},${yS(p.value * 1.15)}`).join(' ');
  const lower = [...forecast].reverse().map((p, i) => `${xS(forecast.length - 1 - i)},${yS(p.value * 0.85)}`).join(' ');
  const step = Math.ceil(forecast.length / 8);
  const ticks = forecast.filter((_, i) => i % step === 0 || i === forecast.length - 1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = PAD.top + iH * (1 - t);
        const v = minV + (maxV - minV) * t;
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#F2F4F8" strokeWidth="1" />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#94A3B8">{Math.round(v)}</text>
          </g>
        );
      })}
      <polygon points={`${upper} ${lower}`} fill="#6B7FD4" fillOpacity="0.08" />
      <polyline points={pts} fill="none" stroke="#6B7FD4" strokeWidth="2.5" strokeLinejoin="round" />
      {forecast.map((p, i) => <circle key={i} cx={xS(i)} cy={yS(p.value)} r="3" fill="#6B7FD4" />)}
      {ticks.map((p, i) => {
        const idx = forecast.indexOf(p);
        return <text key={i} x={xS(idx)} y={H - 8} textAnchor="middle" fontSize="10" fill="#94A3B8">{p.date.slice(5)}</text>;
      })}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + iH} stroke="#E8E9EC" />
      <line x1={PAD.left} y1={PAD.top + iH} x2={W - PAD.right} y2={PAD.top + iH} stroke="#E8E9EC" />
    </svg>
  );
}

const HORIZONS = [
  { value: 30, label: '30 днів' },
  { value: 60, label: '60 днів' },
  { value: 90, label: '90 днів' },
];

export default function ForecastsPage() {
  const [products, setProducts]     = useState<ProductOption[]>([]);
  const [selected, setSelected]     = useState<number | null>(null);
  const [horizon, setHorizon]       = useState(30);
  const [result, setResult]         = useState<CompareResponse | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [showTech, setShowTech]     = useState(false);
  const [stockQty, setStockQty]     = useState<number | null>(null);
  const [prevMonthSales, setPrevMonthSales] = useState<number | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [exportLoading, setExportLoading] = useState<'excel'|null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getProducts().then(setProducts).catch(console.error);
  }, []);

  const handleExportExcel = async () => {
    if (!selected) return;
    setExportLoading('excel');
    try {
      const res = await apiClient.get(
        `/forecast-export/excel/forecast/${selected}?horizon=${horizon}`,
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `forecast_${result?.productName ?? 'product'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { } finally { setExportLoading(null); }
  };

  const runForecast = async (id: number, h: number) => {
    setResult(null); setError(null);
    setLoading(true); setStockQty(null); setPrevMonthSales(null);
    try {
      const [res] = await Promise.all([
        compareMethods(id, h),
        apiClient.get('/stock/below-reorder-point').then(r => {
          const arr: any[] = Array.isArray(r.data) ? r.data : r.data.content ?? [];
          const item = arr.find((s: any) => s.productId === id);
          if (item) setStockQty(Number(item.quantity));
        }).catch(() => {}),
        // Load previous month sales for comparison
        (() => {
          const now = new Date();
          const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
          const to   = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
          return apiClient.get(`/sales?page=0&size=9999&from=${from}&to=${to}`)
            .then(r => {
              const arr: any[] = Array.isArray(r.data) ? r.data : r.data.content ?? [];
              const total = arr
                .filter((s: any) => s.productId === id)
                .reduce((sum: number, s: any) => sum + Number(s.quantity), 0);
              if (total > 0) setPrevMonthSales(total);
            }).catch(() => {});
        })(),
      ]);
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Недостатньо даних для прогнозу');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (val: string) => {
    const id = Number(val);
    setSelected(id);
    runForecast(id, horizon);
  };

  const handleHorizon = (h: number) => {
    setHorizon(h);
    if (selected) runForecast(selected, h);
  };

  const insights = useMemo(() => {
    if (!result) return null;
    const best = result.best;
    const fc = best.forecast;
    if (!fc.length) return null;
    const vals = fc.map(p => p.value);
    const totalPeriod = vals.reduce((a, b) => a + b, 0);
    const week1 = vals.slice(0, 7).reduce((a, b) => a + b, 0);
    const week2 = vals.slice(7, 14).reduce((a, b) => a + b, 0);
    const half = Math.floor(vals.length / 2);
    const firstAvg = vals.slice(0, half).reduce((a, b) => a + b, 0) / half;
    const lastAvg  = vals.slice(half).reduce((a, b) => a + b, 0) / (vals.length - half);
    const slope = (lastAvg - firstAvg) / (firstAvg || 1);
    const trendText = slope > 0.05
      ? `Попит зростає (~${Math.round(slope * 100)}% до кінця періоду)`
      : slope < -0.05
        ? `Попит спадає (~${Math.round(Math.abs(slope) * 100)}% до кінця періоду)`
        : 'Попит стабільний';
    const acc = accuracy(best.mape);
    const accText = acc >= 75 ? 'Прогноз надійний' : acc >= 55 ? 'Прогноз орієнтовний' : 'Дані нестабільні';
    const dailyDemand = totalPeriod / horizon;
    const daysLeft = stockQty !== null && dailyDemand > 0 ? Math.floor(stockQty / dailyDemand) : null;
    // Compare with prev month (normalize to 30 days)
    const total30 = totalPeriod / horizon * 30;
    const vsLastMonth = prevMonthSales !== null
      ? Math.round(((total30 - prevMonthSales) / (prevMonthSales || 1)) * 100)
      : null;
    return { totalPeriod, total30, week1, week2, slope, trendText, acc, accText, daysLeft, vsLastMonth };
  }, [result, stockQty, horizon, prevMonthSales]);

  const sorted = result ? [...result.results].sort((a, b) => a.mape - b.mape) : [];

  // Save report as text file

  const handleSaveReport = () => {
    if (!result || !insights) return;
    const lines = [
      `ПРОГНОЗ ПРОДАЖІВ — ${result.productName}`,
      `Дата: ${new Date().toLocaleDateString('uk-UA')}`,
      `Горизонт: ${horizon} днів`,
      ``,
      `ТОЧНІСТЬ: ${insights.acc}% (${insights.accText})`,
      `ТРЕНД: ${insights.trendText}`,
      ``,
      `ПОТРЕБА:`,
      `  Цей тиждень: ~${Math.round(insights.week1)} шт`,
      `  Наступний тиждень: ~${Math.round(insights.week2)} шт`,
      `  На весь період (${horizon} дн.): ~${Math.round(insights.totalPeriod)} шт`,
      insights.daysLeft !== null ? `  Залишок закінчиться: через ${insights.daysLeft} дн.` : '',
      insights.vsLastMonth !== null ? `  Порівняно з минулим місяцем: ${insights.vsLastMonth > 0 ? '+' : ''}${insights.vsLastMonth}%` : '',
      ``,
      `РЕКОМЕНДАЦІЯ:`,
      `  Замовте ~${Math.round(insights.totalPeriod)} одиниць на наступні ${horizon} днів.`,
      `  Найближчі 7 днів знадобиться ~${Math.round(insights.week1)} шт.`,
      ``,
      `НАЙКРАЩИЙ МЕТОД: ${result.best.method} (MAPE: ${result.best.mape.toFixed(1)}%)`,
      ``,
      `ПОРІВНЯННЯ МЕТОДІВ:`,
      ...sorted.map((r, i) => `  ${i + 1}. ${r.method}: точність ${accuracy(r.mape)}%, MAPE ${r.mape.toFixed(1)}%`),
      ``,
      `Прогноз по датах:`,
      ...result.best.forecast.map(p => `  ${p.date}: ${Math.round(p.value)} шт`),
    ].filter(l => l !== undefined);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forecast_${result.productName.replace(/\s+/g, '_')}_${horizon}d_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-5" ref={reportRef}>

      {/* Header */}
      <div className="rounded-lg overflow-hidden" style={{
        background: 'linear-gradient(135deg, #2A3050 0%, #3D4F7C 100%)',
        padding: '24px 28px',
      }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.25)' }}>
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Прогноз продажів</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Оберіть товар — система автоматично визначить найточніший прогноз
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-48">
            <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Package className="h-4 w-4 text-slate-400" />
              Товар
            </p>
            <Select value={selected ? String(selected) : ''} onValueChange={handleSelect}>
              <SelectTrigger className="h-11 text-base">
                <SelectValue placeholder="— оберіть товар —" />
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name} <span className="text-slate-400 text-xs ml-1">({p.sku})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Horizon selector */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              Горизонт прогнозу
            </p>
            <div className="flex rounded-lg border overflow-hidden">
              {HORIZONS.map(h => (
                <button
                  key={h.value}
                  onClick={() => handleHorizon(h.value)}
                  className="px-4 py-2.5 text-sm font-medium transition-colors"
                  style={{
                    background: horizon === h.value ? '#6B7FD4' : 'white',
                    color: horizon === h.value ? 'white' : '#64748B',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="rounded-lg border bg-white p-12 flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
          <p className="text-slate-500 text-sm">Розраховую прогноз на {horizon} днів...</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {result && insights && (
        <>
          {/* Insights cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="rounded-lg bg-white p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500">Точність прогнозу</span>
                <div style={{ width: 40, height: 40, borderRadius: 6, background: 'linear-gradient(135deg, #0891B2, #38BDF8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target className="h-5 w-5 text-white" />
                </div>
              </div>
              <AccuracyBar value={insights.acc} />
              <p className="text-xs mt-2 font-semibold" style={{ color: insights.acc >= 75 ? "#0891B2" : insights.acc >= 55 ? "#F59E0B" : "#DC2626" }}>{insights.accText}</p>
            </div>

            <div className="rounded-lg bg-white p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500">Тренд</span>
                <div style={{ width: 40, height: 40, borderRadius: 6, background: 'linear-gradient(135deg, #F59E0B, #FBBF24)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendIcon slope={insights.slope} bright />
                </div>
              </div>
              <p className="text-base font-semibold text-slate-800">{insights.trendText}</p>
              {insights.vsLastMonth !== null && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">Порівняно з минулим місяцем:</span>
                  <span className="text-xs font-bold" style={{
                    color: insights.vsLastMonth > 5 ? '#0891B2' : insights.vsLastMonth < -5 ? '#DC2626' : '#64748B'
                  }}>
                    {insights.vsLastMonth > 0 ? '+' : ''}{insights.vsLastMonth}%
                  </span>
                </div>
              )}
              {prevMonthSales !== null && (
                <p className="text-xs text-slate-400 mt-1">
                  Минулий місяць: {prevMonthSales} шт → прогноз: ~{Math.round(insights.total30)} шт/міс
                </p>
              )}
            </div>

            <div className="rounded-lg bg-white p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500">Потреба</span>
                <div style={{ width: 40, height: 40, borderRadius: 6, background: 'linear-gradient(135deg, #8B5CF6, #C4B5FD)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Цей тиждень</span>
                  <span className="font-bold text-slate-800">{Math.round(insights.week1)} шт</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Наступний тиждень</span>
                  <span className="font-bold text-slate-800">{Math.round(insights.week2)} шт</span>
                </div>
                <div className="flex justify-between items-center pt-1.5" style={{ borderTop: '1px solid #F2F4F8' }}>
                  <span className="text-sm font-semibold text-slate-700">На {horizon} днів</span>
                  <span className="font-bold text-lg" style={{ color: '#6B7FD4' }}>{Math.round(insights.totalPeriod)} шт</span>
                </div>
                {insights.daysLeft !== null && (
                  <div className="flex justify-between items-center pt-1.5" style={{ borderTop: '1px solid #F2F4F8' }}>
                    <span className="text-sm text-slate-600">⚠️ Залишок закінчиться</span>
                    <span className="font-bold text-sm" style={{
                      color: insights.daysLeft <= 7 ? '#DC2626' : insights.daysLeft <= 14 ? '#F59E0B' : '#0891B2'
                    }}>
                      через {insights.daysLeft} дн.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="rounded-lg p-5" style={{ background: '#1A1A2E', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-base mb-1">
                    Рекомендація для «{result.productName}»
                  </p>
                  <p className="text-white/90 text-sm leading-relaxed">
                    {insights.acc >= 55
                      ? <>Замовте приблизно <strong>{Math.round(insights.totalPeriod)} одиниць</strong> на наступні {horizon} днів. Найближчі 7 днів знадобиться <strong>~{Math.round(insights.week1)} шт</strong>.</>
                      : <>Даних поки недостатньо. Орієнтовна потреба — <strong>~{Math.round(insights.totalPeriod)} шт</strong> на {horizon} днів.</>
                    }
                  </p>
                </div>
              </div>
              <button onClick={handleExportExcel} disabled={exportLoading !== null}
                className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold shrink-0"
                style={{ background: 'white', color: '#15803D', border: '2px solid white', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 700 }}>
                <FileSpreadsheet className="h-4 w-4" />
                {exportLoading === 'excel' ? 'Завантаження...' : 'Excel'}
              </button>
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-slate-800">Очікувані продажі — наступні {horizon} днів</p>
                <p className="text-xs text-slate-400 mt-0.5">Синя зона — діапазон можливих значень ±15%</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 24, height: 3, background: '#6B7FD4', borderRadius: 2 }} />
                  Прогноз
                </div>
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 16, height: 10, background: 'rgba(91,108,240,0.15)', borderRadius: 2 }} />
                  Діапазон
                </div>
              </div>
            </div>
            <ForecastChart forecast={result.best.forecast} />
          </div>

          {/* Technical details */}
          <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => setShowTech(v => !v)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
            >
              <div>
                <p className="font-semibold text-slate-700 text-sm">Технічні деталі — порівняння методів</p>
                <p className="text-xs text-slate-400 mt-0.5">Система порівняла 6 алгоритмів і обрала найточніший автоматично</p>
              </div>
              {showTech ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </button>
            {showTech && (
              <div className="border-t">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: '#F5F6F8' }}>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Метод</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Точність</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">MAPE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((r, idx) => {
                      const isBest = r.method === result.best.method;
                      const acc = accuracy(r.mape);
                      const color = acc >= 75 ? '#10B981' : acc >= 55 ? '#CA8A04' : '#DC2626';
                      return (
                        <tr key={r.method} className="border-t hover:bg-slate-50"
                          style={{ background: isBest ? 'rgba(22,163,74,0.05)' : undefined }}>
                          <td className="px-5 py-3 text-slate-400 text-xs">{idx + 1}</td>
                          <td className="px-5 py-3">
                            <span className={`font-medium ${isBest ? 'text-emerald-600' : 'text-slate-700'}`}>{r.method}</span>
                            {isBest && <span className="ml-2 text-xs bg-green-100 text-emerald-600 px-2 py-0.5 rounded font-semibold">Обрано</span>}
                          </td>
                          <td className="px-5 py-3" style={{ width: 180 }}><AccuracyBar value={acc} /></td>
                          <td className="px-5 py-3 text-right font-mono text-xs" style={{ color }}>{r.mape.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="px-5 py-3 border-t bg-slate-50">
                  <p className="text-xs text-slate-400">MAPE — середня відсоткова похибка. Точність = 100% − MAPE.</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {!result && !loading && !error && (
        <div className="rounded-lg border bg-white p-14 text-center">
          <div className="w-16 h-16 rounded-lg mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.08)' }}>
            <TrendingUp className="h-8 w-8 text-orange-400" />
          </div>
          <p className="text-slate-700 font-semibold mb-2 text-base">Оберіть товар вище</p>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            Система автоматично розрахує прогноз і підкаже скільки товару замовити
          </p>
        </div>
      )}
    </div>
  );
}


import { useState, useEffect, useMemo, useRef } from 'react';
import { Package, TrendingUp, TrendingDown, Minus, Loader2, AlertCircle, ChevronDown, ChevronUp, ShoppingCart, Calendar, Target, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getProducts, compareMethods } from '@/api/forecast';
import { apiClient } from '@/api/client';
import type { CompareResponse, ProductOption } from '@/types/forecast';

const accuracy = (mape: number) => Math.max(0, Math.round(100 - mape));

function AccuracyBar({ value }: { value: number }) {
  const color = value >= 75 ? '#16A34A' : value >= 55 ? '#CA8A04' : '#DC2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 8, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color, minWidth: 36 }}>{value}%</span>
    </div>
  );
}

function TrendIcon({ slope }: { slope: number }) {
  if (slope > 0.05) return <TrendingUp className="h-5 w-5" style={{ color: '#16A34A' }} />;
  if (slope < -0.05) return <TrendingDown className="h-5 w-5" style={{ color: '#DC2626' }} />;
  return <Minus className="h-5 w-5" style={{ color: '#64748B' }} />;
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
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#F1F5F9" strokeWidth="1" />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#94A3B8">{Math.round(v)}</text>
          </g>
        );
      })}
      <polygon points={`${upper} ${lower}`} fill="#3B82F6" fillOpacity="0.08" />
      <polyline points={pts} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinejoin="round" />
      {forecast.map((p, i) => <circle key={i} cx={xS(i)} cy={yS(p.value)} r="3" fill="#3B82F6" />)}
      {ticks.map((p, i) => {
        const idx = forecast.indexOf(p);
        return <text key={i} x={xS(idx)} y={H - 8} textAnchor="middle" fontSize="10" fill="#94A3B8">{p.date.slice(5)}</text>;
      })}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + iH} stroke="#E2E8F0" />
      <line x1={PAD.left} y1={PAD.top + iH} x2={W - PAD.right} y2={PAD.top + iH} stroke="#E2E8F0" />
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
  const [saved, setSaved] = useState(false);
  const [exportLoading, setExportLoading] = useState<'excel'|'pdf'|null>(null);

  useEffect(() => {
    getProducts().then(setProducts).catch(console.error);
  }, []);

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
  const handleExportExcel = async () => {
    setExportLoading('excel');
    try {
      const res = await apiClient.get('/forecast-export/excel/reorder', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `reorder_alerts_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { } finally { setExportLoading(null); }
  };

  const handleExportPdf = async () => {
    setExportLoading('pdf');
    try {
      const res = await apiClient.get('/forecast-export/pdf/reorder', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `reorder_alerts_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { } finally { setExportLoading(null); }
  };

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
      <div className="rounded-xl overflow-hidden" style={{
        background: 'linear-gradient(135deg, #1A0E2E 0%, #1E293B 60%, #0F1628 100%)',
        padding: '24px 28px',
      }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #C084FC)' }}>
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Прогноз продажів</h1>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Оберіть товар — система автоматично визначить найточніший прогноз
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
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
                    background: horizon === h.value ? '#7C3AED' : 'white',
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
        <div className="rounded-xl border bg-white p-12 flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p className="text-slate-500 text-sm">Розраховую прогноз на {horizon} днів...</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {result && insights && (
        <>
          {/* Insights cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Точність прогнозу</span>
              </div>
              <AccuracyBar value={insights.acc} />
              <p className="text-xs text-slate-400 mt-2">{insights.accText}</p>
            </div>

            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <TrendIcon slope={insights.slope} />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Тренд</span>
              </div>
              <p className="text-base font-semibold text-slate-800">{insights.trendText}</p>
              {insights.vsLastMonth !== null && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">Порівняно з минулим місяцем:</span>
                  <span className="text-xs font-bold" style={{
                    color: insights.vsLastMonth > 5 ? '#16A34A' : insights.vsLastMonth < -5 ? '#DC2626' : '#64748B'
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

            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Потреба</span>
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
                <div className="flex justify-between items-center pt-1.5" style={{ borderTop: '1px solid #F1F5F9' }}>
                  <span className="text-sm font-semibold text-slate-700">На {horizon} днів</span>
                  <span className="font-bold text-lg text-purple-700">{Math.round(insights.totalPeriod)} шт</span>
                </div>
                {insights.daysLeft !== null && (
                  <div className="flex justify-between items-center pt-1.5" style={{ borderTop: '1px solid #F1F5F9' }}>
                    <span className="text-sm text-slate-600">⚠️ Залишок закінчиться</span>
                    <span className="font-bold text-sm" style={{
                      color: insights.daysLeft <= 7 ? '#DC2626' : insights.daysLeft <= 14 ? '#CA8A04' : '#16A34A'
                    }}>
                      через {insights.daysLeft} дн.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="rounded-xl p-5" style={{
            background: insights.acc >= 75
              ? 'linear-gradient(135deg, #14532D, #15803D)'
              : insights.acc >= 55
                ? 'linear-gradient(135deg, #713F12, #A16207)'
                : 'linear-gradient(135deg, #7F1D1D, #B91C1C)',
          }}>
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
              {/* Save report button */}
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={handleExportExcel} disabled={exportLoading !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: 'rgba(21,128,61,0.2)', color: 'white', border: '1px solid rgba(74,222,128,0.3)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {exportLoading === 'excel' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
                  Excel
                </button>
                <button onClick={handleExportPdf} disabled={exportLoading !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: 'rgba(220,38,38,0.2)', color: 'white', border: '1px solid rgba(248,113,113,0.3)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {exportLoading === 'pdf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                  PDF
                </button>
                <button onClick={handleSaveReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: saved ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.15)',
                    color: 'white', border: saved ? '1px solid rgba(74,222,128,0.5)' : '1px solid rgba(255,255,255,0.25)',
                    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.3s',
                  }}>
                  {saved ? <><span>✓</span> Збережено!</> : <><Download className="h-3.5 w-3.5" /> TXT</>}
                </button>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-slate-800">Очікувані продажі — наступні {horizon} днів</p>
                <p className="text-xs text-slate-400 mt-0.5">Синя зона — діапазон можливих значень ±15%</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 24, height: 3, background: '#3B82F6', borderRadius: 2 }} />
                  Прогноз
                </div>
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 16, height: 10, background: 'rgba(59,130,246,0.15)', borderRadius: 2 }} />
                  Діапазон
                </div>
              </div>
            </div>
            <ForecastChart forecast={result.best.forecast} />
          </div>

          {/* Technical details */}
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
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
                    <tr style={{ background: '#F8FAFC' }}>
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
                      const color = acc >= 75 ? '#16A34A' : acc >= 55 ? '#CA8A04' : '#DC2626';
                      return (
                        <tr key={r.method} className="border-t hover:bg-slate-50"
                          style={{ background: isBest ? 'rgba(22,163,74,0.05)' : undefined }}>
                          <td className="px-5 py-3 text-slate-400 text-xs">{idx + 1}</td>
                          <td className="px-5 py-3">
                            <span className={`font-medium ${isBest ? 'text-green-700' : 'text-slate-700'}`}>{r.method}</span>
                            {isBest && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-semibold">Обрано</span>}
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
        <div className="rounded-xl border bg-white p-14 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.08)' }}>
            <TrendingUp className="h-8 w-8 text-purple-400" />
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


import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import type { ForecastResult } from '@/types/forecast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MEDALS = ['🥇', '🥈', '🥉'];

function Tooltip({ text, align = 'center' }: { text: string; align?: 'center' | 'right' }) {
  const [show, setShow] = useState(false);
  const leftStyle = align === 'right'
    ? { right: '0', left: 'auto', transform: 'none' }
    : { left: '50%', transform: 'translateX(-50%)' };
  const arrowStyle = align === 'right'
    ? { right: '8px', left: 'auto', transform: 'none' }
    : { left: '50%', transform: 'translateX(-50%)' };
  return (
    <span
      className="relative inline-flex items-center ml-1"
      style={{ verticalAlign: 'middle' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <HelpCircle className="h-3 w-3 text-slate-300 cursor-help hover:text-slate-500 transition-colors" />
      {show && (
        <span style={{
          position: 'absolute', top: '120%', ...leftStyle,
          background: '#16213E', color: 'white', fontSize: '11px', padding: '6px 10px',
          borderRadius: '6px', zIndex: 50, lineHeight: '1.5',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)', width: '220px', textAlign: 'left',
          fontWeight: 'normal', textTransform: 'none', letterSpacing: 'normal',
        }}>
          {text}
          <span style={{
            position: 'absolute', bottom: '100%', ...arrowStyle,
            borderWidth: '4px', borderStyle: 'solid',
            borderColor: 'transparent transparent #16213E transparent',
          }} />
        </span>
      )}
    </span>
  );
}

function getGrade(mape: number) {
  if (mape < 10) return { label: 'Відмінно', bg: '#DCFCE7', color: '#059669' };
  if (mape < 20) return { label: 'Добре',    bg: '#D1FAE5', color: '#047857' };
  if (mape < 35) return { label: 'Прийнятно',bg: '#FEF9C3', color: '#A16207' };
  if (mape < 50) return { label: 'Задовільно',bg: '#FFEDD5', color: '#C2410C' };
  return { label: 'Слабко', bg: '#FEE2E2', color: '#B91C1C' };
}

export default function CompareTable({ results, bestMethod }: {
  results: ForecastResult[];
  bestMethod: string;
}) {
  const sorted = [...results].sort((a, b) => a.mape - b.mape);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Порівняння точності методів</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-center p-3 font-medium w-12">#</th>
                <th className="text-left p-3 font-medium">Метод</th>
                <th className="text-right p-3 font-medium">
                  MAPE (%)
                  <Tooltip text="Середня відсоткова похибка. Чим менше – тим точніший метод. До 10% – відмінно, до 20% – добре, до 35% – прийнятно для реальних даних." />
                </th>
                <th className="text-right p-3 font-medium">
                  MAE
                  <Tooltip text="Середня абсолютна похибка в одиницях товару. Показує на скільки одиниць помиляється прогноз." align="right" />
                </th>
                <th className="text-right p-3 font-medium">
                  RMSE
                  <Tooltip text="Середньоквадратична похибка. Більш чутлива до великих відхилень ніж MAE." align="right" />
                </th>
                <th className="text-center p-3 font-medium">Оцінка</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, idx) => {
                const isBest = r.method === bestMethod;
                const grade = getGrade(r.mape);
                return (
                  <tr key={r.method}
                    className={`border-b transition-colors ${isBest ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-slate-50'}`}>
                    <td className="p-3 text-center text-lg">
                      {MEDALS[idx] ?? <span className="text-slate-400 text-sm">{idx + 1}</span>}
                    </td>
                    <td className="p-3">
                      <span className={`font-medium ${isBest ? 'text-green-700' : 'text-slate-800'}`}>
                        {r.method}
                      </span>
                      {isBest && (
                        <span className="ml-2 inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                          Найкращий
                        </span>
                      )}
                    </td>
                    <td className={`p-3 text-right font-mono ${isBest ? 'font-bold text-green-700' : ''}`}>
                      {r.mape.toFixed(2)}%
                    </td>
                    <td className="p-3 text-right font-mono text-slate-600">{r.mae.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-slate-600">{r.rmse.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <span className="text-xs px-2 py-0.5 rounded font-medium"
                        style={{ background: grade.bg, color: grade.color }}>
                        {grade.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t bg-slate-50 flex flex-wrap gap-3">
          {[
            { label: 'Відмінно',   range: '< 10%',   bg: '#DCFCE7', color: '#059669' },
            { label: 'Добре',      range: '10–20%',  bg: '#D1FAE5', color: '#047857' },
            { label: 'Прийнятно', range: '20–35%',  bg: '#FEF9C3', color: '#A16207' },
            { label: 'Задовільно', range: '35–50%',  bg: '#FFEDD5', color: '#C2410C' },
            { label: 'Слабко',     range: '> 50%',   bg: '#FEE2E2', color: '#B91C1C' },
          ].map(g => (
            <div key={g.label} className="flex items-center gap-1.5">
              <span className="text-xs px-2 py-0.5 rounded font-medium"
                style={{ background: g.bg, color: g.color }}>{g.label}</span>
              <span className="text-xs text-slate-400">{g.range}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

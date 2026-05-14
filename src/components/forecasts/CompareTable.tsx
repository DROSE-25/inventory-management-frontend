import type { ForecastResult } from '@/types/forecast';
import { Card, CardContent, CardHeader, CardTitle }
  from '@/components/ui/card';

export default function CompareTable({
  results, bestMethod,
}: {
  results: ForecastResult[];
  bestMethod: string;
}) {
  const sorted = [...results].sort((a, b) => a.mape - b.mape);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Порівняння точності методів</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left p-2">Метод</th>
              <th className="text-right p-2">MAPE (%)</th>
              <th className="text-right p-2">MAE</th>
              <th className="text-right p-2">RMSE</th>
              <th className="text-center p-2">Рейтинг</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, idx) => (
              <tr key={r.method} className={r.method === bestMethod
                ? 'border-b bg-green-50 font-semibold'
                : 'border-b hover:bg-slate-50'}>
                <td className="p-2">
                  {r.method === bestMethod && <span>BEST </span>}
                  {r.method}
                </td>
                <td className="p-2 text-right">{r.mape.toFixed(2)}%</td>
                <td className="p-2 text-right">{r.mae.toFixed(2)}</td>
                <td className="p-2 text-right">{r.rmse.toFixed(2)}</td>
                <td className="p-2 text-center">
                  {idx === 0 ? 'Gold' : idx === 1 ? 'Silver' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

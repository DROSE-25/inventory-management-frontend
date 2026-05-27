import type { ForecastResult } from '@/types/forecast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MEDALS = ['🥇', '🥈', '🥉'];

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
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-center p-3 font-medium w-12">#</th>
                <th className="text-left p-3 font-medium">Метод</th>
                <th className="text-right p-3 font-medium">MAPE (%)</th>
                <th className="text-right p-3 font-medium">MAE</th>
                <th className="text-right p-3 font-medium">RMSE</th>
                <th className="text-center p-3 font-medium">Оцінка</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, idx) => {
                const isBest = r.method === bestMethod;
                return (
                  <tr
                    key={r.method}
                    className={`border-b transition-colors ${
                      isBest
                        ? 'bg-green-50 hover:bg-green-100'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="p-3 text-center text-lg">
                      {MEDALS[idx] ?? <span className="text-slate-400 text-sm">{idx + 1}</span>}
                    </td>
                    <td className="p-3">
                      <span className={`font-medium ${isBest ? 'text-green-700' : 'text-slate-800'}`}>
                        {r.method}
                      </span>
                      {isBest && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                          BEST
                        </span>
                      )}
                    </td>
                    <td className={`p-3 text-right font-mono ${isBest ? 'font-bold text-green-700' : ''}`}>
                      {r.mape.toFixed(2)}%
                    </td>
                    <td className="p-3 text-right font-mono text-slate-600">
                      {r.mae.toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-600">
                      {r.rmse.toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      {r.mape < 10 ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Відмінно</span>
                      ) : r.mape < 25 ? (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Добре</span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Слабко</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

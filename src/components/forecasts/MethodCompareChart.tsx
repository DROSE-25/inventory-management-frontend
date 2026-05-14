import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Legend
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle }
  from '@/components/ui/card';
import type { ForecastResult } from '@/types/forecast';

ChartJS.register(CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Legend);

const COLORS = ['#2E5496','#1E8449','#C0392B','#D4A017','#8E44AD'];

export default function MethodCompareChart({
  results,
}: {
  results: ForecastResult[];
}) {
  if (!results.length) return null;
  const labels = results[0].forecast.map(p => p.date);
  const datasets = results.map((r, i) => ({
    label: r.method + ' (MAPE: ' + r.mape.toFixed(1) + '%)',
    data: r.forecast.map(p => p.value),
    borderColor: COLORS[i % COLORS.length],
    backgroundColor: COLORS[i % COLORS.length] + '20',
    borderWidth: 2,
    pointRadius: 3,
    tension: 0.3,
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Прогноз за методами (наступні 30 днів)</CardTitle>
      </CardHeader>
      <CardContent>
        <Line
          data={{ labels, datasets }}
          options={{
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
            scales: {
              x: { ticks: { maxTicksLimit: 10 } },
              y: { beginAtZero: true },
            },
          }}
        />
      </CardContent>
    </Card>
  );
}

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Legend, Filler
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SalePoint } from '@/types/dashboard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function SalesChart({ points }: { points: SalePoint[] }) {
  if (!points.length) {
    return (
      <Card>
        <CardHeader><CardTitle>Динаміка продажів (90 днів)</CardTitle></CardHeader>
        <CardContent>
          <p className="text-slate-400 text-sm text-center py-8">
            Недостатньо даних для побудови графіку
          </p>
        </CardContent>
      </Card>
    );
  }

  const labels = points.map(p => {
    const d = new Date(p.date);
    return d.toLocaleDateString('uk-UA', { day: '2-digit', month: 'short' });
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Кількість продажів',
        data: points.map(p => p.quantity),
        borderColor: '#F06B8A',
        backgroundColor: 'rgba(240,107,138,0.08)',
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 5,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Динаміка продажів (90 днів)</CardTitle>
      </CardHeader>
      <CardContent>
        <Line
          data={data}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: ctx => `Продажів: ${ctx.parsed.y}`,
                },
              },
            },
            scales: {
              x: {
                ticks: { maxTicksLimit: 12, font: { size: 11 } },
                grid: { display: false },
              },
              y: {
                beginAtZero: true,
                ticks: { font: { size: 11 } },
              },
            },
          }}
        />
      </CardContent>
    </Card>
  );
}

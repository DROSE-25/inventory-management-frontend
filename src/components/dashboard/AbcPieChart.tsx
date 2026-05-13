import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AbcItem } from '@/types/dashboard';

// Обов'язкова реєстрація елементів Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

export default function AbcPieChart({ items }: { items: AbcItem[] }) {
  // Рахуємо скільки товарів у кожному класі
  const countA = items.filter(i => i.abcClass === 'A').length;
  const countB = items.filter(i => i.abcClass === 'B').length;
  const countC = items.filter(i => i.abcClass === 'C').length;

  const data = {
    labels: ['Клас A (пріоритет)', 'Клас B (середній)', 'Клас C (низький)'],
    datasets: [{
      data: [countA, countB, countC],
      backgroundColor: ['#1E8449', '#D4A017', '#C0392B'],
      borderWidth: 2,
      borderColor: '#ffffff',
    }],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>ABC-розподіл товарів</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div style={{ width: 280, height: 280 }}>
          <Pie data={data} options={{ plugins: { legend: { position: 'bottom' } } }} />
        </div>
      </CardContent>
    </Card>
  );
}

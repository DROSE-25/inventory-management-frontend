import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AbcPieChart({ items }: { items: any[] }) {
  const countA = items.filter(i => i.abcClass === 'A').length;
  const countB = items.filter(i => i.abcClass === 'B').length;
  const countC = items.filter(i => i.abcClass === 'C').length;

  if (countA + countB + countC === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>ABC-розподіл товарів</CardTitle></CardHeader>
        <CardContent>
          <div style={{ width: 280, height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 60 }}>
              <svg viewBox="0 0 100 100" width="200" height="200">
                <circle cx="50" cy="50" r="40" fill="#1E8449" opacity="0.9"/>
                <path d="M50,50 L50,10 A40,40 0 0,1 84,68 Z" fill="#D4A017"/>
                <path d="M50,50 L84,68 A40,40 0 0,1 16,68 Z" fill="#C0392B"/>
                <text x="30" y="38" fill="white" fontSize="12" fontWeight="bold">A</text>
                <text x="68" y="72" fill="white" fontSize="12" fontWeight="bold">B</text>
                <text x="28" y="72" fill="white" fontSize="12" fontWeight="bold">C</text>
              </svg>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
            {[['#1E8449','Клас A (пріоритет)'],['#D4A017','Клас B (середній)'],['#C0392B','Клас C (низький)']].map(([color, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 16, height: 16, backgroundColor: color, borderRadius: 2 }}/>
                <span style={{ fontSize: 13 }}>{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = {
    labels: ['Клас A (пріоритет)', 'Клас B (середній)', 'Клас C (низький)'],
    datasets: [{ data: [countA, countB, countC], backgroundColor: ['#1E8449', '#D4A017', '#C0392B'], borderWidth: 2, borderColor: '#ffffff' }],
  };

  return (
    <Card>
      <CardHeader><CardTitle>ABC-розподіл товарів</CardTitle></CardHeader>
      <CardContent className="flex justify-center">
        <div style={{ width: 280, height: 280 }}>
          <Pie data={data} options={{ plugins: { legend: { position: 'bottom' } } }} />
        </div>
      </CardContent>
    </Card>
  );
}
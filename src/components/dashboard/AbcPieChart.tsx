import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRef } from 'react';
import type { ChartEvent, ActiveElement } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  items: any[];
  selectedClass?: string | null;
  onClassSelect?: (cls: string | null) => void;
}

export default function AbcPieChart({ items, selectedClass, onClassSelect }: Props) {
  const chartRef = useRef<ChartJS<'pie'>>(null);

  const countA = items.filter(i => i.abcClass === 'A').length;
  const countB = items.filter(i => i.abcClass === 'B').length;
  const countC = items.filter(i => i.abcClass === 'C').length;

  const classes = ['A', 'B', 'C'];
  const colors  = ['#1E8449', '#D4A017', '#C0392B'];
  const labels  = ['Клас A (пріоритет)', 'Клас B (середній)', 'Клас C (низький)'];
  const counts  = [countA, countB, countC];

  const alphaColor = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${opacity})`;
  };

  const getOpacity = (idx: number) =>
    !selectedClass || selectedClass === classes[idx] ? 1 : 0.35;

  const handleChartClick = (_event: ChartEvent, elements: ActiveElement[]) => {
    if (!elements.length || !onClassSelect) return;
    const idx = elements[0].index;
    const cls = classes[idx];
    onClassSelect(selectedClass === cls ? null : cls);
  };

  if (countA + countB + countC === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>ABC-розподіл товарів</CardTitle></CardHeader>
        <CardContent>
          <div style={{ width: 280, height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 100 100" width="200" height="200">
              <circle cx="50" cy="50" r="40" fill="#1E8449" opacity="0.9"/>
              <path d="M50,50 L50,10 A40,40 0 0,1 84,68 Z" fill="#D4A017"/>
              <path d="M50,50 L84,68 A40,40 0 0,1 16,68 Z" fill="#C0392B"/>
              <text x="30" y="38" fill="white" fontSize="12" fontWeight="bold">A</text>
              <text x="68" y="72" fill="white" fontSize="12" fontWeight="bold">B</text>
              <text x="28" y="72" fill="white" fontSize="12" fontWeight="bold">C</text>
            </svg>
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = {
    labels,
    datasets: [{
      data: counts,
      backgroundColor: colors.map((c, i) => alphaColor(c, getOpacity(i))),
      borderColor: colors.map((c, i) => selectedClass === classes[i] ? '#ffffff' : c),
      borderWidth: colors.map((_, i) => selectedClass === classes[i] ? 4 : 2),
      hoverOffset: 8,
    }],
  };

  return (
    <Card style={{ borderRadius: '6px' }}>
      <CardHeader>
        <CardTitle>ABC-розподіл товарів</CardTitle>
        {selectedClass && (
          <p className="text-xs text-slate-400 mt-0.5">
            Фільтр: Клас {selectedClass} —{' '}
            <button
              onClick={() => onClassSelect?.(null)}
              className="text-blue-500 hover:underline"
            >
              скинути
            </button>
          </p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div style={{ width: 260, height: 260, cursor: 'pointer' }}>
          <Pie
            ref={chartRef}
            data={data}
            options={{
              plugins: { legend: { display: false } },
              animation: { duration: 200 },
              onClick: handleChartClick,
            }}
          />
        </div>

        {/* Custom legend with counts */}
        <div className="w-full flex flex-col gap-2">
          {classes.map((cls, i) => (
            <button
              key={cls}
              onClick={() => onClassSelect?.(selectedClass === cls ? null : cls)}
              className="flex items-center justify-between w-full px-3 py-1.5 rounded-md text-sm transition-all"
              style={{
                background: selectedClass === cls ? alphaColor(colors[i], 0.12) : 'transparent',
                border: selectedClass === cls
                  ? `1.5px solid ${alphaColor(colors[i], 0.4)}`
                  : '1.5px solid transparent',
                opacity: !selectedClass || selectedClass === cls ? 1 : 0.45,
              }}
            >
              <div className="flex items-center gap-2">
                <div style={{ width: 12, height: 12, backgroundColor: colors[i], borderRadius: 2, flexShrink: 0 }} />
                <span className="text-slate-600">{labels[i]}</span>
              </div>
              <span className="font-semibold text-slate-800">{counts[i]}</span>
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-400 text-center">
          {selectedClass
            ? 'Клік на сектор або кнопку — скинути фільтр'
            : 'Клікни на сектор або клас, щоб відфільтрувати критичні залишки'}
        </p>
      </CardContent>
    </Card>
  );
}

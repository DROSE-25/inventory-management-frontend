import { useState } from 'react';

interface Props {
  data: Record<string, any>[];
  warehouseNames: string[];
  chartMode: 'revenue' | 'quantity';
  chartType: 'line' | 'bar';
  colors: string[];
}

export default function SvgChart({ data, warehouseNames, chartMode, chartType, colors }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

  const W = 900, H = 260, PAD = { top: 20, right: 20, bottom: 30, left: 55 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const suffix = chartMode === 'revenue' ? '_rev' : '_qty';

  // Get max value across all series
  const maxVal = Math.max(...data.map(d =>
    Math.max(...warehouseNames.map(w => Number(d[`${w}${suffix}`] ?? 0)))
  ), 1);

  const xScale = (i: number) => PAD.left + (i / (data.length - 1 || 1)) * innerW;
  const yScale = (v: number) => PAD.top + innerH - (v / maxVal) * innerH;

  const formatY = (v: number) =>
    chartMode === 'revenue'
      ? v >= 1000 ? (v / 1000).toFixed(0) + 'к' : String(Math.round(v))
      : String(Math.round(v));

  // Y axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({ v: maxVal * t, y: yScale(maxVal * t) }));

  // X axis ticks - show every Nth label to avoid crowding
  const step = Math.ceil(data.length / 10);
  const xTicks = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Grid lines */}
        {yTicks.map(({ y }, i) => (
          <line key={i} x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
            stroke="#F1F5F9" strokeWidth="1" />
        ))}

        {/* Y axis labels */}
        {yTicks.map(({ v, y }, i) => (
          <text key={i} x={PAD.left - 6} y={y + 4} textAnchor="end"
            fontSize="10" fill="#94A3B8">{formatY(v)}</text>
        ))}

        {/* X axis labels */}
        {xTicks.map((d, i) => {
          const idx = data.indexOf(d);
          return (
            <text key={i} x={xScale(idx)} y={H - 8} textAnchor="middle"
              fontSize="10" fill="#94A3B8">{d.date}</text>
          );
        })}

        {/* Series */}
        {warehouseNames.map((wName, wi) => {
          const color = colors[wi % colors.length];
          const key = `${wName}${suffix}`;

          if (chartType === 'line') {
            const points = data.map((d, i) => `${xScale(i)},${yScale(Number(d[key] ?? 0))}`).join(' ');
            return (
              <g key={wName}>
                <polyline points={points} fill="none" stroke={color} strokeWidth="2"
                  strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
              </g>
            );
          } else {
            const barW = Math.max(2, (innerW / data.length / warehouseNames.length) - 1);
            const groupW = barW * warehouseNames.length;
            return (
              <g key={wName}>
                {data.map((d, i) => {
                  const val = Number(d[key] ?? 0);
                  const barH = (val / maxVal) * innerH;
                  const x = PAD.left + (i / data.length) * innerW + (wi * barW) + (innerW / data.length - groupW) / 2;
                  const y = PAD.top + innerH - barH;
                  return (
                    <rect key={i} x={x} y={y} width={barW} height={barH}
                      fill={color} opacity="0.85" rx="2"
                      onMouseEnter={(e) => {
                        setTooltip({
                          x: e.clientX, y: e.clientY,
                          content: `${wName}: ${chartMode === 'revenue' ? val.toFixed(0) + ' грн' : val + ' шт'}`
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </g>
            );
          }
        })}

        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + innerH}
          stroke="#E2E8F0" strokeWidth="1" />
        <line x1={PAD.left} y1={PAD.top + innerH} x2={W - PAD.right} y2={PAD.top + innerH}
          stroke="#E2E8F0" strokeWidth="1" />
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8, paddingLeft: PAD.left }}>
        {warehouseNames.map((wName, i) => (
          <div key={wName} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B' }}>
            <div style={{ width: 12, height: 3, backgroundColor: colors[i % colors.length], borderRadius: 2 }} />
            {wName}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed', left: tooltip.x + 10, top: tooltip.y - 30,
          background: 'white', border: '1px solid #E2E8F0', borderRadius: 8,
          padding: '6px 10px', fontSize: 12, color: '#1E293B',
          pointerEvents: 'none', zIndex: 1000, boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          {tooltip.content}
        </div>
      )}
    </div>
  );
}

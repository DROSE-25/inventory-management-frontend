import { AlertTriangle, CheckCircle2, XCircle, HelpCircle, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReorderItem } from '@/types/dashboard';

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
          background: '#1E293B', color: 'white', fontSize: '11px', padding: '6px 10px',
          borderRadius: '6px', zIndex: 50, lineHeight: '1.5',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)', width: '220px', textAlign: 'left',
          fontWeight: 'normal', textTransform: 'none', letterSpacing: 'normal',
        }}>
          {text}
          <span style={{
            position: 'absolute', bottom: '100%', ...arrowStyle,
            borderWidth: '4px', borderStyle: 'solid',
            borderColor: 'transparent transparent #1E293B transparent',
          }} />
        </span>
      )}
    </span>
  );
}

export default function ReorderTable({ items }: { items: ReorderItem[] }) {
  const navigate = useNavigate();
  if (items.length === 0) {
    return (
      <div className="rounded-md border bg-white p-6 h-full flex flex-col">
        <h3 className="font-semibold text-slate-800 mb-4">Критичні залишки</h3>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
            <p className="text-green-700 font-medium text-sm">Всі товари в нормі</p>
            <p className="text-slate-400 text-xs mt-1">Перезамовлення не потрібне</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white overflow-hidden h-full flex flex-col">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b"
        style={{ background: 'rgba(249,115,22,0.04)' }}>
        <div className="w-8 h-8 rounded flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #C2410C, #F97316)' }}>
          <AlertTriangle className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">Критичні залишки</h3>
          <p className="text-xs text-slate-400">{items.length} товарів потребують замовлення</p>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wide">Товар</th>
              <th className="text-left px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wide">Арт.</th>
              <th className="text-left px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wide">Склад</th>
              <th className="text-right px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wide">Залишок</th>
              <th className="text-right px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wide">
                ROP
                <Tooltip text="Точка перезамовлення – мінімальний залишок при якому треба робити нове замовлення" align="right" />
              </th>
              <th className="text-right px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wide">
                EOQ
                <Tooltip text="Оптимальна кількість для замовлення – найвигідніший розмір партії з урахуванням вартості замовлення і зберігання" align="right" />
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wide">Рекомендація</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const isCritical = item.currentStock < item.safetyStock;
              return (
                <tr key={item.productId}
                  className="border-b hover:bg-slate-50 transition-colors"
                  style={{ background: i % 2 !== 0 ? 'rgba(248,250,252,0.5)' : undefined }}>
                  <td className="px-4 py-3 font-medium text-slate-800">{item.productName}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5">
                      {item.sku}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                      <svg className="h-3 w-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                      {item.warehouseName || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold text-sm inline-flex items-center gap-1 ${isCritical ? 'text-red-600' : 'text-orange-500'}`}>
                      {isCritical && <XCircle className="h-3 w-3" />}
                      {item.currentStock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">{item.reorderPoint}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-blue-600 font-semibold">{item.eoq}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-xs">
                    <button
                      onClick={() => navigate('/suppliers')}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-all cursor-pointer"
                      style={{
                        background: isCritical ? 'rgba(220,38,38,0.1)' : 'rgba(234,88,12,0.1)',
                        color: isCritical ? '#B91C1C' : '#C2410C',
                        border: isCritical ? '1px solid rgba(220,38,38,0.3)' : '1px solid rgba(234,88,12,0.3)',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = isCritical ? 'rgba(220,38,38,0.2)' : 'rgba(234,88,12,0.2)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = isCritical ? 'rgba(220,38,38,0.1)' : 'rgba(234,88,12,0.1)';
                      }}
                    >
                      <ShoppingCart className="h-3 w-3" />
                      {isCritical ? 'КРИТИЧНО' : 'ЗАМОВИТИ'}
                    </button>
                    <span className="ml-2">{item.recommendation?.split('.')[0]}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

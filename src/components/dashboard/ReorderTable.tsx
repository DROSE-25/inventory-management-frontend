import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { ReorderItem } from '@/types/dashboard';

export default function ReorderTable({ items }: { items: ReorderItem[] }) {
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
              <th className="text-left px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wide">SKU</th>
              <th className="text-right px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wide">Залишок</th>
              <th className="text-right px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wide">ROP</th>
              <th className="text-right px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wide">EOQ</th>
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
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      isCritical
                        ? 'bg-red-50 text-red-700'
                        : 'bg-orange-50 text-orange-700'
                    }`}>
                      {isCritical ? 'КРИТИЧНО' : 'ЗАМОВИТИ'}
                    </span>
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


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import type { ReorderItem } from '@/types/dashboard';

export default function ReorderTable({ items }: { items: ReorderItem[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Критичні залишки</CardTitle></CardHeader>
        <CardContent>
          <p className="text-green-600 font-medium">
            ✅ Всі товари в нормі — перезамовлення не потрібне
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-orange-500" />
        <CardTitle>Критичні залишки ({items.length} товарів)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left p-2">Товар</th>
                <th className="text-left p-2">SKU</th>
                <th className="text-right p-2">Залишок</th>
                <th className="text-right p-2">ROP</th>
                <th className="text-right p-2">EOQ</th>
                <th className="text-left p-2">Рекомендація</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.productId} className="border-b hover:bg-slate-50">
                  <td className="p-2 font-medium">{item.productName}</td>
                  <td className="p-2 text-slate-500">{item.sku}</td>
                  <td className="p-2 text-right font-bold text-red-600">
                    {item.currentStock}
                  </td>
                  <td className="p-2 text-right">{item.reorderPoint}</td>
                  <td className="p-2 text-right text-blue-600">{item.eoq}</td>
                  <td className="p-2 text-xs text-slate-600 max-w-xs">
                    {item.recommendation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

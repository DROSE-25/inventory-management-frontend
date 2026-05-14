import { PackageOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({
  title = 'Нічого не знайдено',
  description = 'Спробуйте додати перший запис',
  actionLabel,
  onAction,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <PackageOpen className="h-12 w-12 text-slate-300 mb-4" />
      <h3 className="text-lg font-medium text-slate-700">{title}</h3>
      <p className="text-sm text-slate-400 mt-1 mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  )
}
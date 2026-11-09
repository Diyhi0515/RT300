import { LayoutGrid } from 'lucide-react'
import { EmptyState } from '@/shared/ui/EmptyState'

export function MesasPage() {
  return (
    <EmptyState
      icon={<LayoutGrid className="size-8" />}
      title="Mesas"
      description="Aquí se mostrará el salón."
    />
  )
}

import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-16 text-center">
      {icon && (
        <div className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
      )}
      <h2 className="text-xl font-semibold">{title}</h2>
      {description && <p className="text-muted">{description}</p>}
      {action}
    </div>
  )
}

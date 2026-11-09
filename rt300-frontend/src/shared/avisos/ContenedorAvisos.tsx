import { useIsMutating } from '@tanstack/react-query'
import { ModalAviso } from '@/shared/ui/ModalAviso'
import { SuperposicionCarga } from '@/shared/ui/SuperposicionCarga'
import { useAvisos } from './almacen'

export function ContenedorAvisos() {
  const notice = useAvisos((s) => s.notice)
  const dismiss = useAvisos((s) => s.dismiss)
  const pending = useIsMutating({ predicate: (mutation) => !mutation.meta?.silent })

  return (
    <>
      <SuperposicionCarga open={pending > 0} />
      <ModalAviso
        open={!!notice}
        tone={notice?.tone ?? 'info'}
        title={notice?.title ?? ''}
        message={notice?.message}
        duration={notice?.duration ?? 3000}
        noticeId={notice?.id ?? 0}
        icon={notice?.icon}
        progress={notice?.progress}
        onClose={dismiss}
      />
    </>
  )
}

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <img src="/logo-icono.webp" alt="RT - AXON" width={size} height={size} className="rounded-xl" />
  )
}

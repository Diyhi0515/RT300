export function Logo({ size = 40 }: { size?: number }) {
  return (
    <img src="/logo-icono.webp" alt="RT-300" width={size} height={size} className="rounded-xl" />
  )
}

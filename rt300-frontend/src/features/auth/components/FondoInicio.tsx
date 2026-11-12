export function FondoInicio() {
  return (
    <div className="fondo-animado pointer-events-none absolute inset-0 -z-10" aria-hidden>
      <div className="absolute -left-32 -top-32 size-[28rem] animate-[float_16s_ease-in-out_infinite] rounded-full bg-radial from-club-sc/50 from-35% to-transparent to-70% will-change-transform dark:from-blue-500/25" />
      <div className="absolute -bottom-40 -right-24 size-[32rem] animate-[float_20s_ease-in-out_infinite_reverse] rounded-full bg-radial from-club-pc/25 from-35% to-transparent to-70% will-change-transform dark:from-indigo-500/25" />
      <div className="absolute right-1/4 top-0 size-80 rounded-full bg-radial from-cyan-400/10 from-35% to-transparent to-70% dark:from-cyan-400/15" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--club-text)_1px,transparent_0)] bg-[length:26px_26px] opacity-[0.045]" />
    </div>
  )
}

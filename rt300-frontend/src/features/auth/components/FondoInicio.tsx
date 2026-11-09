export function FondoInicio() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
      <div className="absolute -left-32 -top-32 size-[28rem] animate-[float_16s_ease-in-out_infinite] rounded-full bg-club-sc/50 blur-3xl dark:bg-blue-500/25" />
      <div className="absolute -bottom-40 -right-24 size-[32rem] animate-[float_20s_ease-in-out_infinite_reverse] rounded-full bg-club-pc/25 blur-3xl dark:bg-indigo-500/25" />
      <div className="absolute right-1/4 top-0 size-80 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-400/15" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--club-text)_1px,transparent_0)] bg-[length:26px_26px] opacity-[0.045]" />
    </div>
  )
}

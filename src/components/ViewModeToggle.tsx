interface ViewModeToggleProps {
  viewMode: 'outer' | 'inner'
  onToggle: () => void
  disabled?: boolean
}

export default function ViewModeToggle({
  viewMode,
  onToggle,
  disabled = false,
}: ViewModeToggleProps) {
  const isOuter = viewMode === 'outer'

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-lg backdrop-blur-sm transition hover:bg-white/10 disabled:opacity-40"
      aria-label={isOuter ? '切换到球内' : '切换到球外'}
    >
      {isOuter ? '🔮' : '🌐'}
    </button>
  )
}

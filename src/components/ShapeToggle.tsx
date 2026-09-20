import type { AlbumShape } from '../types/albumShape'

interface ShapeToggleProps {
  shape: AlbumShape
  onToggle: () => void
  disabled?: boolean
}

export default function ShapeToggle({
  shape,
  onToggle,
  disabled = false,
}: ShapeToggleProps) {
  const isSphere = shape === 'sphere'

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-lg backdrop-blur-sm transition hover:bg-white/10 disabled:opacity-40"
      aria-label={isSphere ? '切换到爱心形状' : '切换到球形'}
    >
      {isSphere ? '❤️' : '⚪'}
    </button>
  )
}

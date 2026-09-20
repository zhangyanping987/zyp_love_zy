interface BgmToggleProps {
  muted: boolean
  playing: boolean
  onToggleMute: () => void
}

export default function BgmToggle({ muted, playing, onToggleMute }: BgmToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggleMute}
      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/35 text-teal-100/90 backdrop-blur-sm transition hover:border-teal-300/40 hover:bg-black/50"
      aria-label={muted || !playing ? '开启音乐' : '静音'}
      title={muted || !playing ? '开启音乐' : '静音'}
    >
      {muted || !playing ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M11 5 6 9H3v6h3l5 4V5z" strokeLinejoin="round" />
          <path d="m16 9 5 5M21 9l-5 5" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M11 5 6 9H3v6h3l5 4V5z" strokeLinejoin="round" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" strokeLinecap="round" />
          <path d="M18.5 6a8.5 8.5 0 0 1 0 12" strokeLinecap="round" />
        </svg>
      )}
    </button>
  )
}

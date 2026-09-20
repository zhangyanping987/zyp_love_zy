interface AboutButtonProps {
  onClick: () => void
}

export default function AboutButton({ onClick }: AboutButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-lg backdrop-blur-sm transition hover:bg-white/10"
      aria-label="写给你的一页"
    >
      💌
    </button>
  )
}

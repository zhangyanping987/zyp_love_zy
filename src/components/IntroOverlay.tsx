interface IntroOverlayProps {
  visible: boolean
  progress: number
}

export default function IntroOverlay({ visible, progress }: IntroOverlayProps) {
  if (!visible) return null

  const fade = Math.max(0, 1 - progress * 1.15)
  const pulse = 0.35 + Math.sin(progress * Math.PI * 3) * 0.15 * fade

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9998]"
      style={{ opacity: fade }}
    >
      {/* 春海月明光晕 */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 45%, rgba(13,148,136,${pulse * 0.32}) 0%, rgba(94,234,212,${pulse * 0.1}) 35%, transparent 70%)`,
        }}
      />
      {/* 月球反光 */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 85% 18%, rgba(165,243,252,${pulse * 0.2}) 0%, transparent 40%)`,
        }}
      />
      {/* 乒乓球暖色点缀 */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 25% 75%, rgba(249,115,22,${pulse * 0.08}) 0%, transparent 45%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-25"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, transparent, rgba(94,234,212,0.22), transparent, rgba(165,243,252,0.18), transparent)`,
          transform: `rotate(${progress * 360}deg)`,
          transition: 'transform 0.1s linear',
        }}
      />
    </div>
  )
}

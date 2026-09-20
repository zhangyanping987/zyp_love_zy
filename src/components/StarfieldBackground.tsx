import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HJL_THEME } from '../theme/hjlTheme'

interface Star {
  x: number
  y: number
  size: number
  opacity: number
  delay: number
  duration: number
  tint?: 'sea' | 'moon' | 'white'
}

interface ShootingStar {
  id: number
  top: number
  left: number
  duration: number
  width: number
  variant: ShootingStarVariant
  colors: { head: string; tail: string }
}

function makeStars(count: number, sizeRange: [number, number]): Star[] {
  const tints: Star['tint'][] = ['sea', 'moon', 'white']
  return Array.from({ length: count }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
    opacity: 0.25 + Math.random() * 0.75,
    delay: Math.random() * 6,
    duration: 2.5 + Math.random() * 4,
    tint: tints[Math.floor(Math.random() * tints.length)],
  }))
}

const STAR_COLORS = {
  sea: HJL_THEME.springSeaLight,
  moon: HJL_THEME.moonSilver,
  white: '#ffffff',
} as const

const SHOOTING_STAR_PALETTE = {
  sea: {
    head: 'rgba(165, 243, 252, 0.95)',
    tail: 'rgba(94, 234, 212, 0.55)',
  },
  mars: {
    head: 'rgba(254, 215, 170, 0.98)',
    tail: 'rgba(239, 68, 68, 0.7)',
  },
  pingPong: {
    head: 'rgba(255, 247, 237, 0.98)',
    tail: 'rgba(249, 115, 22, 0.65)',
  },
  pink: {
    head: 'rgba(251, 207, 232, 0.98)',
    tail: 'rgba(244, 114, 182, 0.6)',
  },
  gold: {
    head: 'rgba(254, 249, 195, 0.98)',
    tail: 'rgba(252, 211, 77, 0.6)',
  },
  violet: {
    head: 'rgba(221, 214, 254, 0.98)',
    tail: 'rgba(129, 140, 248, 0.6)',
  },
} as const

type ShootingStarVariant = keyof typeof SHOOTING_STAR_PALETTE

const SPECIAL_VARIANTS: ShootingStarVariant[] = ['mars', 'pingPong', 'pink', 'gold', 'violet']

function pickVariant(spawnIndex: number): ShootingStarVariant {
  // 每第 3 颗必为异色，其余约 30% 异色
  if (spawnIndex % 3 === 0) {
    return SPECIAL_VARIANTS[Math.floor(Math.random() * SPECIAL_VARIANTS.length)]
  }
  if (Math.random() < 0.3) {
    return SPECIAL_VARIANTS[Math.floor(Math.random() * SPECIAL_VARIANTS.length)]
  }
  return 'sea'
}

function createShootingStar(id: number, spawnIndex: number): ShootingStar {
  const variant = pickVariant(spawnIndex)
  const colors = SHOOTING_STAR_PALETTE[variant]
  return {
    id,
    top: 5 + Math.random() * 50,
    left: 20 + Math.random() * 65,
    duration: 1.1 + Math.random() * 0.7,
    width: variant === 'sea' ? 96 : 120 + Math.random() * 24,
    variant,
    colors,
  }
}

function ShootingStarsLayer() {
  const [meteors, setMeteors] = useState<ShootingStar[]>([])
  const idRef = useRef(0)
  const spawnRef = useRef(0)
  const timerRef = useRef<number | null>(null)

  const removeMeteor = useCallback((id: number) => {
    setMeteors((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const spawnMeteor = useCallback(() => {
    spawnRef.current += 1
    idRef.current += 1
    const meteor = createShootingStar(idRef.current, spawnRef.current)
    setMeteors((prev) => [...prev, meteor])
  }, [])

  useEffect(() => {
    const scheduleNext = () => {
      const gap = 1800 + Math.random() * 2800
      timerRef.current = window.setTimeout(() => {
        spawnMeteor()
        scheduleNext()
      }, gap)
    }

    spawnMeteor()
    scheduleNext()

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [spawnMeteor])

  return (
    <>
      {meteors.map((s) => (
        <span
          key={s.id}
          className={`shooting-star absolute h-[2px] origin-left ${s.variant !== 'sea' ? 'shooting-star-special' : ''}`}
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.width,
            animationDuration: `${s.duration}s`,
            background: `linear-gradient(90deg, ${s.colors.head} 0%, ${s.colors.tail} 38%, transparent 100%)`,
          }}
          onAnimationEnd={() => removeMeteor(s.id)}
        />
      ))}
    </>
  )
}

export default function StarfieldBackground() {
  const layers = useMemo(
    () => ({
      far: makeStars(160, [0.5, 1.2]),
      mid: makeStars(85, [1, 2.2]),
      near: makeStars(30, [1.8, 3]),
    }),
    [],
  )

  const bubbles = useMemo(
    () =>
      Array.from({ length: 18 }, () => ({
        left: 5 + Math.random() * 90,
        size: 4 + Math.random() * 14,
        delay: Math.random() * 12,
        duration: 8 + Math.random() * 10,
      })),
    [],
  )

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={{ background: HJL_THEME.deepSea }} />

      <div
        className="absolute inset-0 opacity-95"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 50% 85%, rgba(13,148,136,0.28) 0%, transparent 55%),
            radial-gradient(ellipse 55% 40% at 20% 60%, rgba(94,234,212,0.12) 0%, transparent 50%),
            radial-gradient(ellipse 45% 35% at 80% 40%, rgba(165,243,252,0.1) 0%, transparent 45%)
          `,
        }}
      />

      <div
        className="absolute right-[8%] top-[10%] h-24 w-24 rounded-full opacity-90 sm:h-32 sm:w-32"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${HJL_THEME.moonSilver} 0%, ${HJL_THEME.moonlight} 35%, rgba(165,243,252,0.15) 60%, transparent 70%)`,
          boxShadow: `0 0 60px rgba(165,243,252,0.25), 0 0 120px rgba(13,148,136,0.15)`,
        }}
      />
      <div
        className="absolute right-[5%] top-[8%] h-40 w-40 rounded-full opacity-30 blur-3xl sm:h-52 sm:w-52"
        style={{ background: `radial-gradient(circle, ${HJL_THEME.moonlight}40 0%, transparent 70%)` }}
      />

      <div
        className="sea-wave absolute bottom-0 left-0 right-0 h-[35%] opacity-[0.12]"
        style={{
          background: `linear-gradient(to top, ${HJL_THEME.springSea}55 0%, transparent 100%)`,
        }}
      />

      {(['far', 'mid', 'near'] as const).map((layer) => (
        <div key={layer} className="absolute inset-0">
          {layers[layer].map((star, i) => {
            const color = STAR_COLORS[star.tint ?? 'white']
            return (
              <span
                key={`${layer}-${i}`}
                className="star-twinkle absolute rounded-full"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: star.size,
                  height: star.size,
                  backgroundColor: color,
                  opacity: star.opacity * (layer === 'far' ? 0.5 : layer === 'mid' ? 0.7 : 0.95),
                  animationDelay: `${star.delay}s`,
                  animationDuration: `${star.duration}s`,
                  boxShadow:
                    layer === 'near'
                      ? `0 0 ${star.size * 2}px ${color}88`
                      : undefined,
                }}
              />
            )
          })}
        </div>
      ))}

      {bubbles.map((b, idx) => (
        <span
          key={`bubble-${idx}`}
          className="sea-bubble absolute rounded-full border border-teal-300/20"
          style={{
            left: `${b.left}%`,
            bottom: '-5%',
            width: b.size,
            height: b.size,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
            background: `radial-gradient(circle at 30% 30%, rgba(165,243,252,0.25) 0%, rgba(13,148,136,0.08) 100%)`,
          }}
        />
      ))}

      <ShootingStarsLayer />
    </div>
  )
}

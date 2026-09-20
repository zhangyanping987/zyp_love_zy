import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { HJL_THEME } from '../theme/hjlTheme'

const HEART_PATH =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'

type HeartVariant = 'gradient' | 'outline' | 'soft' | 'twin' | 'sparkle' | 'cluster'
type AnimVariant = 'rise' | 'sway-l' | 'sway-r' | 'float'

interface HeartParticle {
  id: number
  x: number
  y: number
  rotation: number
  scale: number
  colorA: string
  colorB: string
  duration: number
  variant: HeartVariant
  anim: AnimVariant
  driftX: number
  size: number
}

const PALETTE = [
  { a: '#f472b6', b: '#e879f9' },
  { a: '#fb7185', b: '#fda4af' },
  { a: HJL_THEME.springSeaLight, b: HJL_THEME.moonlight },
  { a: '#c084fc', b: '#f0abfc' },
  { a: '#fcd34d', b: '#fb923c' },
  { a: '#f9a8d4', b: '#818cf8' },
  { a: '#6ee7b7', b: '#5eead4' },
  { a: '#fda4af', b: '#fecdd3' },
] as const

const VARIANTS: HeartVariant[] = [
  'gradient',
  'gradient',
  'outline',
  'soft',
  'twin',
  'sparkle',
  'cluster',
]

const ANIMS: AnimVariant[] = ['rise', 'sway-l', 'sway-r', 'float']

const MAX_HEARTS = 52
const MIN_DIST = 10
const MIN_INTERVAL = 28
const MOUSE_HOVER_MIN_DIST = 14
const MOUSE_HOVER_MIN_INTERVAL = 40

function pickVariant(): HeartVariant {
  return VARIANTS[Math.floor(Math.random() * VARIANTS.length)]
}

function pickAnim(): AnimVariant {
  return ANIMS[Math.floor(Math.random() * ANIMS.length)]
}

function HeartGraphic({ p }: { p: HeartParticle }) {
  const gid = `h${p.id}`
  const size = p.size

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
      overflow="visible"
    >
      <defs>
        <linearGradient id={`${gid}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={p.colorA} />
          <stop offset="100%" stopColor={p.colorB} />
        </linearGradient>
        <radialGradient id={`${gid}-r`} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="45%" stopColor={p.colorA} stopOpacity="0.95" />
          <stop offset="100%" stopColor={p.colorB} stopOpacity="0.7" />
        </radialGradient>
        <filter id={`${gid}-blur`}>
          <feGaussianBlur stdDeviation="0.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {p.variant === 'gradient' && (
        <path
          fill={`url(#${gid}-g)`}
          d={HEART_PATH}
          style={{ filter: `drop-shadow(0 0 4px ${p.colorA}aa)` }}
        />
      )}

      {p.variant === 'soft' && (
        <path
          fill={`url(#${gid}-r)`}
          d={HEART_PATH}
          filter={`url(#${gid}-blur)`}
          opacity={0.92}
        />
      )}

      {p.variant === 'outline' && (
        <>
          <path
            fill={`${p.colorA}33`}
            stroke={`url(#${gid}-g)`}
            strokeWidth="1.4"
            d={HEART_PATH}
          />
          <ellipse cx="9" cy="9.5" rx="1.8" ry="1.2" fill="#ffffff" opacity="0.45" />
        </>
      )}

      {p.variant === 'twin' && (
        <>
          <path
            fill={`url(#${gid}-g)`}
            d={HEART_PATH}
            transform="translate(-2.2, 1.2) scale(0.72)"
            opacity={0.75}
          />
          <path
            fill={p.colorB}
            d={HEART_PATH}
            transform="translate(2, -0.8) scale(0.78)"
            opacity={0.9}
            style={{ filter: `drop-shadow(0 0 3px ${p.colorB}99)` }}
          />
        </>
      )}

      {p.variant === 'sparkle' && (
        <>
          <path fill={`url(#${gid}-g)`} d={HEART_PATH} />
          <path
            fill="#fff"
            d="M12 4.5l0.6 1.8 1.9 0.1-1.5 1.1 0.5 1.8-1.5-1-1.5 1 0.5-1.8-1.5-1.1 1.9-0.1z"
            opacity={0.85}
          />
          <circle cx="17.5" cy="8" r="0.9" fill={p.colorB} opacity={0.8} />
          <circle cx="6" cy="7" r="0.6" fill={p.colorA} opacity={0.7} />
        </>
      )}

      {p.variant === 'cluster' && (
        <>
          <path
            fill={p.colorA}
            d={HEART_PATH}
            transform="translate(-4, 2) scale(0.42)"
            opacity={0.85}
          />
          <path
            fill={`url(#${gid}-g)`}
            d={HEART_PATH}
            transform="translate(0, -1) scale(0.55)"
          />
          <path
            fill={p.colorB}
            d={HEART_PATH}
            transform="translate(4, 2.5) scale(0.38)"
            opacity={0.9}
          />
        </>
      )}
    </svg>
  )
}

interface HeartTrailProps {
  enabled?: boolean
}

export default function HeartTrail({ enabled = true }: HeartTrailProps) {
  const [hearts, setHearts] = useState<HeartParticle[]>([])
  const idRef = useRef(0)
  const trackingRef = useRef(false)
  const lastSpawnRef = useRef({ x: 0, y: 0, t: 0 })
  const timersRef = useRef<Map<number, number>>(new Map())

  const removeHeart = useCallback((id: number) => {
    setHearts((prev) => prev.filter((h) => h.id !== id))
    const timer = timersRef.current.get(id)
    if (timer !== undefined) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const spawnHeart = useCallback(
    (x: number, y: number, velocity = 0, gentle = false) => {
      const id = ++idRef.current
      const palette = PALETTE[Math.floor(Math.random() * PALETTE.length)]
      const scale =
        (gentle ? 0.9 : 1.15) +
        Math.random() * (gentle ? 0.55 : 0.75) +
        Math.min(velocity * 0.005, gentle ? 0.2 : 0.4)

      const particle: HeartParticle = {
        id,
        x,
        y,
        rotation: (Math.random() - 0.5) * 50,
        scale,
        colorA: palette.a,
        colorB: palette.b,
        duration: (gentle ? 580 : 680) + Math.random() * 420,
        variant: pickVariant(),
        anim: pickAnim(),
        driftX: (Math.random() - 0.5) * 48,
        size: 22 + Math.random() * 20,
      }

      setHearts((prev) => [...prev.slice(-(MAX_HEARTS - 1)), particle])

      const timer = window.setTimeout(() => removeHeart(id), particle.duration + 80)
      timersRef.current.set(id, timer)
    },
    [removeHeart],
  )

  useEffect(() => {
    if (!enabled) return

    const trySpawn = (x: number, y: number, gentle = false) => {
      const now = performance.now()
      const dx = x - lastSpawnRef.current.x
      const dy = y - lastSpawnRef.current.y
      const dist = Math.hypot(dx, dy)
      const elapsed = now - lastSpawnRef.current.t
      const minDist = gentle ? MOUSE_HOVER_MIN_DIST : MIN_DIST
      const minInterval = gentle ? MOUSE_HOVER_MIN_INTERVAL : MIN_INTERVAL

      if (dist >= minDist || elapsed >= minInterval) {
        spawnHeart(x, y, dist, gentle)
        lastSpawnRef.current = { x, y, t: now }
      }
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      trackingRef.current = true
      lastSpawnRef.current = { x: e.clientX, y: e.clientY, t: performance.now() }
      spawnHeart(e.clientX, e.clientY, 0, false)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') {
        trySpawn(e.clientX, e.clientY, !trackingRef.current)
        return
      }
      if (!trackingRef.current) return
      trySpawn(e.clientX, e.clientY, false)
    }

    const onPointerUp = () => {
      trackingRef.current = false
    }

    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerup', onPointerUp, { passive: true })
    window.addEventListener('pointercancel', onPointerUp, { passive: true })

    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      timersRef.current.forEach((t) => window.clearTimeout(t))
      timersRef.current.clear()
    }
  }, [enabled, spawnHeart])

  useEffect(() => {
    if (!enabled) setHearts([])
  }, [enabled])

  if (!enabled) return null

  const animClass: Record<AnimVariant, string> = {
    rise: 'heart-trail-rise',
    'sway-l': 'heart-trail-sway-l',
    'sway-r': 'heart-trail-sway-r',
    float: 'heart-trail-float',
  }

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 100001 }}
      aria-hidden
    >
      {hearts.map((h) => (
        <div
          key={h.id}
          className={`heart-trail-particle absolute ${animClass[h.anim]}`}
          style={{
            left: h.x,
            top: h.y,
            ['--hr' as string]: `${h.rotation}deg`,
            ['--hs' as string]: h.scale,
            ['--hdx' as string]: `${h.driftX}px`,
            animationDuration: `${h.duration}ms`,
          }}
        >
          <HeartGraphic p={h} />
        </div>
      ))}
    </div>,
    document.body,
  )
}

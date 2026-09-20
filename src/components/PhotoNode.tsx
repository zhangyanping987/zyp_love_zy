import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { Html } from '@react-three/drei'
import { useIntro } from '../context/IntroContext'
import { usePerformance } from '../context/PerformanceContext'
import type { Photo } from '../data/photos'
import { getPhotoThumbSrc } from '../utils/photoUrls'
import type { ImageRect } from '../utils/lightboxRect'
import { rectFromDOM } from '../utils/lightboxRect'

interface PhotoNodeProps {
  photo: Photo
  photoIndex: number
  position: [number, number, number]
  depthZ: number
  onSelect: (photo: Photo, index: number, origin: ImageRect) => void
  onLoad: () => void
  onError: () => void
}

const LOAD_TIMEOUT_MS = 15000

export default function PhotoNode({
  photo,
  photoIndex,
  position,
  depthZ,
  onSelect,
  onLoad,
  onError,
}: PhotoNodeProps) {

  const { active: introActive, progress, done: introDone } = useIntro()
  const { isMobile } = usePerformance()
  const [hovered, setHovered] = useState(false)
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const settled = useRef(false)
  const tapStart = useRef({ x: 0, y: 0, time: 0 })

  const revealStart = 0.1 + (photoIndex % 9) * 0.012
  const reveal = introActive
    ? Math.max(0, Math.min(1, (progress - revealStart) / 0.38))
    : 1
  const displayOpacity = loaded
    ? introDone
      ? 1
      : introActive
        ? reveal
        : 0
    : 0

  useEffect(() => {
    settled.current = false
    setLoaded(false)
    setFailed(false)
  }, [photo.url, photo.thumbUrl])

  useEffect(() => {
    if (loaded || failed) return

    const timer = window.setTimeout(() => {
      if (!settled.current) {
        settled.current = true
        setFailed(true)
        onError()
      }
    }, LOAD_TIMEOUT_MS)

    return () => window.clearTimeout(timer)
  }, [loaded, failed, photo.url, onError])

  const markLoaded = () => {
    if (settled.current) return
    settled.current = true
    setLoaded(true)
    onLoad()
  }

  const markFailed = () => {
    if (settled.current) return
    settled.current = true
    setFailed(true)
    onError()
  }

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    tapStart.current = { x: e.clientX, y: e.clientY, time: performance.now() }
  }

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (failed || !introDone) return

    const dx = e.clientX - tapStart.current.x
    const dy = e.clientY - tapStart.current.y
    const dt = performance.now() - tapStart.current.time
    if (Math.hypot(dx, dy) > 12 || dt > 500) return

    onSelect(photo, photoIndex, rectFromDOM(e.currentTarget.getBoundingClientRect()))
  }

  const size = hovered ? 96 : 72

  return (
    <group position={position}>
      <Html
        center
        transform
        sprite
        occlude={isMobile ? false : 'blending'}
        distanceFactor={10}
        style={{ pointerEvents: 'auto' }}
        zIndexRange={[depthZ, depthZ]}
      >
        <div
          className="relative cursor-pointer select-none transition-transform duration-200"
          style={{
            width: size,
            height: size,
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
          }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        >
          {!loaded && !failed && (
            <div
              className="absolute inset-0 rounded-lg bg-zinc-800 animate-pulse"
              style={{ width: size, height: size }}
            />
          )}
          {failed ? (
            <div
              className="flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-[10px] text-zinc-500"
              style={{ width: size, height: size }}
            >
              加载失败
            </div>
          ) : (
            <img
              src={getPhotoThumbSrc(photo)}
              alt={photo.title}
              loading="eager"
              referrerPolicy="no-referrer"
              draggable={false}
              className="rounded-lg object-cover shadow-lg shadow-black/50 ring-1 ring-white/10"
              style={{
                width: size,
                height: size,
                opacity: displayOpacity,
                filter:
                  !isMobile && introActive && reveal < 1
                    ? `brightness(${1 + (1 - reveal) * 0.9}) saturate(${0.7 + reveal * 0.3})`
                    : undefined,
                boxShadow:
                  !isMobile && introActive && reveal > 0 && reveal < 1
                    ? `0 0 ${12 + reveal * 20}px rgba(192,132,252,${0.35 * reveal})`
                    : undefined,
                transition: introActive ? 'opacity 0.15s, filter 0.15s' : 'opacity 0.3s',
              }}
              onLoad={markLoaded}
              onError={markFailed}
            />
          )}
          {photo.kind === 'video' && loaded && (
            <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[10px] leading-4 text-white">
              ▶
            </span>
          )}
        </div>
      </Html>
    </group>
  )
}

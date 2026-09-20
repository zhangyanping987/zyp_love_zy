import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type TransitionEvent,
} from 'react'
import { createPortal, flushSync } from 'react-dom'
import type { Photo } from '../data/photos'
import { getPhotoFullSrc } from '../utils/photoUrls'
import {
  computeExpandedRect,
  easeInOutCubic,
  fallbackOrigin,
  interpolateRect,
  LIGHTBOX_TRANSITION_MS,
  type ImageRect,
} from '../utils/lightboxRect'

interface LightboxProps {
  photos: Photo[]
  index: number
  originRect: ImageRect | null
  onClose: () => void
  onChangeIndex: (index: number) => void
}

const DRAG_THRESHOLD = 60

/** 淡入淡出：比位移更柔和 */
function fadeEase(t: number) {
  const x = Math.max(0, Math.min(1, t))
  return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2
}

export default function Lightbox({
  photos,
  index,
  originRect,
  onClose,
  onChangeIndex,
}: LightboxProps) {
  const [phase, setPhase] = useState<'enter' | 'open' | 'leave'>('enter')
  const [zoomProgress, setZoomProgress] = useState(0)
  const [imgFailed, setImgFailed] = useState(false)

  const [offset, setOffset] = useState(0)
  const [slideWidth, setSlideWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 360,
  )
  const [isDragging, setIsDragging] = useState(false)
  const [instant, setInstant] = useState(false)

  const startX = useRef(0)
  const rafRef = useRef(0)
  const capturedPointerId = useRef<number | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const pendingIndexRef = useRef<number | null>(null)
  const originRef = useRef<ImageRect>(originRect ?? fallbackOrigin())
  const expandedRef = useRef<ImageRect>(computeExpandedRect())

  const photo = photos[index]
  const prevIndex = (index - 1 + photos.length) % photos.length
  const nextIndex = (index + 1) % photos.length

  useLayoutEffect(() => {
    originRef.current = originRect ?? fallbackOrigin()
    expandedRef.current = computeExpandedRect()
  }, [originRect])

  useLayoutEffect(() => {
    const el = viewportRef.current
    if (!el) return

    const measure = () => {
      const w = el.clientWidth
      if (w > 0) setSlideWidth(w)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [phase])

  useEffect(() => {
    setImgFailed(false)
  }, [index, photo?.url])

  const runZoom = useCallback(
    (from: number, to: number, onDone?: () => void) => {
      cancelAnimationFrame(rafRef.current)
      const start = performance.now()

      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / LIGHTBOX_TRANSITION_MS)
        setZoomProgress(from + (to - from) * t)
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          setZoomProgress(to)
          onDone?.()
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    },
    [],
  )

  const releasePointerCapture = useCallback(() => {
    const el = trackRef.current
    const pointerId = capturedPointerId.current
    if (el && pointerId !== null && el.hasPointerCapture(pointerId)) {
      el.releasePointerCapture(pointerId)
    }
    capturedPointerId.current = null
    setIsDragging(false)
  }, [])

  useEffect(() => {
    document.body.classList.add('lightbox-open')
    setPhase('enter')
    setZoomProgress(0)
    runZoom(0, 1, () => setPhase('open'))

    return () => {
      releasePointerCapture()
      document.body.classList.remove('lightbox-open')
      cancelAnimationFrame(rafRef.current)
    }
  }, [runZoom, releasePointerCapture])

  const requestClose = useCallback(() => {
    if (phase === 'leave') return
    releasePointerCapture()
    setPhase('leave')
    setZoomProgress(1)
    runZoom(1, 0, onClose)
  }, [onClose, phase, releasePointerCapture, runZoom])

  const commitIndex = useCallback(
    (targetIndex: number) => {
      pendingIndexRef.current = null
      flushSync(() => {
        setInstant(true)
        setOffset(0)
        setIsDragging(false)
        onChangeIndex(targetIndex)
      })
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setInstant(false))
      })
    },
    [onChangeIndex],
  )

  const animateTo = useCallback((targetOffset: number, targetIndex: number) => {
    pendingIndexRef.current = targetIndex
    setIsDragging(false)
    setInstant(false)
    setOffset(targetOffset)
  }, [])

  const goPrev = useCallback(() => {
    if (phase !== 'open' || pendingIndexRef.current !== null) return
    animateTo(slideWidth, prevIndex)
  }, [animateTo, phase, prevIndex, slideWidth])

  const goNext = useCallback(() => {
    if (phase !== 'open' || pendingIndexRef.current !== null) return
    animateTo(-slideWidth, nextIndex)
  }, [animateTo, nextIndex, phase, slideWidth])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [requestClose, goPrev, goNext])

  const finishDrag = useCallback(
    (delta: number) => {
      setIsDragging(false)

      if (delta < -DRAG_THRESHOLD) {
        animateTo(-slideWidth, nextIndex)
        return
      }
      if (delta > DRAG_THRESHOLD) {
        animateTo(slideWidth, prevIndex)
        return
      }

      setInstant(false)
      setOffset(0)
    },
    [animateTo, nextIndex, prevIndex, slideWidth],
  )

  const onTrackPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (phase !== 'open' || pendingIndexRef.current !== null) return
    startX.current = e.clientX
    setIsDragging(true)
    setInstant(true)
    trackRef.current?.setPointerCapture(e.pointerId)
    capturedPointerId.current = e.pointerId
  }

  const onTrackPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    setOffset(e.clientX - startX.current)
  }

  const onTrackPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const wasDragging = isDragging
    const delta = e.clientX - startX.current
    releasePointerCapture()
    if (!wasDragging) return
    setInstant(false)
    finishDrag(delta)
  }

  const onTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== 'transform') return
    if (pendingIndexRef.current === null) return
    commitIndex(pendingIndexRef.current)
  }

  if (!photo) return null

  const isZooming = phase === 'enter' || phase === 'leave'
  const from = originRef.current
  const to = expandedRef.current
  const motion = easeInOutCubic(zoomProgress)
  const fade = fadeEase(zoomProgress)
  const box = isZooming ? interpolateRect(from, to, motion) : to

  const backdropOpacity = isZooming ? fade * 0.88 : 0.88
  const imageFade = isZooming ? fade : 1
  const radius = 8 + motion * 4
  const objectFit = motion < 0.98 ? 'cover' : 'contain'

  const slideTransition =
    isDragging || instant
      ? 'none'
      : 'transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)'

  const renderSlide = (
    p: Photo,
    slideIndex: number,
    position: 'prev' | 'current' | 'next',
  ) => {
    const isCurrent = position === 'current'
    const failed = isCurrent && imgFailed

    return (
      <div
        key={`${slideIndex}-${position}`}
        className="flex shrink-0 flex-col items-center justify-center px-4"
        style={{ width: slideWidth }}
      >
        {failed ? (
          <div className="flex h-64 w-64 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400">
            无法加载
          </div>
        ) : isCurrent && p.kind === 'video' && p.videoUrl ? (
          <video
            key={p.videoUrl}
            src={p.videoUrl}
            poster={getPhotoFullSrc(p)}
            controls
            playsInline
            autoPlay
            className="max-h-[80vh] max-w-full select-none rounded-xl bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <img
            src={getPhotoFullSrc(p)}
            alt={p.title}
            referrerPolicy="no-referrer"
            draggable={false}
            className="max-h-[80vh] max-w-full select-none rounded-xl object-contain shadow-2xl"
            style={{ pointerEvents: isCurrent ? 'auto' : 'none' }}
            onError={() => {
              if (isCurrent) setImgFailed(true)
            }}
          />
        )}
      </div>
    )
  }

  return createPortal(
    <div
      className="fixed inset-0"
      style={{ zIndex: 99999 }}
      onClick={requestClose}
    >
      <div
        className="absolute inset-0 bg-black backdrop-blur-[2px]"
        style={{ opacity: backdropOpacity, transition: isZooming ? 'none' : undefined }}
      />

      <button
        type="button"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20"
        style={{ opacity: phase === 'open' ? 1 : imageFade }}
        onClick={(e) => {
          e.stopPropagation()
          requestClose()
        }}
        aria-label="关闭"
      >
        ×
      </button>

      <button
        type="button"
        className="absolute left-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 sm:flex sm:left-6"
        style={{ opacity: phase === 'open' ? 1 : imageFade }}
        onClick={(e) => {
          e.stopPropagation()
          goPrev()
        }}
        aria-label="上一张"
      >
        ‹
      </button>

      <button
        type="button"
        className="absolute right-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 sm:flex sm:right-6"
        style={{ opacity: phase === 'open' ? 1 : imageFade }}
        onClick={(e) => {
          e.stopPropagation()
          goNext()
        }}
        aria-label="下一张"
      >
        ›
      </button>

      {/* 打开 / 关闭：缩放 + 淡入淡出 */}
      {isZooming && (
        <div
          className="fixed overflow-hidden shadow-2xl"
          style={{
            left: box.left,
            top: box.top,
            width: box.width,
            height: box.height,
            borderRadius: radius,
            opacity: imageFade,
            pointerEvents: 'none',
          }}
        >
          {imgFailed ? (
            <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-zinc-400">
              图片无法加载
            </div>
          ) : (
            <img
              src={getPhotoFullSrc(photo)}
              alt={photo.title}
              referrerPolicy="no-referrer"
              draggable={false}
              className="h-full w-full select-none"
              style={{ objectFit }}
            />
          )}
        </div>
      )}

      {/* 浏览态：左右滑动切换 */}
      <div
        ref={viewportRef}
        className="relative mx-auto h-[90vh] w-full max-w-5xl overflow-hidden"
        style={{
          opacity: phase === 'open' ? 1 : Math.max(0, imageFade - 0.15),
          pointerEvents: phase === 'open' ? 'auto' : 'none',
          transition: phase === 'open' ? 'opacity 0.2s ease-out' : 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={trackRef}
          className="flex h-full cursor-grab active:cursor-grabbing"
          style={{
            transform: `translateX(${-slideWidth + offset}px)`,
            transition: slideTransition,
          }}
          onPointerDown={onTrackPointerDown}
          onPointerMove={onTrackPointerMove}
          onPointerUp={onTrackPointerUp}
          onPointerCancel={onTrackPointerUp}
          onTransitionEnd={onTransitionEnd}
        >
          {renderSlide(photos[prevIndex], prevIndex, 'prev')}
          {renderSlide(photo, index, 'current')}
          {renderSlide(photos[nextIndex], nextIndex, 'next')}
        </div>
      </div>
    </div>,
    document.body,
  )
}

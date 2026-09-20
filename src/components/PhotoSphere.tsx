import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { Photo } from '../data/photos'
import type { ImageRect } from '../utils/lightboxRect'
import { fibonacciHeart } from '../utils/heartSurface'
import { fibonacciSphere } from '../utils/fibonacciSphere'
import { ALBUM_SHAPE_SCALE, type AlbumShape } from '../types/albumShape'
import { useIntro } from '../context/IntroContext'
import { usePerformance } from '../context/PerformanceContext'
import FacingCenter from './FacingCenter'
import PhotoNode from './PhotoNode'

const SHAPE_SCALE = ALBUM_SHAPE_SCALE
const BATCH_SIZE = 30
const WARMUP_BATCH_SIZE = 12

function layoutPhotos(count: number, shape: AlbumShape) {
  return shape === 'heart'
    ? fibonacciHeart(count, SHAPE_SCALE)
    : fibonacciSphere(count, SHAPE_SCALE)
}

interface PhotoSphereProps {
  photos: Photo[]
  shape: AlbumShape
  onSelect: (photo: Photo, index: number, origin: ImageRect) => void
  onLoadProgress: (loaded: number, failed: number, total: number) => void
  preloadAll?: boolean
  warmup?: boolean
}

function depthToZIndex(dot: number) {
  const normalized = (dot + SHAPE_SCALE) / (SHAPE_SCALE * 2)
  return Math.round(Math.max(0, Math.min(1, normalized)) * 1000)
}

export default function PhotoSphere({
  photos,
  shape,
  onSelect,
  onLoadProgress,
  preloadAll = false,
  warmup = false,
}: PhotoSphereProps) {
  const batchSize = warmup ? WARMUP_BATCH_SIZE : BATCH_SIZE
  const { camera } = useThree()
  const { active: introActive } = useIntro()
  const { isMobile } = usePerformance()
  const depthTick = useRef(0)
  const [visibleCount, setVisibleCount] = useState(batchSize)
  const [loadedCount, setLoadedCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [depthZByIndex, setDepthZByIndex] = useState<number[]>([])
  const cameraDir = useMemo(() => new Vector3(), [])
  const depthBuffer = useRef<number[]>([])

  const positions = useMemo(
    () => layoutPhotos(photos.length, shape),
    [photos.length, shape],
  )

  useEffect(() => {
    depthBuffer.current = new Array(photos.length).fill(500)
    setDepthZByIndex(new Array(photos.length).fill(500))
  }, [photos.length, shape])

  useEffect(() => {
    setLoadedCount(0)
    setFailedCount(0)
    depthBuffer.current = new Array(photos.length).fill(500)
    setDepthZByIndex(new Array(photos.length).fill(500))
    setVisibleCount(Math.min(batchSize, photos.length))
  }, [photos, batchSize])

  useEffect(() => {
    if (preloadAll) {
      setVisibleCount(photos.length)
    }
  }, [preloadAll, photos.length])

  useEffect(() => {
    if (preloadAll || visibleCount >= photos.length) return

    const scheduleNext = () => {
      setVisibleCount((c) => Math.min(c + batchSize, photos.length))
    }

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = window.requestIdleCallback(scheduleNext, {
        timeout: warmup ? 200 : 500,
      })
      return () => window.cancelIdleCallback(id)
    }

    const id = globalThis.setTimeout(scheduleNext, warmup ? 60 : 100)
    return () => globalThis.clearTimeout(id)
  }, [visibleCount, photos.length, preloadAll, batchSize, warmup])

  useEffect(() => {
    onLoadProgress(loadedCount, failedCount, photos.length)
  }, [loadedCount, failedCount, photos.length, onLoadProgress])

  useFrame(() => {
    depthTick.current += 1
    const depthInterval = isMobile ? (introActive ? 6 : 3) : 1
    if (depthTick.current % depthInterval !== 0) return

    cameraDir.copy(camera.position).normalize()

    let changed = false
    const next = depthBuffer.current

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i]
      if (!pos) continue
      const z = depthToZIndex(pos.dot(cameraDir))
      if (next[i] !== z) {
        next[i] = z
        changed = true
      }
    }

    if (changed) {
      setDepthZByIndex([...next])
    }
  })

  const visibleIndices = useMemo(() => {
    const count = Math.min(visibleCount, photos.length)
    return Array.from({ length: photos.length }, (_, i) => i)
      .slice(0, count)
      .sort((a, b) => (depthZByIndex[a] ?? 0) - (depthZByIndex[b] ?? 0))
  }, [visibleCount, photos.length, depthZByIndex])

  return (
    <group>
      {visibleIndices.map((index) => {
        const pos = positions[index]
        if (!pos) return null
        const photo = photos[index]

        return (
          <FacingCenter key={`${shape}-${photo.url}-${index}`} position={pos}>
            <PhotoNode
              photo={photo}
              photoIndex={index}
              position={[0, 0, 0]}
              depthZ={depthZByIndex[index] ?? 500}
              onSelect={onSelect}
              onLoad={() => setLoadedCount((c) => c + 1)}
              onError={() => setFailedCount((c) => c + 1)}
            />
          </FacingCenter>
        )
      })}
    </group>
  )
}

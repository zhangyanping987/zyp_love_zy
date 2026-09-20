import { useEffect } from 'react'
import type { Photo } from '../data/photos'
import { getPhotoThumbSrc } from '../utils/photoUrls'
import { PRELOAD_CONCURRENCY } from '../constants/loading'

const LOAD_TIMEOUT_MS = 15000

interface UsePhotoPreloadOptions {
  photos: Photo[]
  enabled: boolean
  onProgress: (loaded: number, failed: number, total: number) => void
}

function loadImage(url: string): Promise<'ok' | 'fail'> {
  return new Promise((resolve) => {
    const img = new Image()
    const timer = window.setTimeout(() => resolve('fail'), LOAD_TIMEOUT_MS)

    const finish = (result: 'ok' | 'fail') => {
      window.clearTimeout(timer)
      resolve(result)
    }

    img.onload = () => finish('ok')
    img.onerror = () => finish('fail')
    img.src = url
  })
}

export function usePhotoPreload({
  photos,
  enabled,
  onProgress,
}: UsePhotoPreloadOptions) {
  useEffect(() => {
    if (!enabled || photos.length === 0) return

    let loaded = 0
    let failed = 0
    const total = photos.length
    let cancelled = false
    let cursor = 0

    onProgress(0, 0, total)

    const report = () => {
      if (!cancelled) onProgress(loaded, failed, total)
    }

    const worker = async () => {
      while (!cancelled) {
        const index = cursor
        cursor += 1
        if (index >= total) return

        const result = await loadImage(getPhotoThumbSrc(photos[index]))
        if (cancelled) return

        if (result === 'ok') loaded += 1
        else failed += 1
        report()
      }
    }

    const poolSize = Math.min(PRELOAD_CONCURRENCY, total)
    void Promise.all(Array.from({ length: poolSize }, () => worker()))

    return () => {
      cancelled = true
    }
  }, [photos, enabled, onProgress])
}

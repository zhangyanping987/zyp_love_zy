import { useEffect } from 'react'
import type { Photo } from '../data/photos'
import { getPhotoThumbSrc } from '../utils/photoUrls'
import { PRELOAD_CONCURRENCY } from '../constants/loading'

const LOAD_TIMEOUT_MS = 60000
const MAX_ATTEMPTS = 3

interface UsePhotoPreloadOptions {
  photos: Photo[]
  enabled: boolean
  onProgress: (loaded: number, failed: number, total: number) => void
}

function loadImage(url: string, attempt = 0): Promise<'ok' | 'fail'> {
  return new Promise((resolve) => {
    const img = new Image()
    const timer = window.setTimeout(() => {
      if (attempt + 1 < MAX_ATTEMPTS) {
        void loadImage(url, attempt + 1).then(resolve)
      } else {
        resolve('fail')
      }
    }, LOAD_TIMEOUT_MS)

    const finish = (result: 'ok' | 'fail') => {
      window.clearTimeout(timer)
      if (result === 'fail' && attempt + 1 < MAX_ATTEMPTS) {
        void loadImage(url, attempt + 1).then(resolve)
        return
      }
      resolve(result)
    }

    img.onload = () => finish('ok')
    img.onerror = () => finish('fail')
    img.src = attempt === 0 ? url : `${url}${url.includes('?') ? '&' : '?'}retry=${attempt}`
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

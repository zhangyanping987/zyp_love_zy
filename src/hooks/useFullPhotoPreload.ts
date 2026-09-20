import { useEffect } from 'react'
import type { Photo } from '../data/photos'
import { getPhotoFullSrc } from '../utils/photoUrls'

const CONCURRENCY = 3
const LOAD_TIMEOUT_MS = 20000

interface UseFullPhotoPreloadOptions {
  photos: Photo[]
  enabled: boolean
}

/** 进入动画期间后台预加载 Lightbox 用的大图，不阻塞 UI */
export function useFullPhotoPreload({ photos, enabled }: UseFullPhotoPreloadOptions) {
  useEffect(() => {
    if (!enabled || photos.length === 0) return

    let cancelled = false
    let cursor = 0

    const loadOne = (url: string) =>
      new Promise<void>((resolve) => {
        const img = new Image()
        const timer = window.setTimeout(() => {
          resolve()
        }, LOAD_TIMEOUT_MS)
        const done = () => {
          window.clearTimeout(timer)
          resolve()
        }
        img.onload = done
        img.onerror = done
        img.src = url
      })

    const worker = async () => {
      while (!cancelled) {
        const index = cursor
        cursor += 1
        if (index >= photos.length) return
        await loadOne(getPhotoFullSrc(photos[index]))
      }
    }

    const pool = Math.min(CONCURRENCY, photos.length)
    void Promise.all(Array.from({ length: pool }, () => worker()))

    return () => {
      cancelled = true
    }
  }, [photos, enabled])
}

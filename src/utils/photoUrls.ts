/** 相册节点显示尺寸约 72～96px，缩略图 160 宽足够且加载快很多 */
const THUMB_MAX = 160

/**
 * 从原图 URL 推导缩略图地址。
 * 百度图床支持 ?w=&h= 参数；picsum 支持改路径尺寸。
 */
export function getThumbUrl(url: string, maxSize = THUMB_MAX): string {
  if (!url) return url

  try {
    const u = new URL(url)
    const wParam = u.searchParams.get('w')
    const hParam = u.searchParams.get('h')
    if (wParam && hParam) {
      const w = Number(wParam) || maxSize
      const h = Number(hParam) || maxSize
      const scale = maxSize / Math.max(w, h)
      u.searchParams.set('w', String(Math.max(48, Math.round(w * scale))))
      u.searchParams.set('h', String(Math.max(48, Math.round(h * scale))))
      return u.toString()
    }
  } catch {
    /* 非标准 URL，走下方兜底 */
  }

  const picsum = url.match(/picsum\.photos\/seed\/([^/]+)\/(\d+)\/(\d+)/)
  if (picsum) {
    return `https://picsum.photos/seed/${picsum[1]}/${maxSize}/${maxSize}`
  }

  return url
}

export function getPhotoThumbSrc(photo: { url: string; thumbUrl?: string }): string {
  return photo.thumbUrl?.trim() || getThumbUrl(photo.url)
}

export function getPhotoFullSrc(photo: { url: string }): string {
  return photo.url
}

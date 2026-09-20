export interface Photo {
  url: string
  title: string
  thumbUrl?: string
  kind?: 'image' | 'video'
  videoUrl?: string
}

function resolveAsset(path: string): string {
  const trimmed = path.trim()
  if (!trimmed || /^(https?:|data:|blob:)/.test(trimmed)) return trimmed
  const base = import.meta.env.BASE_URL
  return `${base}${trimmed.replace(/^\//, '')}`
}

export async function loadPhotos(): Promise<Photo[]> {
  const base = import.meta.env.BASE_URL
  const response = await fetch(`${base}photos.json`)
  if (!response.ok) {
    throw new Error('无法加载 photos.json')
  }
  const data = (await response.json()) as Photo[]
  return data
    .filter((p) => p.url && p.url.trim())
    .map((p) => ({
      ...p,
      url: resolveAsset(p.url),
      thumbUrl: p.thumbUrl ? resolveAsset(p.thumbUrl) : undefined,
      videoUrl: p.videoUrl ? resolveAsset(p.videoUrl) : undefined,
    }))
}

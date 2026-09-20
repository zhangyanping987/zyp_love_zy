/**
 * 媒体大文件走阿里云 OSS（桶域名可正常读图/视频，不宜当网站打开）。
 * 球图 thumbs / 视频封面走站点同源（体积小，随 GitHub Pages 分发，首屏更快）。
 */
function ossBase(): string | null {
  const fromEnv = (import.meta.env.VITE_ASSET_BASE as string | undefined)?.trim()
  if (!fromEnv) return null
  return fromEnv.endsWith('/') ? fromEnv : `${fromEnv}/`
}

function assetBaseFor(path: string): string {
  const site = import.meta.env.BASE_URL
  const oss = ossBase()
  if (!oss) return site
  // 首屏球图：小文件走 Pages，避免跨境 OSS 拉 100+ 张
  if (path.startsWith('media/thumbs/') || path.startsWith('media/posters/')) {
    return site
  }
  return oss
}

export function resolveAsset(path: string): string {
  const trimmed = path.trim()
  if (!trimmed || /^(https?:|data:|blob:)/.test(trimmed)) return trimmed
  const rel = trimmed.replace(/^\//, '')
  return `${assetBaseFor(rel)}${rel}`
}

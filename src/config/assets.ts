/**
 * 媒体等大文件可走阿里云 OSS（桶域名可正常读图/视频，但不宜当网站打开）。
 * 未设置时回退到站点 BASE_URL（本地 / GitHub Pages 同源）。
 */
function assetBase(): string {
  const fromEnv = (import.meta.env.VITE_ASSET_BASE as string | undefined)?.trim()
  if (fromEnv) return fromEnv.endsWith('/') ? fromEnv : `${fromEnv}/`
  return import.meta.env.BASE_URL
}

export function resolveAsset(path: string): string {
  const trimmed = path.trim()
  if (!trimmed || /^(https?:|data:|blob:)/.test(trimmed)) return trimmed
  return `${assetBase()}${trimmed.replace(/^\//, '')}`
}

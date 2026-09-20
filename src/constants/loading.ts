/** 达到此数量即可开始进入动画，其余在动画期间继续加载 */
export const INTRO_MIN_READY = {
  mobile: 18,
  desktop: 30,
} as const

/** 读信期间并发预加载图片数（避免 150 张同时抢带宽） */
export const PRELOAD_CONCURRENCY = 6

export function getIntroMinReady(total: number, isMobile: boolean): number {
  const min = isMobile ? INTRO_MIN_READY.mobile : INTRO_MIN_READY.desktop
  return Math.min(total, min)
}

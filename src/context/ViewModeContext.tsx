import { createContext, useContext } from 'react'

export type ViewMode = 'outer' | 'inner'

export const VIEW_CONFIG = {
  /** 与相册外轮廓一致，≤ 此距离视为「球内/心内」 */
  sphereRadius: 12,
  /** 手动缩放：球心附近 → 球外最远 */
  zoomMin: 1,
  zoomMax: 30,
  /** 按钮切换视角过渡时长（秒） */
  transitionDuration: 0.85,
  /** 按钮快速跳转距离 */
  outer: { distance: 30, mobileDistance: 38 },
  inner: { distance: 1 },
} as const

export function getOuterDistance(isMobile: boolean): number {
  return isMobile
    ? VIEW_CONFIG.outer.mobileDistance
    : VIEW_CONFIG.outer.distance
}

/** 手动缩放上限：手机需 ≥ mobileDistance，否则收放后无法回到初始远景 */
export function getZoomMax(isMobile: boolean): number {
  return isMobile ? VIEW_CONFIG.outer.mobileDistance : VIEW_CONFIG.zoomMax
}

export function viewModeFromDistance(distance: number): ViewMode {
  return distance <= VIEW_CONFIG.sphereRadius ? 'inner' : 'outer'
}

interface ViewModeContextValue {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  toggleViewMode: () => void
  introDone: boolean
  transitioning: boolean
}

export const ViewModeContext = createContext<ViewModeContextValue | null>(null)

export function useViewMode() {
  const ctx = useContext(ViewModeContext)
  if (!ctx) throw new Error('useViewMode must be used within ViewModeContext')
  return ctx
}

export function useViewModeOptional() {
  return useContext(ViewModeContext)
}

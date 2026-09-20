interface LoadingOverlayProps {
  loaded: number
  failed: number
  /** 进入动画所需就绪数量；进度条以此为准，而非全部图片 */
  target: number
  isLoadingPhotos: boolean
  visible?: boolean
}

export default function LoadingOverlay({
  loaded,
  failed,
  target,
  isLoadingPhotos,
  visible = true,
}: LoadingOverlayProps) {
  const done = loaded + failed
  const goal = Math.max(1, target)
  const progress = Math.min(done, goal)
  const allReady = !isLoadingPhotos && progress >= goal

  if (!visible || allReady) return null

  const percent = Math.round((progress / goal) * 100)

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-[#020810]/90 backdrop-blur-sm">
      <div className="w-[min(90vw,280px)] text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-teal-400/80 border-t-transparent" />
        <p className="text-sm text-zinc-300">
          {isLoadingPhotos ? '准备相册…' : '正在铺开照片…'}
        </p>
        {!isLoadingPhotos && (
          <>
            <div className="mx-auto mt-4 h-1 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-teal-400/90 transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
            {failed > 0 && (
              <p className="mt-2 text-xs text-zinc-500">{failed} 张未能加载</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

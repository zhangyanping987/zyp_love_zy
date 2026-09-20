import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react'
import { loadPhotos, type Photo } from './data/photos'
import { useFullPhotoPreload } from './hooks/useFullPhotoPreload'
import IntroOverlay from './components/IntroOverlay'
import Lightbox from './components/Lightbox'
import LoadingOverlay from './components/LoadingOverlay'
import HeartTrail from './components/HeartTrail'
import StarfieldBackground from './components/StarfieldBackground'
import ViewModeToggle from './components/ViewModeToggle'
import ShapeToggle from './components/ShapeToggle'
import AboutPanel from './components/AboutPanel'
import AboutButton from './components/AboutButton'
import PasswordGate from './components/PasswordGate'
import BgmToggle from './components/BgmToggle'
import { useBgm } from './hooks/useBgm'
import { getIntroMinReady } from './constants/loading'
import type { ViewMode } from './context/ViewModeContext'
import type { AlbumShape } from './types/albumShape'
import type { ImageRect } from './utils/lightboxRect'

const Scene = lazy(() => import('./components/Scene'))

export default function App() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(0)
  const [failed, setFailed] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [lightboxOrigin, setLightboxOrigin] = useState<ImageRect | null>(null)
  const [introProgress, setIntroProgress] = useState(0)
  const [introVisible, setIntroVisible] = useState(false)
  const [introDone, setIntroDone] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('outer')
  const [snapRequest, setSnapRequest] = useState(0)
  const [snapTarget, setSnapTarget] = useState<ViewMode>('inner')
  const [viewTransitioning, setViewTransitioning] = useState(false)
  const [albumShape, setAlbumShape] = useState<AlbumShape>('sphere')
  const [faceFrontRequest, setFaceFrontRequest] = useState(0)
  /** 每次刷新都要重新输入密码、再读信 */
  const [unlocked, setUnlocked] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [letterDismissed, setLetterDismissed] = useState(false)
  const videoLightboxOpen =
    lightboxIndex !== null && photos[lightboxIndex]?.kind === 'video'
  const isMobile = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 768px), (pointer: coarse)').matches,
    [],
  )

  const toggleAlbumShape = useCallback(() => {
    setAlbumShape((s) => {
      if (s === 'sphere') {
        setFaceFrontRequest((n) => n + 1)
      }
      return s === 'sphere' ? 'heart' : 'sphere'
    })
  }, [])

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode)
  }, [])

  const toggleViewMode = useCallback(() => {
    if (viewTransitioning) return
    const next = viewMode === 'outer' ? 'inner' : 'outer'
    setViewMode(next)
    setSnapTarget(next)
    setSnapRequest((n) => n + 1)
  }, [viewMode, viewTransitioning])

  useEffect(() => {
    loadPhotos()
      .then((data) => {
        setPhotos(data)
        setLoaded(0)
        setFailed(0)
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setIsLoadingPhotos(false))
  }, [])

  const handleSceneLoadProgress = useCallback(
    (l: number, f: number, _total: number) => {
      setLoaded(l)
      setFailed(f)
    },
    [],
  )

  const handleUnlock = useCallback(() => {
    setUnlocked(true)
    setAboutOpen(true)
  }, [])

  const handleAboutClose = useCallback(() => {
    setAboutOpen(false)
    if (!letterDismissed) {
      setLetterDismissed(true)
    }
  }, [letterDismissed])

  const readyCount = loaded + failed
  const introTarget =
    photos.length > 0 ? getIntroMinReady(photos.length, isMobile) : 1

  /** 够首屏张数即可开场，其余在进入动画期间继续加载 */
  const assetsReady =
    !isLoadingPhotos && photos.length > 0 && readyCount >= introTarget

  /** 读信期间后台挂载 3D（手机/桌面），分批加载缩略图 */
  const warmupScene = photos.length > 0 && !letterDismissed
  const mountScene = photos.length > 0
  const sceneVisible = letterDismissed

  /** 等首批缩略图就绪后再拉 BGM，避免和球图抢带宽 */
  const { playing, muted, toggleMute } = useBgm(
    unlocked && assetsReady,
    videoLightboxOpen,
  )

  useFullPhotoPreload({
    photos,
    enabled: letterDismissed && assetsReady && !introDone,
  })

  const handleSelect = useCallback(
    (_photo: Photo, index: number, origin: ImageRect) => {
      setLightboxOrigin(origin)
      setLightboxIndex(index)
    },
    [],
  )

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#020810]">
      <StarfieldBackground />
      <HeartTrail
        enabled={
          unlocked && introDone && lightboxIndex === null && !aboutOpen
        }
      />

      <PasswordGate open={!unlocked} onUnlock={handleUnlock} />
      <AboutPanel open={unlocked && aboutOpen} onClose={handleAboutClose} />

      {loadError ? (
        <div className="flex h-full items-center justify-center px-6 text-center">
          <div>
            <p className="text-red-400">{loadError}</p>
            <p className="mt-2 text-sm text-zinc-500">
              请确认 public/photos.json 存在且可访问
            </p>
          </div>
        </div>
      ) : mountScene ? (
        <div
          className="absolute inset-0 z-[1]"
          style={{
            visibility: sceneVisible ? 'visible' : 'hidden',
            pointerEvents: sceneVisible ? 'auto' : 'none',
          }}
        >
          <Suspense fallback={null}>
            <Scene
              photos={photos}
              onSelect={handleSelect}
              onLoadProgress={handleSceneLoadProgress}
              assetsReady={assetsReady}
              introEnabled={letterDismissed}
              warmup={warmupScene}
              albumShape={albumShape}
              faceFrontRequest={faceFrontRequest}
              snapRequest={snapRequest}
              snapTarget={snapTarget}
              onViewModeChange={handleViewModeChange}
              onTransitionChange={setViewTransitioning}
              onIntroComplete={() => setIntroDone(true)}
              onIntroProgress={(p) => {
                setIntroVisible(true)
                setIntroProgress(p)
                if (p >= 1) {
                  window.setTimeout(() => setIntroVisible(false), 400)
                }
              }}
              interactive={lightboxIndex === null && sceneVisible}
            />
          </Suspense>
        </div>
      ) : !isLoadingPhotos && photos.length === 0 ? (
        <div className="flex h-full items-center justify-center text-zinc-500">
          暂无图片，请把作品放进 public/media 并更新 photos.json
        </div>
      ) : null}

      <LoadingOverlay
        loaded={readyCount}
        failed={failed}
        target={introTarget}
        isLoadingPhotos={isLoadingPhotos}
        visible={letterDismissed && !assetsReady}
      />

      <IntroOverlay visible={introVisible} progress={introProgress} />

      {unlocked && (
        <div className="pointer-events-none absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
          <BgmToggle muted={muted} playing={playing} onToggleMute={toggleMute} />
        </div>
      )}

      {introDone && lightboxIndex === null && (
        <>
          <div className="pointer-events-none absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
            <AboutButton onClick={() => setAboutOpen(true)} />
          </div>
          <div className="pointer-events-none absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-3">
            <ShapeToggle
              shape={albumShape}
              onToggle={toggleAlbumShape}
              disabled={viewTransitioning}
            />
            <ViewModeToggle
              viewMode={viewMode}
              onToggle={toggleViewMode}
              disabled={viewTransitioning}
            />
          </div>
        </>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          originRect={lightboxOrigin}
          onClose={() => {
            setLightboxIndex(null)
            setLightboxOrigin(null)
          }}
          onChangeIndex={setLightboxIndex}
        />
      )}
    </div>
  )
}

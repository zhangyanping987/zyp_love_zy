import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { TrackballControls } from '@react-three/drei'
import type { TrackballControls as TrackballControlsImpl } from 'three-stdlib'
import { Vector3 } from 'three'
import {
  VIEW_CONFIG,
  getOuterDistance,
  getZoomMax,
  viewModeFromDistance,
  type ViewMode,
} from '../context/ViewModeContext'
import { usePerformance } from '../context/PerformanceContext'

/** 改这里即可生效 — 不要给 TrackballControls 传 rotateSpeed prop（会被 React 覆盖） */
export const CONTROL_CONFIG = {
  outerRotateSpeed: 1.2,
  innerRotateSpeed: 0.4,
  zoomSpeed: 1.2,
  dynamicDampingFactor: 0.08,
} as const

const ORIGIN = new Vector3(0, 0, 0)

export interface SphereControlsHandle {
  /** 将镜头对准指定方向，并同步 Trackball 内部状态（移动端切爱心后必需） */
  syncToDirection: (direction: Vector3) => void
}

interface SphereControlsProps {
  enabled: boolean
  suspendViewSync?: boolean
  onViewModeChange?: (mode: ViewMode) => void
}

const SphereControls = forwardRef<SphereControlsHandle, SphereControlsProps>(
  function SphereControls(
    { enabled, suspendViewSync = false, onViewModeChange },
    ref,
  ) {
    const { camera } = useThree()
    const { isMobile } = usePerformance()
    const controlsRef = useRef<TrackballControlsImpl>(null)
    const zoneRef = useRef<ViewMode>('outer')

    const zoomMin = VIEW_CONFIG.zoomMin
    const zoomMax = getZoomMax(isMobile)

    useImperativeHandle(
      ref,
      () => ({
        syncToDirection(direction: Vector3) {
          const controls = controlsRef.current
          const distance = Math.max(
            zoomMin,
            Math.min(zoomMax, camera.position.length() || getOuterDistance(isMobile)),
          )
          const dir =
            direction.lengthSq() > 1e-6
              ? direction.clone().normalize()
              : new Vector3(0, 0, 1)

          camera.up.set(0, 1, 0)
          camera.position.copy(dir).multiplyScalar(distance)
          camera.lookAt(ORIGIN)
          camera.updateProjectionMatrix()

          if (controls) {
            controls.target.copy(ORIGIN)
            controls.update()
          }
        },
      }),
      [camera, zoomMin, zoomMax, isMobile],
    )

    useEffect(() => {
      const controls = controlsRef.current
      if (!controls) return

      controls.zoomSpeed = CONTROL_CONFIG.zoomSpeed
      controls.dynamicDampingFactor = CONTROL_CONFIG.dynamicDampingFactor
      controls.minDistance = zoomMin
      controls.maxDistance = zoomMax
    }, [zoomMin, zoomMax])

    useFrame(() => {
      const controls = controlsRef.current
      if (!controls || !enabled) return

      const distance = camera.position.distanceTo(ORIGIN)

      const zone = viewModeFromDistance(distance)
      if (!suspendViewSync && zone !== zoneRef.current) {
        zoneRef.current = zone
        onViewModeChange?.(zone)
      } else if (suspendViewSync) {
        zoneRef.current = zone
      }

      const isInner = zone === 'inner'
      let speed = isInner
        ? CONTROL_CONFIG.innerRotateSpeed
        : CONTROL_CONFIG.outerRotateSpeed
      if (isInner) {
        speed *= -1
      }

      controls.rotateSpeed = speed
      controls.minDistance = zoomMin
      controls.maxDistance = zoomMax

      if (distance > 0.001 && (distance < zoomMin || distance > zoomMax)) {
        const dir = camera.position.clone().normalize()
        const clamped = Math.max(zoomMin, Math.min(zoomMax, distance))
        camera.position.copy(dir).multiplyScalar(clamped)
        camera.lookAt(ORIGIN)
      }
    })

    return (
      <TrackballControls
        ref={controlsRef}
        enabled={enabled}
        zoomSpeed={CONTROL_CONFIG.zoomSpeed}
        staticMoving={false}
        dynamicDampingFactor={CONTROL_CONFIG.dynamicDampingFactor}
        minDistance={zoomMin}
        maxDistance={zoomMax}
        noPan
      />
    )
  },
)

export default SphereControls

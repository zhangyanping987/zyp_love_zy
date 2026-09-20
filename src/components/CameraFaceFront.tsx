import { useEffect, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { VIEW_CONFIG, getZoomMax } from '../context/ViewModeContext'
import { usePerformance } from '../context/PerformanceContext'
import type { SphereControlsHandle } from './SphereControls'

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

/** 爱心正面朝向 +Z，相机置于 +Z 侧看向原点 */
const FRONT = new Vector3(0, 0, 1)

interface CameraFaceFrontProps {
  request: number
  enabled: boolean
  controlsRef: RefObject<SphereControlsHandle | null>
  onTransitionChange: (active: boolean) => void
}

/** 切换到爱心时，镜头平滑转到正面（+Z 方向） */
export default function CameraFaceFront({
  request,
  enabled,
  controlsRef,
  onTransitionChange,
}: CameraFaceFrontProps) {
  const { camera } = useThree()
  const { isMobile } = usePerformance()
  const zoomMax = getZoomMax(isMobile)
  const from = useRef(new Vector3())
  const to = useRef(new Vector3())
  const targetDistance = useRef<number>(VIEW_CONFIG.outer.distance)
  const progress = useRef(1)
  const animating = useRef(false)

  const snapFront = () => {
    const distance = targetDistance.current
    camera.up.set(0, 1, 0)
    camera.position.set(0, 0, distance)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
    controlsRef.current?.syncToDirection(FRONT)
  }

  useEffect(() => {
    if (!enabled || request === 0) return

    targetDistance.current = Math.max(
      VIEW_CONFIG.zoomMin,
      Math.min(zoomMax, camera.position.length()),
    )

    from.current.copy(camera.position)
    to.current.copy(FRONT).multiplyScalar(targetDistance.current)
    progress.current = 0
    animating.current = true
    onTransitionChange(true)
  }, [request, enabled, camera, onTransitionChange, zoomMax])

  useFrame((_, delta) => {
    if (!enabled || !animating.current) return

    progress.current = Math.min(
      1,
      progress.current + delta / VIEW_CONFIG.transitionDuration,
    )
    const t = easeInOutCubic(progress.current)

    camera.up.set(0, 1, 0)
    camera.position.lerpVectors(from.current, to.current, t)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()

    if (progress.current >= 1) {
      animating.current = false
      snapFront()
      onTransitionChange(false)
    }
  })

  return null
}

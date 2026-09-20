import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { usePerformance } from '../context/PerformanceContext'
import { VIEW_CONFIG, getOuterDistance, type ViewMode } from '../context/ViewModeContext'

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

interface CameraViewTransitionProps {
  snapRequest: number
  snapTarget: ViewMode
  enabled: boolean
  onTransitionChange: (active: boolean) => void
}

/** 仅底部按钮触发平滑过渡，手动缩放不经过此组件 */
export default function CameraViewTransition({
  snapRequest,
  snapTarget,
  enabled,
  onTransitionChange,
}: CameraViewTransitionProps) {
  const { camera } = useThree()
  const { isMobile } = usePerformance()
  const direction = useRef(new Vector3())
  const fromDistance = useRef(0)
  const toDistance = useRef<number>(getOuterDistance(isMobile))
  const progress = useRef(1)
  const animating = useRef(false)

  useEffect(() => {
    if (!enabled || snapRequest === 0) return

    const targetDist =
      snapTarget === 'inner'
        ? VIEW_CONFIG.inner.distance
        : getOuterDistance(isMobile)

    const dist = camera.position.length()
    if (dist > 0.001) {
      direction.current.copy(camera.position).normalize()
    } else {
      direction.current.set(0, 0, 1)
    }

    fromDistance.current = dist
    toDistance.current = targetDist
    progress.current = 0
    animating.current = true
    onTransitionChange(true)
  }, [snapRequest, snapTarget, enabled, camera, onTransitionChange, isMobile])

  useFrame((_, delta) => {
    if (!enabled || !animating.current) return

    progress.current = Math.min(
      1,
      progress.current + delta / VIEW_CONFIG.transitionDuration,
    )
    const t = easeInOutCubic(progress.current)
    const d =
      fromDistance.current +
      (toDistance.current - fromDistance.current) * t

    camera.position.copy(direction.current).multiplyScalar(d)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()

    if (progress.current >= 1) {
      animating.current = false
      onTransitionChange(false)
    }
  })

  return null
}

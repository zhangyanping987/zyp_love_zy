import { useEffect, useRef, type ReactNode } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { Group, PointLight } from 'three'
import { usePerformance } from '../context/PerformanceContext'
import { getOuterDistance } from '../context/ViewModeContext'

/** 进入网站动画 — 改 duration 即可（秒，越大越慢） */
export const INTRO_CONFIG = {
  duration: 20,
} as const

const DURATION = INTRO_CONFIG.duration

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

function easeOutBack(t: number) {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

interface IntroKeyframe {
  scale: number
  distance: number
  orbitY: number
  orbitX: number
  spinY: number
  spinX: number
  lightIntensity: number
}

function sampleIntro(raw: number, endDistance: number): IntroKeyframe {
  if (raw < 0.18) {
    const p = easeOutCubic(raw / 0.18)
    return {
      scale: lerp(0.02, 0.25, p),
      distance: lerp(42, 28, p),
      orbitY: lerp(-Math.PI * 0.35, Math.PI * 0.5, p),
      orbitX: lerp(0.65, 0.25, p),
      spinY: lerp(0, Math.PI * 2.2, easeInOutCubic(p)),
      spinX: lerp(0.4, 0.1, p),
      lightIntensity: lerp(0.3, 1.4, p),
    }
  }

  if (raw < 0.48) {
    const p = easeOutBack((raw - 0.18) / 0.3)
    return {
      scale: lerp(0.25, 1.18, p),
      distance: lerp(28, 9, easeInOutCubic((raw - 0.18) / 0.3)),
      orbitY: lerp(Math.PI * 0.5, Math.PI * 1.35, (raw - 0.18) / 0.3),
      orbitX: lerp(0.25, -0.15, (raw - 0.18) / 0.3),
      spinY: lerp(Math.PI * 2.2, Math.PI * 4.5, (raw - 0.18) / 0.3),
      spinX: lerp(0.1, -0.08, (raw - 0.18) / 0.3),
      lightIntensity: lerp(1.4, 2.2, p),
    }
  }

  if (raw < 0.78) {
    const p = (raw - 0.48) / 0.3
    const e = easeInOutCubic(p)
    return {
      scale: lerp(1.18, 1, e),
      distance: lerp(9, 16, e),
      orbitY: lerp(Math.PI * 1.35, Math.PI * 0.15, e),
      orbitX: lerp(-0.15, 0.08, e),
      spinY: lerp(Math.PI * 4.5, Math.PI * 5.2, p),
      spinX: lerp(-0.08, 0.04, e),
      lightIntensity: lerp(2.2, 1.5, e),
    }
  }

  const p = easeOutCubic((raw - 0.78) / 0.22)
  return {
    scale: 1,
    distance: lerp(16, endDistance, p),
    orbitY: lerp(Math.PI * 0.15, 0, p),
    orbitX: lerp(0.08, 0, p),
    spinY: lerp(Math.PI * 5.2, 0, p),
    spinX: lerp(0.04, 0, p),
    lightIntensity: lerp(1.5, 1, p),
  }
}

interface IntroAnimationProps {
  active: boolean
  onComplete: () => void
  onProgress: (progress: number) => void
  children: ReactNode
}

export default function IntroAnimation({
  active,
  onComplete,
  onProgress,
  children,
}: IntroAnimationProps) {
  const { camera } = useThree()
  const { isMobile } = usePerformance()
  const endDistance = getOuterDistance(isMobile)
  const groupRef = useRef<Group>(null)
  const lightRef = useRef<PointLight>(null)
  const startTime = useRef<number | null>(null)
  const completed = useRef(false)

  useEffect(() => {
    if (active) {
      startTime.current = null
      completed.current = false
    }
  }, [active])

  useFrame((state) => {
    if (!active || completed.current) return

    if (startTime.current === null) {
      startTime.current = state.clock.elapsedTime
    }

    const raw = clamp(
      (state.clock.elapsedTime - startTime.current) / DURATION,
      0,
      1,
    )

    onProgress(raw)

    const k = sampleIntro(raw, endDistance)

    camera.position.set(
      k.distance * Math.sin(k.orbitY) * Math.cos(k.orbitX),
      k.distance * Math.sin(k.orbitX) * 0.9,
      k.distance * Math.cos(k.orbitY) * Math.cos(k.orbitX),
    )
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()

    if (groupRef.current) {
      groupRef.current.scale.setScalar(k.scale)
      groupRef.current.rotation.y = k.spinY
      groupRef.current.rotation.x = k.spinX
    }

    if (lightRef.current) {
      lightRef.current.intensity = k.lightIntensity
    }

    if (raw >= 1 && !completed.current) {
      completed.current = true
      camera.position.set(0, 0, endDistance)
      camera.up.set(0, 1, 0)
      camera.lookAt(0, 0, 0)
      camera.updateProjectionMatrix()
      if (groupRef.current) {
        groupRef.current.scale.setScalar(1)
        groupRef.current.rotation.set(0, 0, 0)
      }
      if (lightRef.current) lightRef.current.intensity = 1
      onProgress(1)
      onComplete()
    }
  })

  return (
    <>
      <pointLight ref={lightRef} position={[8, 12, 10]} intensity={1} color="#5eead4" />
      <pointLight position={[-10, -6, -8]} intensity={0.45} color="#0d9488" />
      <group ref={groupRef}>{children}</group>
    </>
  )
}

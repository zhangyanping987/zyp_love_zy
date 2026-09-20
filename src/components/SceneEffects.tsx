import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles, Stars } from '@react-three/drei'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Mesh,
  Points,
  PointsMaterial,
} from 'three'
import { useIntro } from '../context/IntroContext'
import { usePerformance } from '../context/PerformanceContext'
import { HJL_THEME } from '../theme/hjlTheme'

/** 深海漂浮星尘 */
function DeepSeaDust({ count = 400, spread = 75, color = HJL_THEME.springSeaLight }: { count?: number; spread?: number; color?: string }) {
  const ref = useRef<Points>(null)

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(positions, 3))
    return geo
  }, [count, spread])

  useFrame((state) => {
    const points = ref.current
    if (!points) return
    const t = state.clock.elapsedTime
    points.rotation.y = t * 0.012
    points.rotation.x = Math.sin(t * 0.06) * 0.03
    const mat = points.material as PointsMaterial
    mat.opacity = 0.3 + Math.sin(t * 0.4) * 0.1
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.11}
        color={color}
        transparent
        opacity={0.38}
        sizeAttenuation
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  )
}

/** 深海气泡 — 向上漂浮 */
function DeepSeaBubbles({ count = 60 }) {
  const ref = useRef<Points>(null)
  const data = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    const phases = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50
      speeds[i] = 0.4 + Math.random() * 0.8
      phases[i] = Math.random() * Math.PI * 2
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(positions, 3))
    return { geo, speeds, phases }
  }, [count])

  useFrame((state) => {
    const points = ref.current
    if (!points) return
    const pos = points.geometry.attributes.position as BufferAttribute
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const y = ((t * data.speeds[i] + data.phases[i]) % 40) - 20
      pos.setY(i, y)
      pos.setX(i, pos.getX(i) + Math.sin(t * 0.5 + data.phases[i]) * 0.002)
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={ref} geometry={data.geo}>
      <pointsMaterial
        size={0.22}
        color={HJL_THEME.moonlight}
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  )
}

/** 乒乓球 — 爱好元素 */
function PingPongBall({
  orbitRadius,
  speed,
  phase,
  color,
  yOffset = 0,
}: {
  orbitRadius: number
  speed: number
  phase: number
  color: string
  yOffset?: number
}) {
  const ref = useRef<Mesh>(null)

  useFrame((state) => {
    const mesh = ref.current
    if (!mesh) return
    const t = state.clock.elapsedTime * speed + phase
    mesh.position.x = Math.cos(t) * orbitRadius
    mesh.position.z = Math.sin(t) * orbitRadius
    mesh.position.y = yOffset + Math.abs(Math.sin(t * 2.8)) * 1.8
    mesh.rotation.x = t * 1.2
    mesh.rotation.z = t * 0.8
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.14, 20, 20]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

/** 书法墨韵 — 缓慢飘动的深色粒子 */
function InkWisps({ count = 120 }: { count?: number }) {
  const ref = useRef<Points>(null)

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const r = 18 + Math.random() * 12
      positions[i * 3] = Math.cos(angle) * r
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6
      positions[i * 3 + 2] = Math.sin(angle) * r
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(positions, 3))
    return geo
  }, [count])

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.04
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.35}
        color={HJL_THEME.ink}
        transparent
        opacity={0.18}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

/** 春海月明 · 环绕光点 */
function MoonOrbitMotes({ active }: { active: boolean }) {
  const ref = useRef<Points>(null)
  const count = active ? 70 : 35

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const radius = 14 + Math.random() * 5
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = (Math.random() - 0.5) * 7
      positions[i * 3 + 2] = Math.sin(angle) * radius
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(positions, 3))
    return geo
  }, [count])

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * (active ? 0.1 : 0.04)
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={active ? 0.16 : 0.1}
        color={HJL_THEME.springSeaLight}
        transparent
        opacity={active ? 0.65 : 0.22}
        sizeAttenuation
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  )
}

export default function SceneEffects() {
  const { progress, active } = useIntro()
  const { isMobile } = usePerformance()
  const introBoost = active ? Math.max(0, 1 - progress * 1.2) : 0
  const paintColors = isMobile ? HJL_THEME.paint.slice(0, 3) : HJL_THEME.paint

  return (
    <>
      {/* 深海星空 */}
      <Stars
        radius={90}
        depth={55}
        count={isMobile ? 900 : 2200}
        factor={4}
        saturation={0.15}
        fade
        speed={0.2}
      />
      <Stars
        radius={45}
        depth={25}
        count={isMobile ? 280 : 700}
        factor={2.5}
        saturation={0.25}
        fade
        speed={0.12}
      />

      <DeepSeaDust count={isMobile ? 120 : 380} spread={72} color={HJL_THEME.springSeaLight} />
      <DeepSeaDust count={isMobile ? 50 : 160} spread={50} color={HJL_THEME.moonSilver} />
      {!isMobile && <DeepSeaBubbles count={55} />}
      <InkWisps count={isMobile ? 40 : 120} />
      <MoonOrbitMotes active={active && !isMobile} />

      {/* 乒乓球 orbit */}
      <PingPongBall orbitRadius={11} speed={0.55} phase={0} color={HJL_THEME.pingPong} yOffset={-2} />
      <PingPongBall orbitRadius={13} speed={0.45} phase={1.2} color={HJL_THEME.pingPongHighlight} yOffset={1.5} />
      {!isMobile && (
        <>
          <PingPongBall orbitRadius={15} speed={0.38} phase={2.4} color={HJL_THEME.pingPong} yOffset={-0.5} />
          <PingPongBall orbitRadius={10} speed={0.62} phase={3.8} color={HJL_THEME.pingPongHighlight} yOffset={2} />
          <PingPongBall orbitRadius={16} speed={0.32} phase={5} color={HJL_THEME.pingPong} yOffset={0} />
        </>
      )}

      {/* 绘画 · 调色盘微光 */}
      {paintColors.map((color, i) => (
        <Sparkles
          key={color}
          count={isMobile ? 12 : 25}
          scale={18 + i * 2}
          size={2 + (i % 2)}
          speed={0.15 + i * 0.03}
          opacity={0.22 + introBoost * (isMobile ? 0.15 : 0.35)}
          color={color}
        />
      ))}

      {/* 追星 · 火星余烬 */}
      <Sparkles
        count={isMobile ? 18 : 45}
        scale={24}
        size={2.5}
        speed={0.28}
        opacity={0.25 + introBoost * (isMobile ? 0.15 : 0.4)}
        color={HJL_THEME.mars}
      />
      {!isMobile && (
        <Sparkles
          count={30}
          scale={20}
          size={3}
          speed={0.18}
          opacity={0.15 + introBoost * 0.3}
          color={HJL_THEME.marsGlow}
        />
      )}

      {/* 美食 · 暖色光点 */}
      {!isMobile && (
        <Sparkles
          count={35}
          scale={16}
          size={2}
          speed={0.14}
          opacity={0.18 + introBoost * 0.25}
          color={HJL_THEME.foodWarm}
        />
      )}

      {/* 春海月明 · 主光晕 */}
      <Sparkles
        count={isMobile ? 28 : 70}
        scale={22}
        size={2.5}
        speed={0.18}
        opacity={0.32 + introBoost * (isMobile ? 0.2 : 0.45)}
        color={HJL_THEME.springSeaLight}
      />
      {!isMobile && (
        <Sparkles
          count={45}
          scale={28}
          size={3.5}
          speed={0.1}
          opacity={0.2 + introBoost * 0.35}
          color={HJL_THEME.moonlight}
        />
      )}

      {/* 进入动画 · 深海涌现（移动端跳过额外粒子层） */}
      {active && !isMobile && (
        <>
          <Sparkles
            count={120}
            scale={14}
            size={3.5}
            speed={0.3}
            opacity={introBoost * 0.85}
            color={HJL_THEME.springSeaLight}
          />
          <Sparkles
            count={60}
            scale={18}
            size={4}
            speed={0.14}
            opacity={introBoost * 0.6}
            color={HJL_THEME.moonlight}
          />
        </>
      )}
    </>
  )
}

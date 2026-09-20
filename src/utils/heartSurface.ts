import { Vector3 } from 'three'

import { ALBUM_SHAPE_SCALE } from '../types/albumShape'

/** 爱心外轮廓目标尺寸（与球形半径一致） */
export const HEART_SCALE = ALBUM_SHAPE_SCALE

/** Taubin 隐式爱心：从原点沿每条射线求表面交点，配合斐波那契方向可得到均匀分布 */
function heartImplicit(x: number, y: number, z: number): number {
  const x2 = x * x
  const y2 = y * y
  const z2 = z * z
  const a = x2 + (9 / 4) * y2 + z2 - 1
  return a * a * a - x2 * z2 * z - (9 / 80) * y2 * z2 * z
}

function fibonacciDirection(i: number, count: number): Vector3 {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  const y = 1 - (2 * i) / Math.max(count - 1, 1)
  const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y))
  const theta = goldenAngle * i
  return new Vector3(
    Math.cos(theta) * radiusAtY,
    y,
    Math.sin(theta) * radiusAtY,
  ).normalize()
}

/** 沿单位方向求爱心表面距离（原点在内侧） */
function rayToHeartSurface(dir: Vector3): number {
  const dx = dir.x
  const dy = dir.y
  const dz = dir.z

  let lo = 0.02
  let hi = 1.6
  while (heartImplicit(dx * hi, dy * hi, dz * hi) <= 0 && hi < 4) {
    hi *= 1.4
  }

  for (let i = 0; i < 52; i++) {
    const mid = (lo + hi) * 0.5
    if (heartImplicit(dx * mid, dy * mid, dz * mid) <= 0) {
      lo = mid
    } else {
      hi = mid
    }
  }

  return (lo + hi) * 0.5
}

/** 绕 X 轴 -90°：让爱心竖立在 XY 平面，正面朝向 +Z（相机默认方向） */
function orientHeartToFront(point: Vector3): Vector3 {
  const { x, y, z } = point
  return new Vector3(x, z, -y)
}

function centerAndScale(points: Vector3[], targetScale: number): Vector3[] {
  if (points.length === 0) return []

  const center = new Vector3()
  for (const p of points) center.add(p)
  center.divideScalar(points.length)

  let maxDist = 0
  const centered = points.map((p) => {
    const c = p.clone().sub(center)
    maxDist = Math.max(maxDist, c.length())
    return c
  })

  const scale = maxDist > 0 ? targetScale / maxDist : 1
  return centered.map((p) => p.multiplyScalar(scale))
}

/** 最远点采样：从候选里挑出彼此间距最大的 k 个点 */
function farthestPointSampling(candidates: Vector3[], k: number): Vector3[] {
  if (candidates.length <= k) return candidates.map((p) => p.clone())

  const minDistSq = new Float32Array(candidates.length).fill(Infinity)
  const selected: Vector3[] = [candidates[0].clone()]

  while (selected.length < k) {
    const last = selected[selected.length - 1]
    let bestIdx = 0
    let bestDist = -1

    for (let i = 0; i < candidates.length; i++) {
      const d = candidates[i].distanceToSquared(last)
      if (d < minDistSq[i]) minDistSq[i] = d
      if (minDistSq[i] > bestDist) {
        bestDist = minDistSq[i]
        bestIdx = i
      }
    }

    selected.push(candidates[bestIdx].clone())
  }

  return selected
}

function buildHeartCandidates(count: number): Vector3[] {
  const candidateCount = Math.max(count * 3, 320)
  const points: Vector3[] = []

  for (let i = 0; i < candidateCount; i++) {
    const dir = fibonacciDirection(i, candidateCount)
    const t = rayToHeartSurface(dir)
    points.push(dir.clone().multiplyScalar(t))
  }

  return points
}

/**
 * 爱心表面照片布局：
 * 1. 斐波那契方向（球面均匀）
 * 2. 隐式爱心求交（轮廓准确）
 * 3. 最远点采样（局部间距更均匀）
 */
export function fibonacciHeart(count: number, targetScale = HEART_SCALE): Vector3[] {
  if (count <= 0) return []

  const candidates = centerAndScale(buildHeartCandidates(count), targetScale).map(
    orientHeartToFront,
  )
  return farthestPointSampling(candidates, count)
}

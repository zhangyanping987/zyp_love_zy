import { Vector3 } from 'three'

export function fibonacciSphere(count: number, radius: number): Vector3[] {
  if (count <= 0) return []

  const points: Vector3[] = []
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < count; i++) {
    const y = 1 - (2 * i) / Math.max(count - 1, 1)
    const radiusAtY = Math.sqrt(1 - y * y)
    const theta = goldenAngle * i

    const x = Math.cos(theta) * radiusAtY
    const z = Math.sin(theta) * radiusAtY

    points.push(new Vector3(x * radius, y * radius, z * radius))
  }

  return points
}

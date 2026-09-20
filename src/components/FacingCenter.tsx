import { useLayoutEffect, useRef, type ReactNode } from 'react'
import type { Vector3 } from 'three'
import type { Group } from 'three'

interface FacingCenterProps {
  position: Vector3
  children: ReactNode
}

export default function FacingCenter({ position, children }: FacingCenterProps) {
  const ref = useRef<Group>(null)

  useLayoutEffect(() => {
    if (!ref.current) return
    ref.current.position.copy(position)
    ref.current.lookAt(0, 0, 0)
  }, [position])

  return <group ref={ref}>{children}</group>
}

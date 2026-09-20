import { createContext, useContext, useEffect, useState } from 'react'

interface PerformanceContextValue {
  isMobile: boolean
}

export const PerformanceContext = createContext<PerformanceContextValue>({
  isMobile: false,
})

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 768px), (pointer: coarse)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px), (pointer: coarse)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return (
    <PerformanceContext.Provider value={{ isMobile }}>
      {children}
    </PerformanceContext.Provider>
  )
}

export function usePerformance() {
  return useContext(PerformanceContext)
}

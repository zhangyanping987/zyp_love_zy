import { createContext, useContext } from 'react'

export interface IntroState {
  progress: number
  /** 进入动画正在播放 */
  active: boolean
  /** 进入动画已结束 */
  done: boolean
}

export const IntroContext = createContext<IntroState>({
  progress: 0,
  active: false,
  done: false,
})

export function useIntro() {
  return useContext(IntroContext)
}

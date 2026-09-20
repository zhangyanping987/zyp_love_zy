import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { PerformanceProvider } from './context/PerformanceContext'

/** 应用启动即预拉取 3D 分包，读信时与图片预加载并行 */
void import('./components/Scene')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PerformanceProvider>
      <App />
    </PerformanceProvider>
  </StrictMode>,
)

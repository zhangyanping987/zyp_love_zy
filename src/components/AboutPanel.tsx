import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface AboutPanelProps {
  open: boolean
  onClose: () => void
}

export default function AboutPanel({ open, onClose }: AboutPanelProps) {
  useEffect(() => {
    if (!open) return
    document.body.classList.add('about-open')
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('about-open')
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[99990] flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-[#020810]/75 backdrop-blur-sm"
        aria-hidden
      />

      <article
        className="relative z-10 flex max-h-[min(82vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a1628]/95 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="letter-title text-xl leading-none sm:text-[1.4rem]" aria-label="信">
            <span className="inline-block not-italic">💌</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-zinc-400 transition hover:bg-white/10 hover:text-white"
            aria-label="关闭"
          >
            ×
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-4 text-sm leading-[1.85] text-zinc-300 sm:text-[15px] [&_p]:indent-[2em] [&_p.text-center]:indent-0">
          <p className="mb-5 text-zinc-300">
            <span className="letter-name bg-gradient-to-r from-teal-300 via-white to-cyan-200 bg-clip-text text-lg font-normal tracking-wide text-transparent drop-shadow-[0_0_10px_rgba(94,234,212,0.35)] sm:text-xl">
              To 曾妍
            </span>
            ，你是宇宙里最耀眼的那一颗星。我愿以这片星空为笺，把你的曾经轻轻珍藏，也把你的未来慢慢写进光阴。
          </p>
          <section className="mb-6">
            <h3 className="mb-3 text-xs font-medium tracking-wider text-teal-300/90">
              我想跟你说
            </h3>
            <p className="mb-3">
              喜欢你，不像烟花一霎明灭，更像星子入眸，夜色从此不歇。越看越清晰，越望越不舍——歪戴帽檐的你，短发轻扬的你，红发燃亮的你，随手定格的你；每一种模样，都像人间偶拾的星火，我想轻轻拢住，也想细细珍藏到岁月深处。
            </p>
            <p>
              把这些片刻嵌进星空时，我常默念：若你他日再翻开某一帧，会不会忽然懂——早有人把你的曾经与此刻，都当成不舍得熄的光。那个人是我。你成了我的女朋友，这件事一想起，心里便漫起一点甜，久久不散，像月色落在肩。
            </p>
          </section>

          <div className="border-t border-white/10 pt-5">
            <p className="letter-quote mb-5 px-1 text-center text-xl leading-[1.8] sm:text-[1.65rem]">
              <span className="bg-gradient-to-br from-teal-200/85 via-cyan-100/90 to-sky-200/80 bg-clip-text text-transparent">
                往后余生，
              </span>
              <span className="bg-gradient-to-r from-teal-50 via-white to-cyan-100 bg-clip-text text-transparent">
                请多指教。
              </span>
            </p>
            <p className="letter-signature mt-3 text-right text-teal-100/90">
              —— 张燕平
            </p>
          </div>
        </div>
      </article>
    </div>,
    document.body,
  )
}

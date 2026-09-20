import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { ALBUM_PASSWORD, ALBUM_PASSWORD_HINT } from '../constants/access'

interface PasswordGateProps {
  open: boolean
  onUnlock: () => void
}

export default function PasswordGate({ open, onUnlock }: PasswordGateProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    document.body.classList.add('about-open')
    const t = window.setTimeout(() => inputRef.current?.focus(), 80)
    return () => {
      document.body.classList.remove('about-open')
      window.clearTimeout(t)
    }
  }, [open])

  if (!open) return null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const ok = value.trim() === ALBUM_PASSWORD
    if (!ok) {
      setError(true)
      setValue('')
      inputRef.current?.focus()
      return
    }
    setError(false)
    onUnlock()
  }

  return createPortal(
    <div className="fixed inset-0 z-[99995] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-[#020810]/85 backdrop-blur-md"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(circle at 50% 40%, rgba(13,148,136,0.28) 0%, transparent 55%), radial-gradient(circle at 80% 20%, rgba(165,243,252,0.12) 0%, transparent 40%)',
        }}
        aria-hidden
      />

      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a1628]/95 px-6 py-8 shadow-2xl"
      >
        <p className="letter-title mb-2 text-center text-2xl">
          <span className="bg-gradient-to-r from-teal-100/95 via-white/90 to-cyan-100/95 bg-clip-text text-transparent">
            曾妍的相册
          </span>
        </p>
        <p className="mb-6 text-center text-sm text-zinc-400">
          输入密码后才能打开这封信
        </p>

        <label className="sr-only" htmlFor="album-password">
          密码
        </label>
        <input
          ref={inputRef}
          id="album-password"
          type="password"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (error) setError(false)
          }}
          placeholder="请输入密码"
          className={`w-full rounded-xl border bg-black/30 px-4 py-3 text-center text-base tracking-widest text-zinc-100 outline-none transition placeholder:tracking-normal placeholder:text-zinc-600 focus:ring-2 ${
            error
              ? 'border-rose-400/60 focus:ring-rose-400/30'
              : 'border-white/15 focus:border-teal-300/50 focus:ring-teal-300/25'
          }`}
        />

        {error ? (
          <p className="mt-3 text-center text-sm text-rose-300/90">密码不对，再试一次</p>
        ) : ALBUM_PASSWORD_HINT ? (
          <p className="mt-3 text-center text-xs text-zinc-500">提示：{ALBUM_PASSWORD_HINT}</p>
        ) : (
          <div className="mt-3 h-5" />
        )}

        <button
          type="submit"
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-teal-600/90 to-cyan-700/80 py-3 text-sm font-medium tracking-wide text-teal-50 transition hover:from-teal-500 hover:to-cyan-600"
        >
          打开信件
        </button>
      </form>
    </div>,
    document.body,
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { resolveAsset } from '../config/assets'

const BGM_SRC = resolveAsset('media/audio/pianai.mp3')

/**
 * enabled 为 true 时才创建 Audio 并开始下载（避免与首批缩略图抢带宽）。
 * suspended=true（例如视频 lightbox）时暂停，结束后若未静音则恢复。
 */
export function useBgm(enabled: boolean, suspended = false) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [ready, setReady] = useState(false)
  const mutedRef = useRef(false)
  const wasPlayingBeforeSuspend = useRef(false)

  useEffect(() => {
    mutedRef.current = muted
  }, [muted])

  useEffect(() => {
    if (!enabled) return

    const audio = new Audio(BGM_SRC)
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = 0.45
    audioRef.current = audio

    const onCanPlay = () => setReady(true)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    audio.addEventListener('canplaythrough', onCanPlay)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.pause()
      audio.removeEventListener('canplaythrough', onCanPlay)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audioRef.current = null
      setReady(false)
      setPlaying(false)
    }
  }, [enabled])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !enabled) return

    if (suspended) {
      wasPlayingBeforeSuspend.current = !audio.paused && !mutedRef.current
      audio.pause()
      return
    }

    if (mutedRef.current) return

    const shouldResume = wasPlayingBeforeSuspend.current || ready
    wasPlayingBeforeSuspend.current = false
    if (shouldResume) {
      void audio.play().catch(() => {})
    }
  }, [enabled, ready, suspended])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = muted
  }, [muted])

  const toggleMute = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    setMuted((m) => {
      const next = !m
      if (!next && !suspended) {
        void audio.play().catch(() => {})
      }
      return next
    })
  }, [suspended])

  return { playing, muted, toggleMute, ready }
}

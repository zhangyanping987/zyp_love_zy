import { useCallback, useEffect, useRef, useState } from 'react'

const BGM_SRC = `${import.meta.env.BASE_URL}media/audio/pianai.mp3`

/**
 * 在用户解锁（有手势）后播放 BGM。
 * 请自行将合法获得的音频放到 public/media/audio/pianai.mp3
 */
export function useBgm(enabled: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
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
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !enabled) return

    const tryPlay = () => {
      void audio.play().catch(() => {
        /* 个别浏览器仍拦截，等用户点右下角按钮 */
      })
    }

    tryPlay()
  }, [enabled, ready])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = muted
  }, [muted])

  const toggleMute = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (!playing) {
      void audio.play().catch(() => {})
    }
    setMuted((m) => !m)
  }, [playing])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      void audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [])

  return { playing, muted, toggleMute, togglePlay, ready }
}

import { useCallback, useEffect, useRef, useState } from 'react'

/** 한 구간(점 → 다음 점)을 1× 속도로 지나는 시간 */
const STEP_MS = 140

/**
 * 백엔드가 준 경로 좌표를 requestAnimationFrame으로 따라간다.
 * progress는 0 ~ (점 개수 − 1) 사이 실수(구간 사이를 보간한다).
 */
export function usePlayback(length: number, speed: number, onEnd?: () => void) {
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)
  const progressRef = useRef(0)
  const speedRef = useRef(speed)
  const onEndRef = useRef(onEnd)
  const frame = useRef<number | null>(null)
  const last = useRef<number | null>(null)

  useEffect(() => {
    speedRef.current = speed
    onEndRef.current = onEnd
  })

  const stopFrame = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = null
    last.current = null
  }

  const run = useCallback((total: number) => {
    stopFrame()
    const end = Math.max(0, total - 1)
    const tick = (ts: number) => {
      const dt = last.current === null ? 0 : ts - last.current
      last.current = ts
      const next = Math.min(end, progressRef.current + (dt / STEP_MS) * speedRef.current)
      progressRef.current = next
      setProgress(next)
      if (next >= end) {
        frame.current = null
        last.current = null
        setPlaying(false)
        onEndRef.current?.()
        return
      }
      frame.current = requestAnimationFrame(tick)
    }
    setPlaying(true)
    frame.current = requestAnimationFrame(tick)
  }, [])

  /** 처음부터 재생(새 경로) */
  const restart = useCallback(
    (total: number) => {
      progressRef.current = 0
      setProgress(0)
      run(total)
    },
    [run],
  )

  /** 멈춘 곳에서 이어 재생. 끝까지 갔으면 처음부터 */
  const play = useCallback(() => {
    if (length < 2) return
    if (progressRef.current >= length - 1) {
      progressRef.current = 0
      setProgress(0)
    }
    run(length)
  }, [length, run])

  const pause = useCallback(() => {
    stopFrame()
    setPlaying(false)
  }, [])

  /** 재생 없이 끝 지점으로 */
  const seekEnd = useCallback((total: number) => {
    stopFrame()
    setPlaying(false)
    progressRef.current = Math.max(0, total - 1)
    setProgress(progressRef.current)
  }, [])

  useEffect(() => stopFrame, [])

  return { progress, playing, play, pause, restart, seekEnd }
}

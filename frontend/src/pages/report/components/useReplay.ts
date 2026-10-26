import { useCallback, useEffect, useRef, useState } from 'react'

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * 여러 리플레이를 같은 시계로 재생한다. durations(ms)마다 0~1 진행값을 돌려준다.
 * 동작 줄이기 설정이면 바로 끝 상태로 보여 준다.
 */
export function useReplay(durations: number[]) {
  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(false)
  const raf = useRef(0)
  const longest = Math.max(1, ...durations)

  const play = useCallback(() => {
    cancelAnimationFrame(raf.current)
    if (reduceMotion()) {
      setElapsed(longest)
      return
    }
    setPlaying(true)
    const start = performance.now()
    const tick = (now: number) => {
      const e = now - start
      setElapsed(e)
      if (e < longest) raf.current = requestAnimationFrame(tick)
      else setPlaying(false)
    }
    raf.current = requestAnimationFrame(tick)
  }, [longest])

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  return {
    progress: durations.map((d) => Math.min(1, elapsed / Math.max(1, d))),
    playing,
    play,
  }
}

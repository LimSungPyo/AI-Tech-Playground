import { useEffect, useState } from 'react'

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * 0초부터 total초까지 흐르는 재생 시계. messages[].at 순서대로 보여 줄 때 쓴다.
 * 움직임 줄이기 설정이면 바로 끝 상태로 둔다. run 값이 바뀌면 처음부터 다시 재생한다.
 */
export function usePlayback(total: number | undefined, run: number) {
  const [elapsed, setElapsed] = useState(0)
  const [prevKey, setPrevKey] = useState<string>('')

  // total · run이 바뀌면 렌더 중에 시계를 0으로 돌린다
  const key = `${total ?? ''}:${run}`
  if (key !== prevKey) {
    setPrevKey(key)
    setElapsed(total !== undefined && reducedMotion() ? total : 0)
  }

  useEffect(() => {
    if (total === undefined || reducedMotion()) return
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const t = (now - start) / 1000
      // 0.1초 단위로만 갱신(같은 값이면 React가 렌더를 건너뛴다)
      setElapsed(t >= total ? total : Math.floor(t * 10) / 10)
      if (t < total) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [total, run])

  return { elapsed, done: total !== undefined && elapsed >= total }
}

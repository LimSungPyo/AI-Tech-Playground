import { useEffect, useState } from 'react'

/** 등장/퇴장 애니메이션 동안 마운트를 유지한다. 반환: [마운트 여부, 'enter' | 'exit'] */
export function usePresence(open: boolean, duration = 220) {
  const [mounted, setMounted] = useState(open)
  // 처음부터 열린 채로 마운트돼도 등장 애니메이션이 나오도록 exit에서 시작한다
  const [phase, setPhase] = useState<'enter' | 'exit'>('exit')

  // 열리면 렌더 중에 바로 마운트한다
  if (open && !mounted) setMounted(true)

  useEffect(() => {
    if (open) {
      // 한 프레임 뒤 enter로 바꿔야 transition이 시작된다
      let raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => setPhase('enter'))
      })
      return () => cancelAnimationFrame(raf)
    }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const t = window.setTimeout(
      () => {
        setMounted(false)
        setPhase('exit')
      },
      reduce ? 0 : duration,
    )
    return () => window.clearTimeout(t)
  }, [open, duration])

  return [mounted || open, open ? phase : 'exit'] as const
}

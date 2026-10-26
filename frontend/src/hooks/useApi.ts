import { useCallback, useEffect, useRef, useState } from 'react'
import type { DependencyList } from 'react'
import { ApiError } from '../api/client'

export interface ApiState<T> {
  data: T | undefined
  error: ApiError | undefined
  loading: boolean
  /** 같은 인자로 다시 부른다 */
  reload: () => void
  /** 낙관적 갱신 등으로 data를 직접 바꾼다 */
  setData: (next: T | undefined | ((prev: T | undefined) => T | undefined)) => void
}

function sameDeps(a: DependencyList, b: DependencyList) {
  return a.length === b.length && a.every((v, i) => Object.is(v, b[i]))
}

/**
 * API 함수를 마운트 · deps 변경 때 호출한다.
 *   const { data, error, loading, reload } = useApi((signal) => getHome(signal), [])
 *   const exp = useApi((signal) => getExperiment(id, signal), [id])
 * fn에 null을 주면 호출하지 않는다(조건부 요청).
 */
export function useApi<T>(fn: ((signal: AbortSignal) => Promise<T>) | null, deps: DependencyList): ApiState<T> {
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<ApiError | undefined>(undefined)
  const [loading, setLoading] = useState(fn !== null)
  const [nonce, setNonce] = useState(0)
  const enabled = fn !== null

  // deps가 바뀌면(얕은 비교) version을 올린다 — 렌더 중 이전 값과 비교하는 React 권장 패턴
  const [prevDeps, setPrevDeps] = useState(deps)
  const [version, setVersion] = useState(0)
  if (!sameDeps(prevDeps, deps)) {
    setPrevDeps(deps)
    setVersion((v) => v + 1)
  }

  const fnRef = useRef(fn)
  useEffect(() => {
    fnRef.current = fn
  })

  useEffect(() => {
    const current = fnRef.current
    if (!enabled || !current) return
    const ctrl = new AbortController()
    // 요청 시작 표시는 비동기 콜백 안에서 바꾼다
    queueMicrotask(() => {
      if (ctrl.signal.aborted) return
      setLoading(true)
      setError(undefined)
    })
    current(ctrl.signal)
      .then((res) => {
        if (!ctrl.signal.aborted) setData(res)
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return
        setError(e instanceof ApiError ? e : new ApiError(0, 'UNKNOWN', e instanceof Error ? e.message : String(e)))
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false)
      })
    return () => ctrl.abort()
  }, [version, nonce, enabled])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return { data, error, loading: enabled && loading, reload, setData }
}

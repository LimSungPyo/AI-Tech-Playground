import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import * as authApi from '../api/auth'
import { SESSION_EXPIRED_EVENT } from '../api/client'
import type { User } from '../api/types'
import { AuthContext } from './context'
import type { AuthContextValue, AuthStatus } from './context'
import { getAdminToken, getToken, setRememberedEmail, setStoredAdminToken, setStoredToken } from './storage'

/**
 * 로그인 상태. 토큰이 있으면 `/api/auth/me`로 사용자를 불러오고,
 * 실패하면(백엔드 없음 포함) 비회원으로 본다. 앱은 어느 경우에도 계속 동작한다.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() => (getToken() ? 'loading' : 'guest'))
  const [adminToken, setAdminTokenState] = useState<string | null>(() => getAdminToken())

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setStatus('guest')
      return null
    }
    try {
      const me = await authApi.getMe()
      setUser(me)
      setStatus('member')
      return me
    } catch {
      // 토큰이 무효이거나 서버가 없으면 비회원으로 계속 진행한다(토큰은 401일 때 세션 만료 이벤트가 처리)
      setUser(null)
      setStatus('guest')
      return null
    }
  }, [])

  useEffect(() => {
    // 첫 마운트 때 저장된 토큰으로 사용자 정보를 불러온다. 실패하면(백엔드 없음 포함) 비회원
    if (!getToken()) return
    let alive = true
    authApi
      .getMe()
      .then((me) => {
        if (!alive) return
        setUser(me)
        setStatus('member')
      })
      .catch(() => {
        if (!alive) return
        setUser(null)
        setStatus('guest')
      })
    return () => {
      alive = false
    }
  }, [])

  const setToken = useCallback(
    (token: string | null, nextUser?: User) => {
      setStoredToken(token)
      if (!token) {
        setUser(null)
        setStatus('guest')
        return
      }
      if (nextUser) {
        setUser(nextUser)
        setStatus('member')
      } else {
        setStatus('loading')
        void refresh()
      }
    },
    [refresh],
  )

  const setAdminToken = useCallback((token: string | null) => {
    setStoredAdminToken(token)
    setAdminTokenState(token)
  }, [])

  const login = useCallback(
    async (email: string, password: string, remember: boolean) => {
      const res = await authApi.login({ email, password, remember })
      setRememberedEmail(remember ? email : null)
      setToken(res.token, res.user)
      return res.user
    },
    [setToken],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // 서버 응답과 상관없이 로컬 세션은 정리한다
    }
    setAdminToken(null)
    setToken(null)
  }, [setToken, setAdminToken])

  // 401(세션 만료) 시 토큰을 버리고 비회원으로 돌린다. 안내 모달은 auth slave의 전역 컴포넌트가 같은 이벤트를 듣는다.
  useEffect(() => {
    const onExpired = () => {
      setStoredToken(null)
      setUser(null)
      setStatus('guest')
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isMember: status === 'member' && user !== null,
      isAdmin: user?.role === 'admin',
      adminToken,
      login,
      logout,
      refresh,
      setToken,
      setAdminToken,
    }),
    [user, status, adminToken, login, logout, refresh, setToken, setAdminToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

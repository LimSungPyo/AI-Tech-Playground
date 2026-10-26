import { createContext } from 'react'
import type { User } from '../api/types'

export type AuthStatus = 'loading' | 'member' | 'guest'

export interface AuthContextValue {
  user: User | null
  status: AuthStatus
  isMember: boolean
  isAdmin: boolean
  /** 관리자 재인증 토큰(sessionStorage) */
  adminToken: string | null
  login: (email: string, password: string, remember: boolean) => Promise<User>
  logout: () => Promise<void>
  /** GET /api/auth/me 를 다시 부른다 */
  refresh: () => Promise<User | null>
  /** 가입 인증·소셜 로그인 등 다른 경로로 받은 토큰을 저장한다(user를 함께 주면 me 호출 생략) */
  setToken: (token: string | null, user?: User) => void
  setAdminToken: (token: string | null) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

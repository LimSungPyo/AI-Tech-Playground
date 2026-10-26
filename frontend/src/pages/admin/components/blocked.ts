// G-11 관리자 접속 차단 화면으로 넘기는 state
import type { ApiError } from '../../../api/client'
import type { IpBlockedData } from '../../../api/types'

/** 차단 화면(G-11)에 넘기는 시도 정보 */
export interface BlockedState {
  email?: string
  at: number
  /** 403 IP_BLOCKED error.ip (v2) */
  ip?: string
}

/** IP_BLOCKED 오류 → 차단 화면 state. 서버의 ip · at(v2)을 우선 쓴다 */
export function blockedState(e: ApiError, email?: string): BlockedState {
  const data = e.data as Partial<IpBlockedData> | undefined
  const at = data?.at ? Date.parse(data.at) : NaN
  return { email, at: Number.isNaN(at) ? Date.now() : at, ip: data?.ip }
}

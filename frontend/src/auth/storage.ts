// 토큰 저장소. localStorage/sessionStorage 접근은 사파리 사설 모드 등에서 throw 할 수 있어 감싼다.

export const TOKEN_KEY = 'atp.token'
export const ADMIN_TOKEN_KEY = 'atp.adminToken'
export const ADMIN_TOKEN_AT_KEY = 'atp.adminTokenAt'
export const REMEMBERED_EMAIL_KEY = 'atp.rememberedEmail'
export const GUEST_TRIALS_KEY = 'atp.guestTrials'

/** 관리자 재인증 유효 시간(분). 상단 바의 남은 시간 표시에 쓴다. */
export const ADMIN_REAUTH_MINUTES = 30

function read(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key)
  } catch {
    return null
  }
}

function write(storage: () => Storage, key: string, value: string | null) {
  try {
    if (value === null) storage().removeItem(key)
    else storage().setItem(key, value)
  } catch {
    // 저장소를 못 쓰면 메모리 상태만으로 동작한다
  }
}

const local = () => window.localStorage
const session = () => window.sessionStorage

export const getToken = () => read(local, TOKEN_KEY)
export const setStoredToken = (token: string | null) => write(local, TOKEN_KEY, token)

export const getAdminToken = () => read(session, ADMIN_TOKEN_KEY)
export function setStoredAdminToken(token: string | null) {
  write(session, ADMIN_TOKEN_KEY, token)
  write(session, ADMIN_TOKEN_AT_KEY, token === null ? null : String(Date.now()))
}
/** 재인증 시각(ms). 없으면 null */
export function getAdminTokenIssuedAt(): number | null {
  const raw = read(session, ADMIN_TOKEN_AT_KEY)
  return raw ? Number(raw) : null
}

export const getRememberedEmail = () => read(local, REMEMBERED_EMAIL_KEY)
export const setRememberedEmail = (email: string | null) => write(local, REMEMBERED_EMAIL_KEY, email)

export function getGuestTrials(): number {
  return Number(read(local, GUEST_TRIALS_KEY) ?? 0) || 0
}
export const setGuestTrials = (n: number) => write(local, GUEST_TRIALS_KEY, String(n))

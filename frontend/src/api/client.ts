// fetch 래퍼. 모든 API 호출은 이 파일의 request()를 거친다.
import { getAdminToken, getToken } from '../auth/storage'

/** 401 응답(토큰을 보낸 요청)에서 window에 발생하는 전역 이벤트 */
export const SESSION_EXPIRED_EVENT = 'atp:session-expired'

export class ApiError<T = unknown> extends Error {
  readonly status: number
  readonly code: string
  readonly data: T | undefined

  constructor(status: number, code: string, message: string, data?: T) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.data = data
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError

type Query = Record<string, string | number | boolean | undefined | null>

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Query
  signal?: AbortSignal
  /** true면 401이어도 세션 만료 이벤트를 내지 않는다(로그인 시도 등) */
  silent401?: boolean
}

function buildUrl(path: string, query?: Query) {
  const url = `/api${path.startsWith('/') ? path : `/${path}`}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal, silent401 } = options
  const headers: Record<string, string> = { Accept: 'application/json' }

  // 관리자 API는 재인증 토큰이 있으면 그것을, 없으면 회원 토큰을 보낸다
  const token = path.startsWith('/admin') ? (getAdminToken() ?? getToken()) : getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let payload: BodyInit | undefined
  if (body instanceof FormData) {
    payload = body
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let res: Response
  try {
    res = await fetch(buildUrl(path, query), { method, headers, body: payload, signal })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new ApiError(0, 'NETWORK_ERROR', '서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.')
  }

  const text = await res.text()
  let json: unknown = undefined
  if (text) {
    try {
      json = JSON.parse(text)
    } catch {
      json = undefined
    }
  }

  if (!res.ok) {
    const err = (json as { error?: { code?: string; message?: string; [k: string]: unknown } } | undefined)?.error
    // 오류 본문의 code·message 외 필드(remainingAttempts 등)는 data로 넘긴다
    const { code, message, ...rest } = err ?? {}
    const data = (err as { data?: unknown } | undefined)?.data ?? (Object.keys(rest).length ? rest : undefined)
    if (res.status === 401 && token && !silent401) {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { path } }))
    }
    throw new ApiError(
      res.status,
      code ?? `HTTP_${res.status}`,
      message ?? (json === undefined ? '서버 응답을 읽을 수 없어요.' : '요청을 처리하지 못했어요.'),
      data,
    )
  }

  if (json === undefined && text) {
    throw new ApiError(res.status, 'INVALID_JSON', '서버 응답을 읽을 수 없어요.')
  }
  return json as T
}

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>(path, { query, signal }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'PUT', body }),
  del: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) => request<T>(path, { ...opts, method: 'DELETE' }),
}

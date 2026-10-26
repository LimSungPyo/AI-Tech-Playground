import { useEffect, useState } from 'react'
import { useLocation, useMatch } from 'react-router'
import { getHome } from '../api/me'
import type { DormantInfo } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { CookieConsentBanner, DormantWelcomeModal, SessionExpiredModal } from '../pages/auth/global'

/** 휴면 복귀 모달을 이번 탭에서 이미 보여 줬는지(sessionStorage) */
const DORMANT_SHOWN_KEY = 'atp.dormantShown'

function readShown() {
  try {
    return window.sessionStorage.getItem(DORMANT_SHOWN_KEY) === '1'
  } catch {
    return false
  }
}

function markShown() {
  try {
    window.sessionStorage.setItem(DORMANT_SHOWN_KEY, '1')
  } catch {
    // 저장소를 못 쓰면 이번 화면 동안만 기억한다
  }
}

/**
 * 07:M-07 휴면 복귀 웰컴. 로그인 홈(/)에서 `/api/me/home`의 `dormant`가 있으면 탭마다 한 번 띄운다.
 * 홈 화면도 같은 API를 부르지만, 홈 페이지를 건드리지 않으려고 여기서 따로 확인한다(이미 본 탭이면 부르지 않음).
 */
function DormantWelcomeGate() {
  const { status } = useAuth()
  const { pathname } = useLocation()
  const [dormant, setDormant] = useState<DormantInfo | null>(null)
  const [checked, setChecked] = useState(readShown)
  const onHome = pathname === '/'

  useEffect(() => {
    if (status !== 'member' || !onHome || checked) return
    const ctrl = new AbortController()
    getHome(ctrl.signal)
      .then((home) => {
        setChecked(true)
        if (!home.dormant) return
        markShown()
        setDormant(home.dormant)
      })
      .catch(() => {
        // 홈 화면이 오류를 따로 보여 준다. 여기서는 모달만 건너뛴다
      })
    return () => ctrl.abort()
  }, [status, onHome, checked])

  if (!dormant) return null
  return (
    <DormantWelcomeModal
      open={onHome && status === 'member'}
      onClose={() => setDormant(null)}
      daysAway={dormant.daysAway}
      highlights={dormant.highlights}
      continueTo={dormant.continueTo}
    />
  )
}

/**
 * 앱 전체에 한 번만 붙는 인증 팝업(RootLayout 안).
 * - 08:M-01 세션 만료: 플레이 화면(`/experiments/:id/play`)은 자체 07:M-08 모달을 띄우므로 거기서는 붙이지 않는다.
 * - 08:M-07 쿠키 동의 배너: 첫 방문 한 번
 * - 07:M-07 휴면 복귀 웰컴
 */
export function GlobalOverlays() {
  const onPlay = useMatch('/experiments/:id/play') !== null
  return (
    <>
      {!onPlay && <SessionExpiredModal />}
      <CookieConsentBanner />
      <DormantWelcomeGate />
    </>
  )
}

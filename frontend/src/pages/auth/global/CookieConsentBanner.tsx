import { useState } from 'react'
import { Button, Modal, Toggle } from '../../../components'
import styles from './global.module.css'

/** localStorage `atp.cookieConsent` 값: 'all'(분석 쿠키 포함) | 'essential'(필수만) */
export type CookieConsent = 'all' | 'essential'
const CONSENT_KEY = 'atp.cookieConsent'

function readConsent(): CookieConsent | null {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY)
    return v === 'all' || v === 'essential' ? v : null
  } catch {
    return null
  }
}

export interface CookieConsentBannerProps {
  /** 사용자가 고른 뒤 호출 */
  onChange?: (consent: CookieConsent) => void
}

/** 08:M-07 첫 방문 · 쿠키 동의 배너. 저장된 동의가 없을 때만 화면 아래에 뜬다(딤 없음) */
export function CookieConsentBanner({ onChange }: CookieConsentBannerProps) {
  const [consent, setConsent] = useState<CookieConsent | null>(() => readConsent())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [analytics, setAnalytics] = useState(true)

  const save = (value: CookieConsent) => {
    try {
      window.localStorage.setItem(CONSENT_KEY, value)
    } catch {
      // 저장소를 못 쓰면 이번 방문 동안만 기억한다
    }
    setConsent(value)
    setSettingsOpen(false)
    onChange?.(value)
  }

  if (consent) return null

  return (
    <>
      <div className={styles.cookie} role="region" aria-label="쿠키 동의">
        <div className={styles.cookieText}>
          <strong>더 나은 실험 환경을 위해 쿠키를 사용해요</strong>
          <span>필수 쿠키는 항상 켜져 있어요 · 분석 쿠키는 선택이에요</span>
        </div>
        <div className={styles.cookieActions}>
          <button type="button" className={styles.cookieLink} onClick={() => setSettingsOpen(true)}>
            설정
          </button>
          <Button variant="secondary" onClick={() => save('essential')}>
            필수만 허용
          </Button>
          <Button onClick={() => save('all')}>모두 허용</Button>
        </div>
      </div>
      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        size="md"
        showClose
        title="쿠키 설정"
        description="필수 쿠키는 로그인 · 보안에 꼭 필요해서 끌 수 없어요."
        footer={<Button onClick={() => save(analytics ? 'all' : 'essential')}>저장하기</Button>}
      >
        <div className={styles.stack}>
          <Toggle label="필수 쿠키" description="로그인 유지 · 보안 · 게스트 체험 기록" checked disabled readOnly />
          <Toggle label="분석 쿠키" description="어떤 실험이 어려운지 살펴보고 개선하는 데 써요" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
        </div>
      </Modal>
    </>
  )
}

import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { Button, useModal } from '../../components'
import type { BlockedState } from './components/blocked'
import { AuthShell } from './components/AuthShell'
import authStyles from './components/AuthShell.module.css'
import { ymdhm } from './components/format'
import styles from './AdminBlockedPage.module.css'

/** admin.hyewon@playground.ai → admin.hy***@playground.ai */
function maskEmail(email: string) {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const keep = Math.min(local.length, Math.max(2, local.indexOf('.') + 3))
  return `${local.slice(0, keep)}***@${domain}`
}

function ShieldX() {
  return (
    <svg width="80" height="96" viewBox="0 0 80 96" aria-hidden className={styles.shield}>
      <path d="M40 4 74 16v28c0 22-14 38-34 48C20 82 6 66 6 44V16Z" className={styles.shieldFill} />
      <path d="M40 4 74 16v28c0 22-14 38-34 48C20 82 6 66 6 44V16Z" className={styles.shieldLine} />
      <path d="m27 34 26 26M53 34 27 60" className={styles.shieldLine} />
    </svg>
  )
}

// W2 admin 담당 · 경로 /admin/blocked — G-11 관리자 접속 차단
export default function AdminBlockedPage() {
  const navigate = useNavigate()
  const modal = useModal()
  const { user } = useAuth()
  const state = useLocation().state as BlockedState | null
  // 시도 시각은 넘겨받은 값, 없으면 화면을 연 시각
  const [at] = useState(() => state?.at ?? Date.now())
  const email = state?.email || user?.email

  const showVpnGuide = () =>
    modal.info({
      title: 'VPN 연결 방법',
      message:
        '사내 VPN 앱을 켜고 회사 계정으로 로그인한 뒤, 연결 상태가 "사내망"으로 바뀌면 관리자 로그인을 다시 시도해 주세요. 등록된 IP가 바뀌었다면 슈퍼관리자에게 허용 IP 추가를 요청해 주세요.',
      confirmLabel: '확인',
    })

  return (
    <AuthShell wide label="관리자 접속 차단">
      <div className={styles.wrap}>
        <ShieldX />
        <h1 className={authStyles.title}>허용되지 않은 네트워크예요</h1>
        <p className={authStyles.desc}>
          관리자 콘솔은 사내 VPN 또는 등록된 IP에서만 열려요. 관리자 계정이라도 외부 네트워크에서는 접속할 수 없어요.
        </p>

        <dl className={styles.info}>
          <dt>접속 IP</dt>
          <dd>{state?.ip ? `${state.ip} (외부 네트워크)` : '외부 네트워크'}</dd>
          <dt>시간</dt>
          <dd>{ymdhm(new Date(at))}</dd>
          {email && (
            <>
              <dt>계정</dt>
              <dd>{maskEmail(email)}</dd>
            </>
          )}
        </dl>

        <p className={styles.warn}>이 시도는 보안 로그에 기록되고, 3회 반복되면 슈퍼관리자에게 알림이 가요.</p>

        <div className={authStyles.buttons}>
          <Button variant="secondary" size="lg" pill={false} onClick={() => void showVpnGuide()}>
            VPN 연결 방법
          </Button>
          <Button variant="primary" size="lg" pill={false} onClick={() => navigate('/', { replace: true })}>
            사용자 화면으로
          </Button>
        </div>
      </div>
    </AuthShell>
  )
}

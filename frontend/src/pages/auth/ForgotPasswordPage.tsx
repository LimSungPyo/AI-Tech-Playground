import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { forgotPassword } from '../../api/auth'
import { Button, Icon, Mascot, useToast } from '../../components'
import { AuthCard, StepChips } from './components/AuthCard'
import { ForgotForm } from './components/ForgotForm'
import { RESEND_COOLDOWN_SEC, useCountdown } from './lib'
import a from './auth.module.css'
import styles from './ForgotPasswordPage.module.css'

const STEPS = ['이메일 입력', '메일 확인', '새 비밀번호']

// W2 auth 담당 · 경로 /password/forgot (?email= 미리 채움)
// 0-05 비밀번호 찾기: 1 이메일 입력 → 2 메일 확인. 팝업 버전(08:L-04 · L-05)은 global/LoginPopup
export default function ForgotPasswordPage() {
  const [params] = useSearchParams()
  const [sent, setSent] = useState<{ email: string; expiresInMin: number } | null>(null)

  if (sent) return <SentCard email={sent.email} expiresInMin={sent.expiresInMin} />

  return (
    <AuthCard width={520}>
      <StepChips steps={STEPS} current={0} />
      <div className={styles.mascot}>
        <Mascot expression="confused" size={96} />
      </div>
      <h1 className={a.title}>비밀번호를 잊었나요?</h1>
      <p className={a.lead}>가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드려요.</p>
      <ForgotForm variant="page" defaultEmail={params.get('email') ?? ''} onSent={(email, expiresInMin) => setSent({ email, expiresInMin })} />
      <Link to="/login" className={styles.back}>
        <Icon name="arrow-left" size={16} /> 로그인으로 돌아가기
      </Link>
    </AuthCard>
  )
}

function SentCard({ email, expiresInMin }: { email: string; expiresInMin: number }) {
  const toast = useToast()
  const cooldown = useCountdown(RESEND_COOLDOWN_SEC)
  const [resending, setResending] = useState(false)

  const resend = async () => {
    setResending(true)
    try {
      await forgotPassword(email)
      cooldown.restart(RESEND_COOLDOWN_SEC)
      toast.show({ title: '메일을 다시 보냈어요', description: email, tone: 'success' })
    } catch {
      toast.show({ title: '메일을 보내지 못했어요', description: '잠시 후 다시 시도해 주세요.', tone: 'danger' })
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthCard centered width={520}>
      <StepChips steps={STEPS} current={1} align="center" />
      <div className={a.media}>
        <Mascot expression="happy" size={110} float />
      </div>
      <h1 className={a.title}>메일을 보냈어요!</h1>
      <p className={a.lead}>
        {email} 로 재설정 링크를 보냈어요. 링크는 {expiresInMin}분 동안 유효해요.
      </p>
      <Button size="lg" block onClick={() => (window.location.href = 'mailto:')}>
        메일 앱 열기
      </Button>
      <p className={styles.resend}>
        메일이 안 왔나요?{' '}
        <button type="button" className={a.link} onClick={() => void resend()} disabled={cooldown.left > 0 || resending}>
          {cooldown.left > 0 ? `다시 보내기 (${cooldown.left}초 후)` : '다시 보내기'}
        </button>
      </p>
      <p className={a.noticeWarm}>스팸함도 확인해 주세요. 소셜 로그인으로 가입했다면 비밀번호 없이 해당 서비스로 로그인하면 돼요.</p>
    </AuthCard>
  )
}

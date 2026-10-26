import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { User } from '../../../api/types'
import { Button, Icon, Info, Logo, Modal, useToast } from '../../../components'
import { StepChips } from '../components/AuthCard'
import { ForgotForm } from '../components/ForgotForm'
import { LoginForm } from '../components/LoginForm'
import { SignupForm } from '../components/SignupForm'
import { safeReturnTo, useMediaQuery } from '../lib'
import { MobileLoginSheet } from './MobileLoginSheet'
import styles from './global.module.css'

export type LoginPopupView = 'login' | 'signup' | 'forgot'

export interface LoginPopupProps {
  open: boolean
  onClose: () => void
  /** 처음 보여줄 화면. 기본 login */
  initialView?: LoginPopupView
  /** 로그인 성공 후 이동할 앱 경로. 없으면 지금 화면에 머문다 */
  returnTo?: string
  onSuccess?: (user: User) => void
}

/**
 * 08:L-01 로그인 팝업 · L-02 비밀번호 오류 · L-03 회원가입 · L-04 비밀번호 찾기 · L-05 메일 발송 완료.
 * 768px 이하에서는 08:M-06 MobileLoginSheet(바텀시트)로 대신 그린다.
 */
export function LoginPopup(props: LoginPopupProps) {
  const mobile = useMediaQuery('(max-width: 768px)')
  const [session, setSession] = useState(0)
  const [prevOpen, setPrevOpen] = useState(props.open)
  // 열릴 때마다 입력과 화면을 처음 상태로 돌린다
  if (props.open !== prevOpen) {
    setPrevOpen(props.open)
    if (props.open) setSession((s) => s + 1)
  }
  if (mobile) return <MobileLoginSheet key={session} {...props} />
  return <DesktopPopup key={session} {...props} />
}

function DesktopPopup({ open, onClose, initialView = 'login', returnTo, onSuccess }: LoginPopupProps) {
  const navigate = useNavigate()
  const toast = useToast()
  const [view, setView] = useState<LoginPopupView>(initialView)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const done = (user: User) => {
    onSuccess?.(user)
    onClose()
    toast.show({ title: `다시 만나서 반가워요, ${user.nickname}님`, tone: 'success' })
    if (returnTo) navigate(safeReturnTo(returnTo))
  }

  if (sentTo !== null) {
    return (
      <Info
        open={open}
        title="메일을 보냈어요"
        message={'받은편지함에서 링크를 눌러\n비밀번호를 다시 만들어 주세요'}
        onClose={onClose}
      />
    )
  }

  if (view === 'signup') {
    return (
      <Modal
        open={open}
        onClose={onClose}
        size="md"
        showClose
        className={styles.popup}
        media={
          <div className={styles.popupSteps}>
            <StepChips steps={['계정', '온보딩']} current={0} />
          </div>
        }
        title="AI 실험실에 오신 걸 환영해요"
        description="30초면 끝나요 · 가입하면 게스트 기록도 함께 저장돼요"
      >
        <SignupForm variant="popup" onLeave={onClose} onLogin={() => setView('login')} />
      </Modal>
    )
  }

  if (view === 'forgot') {
    return (
      <Modal
        open={open}
        onClose={onClose}
        size="md"
        showClose
        centered
        className={styles.popup}
        media={
          <span className={styles.iconBubble}>
            <Icon name="key" size={22} />
          </span>
        }
        title="비밀번호를 잊으셨나요?"
        description="가입한 이메일로 재설정 링크를 보내드려요"
      >
        <div className={styles.stack}>
          <ForgotForm variant="popup" onSent={(email) => setSentTo(email)} />
          <Button variant="ghost" size="sm" iconLeft={<Icon name="arrow-left" size={14} />} onClick={() => setView('login')} className={styles.back}>
            로그인으로 돌아가기
          </Button>
          <p className={styles.caption}>소셜 로그인으로 가입했다면 해당 서비스에서 로그인해 주세요</p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      showClose
      centered
      className={styles.popup}
      media={<Logo iconOnly size={48} />}
      title="다시 만나서 반가워요"
      description="로그인하고 실험 기록을 이어가요"
    >
      <LoginForm
        variant="popup"
        returnTo={returnTo}
        onSuccess={done}
        onLeave={onClose}
        onSignup={() => setView('signup')}
        onForgot={() => setView('forgot')}
        autoFocus
      />
    </Modal>
  )
}

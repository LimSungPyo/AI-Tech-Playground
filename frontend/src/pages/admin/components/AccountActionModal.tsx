import { useState } from 'react'
import { adminUserAction } from '../../../api'
import { isApiError } from '../../../api/client'
import type { AdminUserAction, AdminUsers } from '../../../api/types'
import { Button, Modal, OtpInput, Textarea, useToast } from '../../../components'
import { Pill } from './AdminUi'
import styles from './AccountActionModal.module.css'

type User = AdminUsers['users'][number]

const ACTION_COPY: Record<AdminUserAction, { title: (u: User) => string; button: string; effects: string[]; danger?: boolean }> = {
  restore: {
    title: (u) => (u.status === 'withdrawing' ? '탈퇴 유예 계정을 복구할까요?' : '계정 잠금을 해제할까요?'),
    button: '복구 실행',
    effects: ['계정 상태 → 활성', '실험 기록 · 캐릭터 · 도감 · 배지 그대로 복원', '사용자에게 "계정이 복구됐어요" 이메일 발송'],
  },
  suspend: {
    title: () => '계정을 잠글까요?',
    button: '잠금 실행',
    effects: ['계정 상태 → 잠김, 즉시 로그아웃', '랭킹 · 공유 페이지에서 숨김', '사용자에게 잠금 사유 이메일 발송'],
    danger: true,
  },
  warn: {
    title: () => '이 사용자에게 경고를 보낼까요?',
    button: '경고 보내기',
    effects: ['알림 센터 · 이메일로 경고 안내 발송', '같은 사유로 3회 누적되면 잠금 검토 대상'],
  },
  // v2 계약에 추가된 조치(화면 연결은 다음 단계)
  reset_password: {
    title: () => '비밀번호 재설정 메일을 보낼까요?',
    button: '메일 보내기',
    effects: ['가입 이메일로 30분짜리 재설정 링크 발송', '다른 기기 세션은 그대로 유지'],
  },
  unlock: {
    title: () => '계정 잠금을 해제할까요?',
    button: '잠금 해제',
    effects: ['계정 상태 → 활성', '로그인 실패 횟수 초기화'],
  },
  wipe: {
    title: () => '학습 기록을 초기화할까요?',
    button: '초기화 실행',
    effects: ['실험 기록 · 캐릭터 성장 · 배지 진행 삭제', '되돌릴 수 없어요'],
    danger: true,
  },
}

/** F-09 계정 조치 확인 모달: 사유(필수) + 2차 인증 후 실행, 감사 로그에 기록 */
export function AccountActionModal({
  user,
  action,
  onClose,
  onDone,
}: {
  user: User | null
  action: AdminUserAction | null
  onClose: () => void
  onDone: (user: User, action: AdminUserAction) => void
}) {
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [touched, setTouched] = useState(false)
  const open = Boolean(user && action)
  const copy = action ? ACTION_COPY[action] : null

  const close = () => {
    if (busy) return
    setReason('')
    setOtp('')
    setTouched(false)
    onClose()
  }

  const run = async () => {
    setTouched(true)
    if (!user || !action || !reason.trim() || otp.length !== 6) return
    setBusy(true)
    try {
      await adminUserAction(user.id, action, reason.trim())
      toast.show({ title: `${user.nickname} · ${copy?.button.replace(' 실행', '')} 완료`, description: '감사 로그에 기록됐어요', tone: 'success' })
      onDone(user, action)
      setBusy(false)
      setReason('')
      setOtp('')
      setTouched(false)
      onClose()
    } catch (e) {
      setBusy(false)
      toast.show({ title: '조치하지 못했어요', description: isApiError(e) ? e.message : undefined, tone: 'danger' })
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      size="md"
      showClose
      eyebrow={<Pill tone="warning">계정 조치</Pill>}
      title={user && copy ? copy.title(user) : ''}
      description={user ? `${user.nickname} (${user.email}) · 가입 ${user.joinedAt}` : undefined}
      footer={
        <div className={styles.footer}>
          <Pill>감사 로그에 기록돼요</Pill>
          <span className={styles.spacer} />
          <Button variant="secondary" pill={false} onClick={close} disabled={busy}>
            취소
          </Button>
          <Button variant={copy?.danger ? 'danger' : 'primary'} pill={false} loading={busy} onClick={() => void run()}>
            {copy?.button}
          </Button>
        </div>
      }
    >
      {copy && (
        <div className={styles.body}>
          <div className={styles.effects}>
            <strong>실행하면</strong>
            <ul>
              {copy.effects.map((e) => (
                <li key={e}>· {e}</li>
              ))}
            </ul>
          </div>
          <Textarea
            label="사유 (필수)"
            rows={3}
            placeholder="예) 본인이 문의(T-2041)로 복구를 요청함. 가입 이메일로 본인 확인 완료."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={touched && !reason.trim() ? '사유를 입력해 주세요' : undefined}
          />
          <div className={styles.otp}>
            <span className={styles.label}>2차 인증</span>
            <OtpInput label="2차 인증 6자리" value={otp} onChange={setOtp} error={touched && otp.length !== 6} disabled={busy} />
            {touched && otp.length !== 6 && <span className={styles.error}>Authenticator 6자리를 입력해 주세요</span>}
          </div>
        </div>
      )}
    </Modal>
  )
}

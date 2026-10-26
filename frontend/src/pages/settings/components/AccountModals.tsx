import { useState } from 'react'
import { changeEmail, isApiError, resetRecords } from '../../../api'
import { Button, Input, Modal, PasswordInput, useToast } from '../../../components'
import styles from './WithdrawFlow.module.css'

const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

/** 비밀번호가 틀린 401(INVALID_PASSWORD)이면 입력칸 오류, 그 밖은 토스트 */
function passwordError(e: unknown) {
  return isApiError(e) && (e.status === 400 || e.status === 401) ? '비밀번호가 맞지 않아요' : undefined
}

/** C-07 이메일 변경: 새 이메일 + 현재 비밀번호 → 새 주소로 인증 메일(인증을 마쳐야 바뀐다) */
export function EmailChangeModal({
  open,
  current,
  onClose,
}: {
  open: boolean
  current?: string
  onClose: () => void
}) {
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  const emailOk = validEmail(email) && email.trim() !== current
  const close = () => {
    setEmail('')
    setPassword('')
    setError(undefined)
    onClose()
  }

  const submit = async () => {
    if (!emailOk || !password) return
    setSubmitting(true)
    setError(undefined)
    try {
      const res = await changeEmail(email.trim(), password)
      toast.show({
        title: '인증 메일을 보냈어요',
        description: `${res.email}에서 인증하면 이메일이 바뀌어요`,
        tone: 'success',
      })
      close()
    } catch (e) {
      const msg = passwordError(e)
      if (msg) setError(msg)
      else toast.show({ title: '이메일을 바꾸지 못했어요', description: e instanceof Error ? e.message : undefined, tone: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      size="md"
      title="이메일 변경"
      description={current ? `지금 이메일 ${current}` : undefined}
      footer={
        <div className={styles.actions}>
          <Button variant="secondary" size="lg" block onClick={close}>
            취소
          </Button>
          <Button size="lg" block disabled={!emailOk || !password} loading={submitting} onClick={submit}>
            인증 메일 보내기
          </Button>
        </div>
      }
    >
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <Input
          label="새 이메일"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={email && !validEmail(email) ? '이메일 형식을 확인해 주세요' : undefined}
          autoComplete="email"
        />
        <PasswordInput
          label="현재 비밀번호"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError(undefined)
          }}
          error={error}
          autoComplete="current-password"
        />
      </form>
    </Modal>
  )
}

/** C-07 학습 기록 초기화: 비밀번호 확인 후 실험 기록을 지운다 */
export function ResetRecordsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  const close = () => {
    setPassword('')
    setError(undefined)
    onClose()
  }

  const submit = async () => {
    if (!password) return
    setSubmitting(true)
    setError(undefined)
    try {
      await resetRecords(password, 'experiments')
      toast.show({ title: '학습 기록을 초기화했어요', tone: 'success' })
      close()
    } catch (e) {
      const msg = passwordError(e)
      if (msg) setError(msg)
      else toast.show({ title: '초기화하지 못했어요', description: e instanceof Error ? e.message : undefined, tone: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      size="md"
      media={
        <span className={styles.alertIcon} aria-hidden>
          !
        </span>
      }
      title="학습 기록을 초기화할까요?"
      description="모든 실험 기록과 캐릭터 레벨이 처음으로 돌아가요. 되돌릴 수 없어요."
      footer={
        <div className={styles.actions}>
          <Button variant="secondary" size="lg" block onClick={close}>
            취소
          </Button>
          <Button variant="danger" size="lg" block disabled={!password} loading={submitting} onClick={submit}>
            초기화
          </Button>
        </div>
      }
    >
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <PasswordInput
          label="확인을 위해 비밀번호를 입력하세요"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError(undefined)
          }}
          error={error}
          autoComplete="current-password"
        />
      </form>
    </Modal>
  )
}

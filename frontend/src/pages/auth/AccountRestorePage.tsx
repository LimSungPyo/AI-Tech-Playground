import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { getRestorePreview, restoreAccount } from '../../api/auth'
import { isApiError } from '../../api/client'
import type { RestorePreview } from '../../api/types'
import { Button, Input, Mascot, useToast } from '../../components'
import { AuthCard } from './components/AuthCard'
import { isEmail } from './lib'
import a from './auth.module.css'

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}
function daysUntil(iso: string) {
  return Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000))
}

// W2 auth 담당 · 경로 /account/restore?email=&deletionAt=<ISO>
// 07:M-06 탈퇴 유예 계정 복구 → POST /api/auth/restore 후 /login
// 이메일을 알면 GET /api/auth/restore/preview로 삭제 예정일 · 되살아날 기록 수를 보여 준다(deletionAt은 미리보기가 없을 때만)
export default function AccountRestorePage() {
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const state = location.state as { email?: string; deletionAt?: string } | null
  const [email, setEmail] = useState(state?.email ?? params.get('email') ?? '')
  const deletionAt = state?.deletionAt ?? params.get('deletionAt')
  const knownEmail = !!(state?.email ?? params.get('email'))
  const [preview, setPreview] = useState<RestorePreview | null>(null)
  const [error, setError] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!knownEmail || !isEmail(email)) return
    const ctrl = new AbortController()
    getRestorePreview(email.trim(), ctrl.signal)
      .then(setPreview)
      .catch(() => {
        // 미리보기가 없으면 일반 문구로 둔다
      })
    return () => ctrl.abort()
  }, [knownEmail, email])

  const restore = async () => {
    if (!isEmail(email)) {
      setError('이메일 형식을 확인해 주세요.')
      return
    }
    setSubmitting(true)
    setError(undefined)
    try {
      await restoreAccount(email.trim())
      toast.show({ title: '계정을 복구했어요', description: '다시 로그인하면 기록이 그대로 있어요.', tone: 'success' })
      navigate(`/login?${new URLSearchParams({ mode: 'form', email: email.trim() })}`, { replace: true })
    } catch (err) {
      setError(isApiError(err) ? err.message : '복구하지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard centered width={560}>
      <div className={a.media}>
        <Mascot expression="sleep" size={130} float />
      </div>
      <h1 className={a.title}>탈퇴를 신청한 계정이에요</h1>
      {preview ? (
        <span className={a.pillDanger}>
          {preview.daysLeft}일 뒤 완전히 삭제돼요 · {formatDate(preview.deletionScheduledAt)}
        </span>
      ) : (
        deletionAt &&
        !Number.isNaN(Date.parse(deletionAt)) && (
          <span className={a.pillDanger}>
            {daysUntil(deletionAt)}일 뒤 완전히 삭제돼요 · {formatDate(deletionAt)}
          </span>
        )
      )}
      <p className={a.lead}>
        {preview
          ? `지금 복구하면 실험 기록 ${preview.counts.experiments}개, 캐릭터 ${preview.counts.characters}명, 도감 카드 ${preview.counts.cards}장, 배지 ${preview.counts.badges}개가 그대로 돌아와요.`
          : '지금 복구하면 실험 기록, 캐릭터, 도감 카드, 배지가 그대로 돌아와요.'}
      </p>
      {!knownEmail && (
        <Input
          label="탈퇴를 신청한 이메일"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError(undefined)
          }}
          error={error}
          style={{ textAlign: 'left' }}
        />
      )}
      {knownEmail && error && (
        <p className={a.noticeDanger} role="alert">
          {error}
        </p>
      )}
      <div className={a.actions}>
        <Button size="lg" block loading={submitting} onClick={() => void restore()}>
          계정 복구하고 시작하기
        </Button>
        <Button
          variant="secondary"
          size="lg"
          block
          disabled={submitting}
          onClick={() => {
            toast.show({ title: '탈퇴가 예정대로 진행돼요', description: '유예 기간 안에는 언제든 다시 복구할 수 있어요.' })
            navigate('/', { replace: true })
          }}
        >
          그대로 탈퇴 진행
        </Button>
      </div>
    </AuthCard>
  )
}

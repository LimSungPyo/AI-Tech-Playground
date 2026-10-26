import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { mergeGuestTrials } from '../../api/auth'
import { GUEST_TRIALS_KEY, getGuestTrials } from '../../auth/storage'
import { useAuth } from '../../auth/useAuth'
import { Button, EmptyState, Icon, Mascot, Skeleton } from '../../components'
import { AuthCard } from './components/AuthCard'
import type { SignupDoneState } from './VerifyEmailPage'
import a from './auth.module.css'
import styles from './SignupDonePage.module.css'

type MergeState = { status: 'idle' | 'pending' | 'done' | 'error'; merged: number }

// W2 auth 담당 · 경로 /signup/done
// E-02 가입 완료 · 체험 기록 이어받기: localStorage `atp.guestTrials`를 POST /api/auth/guest/merge로 보내고 지운다
export default function SignupDonePage() {
  const { status, isMember } = useAuth()
  const location = useLocation()
  const imported = (location.state as SignupDoneState | null)?.importedGuestTrials ?? 0
  const [guestTrials] = useState(() => getGuestTrials())
  const [merge, setMerge] = useState<MergeState>({ status: guestTrials > 0 ? 'pending' : 'idle', merged: 0 })
  const started = useRef(false)

  useEffect(() => {
    if (!isMember || guestTrials <= 0 || started.current) return
    started.current = true
    mergeGuestTrials(guestTrials)
      .then((res) => {
        try {
          window.localStorage.removeItem(GUEST_TRIALS_KEY)
        } catch {
          // 저장소를 못 쓰면 그대로 둔다
        }
        setMerge({ status: 'done', merged: res.merged })
      })
      .catch(() => setMerge({ status: 'error', merged: 0 }))
  }, [isMember, guestTrials])

  if (status === 'loading') {
    return (
      <AuthCard centered>
        <Skeleton shape="circle" width={120} />
        <Skeleton shape="text" lines={3} />
      </AuthCard>
    )
  }

  if (!isMember) {
    return (
      <AuthCard centered>
        <EmptyState
          expression="confused"
          title="로그인이 필요해요"
          description="가입 인증을 마친 뒤 이 화면을 볼 수 있어요."
          action={<Button to="/login?returnTo=%2Fsignup%2Fdone">로그인</Button>}
        />
      </AuthCard>
    )
  }

  const count = merge.status === 'done' ? merge.merged : imported
  const pending = merge.status === 'pending'

  return (
    <AuthCard centered width={560}>
      <div className={a.media}>
        <Mascot expression="champion" size={140} float />
      </div>
      <h1 className={a.title}>가입 완료!</h1>
      <p className={a.lead}>{count > 0 || pending ? '게스트로 해본 기록을 계정으로 옮겼어요.' : '이제 실험 기록과 캐릭터가 계정에 저장돼요.'}</p>

      {pending && <Skeleton height={56} />}
      {!pending && count > 0 && (
        <ul className={styles.items}>
          <li>
            <Icon name="check" size={16} strokeWidth={3} className={styles.check} />
            <span>
              <strong>
                #001 Trial 1–{count} 기록
              </strong>
              <small>리플레이 {count}개 · 성장 리포트에서 다시 볼 수 있어요</small>
            </span>
          </li>
          <li>
            <Icon name="check" size={16} strokeWidth={3} className={styles.check} />
            <span>
              <strong>드로시</strong>
              <small>훈련 중 상태 유지</small>
            </span>
          </li>
        </ul>
      )}
      {merge.status === 'error' && (
        <p className={a.noticeWarm}>체험 기록을 옮기지 못했어요. 기록은 이 기기에 그대로 남아 있고, 다음 로그인 때 다시 옮길게요.</p>
      )}

      <Button to="/onboarding" size="lg" block iconRight={<Icon name="arrow-right" size={18} />}>
        관심사 고르러 가기
      </Button>
      <p className={a.caption}>다음: 관심사 → 파트너 추천 (약 1분)</p>
    </AuthCard>
  )
}

import { useCallback, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { getGuestTrials } from '../../auth/storage'
import { useAuth } from '../../auth/useAuth'
import { Avatar, Button, Character, Mascot, useToast } from '../../components'
import { AuthCard } from './components/AuthCard'
import { LoginForm } from './components/LoginForm'
import { PROVIDER_LABEL, forgetAccount, getRememberedProfile, guestTrialsLeft, maskEmail, safeReturnTo, useSocialLogin } from './lib'
import type { RememberedProfile } from './lib'
import a from './auth.module.css'
import styles from './LoginPage.module.css'

// W2 auth 담당 · 경로 /login
// B-01 로그인 · 0-04 로그인(같은 화면) · 07:M-02 기억된 계정으로 로그인
// ?returnTo=/경로 → 로그인 후 복귀(없으면 /) · ?mode=form → 기억된 계정 화면 건너뛰기 · ?email= → 이메일 미리 채움
export default function LoginPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { isMember } = useAuth()
  const returnTo = safeReturnTo(params.get('returnTo'))
  const presetEmail = params.get('email') ?? ''
  const [profile, setProfile] = useState<RememberedProfile | null>(() =>
    params.get('mode') === 'form' || presetEmail ? null : getRememberedProfile(),
  )
  const [formEmail, setFormEmail] = useState(presetEmail)

  const done = useCallback(() => navigate(returnTo, { replace: true }), [navigate, returnTo])

  if (isMember && !profile) return <Navigate to={returnTo} replace />

  if (profile) {
    return (
      <RememberedLogin
        profile={profile}
        returnTo={returnTo}
        onDone={done}
        onOther={() => {
          setFormEmail(profile.email)
          setProfile(null)
        }}
        onForget={() => {
          forgetAccount()
          setFormEmail('')
          setProfile(null)
        }}
      />
    )
  }

  const trials = getGuestTrials()
  const left = guestTrialsLeft()

  return (
    <div className={styles.split}>
      <section className={styles.story} aria-label="환영 인사">
        <span className={styles.eyebrow}>WELCOME BACK</span>
        <h1 className={styles.storyTitle}>다시 만나서 반가워요!</h1>
        <p className={styles.storyLead}>
          {trials > 0
            ? `Trial ${trials}에서 멈춘 드로시가 기다리고 있어요. 로그인하면 바로 이어서 훈련할 수 있어요.`
            : '드로시와 친구들이 기다리고 있어요. 로그인하면 멈춘 실험을 바로 이어서 훈련할 수 있어요.'}
        </p>
        <div className={styles.cast} aria-hidden>
          <Character id="wormy" size={120} className={styles.castSide} />
          <Mascot expression="default" size={240} float />
          <Character id="parrot" size={110} className={styles.castSide} />
        </div>
        <blockquote className={styles.quote}>
          <span className={styles.quoteMark}>"</span>보는 기술이 아니라, 해보는 기술.
        </blockquote>
      </section>

      <section className={styles.panel} aria-labelledby="login-title">
        <h2 id="login-title" className={a.titleLg}>
          로그인
        </h2>
        <p className={a.lead}>실험 기록과 캐릭터가 계정에 저장돼요.</p>
        <LoginForm key={formEmail} variant="page" defaultEmail={formEmail} returnTo={returnTo} onSuccess={done} autoFocus />
        <hr className={styles.rule} />
        {left > 0 ? (
          <Button variant="secondary" size="lg" block to="/experiments/001/play">
            로그인 없이 체험하기 ({left}회)
          </Button>
        ) : (
          <Button variant="secondary" size="lg" block to="/signup">
            체험 3회를 모두 했어요 · 가입하고 이어가기
          </Button>
        )}
      </section>
    </div>
  )
}

/** 07:M-02 이 기기에 기억된 계정 */
function RememberedLogin({
  profile,
  returnTo,
  onDone,
  onOther,
  onForget,
}: {
  profile: RememberedProfile
  returnTo: string
  onDone: () => void
  onOther: () => void
  onForget: () => void
}) {
  const toast = useToast()
  const social = useSocialLogin({
    remember: true,
    returnTo,
    onSuccess: onDone,
    onError: (message) => toast.show({ title: '로그인하지 못했어요', description: message, tone: 'danger' }),
  })
  const provider = profile.provider

  return (
    <AuthCard centered width={520}>
      <div className={a.media}>
        <Avatar character={profile.avatar} name={profile.nickname} size={88} className={styles.rememberedAvatar} />
      </div>
      <h1 className={a.title}>{profile.nickname}</h1>
      <p className={styles.masked}>{maskEmail(profile.email)}</p>
      <span className={a.pillSuccess}>지난번엔 {PROVIDER_LABEL[provider]}로 로그인했어요</span>
      <div className={a.actions}>
        {provider === 'email' ? (
          <Button size="lg" block onClick={onOther}>
            이메일로 계속하기
          </Button>
        ) : (
          <Button size="lg" block loading={social.pending !== null} onClick={() => void social.start(provider)}>
            {provider === 'kakao' ? 'K' : 'G'}&nbsp; {PROVIDER_LABEL[provider]}로 계속하기
          </Button>
        )}
        <Button variant="secondary" size="lg" block onClick={onOther}>
          다른 방법으로 로그인
        </Button>
      </div>
      <button type="button" className={a.link} onClick={onForget}>
        이 기기에서 계정 지우기
      </button>
      <p className={a.caption}>공용 기기라면 로그인 후 "로그인 상태 유지"를 꺼 주세요.</p>
    </AuthCard>
  )
}

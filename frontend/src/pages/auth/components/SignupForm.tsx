import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { signup } from '../../../api/auth'
import { isApiError } from '../../../api/client'
import { Button, Checkbox, Divider, Icon, Input, PasswordInput, cx } from '../../../components'
import { isEmail, passwordRules, passwordStrength, useSocialLogin } from '../lib'
import { SocialButtons } from './SocialButtons'
import styles from './SignupForm.module.css'

const NICK_MAX = 12

type AgreeKey = 'terms' | 'privacy' | 'age' | 'marketing'
interface AgreeItem {
  key: AgreeKey
  label: string
  required: boolean
  to?: string
}

const PAGE_AGREES: AgreeItem[] = [
  { key: 'terms', label: '이용약관 동의', required: true, to: '/terms' },
  { key: 'privacy', label: '개인정보 수집 · 이용 동의', required: true, to: '/privacy' },
  { key: 'age', label: '만 14세 이상이에요', required: true },
  { key: 'marketing', label: '새 실험(Tech Drop) 소식 받기', required: false, to: '/privacy' },
]
const POPUP_AGREES: AgreeItem[] = [
  { key: 'terms', label: '(필수) 이용약관', required: true, to: '/terms' },
  { key: 'privacy', label: '(필수) 개인정보 수집 · 이용', required: true, to: '/privacy' },
  { key: 'marketing', label: '(선택) 새 실험 · 이벤트 알림', required: false, to: '/privacy' },
]

interface SignupFormProps {
  /** page = A-01 · popup = 08:L-03 */
  variant: 'page' | 'popup'
  /** 다른 화면으로 넘어가기 직전(팝업 닫기) */
  onLeave?: () => void
  /** 팝업에서 로그인으로 돌아가기. 없으면 /login 링크 */
  onLogin?: () => void
}

/** 회원가입 폼. 가입 요청이 끝나면 `/signup/verify`(E-01)로 보낸다 */
export function SignupForm({ variant, onLeave, onLogin }: SignupFormProps) {
  const navigate = useNavigate()
  const page = variant === 'page'
  const agrees = page ? PAGE_AGREES : POPUP_AGREES

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [nickname, setNickname] = useState('')
  const [checked, setChecked] = useState<Record<AgreeKey, boolean>>({ terms: false, privacy: false, age: false, marketing: false })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>()

  const social = useSocialLogin({
    remember: true,
    onSuccess: () => {
      onLeave?.()
      navigate('/signup/done')
    },
    onLeave,
    onError: setServerError,
  })

  const rules = passwordRules(password, page ? email : undefined)
  const strength = passwordStrength(rules)
  const requiredOk = agrees.filter((g) => g.required).every((g) => checked[g.key])
  const allOn = agrees.every((g) => checked[g.key])

  const emailError = submitted && !isEmail(email) ? '이메일 형식을 확인해 주세요.' : undefined
  const passwordError = submitted && !rules.every((r) => r.ok) ? '비밀번호 규칙을 모두 채워 주세요.' : undefined
  const confirmError = page && confirm && confirm !== password ? '비밀번호가 서로 달라요.' : undefined
  const nickError = submitted && !nickname.trim() ? '닉네임을 입력해 주세요.' : undefined

  const setAll = (on: boolean) => setChecked({ terms: on, privacy: on, age: on, marketing: on })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setServerError(undefined)
    if (!isEmail(email) || !rules.every((r) => r.ok) || (page && confirm !== password) || !nickname.trim() || !requiredOk) return
    setSubmitting(true)
    try {
      const res = await signup({
        email: email.trim(),
        password,
        nickname: nickname.trim(),
        agreeTerms: true,
        agreeMarketing: checked.marketing,
      })
      onLeave?.()
      navigate(`/signup/verify?${new URLSearchParams({ vid: res.verificationId, email: res.email })}`)
    } catch (err) {
      setServerError(isApiError(err) ? err.message : '가입하지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className={cx(styles.form, styles[variant])} onSubmit={submit} noValidate>
      {page && (
        <>
          <SocialButtons layout="row" onSelect={(p) => void social.start(p)} pending={social.pending} disabled={submitting} />
          <Divider label="또는 이메일로 가입" />
        </>
      )}

      <Input
        label="이메일"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={emailError}
        success={isEmail(email)}
        hint={
          isEmail(email)
            ? page
              ? '가입하면 이 주소로 6자리 인증 코드를 보내드려요.'
              : '✓ 사용할 수 있는 이메일이에요'
            : undefined
        }
      />

      <div className={styles.group}>
        <PasswordInput
          label="비밀번호"
          autoComplete="new-password"
          placeholder="8자 이상"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={passwordError}
          hint={page ? undefined : '8자 이상 · 영문 + 숫자 + 특수문자'}
        />
        {page && (
          <>
            <ul className={styles.rules} aria-label="비밀번호 규칙">
              {rules.map((r) => (
                <li key={r.label} className={cx(r.ok && styles.ruleOk)}>
                  {r.ok ? <Icon name="check" size={12} strokeWidth={3} /> : <span className={styles.ruleDot} aria-hidden />}
                  {r.label}
                </li>
              ))}
            </ul>
            <div className={styles.strength} aria-label={`비밀번호 강도 ${strength.label}`}>
              {rules.map((r, i) => (
                <span key={r.label} className={cx(styles.bar, password && i < strength.score && styles[`bar${strength.score}`])} />
              ))}
              <span className={cx(styles.strengthLabel, password && styles[`text${strength.score}`])}>강도 · {password ? strength.label : '-'}</span>
            </div>
          </>
        )}
      </div>

      {page && (
        <PasswordInput
          label="비밀번호 확인"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={confirmError ?? (submitted && !confirm ? '비밀번호를 한 번 더 입력해 주세요.' : undefined)}
          success={!!confirm && confirm === password}
          hint={confirm && confirm === password ? '비밀번호가 일치해요.' : undefined}
        />
      )}

      <Input
        label="닉네임"
        placeholder="닉네임"
        maxLength={NICK_MAX}
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        error={nickError}
        right={
          page ? (
            <span className={styles.count}>
              {nickname.length} / {NICK_MAX}
            </span>
          ) : undefined
        }
        hint={page ? 'AI 도감과 랭킹에 보여요. 나중에 바꿀 수 있어요.' : '랭킹과 공유 카드에 보여요'}
      />

      <fieldset className={styles.agrees}>
        <legend className="sr-only">약관 동의</legend>
        <Checkbox
          className={cx(styles.agreeAll, page && styles.agreeAllPage)}
          label={page ? '전체 동의하기' : '전체 동의'}
          checked={allOn}
          onChange={(e) => setAll(e.target.checked)}
        />
        {agrees.map((g) => (
          <div key={g.key} className={styles.agreeRow}>
            <Checkbox
              label={
                page ? (
                  <>
                    <span className={cx(styles.tag, g.required ? styles.tagRequired : styles.tagOptional)}>{g.required ? '필수' : '선택'}</span>
                    {g.label}
                  </>
                ) : (
                  g.label
                )
              }
              checked={checked[g.key]}
              onChange={(e) => setChecked((c) => ({ ...c, [g.key]: e.target.checked }))}
            />
            {g.to && (
              <Link to={g.to} target="_blank" className={styles.view}>
                보기
              </Link>
            )}
          </div>
        ))}
      </fieldset>

      {serverError && (
        <p className={styles.error} role="alert">
          {serverError}
        </p>
      )}

      <Button type="submit" size="lg" block loading={submitting} disabled={!requiredOk || social.pending !== null} iconRight={page ? <Icon name="arrow-right" size={18} /> : undefined}>
        {page ? '가입하고 파트너 만나기' : '가입하고 시작하기'}
      </Button>
      {page ? (
        <p className={styles.caption}>필수 항목을 모두 체크하면 버튼이 활성화돼요.</p>
      ) : (
        <p className={styles.footer}>
          이미 계정이 있어요{' '}
          {onLogin ? (
            <button type="button" className={styles.link} onClick={onLogin}>
              로그인
            </button>
          ) : (
            <Link to="/login" className={styles.link} onClick={onLeave}>
              로그인
            </Link>
          )}
        </p>
      )}
    </form>
  )
}

import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { connectSocial, disconnectSocial, getSettings, isApiError, requestDataExport, saveSettings } from '../../api'
import type { MeSettings, SkillLevel, SocialConnection, SocialProvider } from '../../api'
import { useAuth } from '../../auth/useAuth'
import {
  Avatar,
  Button,
  CHARACTERS,
  EmptyState,
  Icon,
  SegmentedControl,
  Skeleton,
  Toggle,
  useModal,
  useToast,
} from '../../components'
import { useApi } from '../../hooks/useApi'
import { EmailChangeModal, ResetRecordsModal } from './components/AccountModals'
import { SettingRow, SettingsCard } from './components/SettingsCard'
import { WithdrawFlow } from './components/WithdrawFlow'
import type { WithdrawStep } from './components/WithdrawFlow'
import { useLocalPrefs } from './localPrefs'
import styles from './SettingsPage.module.css'

const WHY_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'beginner', label: '쉬운 말' },
  { value: 'intermediate', label: '자세히' },
  { value: 'advanced', label: '숫자만' },
]

const SOCIALS: { provider: SocialProvider; name: string }[] = [
  { provider: 'google', name: 'Google' },
  { provider: 'kakao', name: '카카오' },
  { provider: 'github', name: 'GitHub' },
]

type A11yKey = keyof NonNullable<MeSettings['a11y']>
const A11Y_DEFAULT: NonNullable<MeSettings['a11y']> = {
  reduceMotion: false,
  highContrast: false,
  largeText: false,
  captions: false,
}

/** 개발 확인용: `?socialCode=conflict`면 백엔드 샘플이 409를 돌려준다 */
const sampleSocialCode = () => new URLSearchParams(window.location.search).get('socialCode') ?? 'sample'

/** 비밀번호 마지막 변경 → "7일 전" */
function changedAgo(value?: string) {
  if (!value) return '주기적으로 바꾸면 더 안전해요'
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000)
  return `마지막 변경 · ${days <= 0 ? '오늘' : `${days}일 전`}`
}

function parseStep(raw: string | null): WithdrawStep | null {
  return raw === '1' || raw === '2' || raw === '3' ? (Number(raw) as WithdrawStep) : null
}

// W2 my 담당 · 경로 /settings — C-07 설정 · E-07 로그아웃 확인 · E-08~E-10 회원 탈퇴(?withdraw=1|2|3)
export default function SettingsPage() {
  const { user, logout } = useAuth()
  const modal = useModal()
  const toast = useToast()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { data, error, loading, reload, setData } = useApi((s) => getSettings(s), [])
  // 효과음은 API에 없어 이 기기에만 저장
  const [prefs, setPref] = useLocalPrefs()
  const [emailOpen, setEmailOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [socialBusy, setSocialBusy] = useState<SocialProvider>()
  const [exporting, setExporting] = useState(false)

  const step = parseStep(params.get('withdraw'))
  const setStep = (next: WithdrawStep | null) => {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (next === null) p.delete('withdraw')
        else p.set('withdraw', String(next))
        return p
      },
      { replace: step !== null && next !== null },
    )
  }

  /** 바로 저장(낙관적 갱신). 실패하면 되돌린다. 연결 계정 · 이메일은 읽기 전용이라 화면 값 유지 */
  const save = async (next: MeSettings) => {
    const prev = data
    setData(next)
    try {
      const saved = await saveSettings(next)
      setData((cur) => ({ ...saved, connections: cur?.connections ?? saved.connections, email: cur?.email ?? saved.email }))
    } catch {
      setData(prev)
      toast.show({ title: '저장하지 못했어요', description: '잠시 뒤 다시 시도해 주세요', tone: 'danger' })
    }
  }
  const setNotify = (key: keyof MeSettings['notifications'], value: boolean) => {
    if (data) void save({ ...data, notifications: { ...data.notifications, [key]: value } })
  }

  const setA11y = (key: A11yKey, value: boolean) => {
    if (data) void save({ ...data, a11y: { ...A11Y_DEFAULT, ...data.a11y, [key]: value } })
  }

  const setConnection = (provider: SocialProvider, connected: boolean) =>
    setData((cur) =>
      cur
        ? {
            ...cur,
            connections: SOCIALS.map(({ provider: p }) => {
              const prev = cur.connections?.find((c) => c.provider === p) ?? { provider: p, connected: false }
              return p === provider ? { ...prev, connected, email: connected ? prev.email : undefined } : prev
            }),
          }
        : cur,
    )

  const onSocial = async (social: (typeof SOCIALS)[number], conn?: SocialConnection) => {
    setSocialBusy(social.provider)
    try {
      if (conn?.connected) {
        const ok = await modal.alert({
          title: `${social.name} 연결을 해제할까요?`,
          message: '해제해도 이메일 · 비밀번호로 계속 로그인할 수 있어요.',
          confirmLabel: '연결 해제',
          cancelLabel: '취소',
        })
        if (!ok) return
        await disconnectSocial(social.provider)
        setConnection(social.provider, false)
        toast.show({ title: `${social.name} 연결을 해제했어요` })
      } else {
        await connectSocial(social.provider, sampleSocialCode())
        setConnection(social.provider, true)
        toast.show({ title: `${social.name} 계정을 연결했어요`, tone: 'success' })
      }
    } catch (e) {
      toast.show({
        title: isApiError(e) && e.status === 409 ? '이미 다른 계정에 연결된 소셜 계정이에요' : '연결 상태를 바꾸지 못했어요',
        description: e instanceof Error ? e.message : undefined,
        tone: 'danger',
      })
    } finally {
      setSocialBusy(undefined)
    }
  }

  const onExport = async () => {
    setExporting(true)
    try {
      const res = await requestDataExport()
      toast.show({
        title: '내려받기를 요청했어요',
        description: `${res.readyInMin}분 안에 ${res.email}로 보내 드릴게요`,
        tone: 'success',
      })
    } catch {
      toast.show({ title: '요청하지 못했어요', description: '잠시 뒤 다시 시도해 주세요', tone: 'danger' })
    } finally {
      setExporting(false)
    }
  }

  const onLogout = async () => {
    const ok = await modal.alert({
      title: '로그아웃할까요?',
      message: '이 기기의 "로그인 상태 유지"도 함께 해제돼요. 진행 중인 실험은 이미 저장돼 있어요.',
      confirmLabel: '로그아웃',
      cancelLabel: '취소',
    })
    if (!ok) return
    await logout()
    navigate('/')
  }

  const partner = user?.partner ?? null
  const email = data?.email ?? user?.email
  const a11y = { ...A11Y_DEFAULT, ...data?.a11y }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>설정</h1>
        <p className={styles.autosave}>
          <span className={styles.saved}>✓ 변경사항은 자동 저장돼요</span>
          <Link to="/settings/profile">프로필 편집 →</Link>
          <Link to="/support">도움말 · 문의 →</Link>
        </p>
      </header>

      {loading && !data ? (
        <div className={styles.grid}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={360} />
          ))}
        </div>
      ) : error || !data ? (
        <EmptyState
          expression="confused"
          title="설정을 불러오지 못했어요"
          description="잠시 뒤 다시 시도해 주세요"
          action={<Button onClick={reload}>다시 불러오기</Button>}
        />
      ) : (
        <>
          <div className={styles.grid}>
            <div className={styles.col}>
              <SettingsCard title="계정">
                <SettingRow title="이메일" description={email}>
                  <Button variant="secondary" size="sm" onClick={() => setEmailOpen(true)}>
                    변경
                  </Button>
                </SettingRow>
                <SettingRow title="비밀번호" description={changedAgo(data.passwordChangedAt)}>
                  <Button variant="secondary" size="sm" to="/settings/password">
                    변경
                  </Button>
                </SettingRow>
                {SOCIALS.map((social) => {
                  const conn = data.connections?.find((c) => c.provider === social.provider)
                  return (
                    <SettingRow
                      key={social.provider}
                      title={social.name}
                      description={conn?.connected ? `연결됨${conn.email ? ` · ${conn.email}` : ''}` : '연결 안 됨'}
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={socialBusy === social.provider}
                        onClick={() => void onSocial(social, conn)}
                      >
                        {conn?.connected ? '연결 해제' : '연결'}
                      </Button>
                    </SettingRow>
                  )
                })}
              </SettingsCard>

              <SettingsCard title="학습 환경">
                <SettingRow title="WHY? 설명 수준" description="온보딩에서 고른 값 · 설명 패널의 기본 탭">
                  <SegmentedControl
                    label="WHY? 설명 수준"
                    items={WHY_LEVELS}
                    value={data.whyLevel}
                    onChange={(whyLevel) => void save({ ...data, whyLevel })}
                  />
                </SettingRow>
                <SettingRow title="기본 훈련 속도" description="플레이 화면의 시작 속도">
                  <SegmentedControl
                    label="기본 훈련 속도"
                    items={[
                      { value: '1', label: '1x' },
                      { value: '2', label: '2x' },
                      { value: '4', label: '4x' },
                    ]}
                    value={String(data.trainingSpeed ?? 1)}
                    onChange={(v) => void save({ ...data, trainingSpeed: Number(v) as 1 | 2 | 4 })}
                  />
                </SettingRow>
                <SettingRow title="파트너 캐릭터" description="홈 · 프로필에 함께 나와요">
                  {partner && (
                    <span className={styles.partner}>
                      <Avatar character={partner} name={CHARACTERS[partner].name} size={32} />
                      {CHARACTERS[partner].name}
                    </span>
                  )}
                  <Button variant="secondary" size="sm" to="/onboarding/partner">
                    {partner ? '변경' : '고르기'}
                  </Button>
                </SettingRow>
                <SettingRow title="언어">
                  <SegmentedControl
                    label="언어"
                    items={[
                      { value: 'ko', label: '한국어' },
                      { value: 'en', label: 'English' },
                    ]}
                    value={data.language ?? 'ko'}
                    onChange={(language) => void save({ ...data, language })}
                  />
                </SettingRow>
              </SettingsCard>
            </div>

            <div className={styles.col}>
              <SettingsCard title="알림">
                <SettingRow title="새 실험(Tech Drop) 오픈" description="관심 있는 기술의 실험이 열리면 알려줘요">
                  <Toggle
                    aria-label="새 실험(Tech Drop) 오픈"
                    checked={data.notifications.email}
                    onChange={(e) => setNotify('email', e.target.checked)}
                  />
                </SettingRow>
                <SettingRow title="휴면 복귀 알림" description="7일 쉬면 캐릭터가 한 번만 불러요 (주 1회 이하)">
                  <Toggle
                    aria-label="휴면 복귀 알림"
                    checked={data.notifications.push}
                    onChange={(e) => setNotify('push', e.target.checked)}
                  />
                </SettingRow>
                <SettingRow title="랭킹 변동" description="내 순위가 바뀌면 알려줘요">
                  <Toggle
                    aria-label="랭킹 변동"
                    checked={data.rankingAlert ?? false}
                    onChange={(e) => void save({ ...data, rankingAlert: e.target.checked })}
                  />
                </SettingRow>
                <SettingRow title="마케팅 정보 수신" description="이벤트 · 소식 (선택 동의)">
                  <Toggle
                    aria-label="마케팅 정보 수신"
                    checked={data.notifications.marketing}
                    onChange={(e) => setNotify('marketing', e.target.checked)}
                  />
                </SettingRow>
              </SettingsCard>

              <SettingsCard title="접근성">
                <SettingRow title="동작 줄이기" description="반전 연출 · 캐러셀 자동 넘김을 끄고 페이드만 사용">
                  <Toggle
                    aria-label="동작 줄이기"
                    checked={a11y.reduceMotion}
                    onChange={(e) => setA11y('reduceMotion', e.target.checked)}
                  />
                </SettingRow>
                <SettingRow title="큰 글씨" description="본문 16 → 18px">
                  <Toggle
                    aria-label="큰 글씨"
                    checked={a11y.largeText}
                    onChange={(e) => setA11y('largeText', e.target.checked)}
                  />
                </SettingRow>
                <SettingRow title="고대비 모드" description="유리 효과를 줄이고 대비를 높여요">
                  <Toggle
                    aria-label="고대비 모드"
                    checked={a11y.highContrast}
                    onChange={(e) => setA11y('highContrast', e.target.checked)}
                  />
                </SettingRow>
                <SettingRow title="효과음" description="성공 · 반전 순간의 짧은 소리">
                  <Toggle aria-label="효과음" checked={prefs.sound} onChange={(e) => setPref('sound', e.target.checked)} />
                </SettingRow>
              </SettingsCard>
            </div>
          </div>

          <SettingsCard title="개인정보 · 데이터">
            <SettingRow title="내 학습 데이터 내려받기" description="실험 기록 · 지표 · 도감을 JSON / CSV로">
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<Icon name="download" size={14} />}
                loading={exporting}
                onClick={onExport}
              >
                내려받기
              </Button>
            </SettingRow>
            <SettingRow title="학습 기록 초기화" description="모든 실험 기록과 캐릭터 레벨이 처음으로 돌아가요">
              <Button variant="secondary" size="sm" className={styles.dangerOutline} onClick={() => setResetOpen(true)}>
                초기화
              </Button>
            </SettingRow>
          </SettingsCard>
        </>
      )}

      <section className={styles.danger} aria-label="계정 위험 영역">
        <div>
          <h2 className={styles.dangerTitle}>계정</h2>
          <p className={styles.dangerDesc}>탈퇴하면 30일 동안 복구할 수 있고, 이후 도감과 기록이 완전히 삭제돼요.</p>
        </div>
        <div className={styles.dangerActions}>
          <Button variant="secondary" size="sm" onClick={onLogout}>
            로그아웃
          </Button>
          <Button variant="secondary" size="sm" className={styles.dangerOutline} onClick={() => setStep(1)}>
            회원 탈퇴
          </Button>
        </div>
      </section>

      <WithdrawFlow step={step} onStep={setStep} />
      <EmailChangeModal open={emailOpen} current={email} onClose={() => setEmailOpen(false)} />
      <ResetRecordsModal open={resetOpen} onClose={() => setResetOpen(false)} />
    </div>
  )
}

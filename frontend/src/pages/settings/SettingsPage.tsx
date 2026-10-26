import { Link, useNavigate, useSearchParams } from 'react-router'
import { getSettings, saveSettings } from '../../api'
import type { MeSettings, SkillLevel } from '../../api'
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

const SOCIALS = ['Google', '카카오', 'GitHub']

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
  const [prefs, setPref] = useLocalPrefs()

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

  /** 바로 저장(낙관적 갱신). 실패하면 되돌린다 */
  const save = async (next: MeSettings) => {
    const prev = data
    setData(next)
    try {
      setData(await saveSettings(next))
    } catch {
      setData(prev)
      toast.show({ title: '저장하지 못했어요', description: '잠시 뒤 다시 시도해 주세요', tone: 'danger' })
    }
  }
  const setNotify = (key: keyof MeSettings['notifications'], value: boolean) => {
    if (data) void save({ ...data, notifications: { ...data.notifications, [key]: value } })
  }

  const notReady = (title: string) => toast.show({ title, description: '아직 준비 중인 기능이에요' })

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

  const onReset = async () => {
    const ok = await modal.alert({
      title: '학습 기록을 초기화할까요?',
      message: '모든 실험 기록과 캐릭터 레벨이 처음으로 돌아가요. 되돌릴 수 없어요.',
      confirmLabel: '초기화',
      cancelLabel: '취소',
      tone: 'danger',
    })
    if (ok) notReady('학습 기록 초기화')
  }

  const partner = user?.partner ?? null

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
                <SettingRow title="이메일" description={user?.email}>
                  <Button variant="secondary" size="sm" onClick={() => notReady('이메일 변경')}>
                    변경
                  </Button>
                </SettingRow>
                <SettingRow title="비밀번호" description="주기적으로 바꾸면 더 안전해요">
                  <Button variant="secondary" size="sm" to="/settings/password">
                    변경
                  </Button>
                </SettingRow>
                {SOCIALS.map((name) => (
                  <SettingRow key={name} title={name} description="연결 안 됨">
                    <Button variant="secondary" size="sm" onClick={() => notReady(`${name} 연결`)}>
                      연결
                    </Button>
                  </SettingRow>
                ))}
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
                    value={prefs.speed}
                    onChange={(v) => setPref('speed', v)}
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
                    value={prefs.language}
                    onChange={(v) => setPref('language', v)}
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
                    checked={prefs.rankingAlert}
                    onChange={(e) => setPref('rankingAlert', e.target.checked)}
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
                    checked={prefs.reduceMotion}
                    onChange={(e) => setPref('reduceMotion', e.target.checked)}
                  />
                </SettingRow>
                <SettingRow title="큰 글씨" description="본문 16 → 18px">
                  <Toggle
                    aria-label="큰 글씨"
                    checked={prefs.largeText}
                    onChange={(e) => setPref('largeText', e.target.checked)}
                  />
                </SettingRow>
                <SettingRow title="고대비 모드" description="유리 효과를 줄이고 대비를 높여요">
                  <Toggle
                    aria-label="고대비 모드"
                    checked={prefs.highContrast}
                    onChange={(e) => setPref('highContrast', e.target.checked)}
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
                onClick={() => notReady('학습 데이터 내려받기')}
              >
                내려받기
              </Button>
            </SettingRow>
            <SettingRow title="학습 기록 초기화" description="모든 실험 기록과 캐릭터 레벨이 처음으로 돌아가요">
              <Button variant="secondary" size="sm" className={styles.dangerOutline} onClick={onReset}>
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
    </div>
  )
}

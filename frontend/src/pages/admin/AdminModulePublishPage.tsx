import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { getAdminModules, publishModule } from '../../api'
import { isApiError } from '../../api/client'
import type { ModuleStage } from '../../api/types'
import { Button, CHARACTERS, Character, Checkbox, EmptyState, Select, Toggle, cx, useModal, useToast } from '../../components'
import { useApi } from '../../hooks/useApi'
import { LoadError, PageHead, Panel, PanelSkeleton, Pill } from './components/AdminUi'
import a from './components/admin.module.css'
import { characterOf } from './components/format'
import styles from './AdminModulePublishPage.module.css'

const TABS = ['기본 정보', '미션', '캐릭터', '기술 카드', '공개 설정', '지표']

const STAGE_LABEL: Record<ModuleStage, string> = {
  idea: '아이디어',
  voting: '투표 중',
  design: '설계 중',
  build: '개발 중',
  qa: 'QA',
  scheduled: '오픈 예정',
  live: '공개',
}

/** 공개 전 체크리스트(F-06). 담당자가 직접 확인해 체크한다 */
const CHECKS = [
  'QA 테스트 통과',
  '미션 2개 · 보상 규칙',
  '기술 카드 연결',
  'WHY? 설명 3단계',
  '접근성 · 동작 줄이기',
  '모바일 레이아웃',
  '정직 고지 문구',
  '캐릭터 표정 9종',
  '오픈 알림 문구 검수',
]

const AUDIENCES = [
  { value: 'all', label: '전체 사용자' },
  { value: 'members', label: '회원만' },
  { value: 'beta', label: '베타 테스터' },
]

const pad = (n: number) => String(n).padStart(2, '0')
/** datetime-local 기본값: 7일 뒤 10:00 */
function defaultOpenAt() {
  const d = new Date(Date.now() + 7 * 86_400_000)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T10:00`
}
const WEEK = ['일', '월', '화', '수', '목', '금', '토']
function openLabel(local: string) {
  const d = new Date(local)
  if (Number.isNaN(d.getTime())) return ''
  return `${pad(d.getMonth() + 1)}.${pad(d.getDate())} (${WEEK[d.getDay()]}) ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function dDay(local: string) {
  const t = new Date(local).getTime()
  if (Number.isNaN(t)) return ''
  const days = Math.ceil((t - Date.now()) / 86_400_000)
  return days > 0 ? `D-${days}` : days === 0 ? 'D-DAY' : `D+${-days}`
}

// W2 admin 담당 · 경로 /admin/modules/:id/publish — F-06 모듈 공개 설정
export default function AdminModulePublishPage() {
  const { id = '' } = useParams()
  const toast = useToast()
  const modal = useModal()
  const { data, error, reload } = useApi((signal) => getAdminModules(signal), [])
  const mod = data?.modules.find((m) => m.id === id)

  const [openAt, setOpenAt] = useState(defaultOpenAt)
  const [audience, setAudience] = useState('all')
  const [carousel, setCarousel] = useState(true)
  const [notify, setNotify] = useState(true)
  // QA 이상 단계면 앞의 7개는 이미 확인된 상태로 시작한다
  const [checked, setChecked] = useState<boolean[] | null>(null)
  const [prevMod, setPrevMod] = useState(mod)
  if (mod !== prevMod) {
    setPrevMod(mod)
    setChecked(CHECKS.map((_, i) => (mod?.stage === 'qa' || mod?.stage === 'live') && i < 7))
  }
  const [busy, setBusy] = useState<null | 'save' | 'now' | 'schedule'>(null)

  const done = (checked ?? []).filter(Boolean).length
  const allDone = done === CHECKS.length

  const submit = async (kind: 'save' | 'now' | 'schedule') => {
    if (!mod) return
    if (kind === 'now') {
      const ok = await modal.alert({
        title: `${mod.code} ${mod.title}을(를) 지금 공개할까요?`,
        message: notify ? '공개 즉시 알림 신청자에게 앱 알림과 이메일이 가요.' : '오픈 알림은 보내지 않아요.',
        confirmLabel: '지금 공개',
        cancelLabel: '취소',
      })
      if (!ok) return
    }
    setBusy(kind)
    try {
      await publishModule(mod.id, {
        visibility: kind === 'now' ? 'public' : 'scheduled',
        openAt: kind === 'now' ? new Date().toISOString() : new Date(openAt).toISOString(),
        audience,
      })
      toast.show({
        title: kind === 'now' ? '지금 공개했어요' : kind === 'save' ? '예약 설정을 저장했어요' : `${openLabel(openAt)} 공개를 예약했어요`,
        description: carousel ? '홈 캐러셀 · D-10 상세에 자동 반영돼요' : undefined,
        tone: 'success',
      })
    } catch (e) {
      toast.show({ title: '저장하지 못했어요', description: isApiError(e) ? e.message : undefined, tone: 'danger' })
    } finally {
      setBusy(null)
    }
  }

  if (error) return <LoadError error={error} onRetry={reload} />
  if (data && !mod) {
    return (
      <EmptyState
        expression="confused"
        title="모듈을 찾을 수 없어요"
        description={`#${id} 모듈이 파이프라인에 없어요.`}
        action={<Button to="/admin/modules">파이프라인으로</Button>}
      />
    )
  }

  const character = mod ? characterOf(mod.code) : undefined

  return (
    <>
      <PageHead title={mod ? `${mod.code} ${mod.title} · 공개 설정` : '공개 설정'} />
      <div className={styles.tabs} role="tablist" aria-label="모듈 설정">
        {TABS.map((t) => (
          <span key={t} role="tab" aria-selected={t === '공개 설정'} aria-disabled={t !== '공개 설정'} className={cx(a.filter, t === '공개 설정' && a.filterOn, t !== '공개 설정' && styles.tabOff)}>
            {t}
          </span>
        ))}
        <Link to="/admin/modules" className={cx(a.panelLink, styles.back)}>
          ← 파이프라인
        </Link>
      </div>

      {!mod || !checked ? (
        <div className={a.grid2}>
          <PanelSkeleton height={380} />
          <PanelSkeleton height={300} />
        </div>
      ) : (
        <div className={a.grid2}>
          <Panel>
            <dl className={styles.form}>
              <dt>상태</dt>
              <dd className={styles.inline}>
                <Pill tone="warning">{STAGE_LABEL[mod.stage]}</Pill>
                <span aria-hidden>→</span>
                <Pill tone="indigo">{mod.stage === 'live' ? '공개 중' : '오픈 예정'}</Pill>
              </dd>

              <dt>
                <label htmlFor="open-at">오픈 일시</label>
              </dt>
              <dd className={styles.inline}>
                <input id="open-at" type="datetime-local" className={styles.date} value={openAt} onChange={(e) => setOpenAt(e.target.value)} />
                <span className={a.muted}>{dDay(openAt)} · KST</span>
              </dd>

              <dt>캐릭터</dt>
              <dd className={styles.inline}>
                {character ? <Pill tone="indigo">{CHARACTERS[character].name}</Pill> : '—'}
                <span className={a.muted}>담당 {mod.owner}</span>
              </dd>

              <dt>
                <label htmlFor="audience">공개 대상</label>
              </dt>
              <dd>
                <Select id="audience" className={styles.select} value={audience} onChange={(e) => setAudience(e.target.value)} options={AUDIENCES} />
              </dd>

              <dt>홈 캐러셀 노출</dt>
              <dd>
                <Toggle className={a.switchFirst} label="COMING SOON 슬라이드로 노출" checked={carousel} onChange={(e) => setCarousel(e.target.checked)} />
              </dd>

              <dt>오픈 알림</dt>
              <dd>
                <Toggle className={a.switchFirst} label="오픈 즉시 앱 알림 + 이메일" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
              </dd>
            </dl>

            <div className={styles.footer}>
              <Button variant="secondary" pill={false} loading={busy === 'save'} disabled={busy !== null} onClick={() => void submit('save')}>
                예약 저장
              </Button>
              <span className={styles.spacer} />
              <Button variant="secondary" pill={false} loading={busy === 'now'} disabled={!allDone || busy !== null} onClick={() => void submit('now')}>
                지금 공개 (체크리스트 {done}/{CHECKS.length})
              </Button>
              <Button pill={false} loading={busy === 'schedule'} disabled={busy !== null} onClick={() => void submit('schedule')}>
                {openLabel(openAt)} 공개 예약
              </Button>
            </div>
          </Panel>

          <div className={a.stack}>
            <Panel title="공개 전 체크리스트" right={<span className={a.panelLink}>{done} / {CHECKS.length}</span>}>
              <ul className={styles.checks}>
                {CHECKS.map((c, i) => (
                  <li key={c} className={cx(!checked[i] && styles.unchecked)}>
                    <Checkbox label={c} checked={checked[i]} onChange={(e) => setChecked(checked.map((v, j) => (j === i ? e.target.checked : v)))} />
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="사용자에게 이렇게 보여요">
              <div className={styles.preview}>
                {character && <Character id={character} size={64} />}
                <div>
                  <p className={styles.previewTag}>{mod.code} · COMING SOON</p>
                  <strong className={styles.previewTitle}>{mod.title}</strong>
                  <p className={a.muted}>{dDay(openAt)} · 오픈 알림 받기</p>
                </div>
              </div>
              <p className={styles.previewNote}>홈 캐러셀 슬라이드 · D-10 오픈 예정 상세 · 내 실험 "알림 신청" 탭에 자동 반영</p>
            </Panel>
          </div>
        </div>
      )}
    </>
  )
}

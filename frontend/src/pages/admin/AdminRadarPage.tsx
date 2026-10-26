import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router'
import { decideRadar, getAdminRadar } from '../../api'
import { isApiError } from '../../api/client'
import type { AdminRadar, RadarCandidateStatus, RadarDecision } from '../../api/types'
import { Button, CHARACTERS, Icon, Textarea, cx, useModal, useToast } from '../../components'
import { useApi } from '../../hooks/useApi'
import { CheckList, FilterPills, LoadError, PageHead, Panel, PanelSkeleton, Pill } from './components/AdminUi'
import type { PillTone } from './components/AdminUi'
import a from './components/admin.module.css'
import { characterOf } from './components/format'
import styles from './AdminRadarPage.module.css'

type Candidate = AdminRadar['candidates'][number]
type Filter = 'all' | RadarCandidateStatus

const STATUS: Record<RadarCandidateStatus, { label: string; tone: PillTone }> = {
  pending: { label: '대기', tone: 'neutral' },
  approved: { label: '승인', tone: 'success' },
  rejected: { label: '제외', tone: 'danger' },
  merged: { label: '병합', tone: 'neutral' },
}

/** 과장 표현 자동 경고(F-00 운영 원칙) */
const HYPE = ['곧 온다', '복제', '완벽', '인간 수준', '혁명']

/** "논문 18 · 코드 31 · 커뮤 44" → [{ kind: '논문', count: 18 }, …] */
function parseSources(source: string) {
  return source
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const m = s.match(/^(\S+)\s+(\d+)$/)
      return m ? { kind: m[1], count: Number(m[2]) } : { kind: s, count: 0 }
    })
}

/** "#003" → "#003 옥토" */
function moduleLabel(code: string) {
  const id = characterOf(code)
  return id ? `${code} ${CHARACTERS[id].name}` : code
}

/** 경고 문구: v2 warning, 없으면 과장 표현 · 출처 단일을 직접 판정 */
function warningOf(c: Candidate) {
  if (c.warning) return c.warning
  const hype = HYPE.some((h) => c.keyword.includes(h))
  const single = parseSources(c.source).length < 2
  return [hype && '과장', single && '출처 단일'].filter(Boolean).join(' · ')
}

/** 상태 배지. 대기 중 병합 제안이 있으면 "병합 제안", 경고로 제외됐으면 "제외 권장" */
function statusOf(c: Candidate): { label: string; tone: PillTone } {
  if (c.status === 'pending' && c.mergeInto) return { label: '병합 제안', tone: 'indigo' }
  if (c.status === 'rejected' && c.warning) return { label: '제외 권장', tone: 'danger' }
  return STATUS[c.status]
}

function qualityChecks(c: Candidate, all: Candidate[]) {
  const words = c.keyword.toLowerCase().split(/\s+/)
  // 병합 제안으로 이미 묶인 후보(mergeInto)는 중복으로 보지 않는다
  const duplicate = all.some(
    (o) =>
      o.id !== c.id &&
      o.status !== 'rejected' &&
      o.status !== 'merged' &&
      o.mergeInto !== c.id &&
      c.mergeInto !== o.id &&
      o.keyword.toLowerCase().split(/\s+/).some((w) => w.length > 3 && words.includes(w)),
  )
  return [
    { label: '출처 3종 이상', ok: parseSources(c.source).length >= 3 },
    { label: '중복 키워드 없음', ok: !duplicate },
    { label: '과장 표현 0건', ok: !HYPE.some((h) => c.keyword.includes(h)) },
    { label: '연결 모듈 지정', ok: Boolean(c.linkedModule) },
  ]
}

const PIPELINE = [
  { name: '수집', sub: '매주 월 09:00' },
  { name: '정제', sub: '중복 제거' },
  { name: '키워드 추출', sub: '후보 추출' },
]

// W2 admin 담당 · 경로 /admin/radar — F-03 기술 레이더 검수
export default function AdminRadarPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const modal = useModal()
  const { data, error, reload, setData } = useApi((signal) => getAdminRadar(signal), [])
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [summaries, setSummaries] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const candidates = data?.candidates ?? []
  const count = (s: RadarCandidateStatus) => candidates.filter((c) => c.status === s).length
  const rows = filter === 'all' ? candidates : candidates.filter((c) => c.status === filter)
  const selected = candidates.find((c) => c.id === selectedId) ?? rows[0] ?? null

  const decide = async (c: Candidate, decision: RadarDecision, message?: string, mergeInto?: string) => {
    setBusy(true)
    try {
      await decideRadar(c.id, decision, mergeInto)
      setData((prev) =>
        prev
          ? { candidates: prev.candidates.map((x) => (x.id === c.id ? { ...x, status: decision, mergeInto: mergeInto ?? x.mergeInto } : x)) }
          : prev,
      )
      toast.show({
        title: message ?? (decision === 'approved' ? `"${c.keyword}" 승인했어요` : `"${c.keyword}" 제외했어요`),
        description: '감사 로그에 기록됐어요',
        tone: decision === 'approved' ? 'success' : 'default',
      })
      return true
    } catch (e) {
      toast.show({ title: '처리하지 못했어요', description: isApiError(e) ? e.message : undefined, tone: 'danger' })
      return false
    } finally {
      setBusy(false)
    }
  }

  const merge = async (c: Candidate) => {
    const targets = candidates
      .filter((x) => x.id !== c.id && x.status !== 'rejected' && x.status !== 'merged')
      .sort((x, y) => Number(y.id === c.mergeInto) - Number(x.id === c.mergeInto))
    const to = await modal.actionSheet({
      title: `"${c.keyword}"를 어느 키워드에 합칠까요?`,
      message: '병합하면 이 후보는 목록에서 빠지고 출처가 대상 키워드로 옮겨져요.',
      options: targets.map((x) => ({ value: x.id, label: x.id === c.mergeInto ? `${x.keyword} (제안)` : x.keyword })),
      cancelLabel: '취소',
    })
    const target = targets.find((x) => x.id === to)
    if (target) await decide(c, 'merged', `${c.keyword} → ${target.keyword} 병합했어요`, target.id)
  }

  const publish = async () => {
    const ok = await modal.alert({
      title: '승인한 키워드를 공개 예약할까요?',
      message: `승인 ${count('approved')}개가 오늘 18:00 사용자 화면 "이번 주 기술 레이더"에 공개돼요.`,
      confirmLabel: '공개 예약',
      cancelLabel: '취소',
    })
    if (ok) toast.show({ title: '18:00 공개를 예약했어요', tone: 'success' })
  }

  const approveAndDraft = async (c: Candidate) => {
    if (c.status === 'approved' || (await decide(c, 'approved'))) navigate('/admin/cards')
  }

  return (
    <>
      <PageHead title="기술 레이더 검수" />

      <ol className={styles.pipeline} aria-label="이번 주 레이더 진행 단계">
        {PIPELINE.map((p) => (
          <Fragment key={p.name}>
            <li className={cx(styles.step, styles.done)}>
              <Icon name="check" size={14} />
              <span>
                <strong>{p.name}</strong>
                <small>{p.sub}</small>
              </span>
            </li>
            <li aria-hidden className={styles.arrow}>
              →
            </li>
          </Fragment>
        ))}
        <li className={cx(styles.step, styles.current)} aria-current="step">
          <span className={styles.bullet} />
          <span>
            <strong>사람 검수</strong>
            <small>진행 중 · {count('pending')}개 남음</small>
          </span>
        </li>
        <li aria-hidden className={styles.arrow}>
          →
        </li>
        <li className={styles.step}>
          <span className={styles.ringBullet} />
          <span>
            <strong>공개 예약</strong>
            <small>18:00 · 사용자 레이더</small>
          </span>
        </li>
      </ol>

      {error ? (
        <LoadError error={error} onRetry={reload} />
      ) : !data ? (
        <div className={cx(a.grid2, a.grid2Wide)}>
          <PanelSkeleton height={320} />
          <PanelSkeleton height={320} />
        </div>
      ) : (
        <div className={cx(a.grid2, a.grid2Wide)}>
          <Panel>
            <div className={styles.tableHead}>
              <FilterPills<Filter>
                label="검수 상태"
                value={filter}
                onChange={setFilter}
                items={[
                  { value: 'all', label: '전체', count: candidates.length },
                  { value: 'pending', label: '대기', count: count('pending') },
                  { value: 'approved', label: '승인', count: count('approved') },
                  { value: 'rejected', label: '제외', count: count('rejected') },
                  ...(count('merged') ? [{ value: 'merged' as const, label: '병합', count: count('merged') }] : []),
                ]}
              />
              <span className={a.muted}>점수 = 증가율 × 출처 다양성 × 최신성</span>
            </div>
            <div className={a.tableWrap}>
              <table className={cx(a.table, a.tableCompact)}>
                <thead>
                  <tr>
                    <th>키워드</th>
                    <th>점수</th>
                    <th>상승</th>
                    <th>출처</th>
                    <th>병합 · 경고</th>
                    <th>연결 모듈</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => {
                    const warning = warningOf(c)
                    const mergeTarget = candidates.find((x) => x.id === c.mergeInto)
                    const st = statusOf(c)
                    return (
                      <tr
                        key={c.id}
                        className={cx(a.rowButton, selected?.id === c.id && a.rowOn)}
                        onClick={() => setSelectedId(c.id)}
                        aria-selected={selected?.id === c.id}
                      >
                        <td className={a.strong}>
                          <button type="button" className={styles.rowLink} onClick={() => setSelectedId(c.id)}>
                            {c.keyword}
                          </button>
                        </td>
                        <td className={a.num}>{c.score.toFixed(2)}</td>
                        <td className={a.num}>{c.growth !== undefined ? `▲${c.growth}%` : '—'}</td>
                        <td className={a.wrap}>{c.source}</td>
                        <td>
                          {mergeTarget ? (
                            <Pill tone="indigo">→ {mergeTarget.keyword} 병합</Pill>
                          ) : warning ? (
                            <Pill tone="danger">{warning}</Pill>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>{c.linkedModule ? moduleLabel(c.linkedModule) : '—'}</td>
                        <td>
                          <Pill tone={st.tone}>{st.label}</Pill>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className={styles.actions}>
              <span className={styles.selCount}>선택 {selected ? 1 : 0}개</span>
              <Button size="sm" pill={false} disabled={!selected || busy} onClick={() => selected && void decide(selected, 'approved')}>
                승인
              </Button>
              <Button size="sm" variant="secondary" pill={false} disabled={!selected || busy} onClick={() => selected && void merge(selected)}>
                병합
              </Button>
              <Button size="sm" variant="secondary" pill={false} className={styles.reject} disabled={!selected || busy} onClick={() => selected && void decide(selected, 'rejected')}>
                제외
              </Button>
              <Button size="sm" variant="dark" pill={false} className={styles.publish} onClick={() => void publish()}>
                {count('approved')}개 승인됨 · 18:00 공개 예약
              </Button>
            </div>
          </Panel>

          {selected && (
            <Panel className={styles.detail}>
              <h2 className={styles.keyword}>{selected.keyword}</h2>
              <div className={styles.badges}>
                <Pill tone="dark">점수 {selected.score.toFixed(2)}</Pill>
                {selected.growth !== undefined && <Pill tone="success">▲{selected.growth}%</Pill>}
                {selected.linkedModule && <Pill tone="indigo">{moduleLabel(selected.linkedModule)}</Pill>}
                <Pill tone={statusOf(selected).tone}>{statusOf(selected).label}</Pill>
              </div>

              <h3 className={styles.sub}>출처 분포</h3>
              <ul className={styles.docs}>
                {parseSources(selected.source).map((s) => (
                  <li key={s.kind}>
                    <span className={styles.docKind}>{s.kind}</span>
                    {s.count}건 수집
                  </li>
                ))}
              </ul>

              <Textarea
                label="AI 요약 초안 (편집 가능)"
                placeholder="사용자에게 보일 한두 문장 설명을 적어 주세요"
                rows={3}
                value={summaries[selected.id] ?? ''}
                onChange={(e) => setSummaries((s) => ({ ...s, [selected.id]: e.target.value }))}
              />

              <h3 className={styles.sub}>품질 체크</h3>
              <CheckList items={qualityChecks(selected, candidates)} />

              <Button block pill={false} disabled={busy || selected.status === 'rejected' || selected.status === 'merged'} onClick={() => void approveAndDraft(selected)}>
                승인하고 기술 카드 초안 만들기 →
              </Button>
            </Panel>
          )}
        </div>
      )}
    </>
  )
}

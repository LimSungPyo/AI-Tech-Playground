import { useState } from 'react'
import type { DragEvent, KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { changeModuleStage, getAdminModules } from '../../api'
import { isApiError } from '../../api/client'
import type { AdminModules, ModuleStage } from '../../api/types'
import { useAuth } from '../../auth/useAuth'
import { Button, Character, Icon, Skeleton, cx, useToast } from '../../components'
import { useApi } from '../../hooks/useApi'
import { FilterPills, LoadError, PageHead, Pill } from './components/AdminUi'
import type { PillTone } from './components/AdminUi'
import { characterOf } from './components/format'
import styles from './AdminModulesPage.module.css'

type Module = AdminModules['modules'][number]
type Filter = 'all' | 'mine' | 'quarter'

/** Figma F-05 6열. 설계(design)는 "개발 중" 열에 함께 둔다. 열로 옮기면 drop 단계로 바뀐다 */
const COLUMNS: { stages: ModuleStage[]; drop: ModuleStage; label: string }[] = [
  { stages: ['idea'], drop: 'idea', label: '아이디어' },
  { stages: ['voting'], drop: 'voting', label: '투표 중' },
  { stages: ['design', 'build'], drop: 'build', label: '개발 중' },
  { stages: ['qa'], drop: 'qa', label: 'QA' },
  { stages: ['scheduled'], drop: 'scheduled', label: '오픈 예정' },
  { stages: ['live'], drop: 'live', label: '공개' },
]
const columnOf = (stage: ModuleStage) => COLUMNS.findIndex((c) => c.stages.includes(stage))

/** 이번 분기 시작 시각 */
function quarterStart(now = new Date()) {
  return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).getTime()
}

/** note "체크리스트 7/9 · 10.31 10:00 · 알림 신청 412명" → 조각 */
const noteParts = (note?: string) => (note ?? '').split(' · ').filter(Boolean)
const checklistRatio = (note?: string) => {
  const m = note?.match(/체크리스트\s+(\d+)\/(\d+)/)
  return m ? (Number(m[1]) / Number(m[2])) * 100 : undefined
}

/** 단계별 카드 내용: 오른쪽 배지 · 제목 · 보조 줄 · 진행 막대 */
function cardView(m: Module): { badge: string; tone: PillTone; title: string; sub: string; progress?: number } {
  const dDay = m.dDay !== undefined ? `D-${m.dDay}` : '-'
  const parts = noteParts(m.note)
  switch (m.stage) {
    case 'idea':
      return { badge: '-', tone: 'neutral', title: m.title, sub: m.note ?? `담당 ${m.owner}` }
    case 'voting':
      return { badge: dDay, tone: 'indigo', title: m.title, sub: m.votePct !== undefined ? `투표 ${m.votePct}%` : `담당 ${m.owner}` }
    case 'design':
    case 'build':
      return {
        badge: m.progress !== undefined ? `${m.progress}%` : m.stage === 'design' ? '설계' : '-',
        tone: 'neutral',
        title: m.note ?? m.title,
        sub: `담당 ${m.owner}`,
        progress: m.progress ?? 0,
      }
    case 'qa':
      return { badge: dDay, tone: 'indigo', title: m.title, sub: parts[0] ?? `담당 ${m.owner}`, progress: checklistRatio(m.note) }
    case 'scheduled':
      return {
        badge: dDay,
        tone: 'indigo',
        title: parts.find((p) => /\d+\.\d+\s+\d+:\d+/.test(p)) ?? m.title,
        sub: parts.find((p) => p.startsWith('알림')) ?? `담당 ${m.owner}`,
      }
    case 'live':
      return { badge: 'LIVE', tone: 'success', title: m.title, sub: m.note ?? `담당 ${m.owner}` }
  }
}

function ModuleCard({
  m,
  onDragStart,
  onMove,
}: {
  m: Module
  onDragStart: (e: DragEvent, m: Module) => void
  onMove: (m: Module, dir: -1 | 1) => void
}) {
  const character = characterOf(m.code)
  const v = cardView(m)
  const onKeyDown = (e: KeyboardEvent) => {
    if (!e.altKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return
    e.preventDefault()
    onMove(m, e.key === 'ArrowLeft' ? -1 : 1)
  }
  return (
    <li>
      <Link
        to={`/admin/modules/${encodeURIComponent(m.id)}/publish`}
        className={styles.card}
        draggable
        onDragStart={(e) => onDragStart(e, m)}
        onKeyDown={onKeyDown}
        aria-label={`${m.code} ${m.title} · 공개 설정 열기`}
        aria-description="Alt + 왼쪽 · 오른쪽 화살표로 단계를 옮겨요"
      >
        <div className={styles.cardTop}>
          {character ? <Character id={character} size={28} /> : <span className={styles.noChar} />}
          <span className={styles.code}>{m.code}</span>
          <Pill tone={v.tone} className={styles.badge}>
            {v.badge}
          </Pill>
        </div>
        <strong className={styles.cardTitle}>{v.title}</strong>
        <span className={styles.meta}>{v.sub}</span>
        {v.progress !== undefined && (
          <span className={styles.bar} aria-hidden>
            <span style={{ width: `${Math.min(100, Math.max(0, v.progress))}%` }} />
          </span>
        )}
      </Link>
    </li>
  )
}

// W2 admin 담당 · 경로 /admin/modules — F-05 실험 모듈 파이프라인
export default function AdminModulesPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const { data, error, reload, setData } = useApi((signal) => getAdminModules(signal), [])
  const [filter, setFilter] = useState<Filter>('all')
  const [over, setOver] = useState<number | null>(null)

  const qs = quarterStart()
  const modules = (data?.modules ?? []).filter((m) =>
    filter === 'mine' ? m.owner === user?.nickname : filter === 'quarter' ? Date.parse(m.updatedAt) >= qs : true,
  )

  const move = async (m: Module, col: number) => {
    const target = COLUMNS[col]
    if (!target || target.stages.includes(m.stage)) return
    const prev = m.stage
    const patch = (stage: ModuleStage) =>
      setData((d) => (d ? { modules: d.modules.map((x) => (x.id === m.id ? { ...x, stage } : x)) } : d))
    patch(target.drop)
    try {
      await changeModuleStage(m.id, target.drop)
      toast.show({ title: `${m.code} ${m.title} → ${target.label}`, description: '사용자 화면에 반영되고 감사 로그에 남았어요', tone: 'success' })
    } catch (e) {
      patch(prev)
      toast.show({ title: '단계를 옮기지 못했어요', description: isApiError(e) ? e.message : undefined, tone: 'danger' })
    }
  }

  const onDragStart = (e: DragEvent, m: Module) => {
    e.dataTransfer.setData('text/plain', m.id)
    e.dataTransfer.effectAllowed = 'move'
  }
  const onDrop = (e: DragEvent, col: number) => {
    e.preventDefault()
    setOver(null)
    const m = data?.modules.find((x) => x.id === e.dataTransfer.getData('text/plain'))
    if (m) void move(m, col)
  }

  return (
    <>
      <PageHead title="실험 모듈 파이프라인" />
      <div className={styles.toolbar}>
        <FilterPills<Filter>
          label="모듈 필터"
          value={filter}
          onChange={setFilter}
          items={[
            { value: 'all', label: '전체' },
            { value: 'mine', label: '내 담당' },
            { value: 'quarter', label: '이번 분기' },
          ]}
        />
        <Button pill={false} iconLeft={<Icon name="plus" size={16} />} onClick={() => navigate('/admin/radar')}>
          새 모듈
        </Button>
      </div>

      {error ? (
        <LoadError error={error} onRetry={reload} />
      ) : (
        <div className={styles.board}>
          {COLUMNS.map((col, ci) => {
            const items = modules.filter((m) => col.stages.includes(m.stage))
            return (
              <section
                key={col.drop}
                className={cx(styles.column, over === ci && styles.columnOver)}
                data-stage={col.drop}
                aria-label={col.label}
                onDragOver={(e) => {
                  e.preventDefault()
                  if (over !== ci) setOver(ci)
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(null)
                }}
                onDrop={(e) => onDrop(e, ci)}
              >
                <h2 className={styles.colHead}>
                  {col.label}
                  <span className={styles.count}>{data ? items.length : '–'}</span>
                </h2>
                {!data ? (
                  <Skeleton height={96} />
                ) : items.length === 0 ? (
                  <p className={styles.empty}>없음</p>
                ) : (
                  <ul className={styles.cards}>
                    {items.map((m) => (
                      <ModuleCard key={m.id} m={m} onDragStart={onDragStart} onMove={(x, dir) => void move(x, columnOf(x.stage) + dir)} />
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}

      <p className={styles.note}>
        카드를 다음 열로 옮기면 상태가 바뀌고 사용자 화면이 자동으로 따라가요 · "오픈 예정"으로 옮기면 캐러셀 COMING SOON 슬라이드와 D-10
        상세가 생기고, "공개"로 옮기면 오픈 알림이 예약돼요.
      </p>
    </>
  )
}

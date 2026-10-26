import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { getAdminModules } from '../../api'
import type { AdminModules, ModuleStage } from '../../api/types'
import { useAuth } from '../../auth/useAuth'
import { Button, Character, Icon, Skeleton } from '../../components'
import { useApi } from '../../hooks/useApi'
import { FilterPills, LoadError, PageHead, Pill } from './components/AdminUi'
import type { PillTone } from './components/AdminUi'
import { characterOf, md } from './components/format'
import styles from './AdminModulesPage.module.css'

type Module = AdminModules['modules'][number]
type Filter = 'all' | 'mine' | 'quarter'

const COLUMNS: { stage: ModuleStage; label: string; tone: PillTone; badge: string }[] = [
  { stage: 'idea', label: '아이디어', tone: 'neutral', badge: 'IDEA' },
  { stage: 'design', label: '설계 중', tone: 'indigo', badge: 'DESIGN' },
  { stage: 'build', label: '개발 중', tone: 'indigo', badge: 'DEV' },
  { stage: 'qa', label: 'QA', tone: 'warning', badge: 'QA' },
  { stage: 'live', label: '공개', tone: 'success', badge: 'LIVE' },
]

/** 이번 분기 시작 시각 */
function quarterStart(now = new Date()) {
  return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).getTime()
}

function ModuleCard({ m, tone, badge }: { m: Module; tone: PillTone; badge: string }) {
  const character = characterOf(m.code)
  return (
    <li>
      <Link to={`/admin/modules/${encodeURIComponent(m.id)}/publish`} className={styles.card}>
        <div className={styles.cardTop}>
          {character ? <Character id={character} size={28} /> : <span className={styles.noChar} />}
          <span className={styles.code}>{m.code}</span>
          <Pill tone={tone} className={styles.badge}>
            {badge}
          </Pill>
        </div>
        <strong className={styles.cardTitle}>{m.title}</strong>
        <span className={styles.meta}>
          담당 {m.owner} · {md(m.updatedAt)} 수정
        </span>
      </Link>
    </li>
  )
}

// W2 admin 담당 · 경로 /admin/modules — F-05 실험 모듈 파이프라인
export default function AdminModulesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data, error, reload } = useApi((signal) => getAdminModules(signal), [])
  const [filter, setFilter] = useState<Filter>('all')

  const qs = quarterStart()
  const modules = (data?.modules ?? []).filter((m) =>
    filter === 'mine' ? m.owner === user?.nickname : filter === 'quarter' ? Date.parse(m.updatedAt) >= qs : true,
  )

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
          {COLUMNS.map((col) => {
            const items = modules.filter((m) => m.stage === col.stage)
            return (
              <section key={col.stage} className={styles.column} data-stage={col.stage} aria-label={col.label}>
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
                      <ModuleCard key={m.id} m={m} tone={col.tone} badge={col.badge} />
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}

      <p className={styles.note}>
        카드를 누르면 공개 설정으로 이동해요 · "오픈 예정"으로 예약하면 캐러셀 COMING SOON 슬라이드와 D-10 상세가 생기고, "공개"로
        바꾸면 오픈 알림이 예약돼요.
      </p>
    </>
  )
}

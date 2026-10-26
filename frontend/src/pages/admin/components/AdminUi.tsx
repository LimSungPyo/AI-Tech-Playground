import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import type { ApiError } from '../../../api/client'
import { Button, EmptyState, Icon, Input, Skeleton, cx } from '../../../components'
import styles from './admin.module.css'

/** 화면 제목 줄. 오른쪽에 검색(사용자 검색으로 이동)과 추가 동작 */
export function PageHead({ title, actions }: { title: ReactNode; actions?: ReactNode }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  return (
    <div className={styles.head}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.headRight}>
        <form
          role="search"
          className={styles.search}
          onSubmit={(e) => {
            e.preventDefault()
            navigate(`/admin/users${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`)
          }}
        >
          <Input
            aria-label="사용자 검색"
            placeholder="검색 (⌘K)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            iconLeft={<Icon name="search" size={16} />}
          />
        </form>
        {actions}
      </div>
    </div>
  )
}

export function Panel({
  title,
  right,
  dark,
  className,
  children,
}: {
  title?: ReactNode
  right?: ReactNode
  dark?: boolean
  className?: string
  children?: ReactNode
}) {
  return (
    <section className={cx(styles.panel, dark && styles.panelDark, className)}>
      {(title || right) && (
        <div className={styles.panelHead}>
          {title && <h2 className={styles.panelTitle}>{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </section>
  )
}

export interface FilterItem<T extends string> {
  value: T
  label: string
  count?: number
}

/** 검은 pill 필터(전체 24 · 대기 12 …) */
export function FilterPills<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: FilterItem<T>[]
  value: T
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div className={styles.filters} role="tablist" aria-label={label}>
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          role="tab"
          aria-selected={it.value === value}
          className={cx(styles.filter, it.value === value && styles.filterOn)}
          onClick={() => onChange(it.value)}
        >
          {it.label}
          {it.count !== undefined && ` ${it.count.toLocaleString()}`}
        </button>
      ))}
    </div>
  )
}

export type PillTone = 'neutral' | 'success' | 'danger' | 'warning' | 'indigo' | 'dark'

export function Pill({ tone = 'neutral', className, children }: { tone?: PillTone; className?: string; children: ReactNode }) {
  return <span className={cx(styles.pill, styles[`pill_${tone}`], className)}>{children}</span>
}

/** ✓ 통과 / ○ 미통과 목록 */
export function CheckList({ items }: { items: { label: ReactNode; ok: boolean }[] }) {
  return (
    <ul className={styles.checklist}>
      {items.map((it, i) => (
        <li key={i} className={cx(styles.checkItem, !it.ok && styles.checkNo)}>
          {it.ok ? <Icon name="check" size={14} className={styles.checkOk} /> : <span className={styles.ring} aria-hidden />}
          <span className="sr-only">{it.ok ? '통과' : '미통과'}</span>
          {it.label}
        </li>
      ))}
    </ul>
  )
}

/** 데이터 로딩 중 자리 */
export function PanelSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <Skeleton shape="text" width={160} />
      </div>
      <Skeleton height={height} />
    </div>
  )
}

/** API 오류 */
export function LoadError({ error, onRetry }: { error: ApiError; onRetry: () => void }) {
  return (
    <div className={styles.panel}>
      <EmptyState
        expression="confused"
        title="데이터를 불러오지 못했어요"
        description={error.message}
        action={
          <Button variant="secondary" size="sm" onClick={onRetry}>
            다시 시도
          </Button>
        }
        compact
      />
    </div>
  )
}

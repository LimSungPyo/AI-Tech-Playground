import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Link } from 'react-router'
import { getNotifications, readAllNotifications } from '../api/support'
import type { CharacterId, MascotExpression, Notification } from '../api/types'
import { Badge, Button, Character, Chip, EmptyState, Mascot, Popover, Skeleton } from '../components'
import { cx } from '../components/cx'
import { useApi } from '../hooks/useApi'
import styles from './HeaderMenu.module.css'
import { timeAgo } from './time'

type Filter = 'all' | 'experiment' | 'character' | 'news'
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'experiment', label: '실험' },
  { value: 'character', label: '캐릭터' },
  { value: 'news', label: '소식' },
]
const filterOf = (n: Notification): Filter =>
  n.kind === 'experiment' ? 'experiment' : n.kind === 'team' || n.kind === 'badge' ? 'character' : 'news'

const iconOf: Record<Notification['kind'], { mascot?: MascotExpression; character?: CharacterId }> = {
  experiment: { mascot: 'default' },
  badge: { mascot: 'why' },
  team: { character: 'wormy' },
  inquiry: { mascot: 'happy' },
  system: { character: 'owl' },
  character: { character: 'drosi' },
  ranking: { mascot: 'champion' },
  radar: { mascot: 'scientist' },
}

interface Props {
  open: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
  /** 안 읽은 알림 유무(벨 빨간 점) */
  onUnreadChange: (unread: boolean) => void
}

/** D-01 알림 센터 드롭다운 */
export function NotificationMenu({ open, onClose, anchorRef, onUnreadChange }: Props) {
  const { data, error, loading, reload, setData } = useApi((signal) => getNotifications(signal), [])
  const [filter, setFilter] = useState<Filter>('all')
  const unreadCount = data?.filter((n) => !n.read).length ?? 0

  useEffect(() => {
    onUnreadChange(unreadCount > 0)
  }, [unreadCount, onUnreadChange])

  // 닫혀 있다가 열릴 때마다 새로 받는다
  const wasOpen = useRef(open)
  useEffect(() => {
    if (open && !wasOpen.current) reload()
    wasOpen.current = open
  }, [open, reload])

  const items = useMemo(() => (data ?? []).filter((n) => filter === 'all' || filterOf(n) === filter), [data, filter])

  const markAllRead = async () => {
    setData((list) => list?.map((n) => ({ ...n, read: true })))
    try {
      await readAllNotifications()
    } catch {
      reload()
    }
  }

  return (
    <Popover open={open} onClose={onClose} anchorRef={anchorRef} width={420} label="알림 센터" dim>
      <div className={styles.head}>
        <h2 className={styles.heading}>
          알림
          {unreadCount > 0 && <Badge tone="danger">{unreadCount}</Badge>}
        </h2>
        <button type="button" className={styles.textLink} onClick={markAllRead} disabled={unreadCount === 0}>
          모두 읽음
        </button>
      </div>
      <div className={styles.filters} role="group" aria-label="알림 종류">
        {FILTERS.map((f) => (
          <Chip key={f.value} selected={filter === f.value} onClick={() => setFilter(f.value)} className={styles.filterChip}>
            {f.label}
          </Chip>
        ))}
      </div>

      <div className={styles.list}>
        {loading && !data ? (
          [0, 1, 2].map((i) => (
            <div key={i} className={styles.item}>
              <Skeleton shape="circle" width={44} />
              <Skeleton shape="text" lines={2} />
            </div>
          ))
        ) : error ? (
          <EmptyState
            compact
            expression="confused"
            title="알림을 불러오지 못했어요"
            description={error.message}
            action={
              <Button size="sm" variant="secondary" onClick={reload}>
                다시 시도
              </Button>
            }
          />
        ) : items.length === 0 ? (
          <EmptyState compact title="새 알림이 없어요" />
        ) : (
          <ul>
            {items.map((n) => {
              const ic = iconOf[n.kind]
              const body = (
                <>
                  <span className={styles.itemIcon}>
                    {ic.character ? <Character id={ic.character} size={40} alt="" /> : <Mascot expression={ic.mascot} size={40} alt="" />}
                  </span>
                  <span className={styles.itemText}>
                    <span className={styles.itemTitle}>{n.title}</span>
                    <span className={styles.itemBody}>{n.body}</span>
                    <span className={styles.itemMeta}>{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.read && <span className={styles.unreadDot} aria-label="안 읽음" />}
                </>
              )
              return (
                <li key={n.id}>
                  {n.target ? (
                    <Link to={n.target} className={cx(styles.item, !n.read && styles.unread)} onClick={onClose}>
                      {body}
                    </Link>
                  ) : (
                    <div className={cx(styles.item, !n.read && styles.unread)}>{body}</div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className={styles.foot}>
        <Link to="/settings" className={styles.footLink} onClick={onClose}>
          알림 설정
        </Link>
        <Link to="/notifications" className={styles.textLink} onClick={onClose}>
          지난 알림 모두 보기 →
        </Link>
      </div>
    </Popover>
  )
}

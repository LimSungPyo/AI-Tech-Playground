import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { getNotifications, readAllNotifications, type Notification } from '../../api'
import { Button, Character, Chip, EmptyState, Icon, Logo, Mascot, Skeleton, cx, useToast } from '../../components'
import { useApi } from '../../hooks/useApi'
import { timeAgo } from '../../layouts/time'
import styles from './NotificationsPage.module.css'

// W2 my 담당 · 경로 /notifications (H-07 알림 전체)

type Tab = 'all' | 'experiment' | 'badge' | 'inquiry' | 'system'

const TABS: { value: Tab; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'experiment', label: '실험' },
  { value: 'badge', label: '배지' },
  { value: 'inquiry', label: '문의' },
  { value: 'system', label: '시스템' },
]

/** 알림 종류 → 탭(팀 미션 소식은 실험 탭에 묶는다) */
const KIND_TAB: Record<Notification['kind'], Exclude<Tab, 'all'>> = {
  experiment: 'experiment',
  team: 'experiment',
  badge: 'badge',
  inquiry: 'inquiry',
  system: 'system',
}

const KIND_LABEL: Record<Notification['kind'], string> = {
  experiment: '실험',
  team: '팀 미션',
  badge: '배지',
  inquiry: '문의 · 운영',
  system: '시스템',
}

function KindIcon({ kind }: { kind: Notification['kind'] }) {
  if (kind === 'experiment') return <Character id="drosi" size={40} alt="" />
  if (kind === 'team') return <Mascot expression="happy" size={40} alt="" />
  if (kind === 'badge') return <Mascot expression="champion" size={40} alt="" />
  return <Logo iconOnly size={28} />
}

/** 이동 경로 → 버튼 이름 */
function ctaLabel(target: string) {
  const exp = /^\/experiments\/(\d{3})/.exec(target)
  if (exp) return `#${exp[1]} 보기`
  if (target.startsWith('/support')) return '답변 보기'
  if (target.startsWith('/my/badges')) return '배지 보기'
  if (target.startsWith('/my/history')) return '기록 보기'
  if (target.startsWith('/dex')) return '도감 보기'
  if (target.startsWith('/radar')) return '레이더 보기'
  if (target.startsWith('/ranking')) return '랭킹 보기'
  return null
}

const DAY = 86400000

function startOfDay(t: number) {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** 오늘 · 이번 주(7일) · 지난 30일 · 이전 */
function groupOf(iso: string, now: number) {
  const t = Date.parse(iso)
  const today = startOfDay(now)
  if (t >= today) return '오늘'
  if (t >= today - 6 * DAY) return '이번 주'
  if (t >= today - 29 * DAY) return '지난 30일'
  return '이전'
}

function timeLabel(iso: string, now: number) {
  const t = Date.parse(iso)
  if (t >= startOfDay(now)) return timeAgo(iso, now)
  const d = new Date(t)
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const GROUP_ORDER = ['오늘', '이번 주', '지난 30일', '이전']

export default function NotificationsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('all')
  const [busy, setBusy] = useState(false)
  const { data, error, loading, reload, setData } = useApi((signal) => getNotifications(signal), [])
  const [now] = useState(() => Date.now())

  const list = useMemo(() => data ?? [], [data])
  const unread = list.filter((n) => !n.read).length

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: list.length, experiment: 0, badge: 0, inquiry: 0, system: 0 }
    for (const n of list) c[KIND_TAB[n.kind]] += 1
    return c
  }, [list])

  const groups = useMemo(() => {
    const shown = tab === 'all' ? list : list.filter((n) => KIND_TAB[n.kind] === tab)
    const sorted = [...shown].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    const map = new Map<string, Notification[]>()
    for (const n of sorted) {
      const g = groupOf(n.createdAt, now)
      map.set(g, [...(map.get(g) ?? []), n])
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({ title: g, items: map.get(g) ?? [] }))
  }, [list, tab, now])

  const markAllRead = async () => {
    const prev = data
    setData((d) => d?.map((n) => ({ ...n, read: true })))
    setBusy(true)
    try {
      await readAllNotifications()
    } catch {
      setData(prev)
      toast.show({ title: '모두 읽음 처리에 실패했어요', description: '잠시 후 다시 시도해 주세요.', tone: 'danger' })
    } finally {
      setBusy(false)
    }
  }

  const open = (n: Notification) => {
    setData((d) => d?.map((it) => (it.id === n.id ? { ...it, read: true } : it)))
    if (n.target) navigate(n.target)
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>알림</h1>
          {unread > 0 && <span className={styles.unread}>안 읽음 {unread}</span>}
        </div>
        <div className={styles.headActions}>
          <button type="button" className={styles.readAll} onClick={markAllRead} disabled={busy || unread === 0}>
            모두 읽음
          </button>
          <Button to="/settings" variant="secondary" iconLeft={<Icon name="settings" size={16} />}>
            알림 설정
          </Button>
        </div>
      </header>

      <div className={styles.tabs} role="tablist" aria-label="알림 종류">
        {TABS.map((t) => (
          <Chip
            key={t.value}
            role="tab"
            aria-selected={tab === t.value}
            selected={tab === t.value}
            onClick={() => setTab(t.value)}
          >
            {t.label}
            {data && t.value !== 'all' && counts[t.value] > 0 ? ` ${counts[t.value]}` : ''}
          </Chip>
        ))}
      </div>

      {loading && !data ? (
        <div className={styles.group}>
          <Skeleton shape="text" width={80} />
          <div className={cx(styles.list, styles.skeletonList)}>
            <Skeleton height={72} />
            <Skeleton height={72} />
            <Skeleton height={72} />
          </div>
        </div>
      ) : error ? (
        <EmptyState
          className={styles.empty}
          expression="confused"
          title="알림을 불러오지 못했어요"
          description={error.message}
          action={<Button onClick={reload}>다시 시도</Button>}
        />
      ) : groups.length === 0 ? (
        <EmptyState className={styles.empty} title="새 알림이 없어요" description="실험을 이어 하면 소식이 여기에 쌓여요." />
      ) : (
        groups.map((g) => (
          <section key={g.title} className={styles.group} aria-label={g.title}>
            <h2 className={styles.groupTitle}>{g.title}</h2>
            <ul className={styles.list}>
              {g.items.map((n) => {
                const cta = n.target ? ctaLabel(n.target) : null
                return (
                  <li key={n.id}>
                    <button type="button" className={cx(styles.item, !n.read && styles.isUnread)} onClick={() => open(n)}>
                      <span className={styles.icon}>
                        <KindIcon kind={n.kind} />
                      </span>
                      <span className={styles.body}>
                        <span className={styles.meta}>
                          <span className={styles.kind}>{KIND_LABEL[n.kind]}</span>
                          <span className={styles.time}>{timeLabel(n.createdAt, now)}</span>
                        </span>
                        <span className={styles.text}>
                          {n.title}
                        </span>
                        {n.body && (
                          <span className={styles.sub}>
                            {n.body}
                          </span>
                        )}
                      </span>
                      {cta && <span className={styles.cta}>{cta}</span>}
                      {!n.read ? (
                        <span className={styles.dot} aria-label="안 읽음" />
                      ) : (
                        <span className={styles.dotSpace} aria-hidden="true" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}

      {data && list.length > 0 && <p className={styles.foot}>90일이 지난 알림은 자동으로 정리돼요</p>}
    </div>
  )
}

import { Link } from 'react-router'
import {
  getDashboard,
  getMyBadges,
  getMyCharacters,
  getMyExperiments,
  getTree,
  type Badge as BadgeData,
  type DexEntry,
  type ExperimentSummary,
  type Level,
} from '../../api'
import {
  Badge,
  Button,
  Character,
  EmptyState,
  GlassCard,
  ProgressBar,
  Skeleton,
  cx,
} from '../../components'
import { useApi } from '../../hooks/useApi'
import { BadgeIcon } from './components/BadgeIcon'
import { CHARACTER_TINT, formatFullDate, formatMinutes, longestStreak, sumMinutes } from './components/format'
import { Grass, GrassLegend } from './components/Grass'
import my from './components/my.module.css'
import styles from './DashboardPage.module.css'

const TREE_LEVELS: { level: Level; label: string; tone: 'success' | 'indigo' | 'dark' }[] = [
  { level: 'basic', label: '기초', tone: 'success' },
  { level: 'advanced', label: '심화', tone: 'indigo' },
  { level: 'frontier', label: '최전선', tone: 'dark' },
]

const isDone = (e: ExperimentSummary) => !!e.progress && e.progress.trial >= e.progress.maxTrial

// W2 my 담당 · 경로 /my · C-02 대시보드
export default function DashboardPage() {
  const dash = useApi((s) => getDashboard(s), [])
  const chars = useApi((s) => getMyCharacters(s), [])
  const badges = useApi((s) => getMyBadges(s), [])
  const exps = useApi((s) => getMyExperiments(s), [])
  const tree = useApi((s) => getTree(s), [])

  if (dash.error) {
    return (
      <EmptyState
        expression="confused"
        title="대시보드를 불러오지 못했어요"
        description={dash.error.message}
        action={<Button onClick={dash.reload}>다시 시도</Button>}
      />
    )
  }
  const d = dash.data
  if (!d) return <DashboardSkeleton />

  const { user, stats, streak } = d
  const calendar = streak.calendar
  const total = d.totalMinutes ?? sumMinutes(calendar)
  const weekDelta = d.weekMinutesDelta ?? sumMinutes(calendar.slice(-7))
  const best = d.bestStreak ?? streak.best ?? longestStreak(calendar)
  const played = (exps.data ?? []).filter((e) => e.progress)
  const masters = (chars.data ?? []).filter((c) => c.state === 'master')
  const xp = d.xp

  return (
    <div className={my.page}>
      {/* 프로필 카드 */}
      <GlassCard radius="lg" padding="lg" className={styles.profile}>
        <span className={styles.avatar} style={{ background: CHARACTER_TINT[user.avatar] }}>
          <Character id={user.avatar} size={112} />
        </span>
        <div className={styles.profileBody}>
          <div className={styles.nameRow}>
            <h1 className={styles.name}>{user.nickname}</h1>
            <Badge tone="solid" size="md">
              Lv.{user.level}
              {user.title && ` ${user.title}`}
            </Badge>
            {d.partner && (
              <Badge tone="pink" size="md">
                파트너 · {d.partner.name}
              </Badge>
            )}
          </div>
          <p className={styles.email}>
            {user.email} · {formatFullDate(user.createdAt)} 가입
          </p>
          {xp && (
            <div className={styles.xp}>
              <ProgressBar value={xp.current} max={xp.next} size="sm" className={styles.xpBar} />
              <span className={my.caption}>
                {xp.current.toLocaleString()} / {xp.next.toLocaleString()} XP · Lv.{xp.nextLevel}까지{' '}
                {(xp.next - xp.current).toLocaleString()}
              </span>
            </div>
          )}
        </div>
        <Button variant="secondary" to="/settings/profile" className={styles.editBtn}>
          프로필 편집
        </Button>
      </GlassCard>

      {/* 핵심 지표 */}
      <div className={styles.stats}>
        <StatCard label="총 실험 시간" value={formatMinutes(total)} caption={`이번 주 +${formatMinutes(weekDelta)}`} />
        <StatCard
          label="완료한 실험"
          value={`${stats.experiments}개`}
          caption={played.map((e) => e.code).sort().join(' · ') || ' '}
        />
        <StatCard
          label="마스터 캐릭터"
          value={`${masters.length}명`}
          caption={masters.map((c) => c.name).join(' · ') || '아직 없어요'}
        />
        <StatCard label="연속 학습" value={`${streak.days}일`} caption={`최고 기록 ${best}일`} />
      </div>

      <div className={styles.row}>
        {/* 진행 중인 실험 */}
        <GlassCard radius="lg" className={styles.wide}>
          <div className={my.cardHead}>
            <h2 className={my.cardTitle}>진행 중인 실험</h2>
            <Link to="/my/experiments" className={my.link}>
              전체 보기
            </Link>
          </div>
          {d.recent.length === 0 ? (
            <EmptyState
              compact
              expression="sleep"
              title="아직 참여한 실험이 없어요"
              action={<Button to="/lab">첫 실험 하러 가기</Button>}
            />
          ) : (
            <ul className={styles.recent}>
              {d.recent.map((e) => (
                <RecentRow key={e.id} exp={e} />
              ))}
            </ul>
          )}
        </GlassCard>

        {/* 학습 잔디 */}
        <GlassCard radius="lg" className={styles.narrow}>
          <div className={my.cardHead}>
            <h2 className={my.cardTitle}>학습 잔디</h2>
            <span className={my.caption}>최근 {Math.ceil(calendar.length / 7)}주</span>
          </div>
          <Link to="/my/history" className={styles.grassLink} aria-label="학습 기록 보기">
            <Grass days={calendar} size={18} />
          </Link>
          <div className={styles.grassFoot}>
            <GrassLegend />
            {streak.days > 0 && <span className={styles.streak}>{streak.days}일 연속 학습 중</span>}
          </div>
        </GlassCard>
      </div>

      <div className={styles.row}>
        {/* 내 캐릭터 */}
        <GlassCard radius="lg" className={styles.wide}>
          <div className={my.cardHead}>
            <h2 className={my.cardTitle}>
              <Link to="/my/characters">내 캐릭터</Link>
            </h2>
            {chars.data && (
              <span className={my.count}>
                {chars.data.filter((c) => c.obtained).length} / {chars.data.length}
              </span>
            )}
          </div>
          {chars.loading || !chars.data ? (
            <Skeleton height={150} />
          ) : (
            <ul className={styles.chars}>
              {chars.data.slice(0, 5).map((c) => (
                <CharacterTile key={c.id} entry={c} />
              ))}
            </ul>
          )}
        </GlassCard>

        {/* 배지 */}
        <GlassCard radius="lg" className={styles.narrow}>
          <div className={my.cardHead}>
            <h2 className={my.cardTitle}>
              <Link to="/my/badges">배지</Link>
            </h2>
            {badges.data && (
              <span className={my.count}>
                {badges.data.filter((b) => b.obtained).length} / {badges.data.length}
              </span>
            )}
          </div>
          {badges.loading || !badges.data ? (
            <Skeleton height={150} />
          ) : (
            <ul className={styles.badges}>
              {pickBadges(badges.data).map((b) => (
                <li key={b.id}>
                  <Link to="/my/badges" className={cx(styles.badge, !b.obtained && styles.badgeOff)}>
                    <BadgeIcon badge={b} size={48} />
                    <span>{b.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>

      {/* 기술 트리 진행 */}
      <GlassCard radius="lg">
        <div className={my.cardHead}>
          <h2 className={my.cardTitle}>기술 트리 진행</h2>
          <Button variant="secondary" size="sm" to="/tree">
            기술 트리 열기
          </Button>
        </div>
        {tree.loading || !tree.data ? (
          <Skeleton height={40} />
        ) : (
          <div className={styles.tree}>
            {TREE_LEVELS.map(({ level, label, tone }) => {
              const nodes = tree.data!.nodes.filter((n) => n.level === level)
              const done = nodes.filter((n) => n.status === 'done').length
              return (
                <div key={level} className={styles.treeItem}>
                  <div className={styles.treeHead}>
                    <span>{label}</span>
                    <span className={cx(my.count, tone === 'success' && styles.countSuccess, tone === 'dark' && styles.countDark)}>
                      {done} / {nodes.length}
                    </span>
                  </div>
                  <ProgressBar value={done} max={Math.max(nodes.length, 1)} tone={tone} size="sm" />
                </div>
              )
            })}
          </div>
        )}
      </GlassCard>
    </div>
  )
}

/** 획득한 배지 먼저, 8개 */
function pickBadges(list: BadgeData[]) {
  return [...list.filter((b) => b.obtained), ...list.filter((b) => !b.obtained)].slice(0, 8)
}

function StatCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <GlassCard padding="md" className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <strong className={styles.statValue}>{value}</strong>
      <span className={styles.statCaption}>{caption}</span>
    </GlassCard>
  )
}

function RecentRow({ exp }: { exp: ExperimentSummary }) {
  const p = exp.progress
  const done = isDone(exp)
  return (
    <li className={styles.recentRow}>
      <Character id={exp.character} size={52} />
      <div className={styles.recentBody}>
        <p className={styles.recentTitle}>
          {exp.code} {exp.title}
        </p>
        <p className={my.caption}>
          {p
            ? done
              ? `완료 · 최종 성공률 ${Math.round(p.successRate)}%`
              : `Trial ${p.trial} / ${p.maxTrial} · 성공률 ${Math.round(p.successRate)}%`
            : '아직 시작 전'}
        </p>
        {p && (
          <ProgressBar value={p.trial} max={p.maxTrial} size="sm" tone={done ? 'success' : 'indigo'} className={styles.recentBar} />
        )}
      </div>
      {done ? (
        <Button variant="secondary" size="sm" to={`/experiments/${exp.id}/report`}>
          리포트
        </Button>
      ) : (
        <Button size="sm" to={`/experiments/${exp.id}/play`}>
          이어하기
        </Button>
      )}
    </li>
  )
}

function CharacterTile({ entry }: { entry: DexEntry }) {
  const met = entry.obtained
  const discovered = !met && entry.title === '발견'
  return (
    <li>
      <Link
        to="/my/characters"
        className={cx(styles.charTile, !met && styles.charOff)}
        style={{ background: CHARACTER_TINT[entry.character] }}
      >
        <Character id={entry.character} size={72} locked={!met} />
        <span className={styles.charName}>{met || discovered ? entry.name : '???'}</span>
        {met ? (
          <Badge tone={entry.state === 'master' ? 'dark' : 'neutral'} className={styles.charBadge}>
            Lv.{entry.level} · {entry.title}
          </Badge>
        ) : (
          <span className={styles.charState}>{entry.title}</span>
        )}
      </Link>
    </li>
  )
}

function DashboardSkeleton() {
  return (
    <div className={my.page}>
      <Skeleton height={190} />
      <div className={styles.stats}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={110} />
        ))}
      </div>
      <div className={styles.row}>
        <Skeleton height={320} />
        <Skeleton height={260} />
      </div>
    </div>
  )
}

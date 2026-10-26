import { useParams } from 'react-router'
import { getTeamMissionResult } from '../../api'
import type { CharacterId } from '../../api'
import { Badge, Button, Character, CHARACTERS, cx, EmptyState, GlassCard, Icon, Skeleton, useToast } from '../../components'
import { useApi } from '../../hooks/useApi'
import styles from './TeamMissionResultPage.module.css'

const fmtAt = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`

// W2 world 담당 · 경로 /team-missions/:id/result — H-11 팀 미션 결과
export default function TeamMissionResultPage() {
  const { id = 't1' } = useParams()
  const toast = useToast()
  const res = useApi((signal) => getTeamMissionResult(id, signal), [id])

  if (res.error) {
    return (
      <div className={styles.page}>
        <EmptyState
          expression="confused"
          title="결과를 불러오지 못했어요"
          description={res.error.message}
          action={<Button onClick={res.reload}>다시 시도</Button>}
        />
      </div>
    )
  }
  if (!res.data) {
    return (
      <div className={styles.page}>
        <Skeleton height={72} />
        <Skeleton height={300} />
        <Skeleton height={260} />
      </div>
    )
  }

  const { mission, summary, contributions } = res.data
  const name = (c: CharacterId) => CHARACTERS[c].name
  const roleOf = (c: CharacterId) => mission.members.find((m) => m.character === c)?.role ?? ''
  // MVP: 메시지를 가장 많이 보낸 친구(같으면 먼저 말한 쪽)
  const count = (c: CharacterId) => mission.messages.filter((m) => m.from === c).length
  const mvp = [...mission.members].sort((a, b) => count(b.character) - count(a.character))[0]?.character
  // MVP를 가운데에 둔다
  const others = mission.members.filter((m) => m.character !== mvp)
  const half = Math.ceil(others.length / 2)
  const lineup = [...others.slice(0, half), ...mission.members.filter((m) => m.character === mvp), ...others.slice(half)]
  const messages = [...mission.messages].sort((a, b) => a.at - b.at)
  const duration = messages.at(-1)?.at ?? 0

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.show({ title: '결과 링크를 복사했어요', tone: 'success' })
    } catch {
      toast.show({ title: '링크를 복사하지 못했어요', tone: 'danger' })
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>TEAM MISSION · {mission.members.map((m) => name(m.character)).join(' × ')}</span>
        <h1 className={styles.h1}>팀 미션 클리어!</h1>
        <p className={styles.lead}>
          "{mission.title}" · {summary}
        </p>
      </header>

      <ul className={styles.lineup}>
        {lineup.map((m) => {
          const isMvp = m.character === mvp
          return (
            <li key={m.character} className={cx(styles.member, isMvp && styles.mvp)}>
              {isMvp && (
                <Badge tone="why" className={styles.mvpBadge}>
                  ★ MVP
                </Badge>
              )}
              <span className={styles.portrait}>
                <Character id={m.character} size={isMvp ? 120 : 96} />
              </span>
              <strong className={styles.name}>{name(m.character)}</strong>
              <span className={styles.role}>{m.role}</span>
              <span className={styles.contrib}>{contributions.find((c) => c.character === m.character)?.text}</span>
            </li>
          )
        })}
      </ul>

      <GlassCard padding="md" radius="lg" className={styles.record}>
        <h2 className={styles.h2}>협업 기록</h2>
        <div className={styles.stats}>
          <Stat label="참여 친구" value={`${mission.members.length}명`} />
          <Stat label="메시지 교환" value={`${messages.length}회`} />
          <Stat label="소요 시간" value={`${Math.round(duration)}초`} />
          <Stat label="결과" value={mission.status === 'done' ? '완료' : '진행 중'} />
        </div>
        <ol className={styles.timeline}>
          {messages.map((m) => (
            <li key={`${m.from}-${m.at}`}>
              {fmtAt(m.at)} {name(m.from)} ({roleOf(m.from)}) → "{m.text}"
            </li>
          ))}
        </ol>
      </GlassCard>

      <div className={styles.card}>
        <span className={styles.cardEyebrow}>TECH CARD · 멀티 에이전트</span>
        <strong>역할을 나눈 AI들이 서로 메시지를 주고받으면, 하나의 큰 AI보다 더 잘할 때가 있어요.</strong>
      </div>

      <div className={styles.actions}>
        <Button to="/create" variant="secondary">
          팀 다시 짜기
        </Button>
        <Button variant="secondary" onClick={share} iconLeft={<Icon name="share" size={16} />}>
          결과 공유
        </Button>
        <Button to="/experiments/004" iconRight={<Icon name="arrow-right" size={16} />}>
          #004 앤티 팀 해금 보기
        </Button>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

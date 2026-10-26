import { useRef, useState } from 'react'
import { useParams } from 'react-router'
import { getTeamMission, getTeamMissionResult } from '../../api'
import type { CharacterId, TeamEvent } from '../../api'
import { Badge, Button, Character, CHARACTERS, cx, EmptyState, GlassCard, Icon, Popover, Skeleton } from '../../components'
import { useApi } from '../../hooks/useApi'
import { TeamGraph } from './components/TeamGraph'
import { usePlayback } from './usePlayback'
import styles from './TeamMissionPage.module.css'

/** 마지막 메시지가 뜬 뒤 끝내기까지 여유(초) */
const TAIL = 1.5

// 캐릭터 기술 태그(팀 편성 · 대화 로그 라벨)
const TECH: Partial<Record<CharacterId, string>> = {
  parrot: 'LLM',
  owl: 'RAG',
  octo: 'Tool Calling',
  memo: 'Memory',
  ants: 'Multi-Agent',
  hawk: 'Vision',
  drosi: '강화학습',
  wormy: '신경망',
  mappy: 'World Model',
}

// W2 world 담당 · 경로 /team-missions/:id — B-13 팀 미션 (= 17 Character Multi-Agent)
export default function TeamMissionPage() {
  const { id = 't1' } = useParams()
  const mission = useApi((signal) => getTeamMission(id, signal), [id])
  const [run, setRun] = useState(0)
  const messages = [...(mission.data?.messages ?? [])].sort((a, b) => a.at - b.at)
  const total = mission.data ? (messages.at(-1)?.at ?? 0) + TAIL : undefined
  const { elapsed, done } = usePlayback(total, run)
  const result = useApi(done ? (signal) => getTeamMissionResult(id, signal) : null, [id, done])
  const [whyOpen, setWhyOpen] = useState(false)
  const whyRef = useRef<HTMLSpanElement>(null)

  if (mission.error) {
    return (
      <div className={styles.page}>
        <EmptyState
          expression="confused"
          title="팀 미션을 불러오지 못했어요"
          description={mission.error.message}
          action={<Button onClick={mission.reload}>다시 시도</Button>}
        />
      </div>
    )
  }

  const m = mission.data
  const shown = messages.filter((msg) => msg.at <= elapsed)
  const next = messages.find((msg) => msg.at > elapsed)
  const spoke = new Set(shown.map((s) => s.from))
  const name = (c: CharacterId) => CHARACTERS[c].name
  const sec = Math.floor(Math.min(elapsed, (total ?? TAIL) - TAIL))
  // 재생 중에는 지금까지 뜬 줄로 세고, 끝나면 result.metrics(v2)
  const countEvents = (kind: TeamEvent['kind']) => shown.filter((msg) => msg.event?.kind === kind).length
  const metrics = (done && result.data?.metrics) || {
    messages: shown.length,
    toolCalls: countEvents('tool_call'),
    searches: countEvents('retrieve'),
  }

  return (
    <div className={styles.page}>
      <div className={styles.topline}>
        <Badge tone="dark">TEAM MISSION · Multi-Agent</Badge>
        <span className={styles.unlock}>팀 미션 · 마스터 2명 이상 해금</span>
      </div>
      <h1 className={styles.h1}>{m ? `팀 미션 — ${m.title}` : '팀 미션'}</h1>
      <p className={styles.lead}>
        마스터한 친구들이 각자 하나의 에이전트가 되어 일해요. 누가 누구에게 무엇을 맡겼는지, 주고받은 메시지를 그대로 보여줘요.
      </p>

      <div className={styles.grid}>
        <GlassCard padding="md" radius="lg" className={styles.team}>
          <h2 className={styles.h2}>팀 편성</h2>
          {!m ? (
            <Skeleton shape="text" lines={6} />
          ) : (
            <ul className={styles.roles}>
              {m.members.map((mem) => (
                <li key={mem.character} className={cx(styles.role, next?.from === mem.character && !done && styles.roleNext)}>
                  <Character id={mem.character} size={44} />
                  <span className={styles.roleText}>
                    <span className={styles.roleLabel}>{mem.role}</span>
                    <strong>{name(mem.character)}</strong>
                  </span>
                  {TECH[mem.character] && <span className={styles.tech}>{TECH[mem.character]}</span>}
                </li>
              ))}
              <li className={styles.empty}>
                <span className={styles.plus}>
                  <Icon name="plus" size={18} />
                </span>
                <span className={styles.roleText}>
                  <span className={styles.roleLabel}>계획 분담</span>
                  <strong>앤티 팀 추천</strong>
                </span>
              </li>
            </ul>
          )}
          <p className={styles.note}>역할은 캐릭터의 기술로 자동 배정돼요. 드래그해서 바꿀 수도 있어요.</p>
        </GlassCard>

        <GlassCard padding="md" radius="lg" className={styles.log}>
          <div className={styles.logHead}>
            <h2 className={styles.h2}>에이전트 대화 로그</h2>
            {m && (
              <span className={cx(styles.status, done && styles.statusDone)}>
                <span className={styles.dot} aria-hidden />
                {done ? '완료' : '실행 중'} · {sec}s
              </span>
            )}
          </div>
          <ol className={styles.messages} aria-live="polite">
            {shown.map((msg) => (
              <li key={`${msg.from}-${msg.at}`} className={styles.message}>
                <Character id={msg.from} size={40} className={styles.msgAvatar} />
                <div className={styles.msgBody}>
                  <span className={styles.msgHead}>
                    <strong>{name(msg.from)}</strong>
                    <span className={styles.msgTech}>{TECH[msg.from] ?? ''}</span>
                  </span>
                  <p className={styles.bubble}>{msg.text}</p>
                  {msg.event && <code className={styles.event}>{msg.event.text}</code>}
                </div>
              </li>
            ))}
            {next && m && (
              <li className={cx(styles.message, styles.typing)} aria-hidden>
                <Character id={next.from} size={40} className={styles.msgAvatar} />
                <span className={styles.dots}>
                  <i />
                  <i />
                  <i />
                </span>
              </li>
            )}
          </ol>
        </GlassCard>

        <div className={styles.right}>
          <GlassCard padding="md" radius="lg">
            <h2 className={styles.h2}>협업 그래프</h2>
            {m && <TeamGraph members={m.members.map((x) => x.character)} spoke={spoke} active={done ? undefined : shown.at(-1)?.from} />}
          </GlassCard>
          <div className={styles.metrics}>
            <Metric label="메시지" value={metrics.messages} />
            <Metric label="도구 호출" value={metrics.toolCalls} />
            <Metric label="검색" value={metrics.searches} />
          </div>
          <GlassCard padding="md" radius="lg">
            <h2 className={styles.h2}>최종 계획</h2>
            {!done ? (
              <p className={styles.wait}>친구들이 계획을 세우는 중이에요…</p>
            ) : result.data ? (
              <ul className={styles.plan}>
                {result.data.contributions
                  .filter((c) => c.character !== m?.members[0]?.character)
                  .map((c) => (
                    <li key={c.character}>
                      <span className={styles.tick}>
                        <Icon name="check" size={12} />
                      </span>
                      {c.text} ({name(c.character)})
                    </li>
                  ))}
              </ul>
            ) : (
              <Skeleton shape="text" lines={3} />
            )}
          </GlassCard>
          <div className={styles.actions}>
            <span ref={whyRef}>
              <Button variant="why" disabled={!result.data} onClick={() => setWhyOpen((o) => !o)} aria-expanded={whyOpen}>
                WHY? 이 계획인 이유
              </Button>
            </span>
            <Button variant="secondary" onClick={() => setRun((r) => r + 1)} iconLeft={<Icon name="refresh" size={16} />}>
              다시 실행
            </Button>
          </div>
          {done && (
            <Button to={`/team-missions/${id}/result`} block iconRight={<Icon name="arrow-right" size={16} />}>
              미션 결과 보기
            </Button>
          )}
        </div>
      </div>

      <Popover open={whyOpen} onClose={() => setWhyOpen(false)} anchorRef={whyRef} placement="top-start" width={380} label="이 계획인 이유">
        {result.data && (
          <div className={styles.why}>
            <span className={styles.whyEyebrow}>WHY? · 이 계획인 이유</span>
            <p>{result.data.summary}</p>
            <ul>
              {result.data.contributions.map((c) => (
                <li key={c.character}>
                  <strong>{name(c.character)}</strong> {c.text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Popover>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

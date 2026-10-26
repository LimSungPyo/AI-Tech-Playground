import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { getCards, getExperiments, getMyBadges } from '../../api'
import type { ExperimentSummary, TechCard } from '../../api/types'
import { Button, Character, Chip, EmptyState, ProgressBar, Skeleton, cx } from '../../components'
import { useAuth } from '../../auth/useAuth'
import { useApi } from '../../hooks/useApi'
import styles from './CardsPage.module.css'

type Owned = 'all' | 'owned' | 'missing'

// W2 growth 담당 · 경로 /cards · H-10 기술 카드 모음 (81:20063)
export default function CardsPage() {
  const cards = useApi((signal) => getCards(signal), [])
  const exps = useApi((signal) => getExperiments({}, signal), [])
  const { isMember } = useAuth()
  // 다음 배지 "기술 카드 수집가" 진행(v2 badge.progress)
  const badges = useApi(isMember ? (signal) => getMyBadges(signal) : null, [isMember])
  const collector = badges.data?.find((b) => b.id === 'card-collector' && !b.obtained)
  const [topic, setTopic] = useState<string | null>(null)
  const [owned, setOwned] = useState<Owned>('all')

  const expById = useMemo(() => new Map((exps.data ?? []).map((e) => [e.id, e])), [exps.data])
  const list = useMemo(() => cards.data ?? [], [cards.data])
  // 주제 칩: 카드가 나온 실험의 분야(subtitle)
  const topics = useMemo(
    () => [...new Set(list.map((c) => expById.get(c.experimentId)?.subtitle).filter((t): t is string => !!t))],
    [list, expById],
  )
  const shown = list.filter(
    (c) =>
      (topic === null || expById.get(c.experimentId)?.subtitle === topic) &&
      (owned === 'all' || (owned === 'owned' ? c.unlocked : !c.unlocked)),
  )
  const got = list.filter((c) => c.unlocked).length
  // "기술 카드 5장 열람" × 남은 진행률 → 남은 장수
  const goal = Number(collector?.description.match(/(\d+)장/)?.[1])
  const left = collector && goal ? Math.ceil((goal * (100 - (collector.progress ?? 0))) / 100) : undefined

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>TECH CARDS</span>
          <h1 className={styles.title}>기술 카드 모음</h1>
          <p className={styles.sub}>실험 속 반전을 볼 때마다 한 장씩 모여요</p>
        </div>
        {cards.data && (
          <div className={styles.collect}>
            <div className={styles.collectHead}>
              <span>수집</span>
              <span className={styles.collectNum}>
                {got} / {list.length}
              </span>
            </div>
            <ProgressBar value={got} max={list.length || 1} size="sm" />
            <p className={styles.collectCaption}>
              {collector && left
                ? `다음 배지 "${collector.name}" · ${left}장 남음`
                : got < list.length
                ? `아직 못 만난 카드 ${list.length - got}장 · 실험을 끝내고 반전을 보면 열려요`
                : '모든 카드를 모았어요!'}
            </p>
          </div>
        )}
      </header>

      <div className={styles.filters}>
        <div className={styles.chips}>
          <Chip selected={topic === null} onClick={() => setTopic(null)} className={styles.chip}>
            전체
          </Chip>
          {topics.map((t) => (
            <Chip
              key={t}
              selected={topic === t}
              onClick={() => setTopic(topic === t ? null : t)}
              className={styles.chip}
            >
              {t}
            </Chip>
          ))}
        </div>
        <div className={styles.chips}>
          <Chip
            selected={owned === 'owned'}
            onClick={() => setOwned(owned === 'owned' ? 'all' : 'owned')}
            className={styles.chip}
          >
            획득 {got}
          </Chip>
          <Chip
            selected={owned === 'missing'}
            onClick={() => setOwned(owned === 'missing' ? 'all' : 'missing')}
            className={styles.chip}
          >
            미획득 {list.length - got}
          </Chip>
        </div>
      </div>

      {cards.loading && (
        <div className={styles.grid}>
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} height={300} />
          ))}
        </div>
      )}
      {cards.error && (
        <EmptyState
          expression="confused"
          title="기술 카드를 불러오지 못했어요"
          description={cards.error.message}
          action={<Button onClick={cards.reload}>다시 시도</Button>}
        />
      )}
      {cards.data && shown.length === 0 && <EmptyState title="조건에 맞는 카드가 없어요" compact />}
      {shown.length > 0 && (
        <ul className={styles.grid}>
          {shown.map((c) => (
            <li key={c.id}>
              <CardTile card={c} exp={expById.get(c.experimentId)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CardTile({ card, exp }: { card: TechCard; exp?: ExperimentSummary }) {
  const topic = exp?.subtitle ?? ''
  const code = exp?.code ?? `#${card.experimentId}`
  if (!card.unlocked) {
    return (
      <Link
        to={`/experiments/${card.experimentId}`}
        className={cx(styles.tile, styles.locked)}
        aria-label={`잠긴 카드 · ${code} 플레이 시 획득`}
      >
        <span className={styles.topic}>{topic}</span>
        <div className={styles.art}>{exp && <Character id={exp.character} size={96} locked alt="" />}</div>
        <p className={styles.name}>???</p>
        <span className={styles.from}>{code} 플레이 시 획득</span>
      </Link>
    )
  }
  return (
    <Link to={`/cards/${card.id}`} className={styles.tile}>
      <span className={styles.topic}>{topic}</span>
      <div className={styles.art}>{exp && <Character id={exp.character} size={96} alt="" />}</div>
      <p className={styles.name}>{card.title}</p>
      <span className={styles.from}>출처 {code} 반전</span>
    </Link>
  )
}

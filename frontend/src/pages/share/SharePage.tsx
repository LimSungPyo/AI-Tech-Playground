import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { getShared, runTrial } from '../../api'
import type { SharedRecord } from '../../api/types'
import { useAuth } from '../../auth/useAuth'
import {
  Avatar,
  Button,
  CHARACTERS,
  Character,
  EmptyState,
  Icon,
  Mascot,
  Modal,
  ProgressBar,
  Skeleton,
} from '../../components'
import { useApi } from '../../hooks/useApi'
import { ReplayArena } from '../report/components/ReplayArena'
import { useReplay } from '../report/components/useReplay'
import styles from './SharePage.module.css'

// W2 growth 담당 · 경로 /share/:shareId · H-04 공유 링크 · 비회원 랜딩 (80:12419)
export default function SharePage() {
  const { shareId = '' } = useParams()
  const shared = useApi((signal) => getShared(shareId, signal), [shareId])

  if (shared.loading) {
    return (
      <div className={styles.page}>
        <Skeleton height={48} width={320} />
        <div className={styles.hero}>
          <Skeleton shape="circle" width={360} />
          <Skeleton height={320} />
        </div>
      </div>
    )
  }
  if (!shared.data) {
    return (
      <EmptyState
        expression="confused"
        title={shared.error?.status === 404 ? '공유 링크가 만료됐거나 없는 링크예요' : '공유 기록을 불러오지 못했어요'}
        description={shared.error?.message}
        action={<Button to="/lab">실험실 둘러보기</Button>}
      />
    )
  }
  return <ShareView rec={shared.data} />
}

function ShareView({ rec }: { rec: SharedRecord }) {
  const { isMember } = useAuth()
  const [replayOpen, setReplayOpen] = useState(false)
  const exp = rec.experiment
  const name = CHARACTERS[rec.character].name
  const playTo = `/experiments/${exp.id}/play`
  // #001은 Figma 문구 그대로(먹이 찾기), 다른 실험은 공통 문구
  const achieved = exp.id === '001' ? '처음으로 먹이를 찾았어요' : '처음으로 성공했어요'

  return (
    <div className={styles.page}>
      <p className={styles.sharer}>
        <Avatar name={rec.nickname} size={28} />
        <span>{rec.nickname} 님이 결과를 공유했어요</span>
      </p>

      <section className={styles.hero}>
        <div className={styles.portrait}>
          {rec.character === 'drosi' ? (
            <Mascot expression="champion" size={300} float alt="" />
          ) : (
            <Character id={rec.character} size={280} float alt="" />
          )}
        </div>
        <div className={styles.info}>
          <span className={styles.eyebrow}>EXPERIMENT {exp.code} · 결과</span>
          <h1 className={styles.title}>
            {name}가 {rec.trials}번째 훈련에서
            <br />
            {achieved}
          </h1>
          <dl className={styles.stats}>
            <div>
              <dt>최종</dt>
              <dd>{Math.round(rec.rate)}%</dd>
            </div>
            <div>
              <dt>첫 성공</dt>
              <dd>T{rec.trials}</dd>
            </div>
          </dl>
          <p className={styles.desc}>
            {exp.title} — {exp.subtitle}를 직접 훈련시키는 실험이에요. 가입 없이 {exp.durationMin}분이면 해볼 수 있어요.
          </p>
          <div className={styles.actions}>
            <Button to={playTo} size="lg" iconRight={<Icon name="arrow-right" size={18} />}>
              {isMember ? '나도 해보기' : '나도 해보기 · 가입 없이'}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => setReplayOpen(true)}>
              리플레이 보기
            </Button>
          </div>
        </div>
      </section>

      <section className={styles.compare}>
        <div className={styles.compareHead}>
          <h2 className={styles.compareTitle}>친구 기록과 비교해 볼래요?</h2>
          <span className={styles.compareHint}>끝나면 자동으로 비교 카드를 보여줘요</span>
        </div>
        <div className={styles.bars}>
          <div>
            <p className={styles.barName}>{rec.nickname} 님</p>
            <ProgressBar value={rec.rate} size="sm" />
            <p className={styles.barValue}>{Math.round(rec.rate)}%</p>
          </div>
          <div>
            <p className={styles.barName}>나</p>
            <ProgressBar value={0} size="sm" tone="dark" />
            <p className={styles.barUnknown}>?</p>
          </div>
        </div>
      </section>

      {!isMember && (
        <p className={styles.member}>
          이미 회원이에요{' '}
          <Link to={`/login?returnTo=${encodeURIComponent(playTo)}`} className={styles.memberLink}>
            로그인하고 이어서 →
          </Link>
        </p>
      )}

      <ReplayModal open={replayOpen} onClose={() => setReplayOpen(false)} rec={rec} />
    </div>
  )
}

/** 공유한 사람의 리플레이(1회차 vs 최근) — POST trials 한 번으로 경로를 받는다 */
function ReplayModal({ open, onClose, rec }: { open: boolean; onClose: () => void; rec: SharedRecord }) {
  const trial = useApi(open ? () => runTrial(rec.experiment.id, { missionId: 'm1', speed: 1 }) : null, [
    open,
    rec.experiment.id,
  ])
  const replay = useReplay([4000, 2000])
  const goal = trial.data?.path[trial.data.path.length - 1]
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      eyebrow={`REPLAY · ${rec.experiment.code}`}
      title={`${rec.nickname} 님의 ${CHARACTERS[rec.character].name}`}
      showClose
      footer={
        <Button
          iconLeft={<Icon name="play" size={14} />}
          onClick={replay.play}
          disabled={!trial.data || replay.playing}
        >
          나란히 재생
        </Button>
      }
    >
      {trial.loading && <Skeleton height={240} />}
      {trial.error && <EmptyState compact expression="confused" title="리플레이를 불러오지 못했어요" />}
      {trial.data && (
        <div className={styles.replays}>
          <figure>
            <ReplayArena
              path={trial.data.firstPath}
              t={replay.progress[0]}
              expression="confused"
              label="1회차"
              goal={goal}
            />
            <figcaption>TRIAL 1</figcaption>
          </figure>
          <figure>
            <ReplayArena
              path={trial.data.path}
              t={replay.progress[1]}
              expression="champion"
              label={`${rec.trials}회차`}
              goal={goal}
            />
            <figcaption>TRIAL {rec.trials}</figcaption>
          </figure>
        </div>
      )}
    </Modal>
  )
}

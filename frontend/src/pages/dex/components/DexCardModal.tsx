import type { Badge as BadgeData, DexEntry } from '../../../api'
import { Badge, Button, Character, IconButton, Modal } from '../../../components'
import { DEX_STATE_LABEL } from '../dexMeta'
import styles from './DexCardModal.module.css'

interface Props {
  entry: DexEntry | undefined
  /** 카드 왼쪽 배경색(실험 thumbnailColor) */
  color?: string
  /** GET /me/badges — entry.badges(id)의 이름 · 아이콘 찾기 */
  badges: BadgeData[]
  /** 비회원 맛보기면 버튼을 로그인 유도로 */
  loginTo?: string
  onClose: () => void
  onMove: (step: 1 | -1) => void
}

const fmtDate = (iso?: string) => (iso ? iso.slice(0, 10).replace(/-/g, '.') : '')

/** H-02 AI 도감 · 카드 상세 */
export function DexCardModal({ entry, color, badges, loginTo, onClose, onMove }: Props) {
  const earned = (entry?.badges ?? []).map((id) => badges.find((b) => b.id === id)).filter((b): b is BadgeData => !!b)
  return (
    <Modal open={!!entry} onClose={onClose} size="xl" showClose className={styles.modal}>
      {entry && (
        <div className={styles.layout}>
          <div className={styles.left} style={color ? { background: `color-mix(in srgb, ${color} 22%, white)` } : undefined}>
            <span className={styles.no}>No.{entry.experimentId}</span>
            {entry.obtained ? (
              <Character id={entry.character} size={180} float />
            ) : (
              <span className={styles.unknown} aria-hidden>
                ?
              </span>
            )}
            <strong className={styles.name}>{entry.name}</strong>
            <div className={styles.badges}>
              <Badge tone={entry.state === 'master' ? 'pink' : 'neutral'}>{DEX_STATE_LABEL[entry.state]}</Badge>
              {entry.obtained && <Badge tone="neutral">{'★'.repeat(Math.max(1, entry.level))}</Badge>}
            </div>
            {entry.obtainedAt && <span className={styles.date}>{fmtDate(entry.obtainedAt)} 획득</span>}
          </div>

          <div className={styles.right}>
            <span className={styles.species}>
              {entry.species} · EXP #{entry.experimentId}
            </span>
            <p className={styles.quote}>"{entry.why}"</p>

            {entry.obtained ? (
              <div className={styles.stats}>
                <Stat label="최고 성공률" value={entry.bestRate !== undefined ? `${Math.round(entry.bestRate)}%` : '—'} />
                <Stat label="총 훈련" value={entry.trials !== undefined ? `${entry.trials}회` : '—'} />
                <Stat label="WHY? 사용" value={entry.whyCount !== undefined ? `${entry.whyCount}번` : '—'} />
              </div>
            ) : (
              <div className={styles.locked}>아직 만나지 못한 친구예요 · {entry.meetCondition}</div>
            )}

            <h3 className={styles.h3}>성격</h3>
            <p className={styles.text}>{entry.personality}</p>
            <h3 className={styles.h3}>만나는 방법</h3>
            <p className={styles.text}>{entry.meetCondition}</p>

            {earned.length > 0 && (
              <>
                <h3 className={styles.h3}>획득한 배지</h3>
                <ul className={styles.earned}>
                  {earned.map((b) => (
                    <li key={b.id} className={styles.earnedChip}>
                      <span aria-hidden>{b.icon}</span> {b.name}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className={styles.footer}>
              {loginTo ? (
                <Button to={loginTo} className={styles.grow}>
                  로그인하고 내 도감 만들기
                </Button>
              ) : entry.obtained ? (
                <>
                  <Button to={`/experiments/${entry.experimentId}/report`} className={styles.grow}>
                    성장 리포트 · 공유
                  </Button>
                  <Button to={`/experiments/${entry.experimentId}/play`} variant="secondary">
                    다시 플레이
                  </Button>
                </>
              ) : (
                <Button to={`/experiments/${entry.experimentId}`} className={styles.grow}>
                  실험 보러 가기
                </Button>
              )}
              <span className={styles.nav}>
                <IconButton icon="chevron-left" label="이전 카드" onClick={() => onMove(-1)} />
                <IconButton icon="chevron-right" label="다음 카드" onClick={() => onMove(1)} />
              </span>
            </div>
          </div>
        </div>
      )}
    </Modal>
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

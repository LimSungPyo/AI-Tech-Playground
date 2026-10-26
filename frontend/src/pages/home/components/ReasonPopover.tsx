import type { RefObject } from 'react'
import type { Recommendation } from '../../../api/types'
import { Character, Mascot, Popover, useToast } from '../../../components'
import { parseReason } from '../format'
import styles from './ReasonPopover.module.css'

interface Props {
  open: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
  recommendations: Recommendation[]
}

/** 추천 제목을 팝오버용으로 줄인다: 기술 카드는 "기술 카드 · 커넥톰" 꼴 */
function shortTitle(r: Recommendation) {
  return r.kind === 'card' ? `${r.badge} · ${r.title.replace(/[?？].*$/, '').replace(/은 어떻게.*$|는 어떻게.*$/, '')}` : r.title
}

/** D-06 추천 이유 팝오버 — 내 기록에서 찾은 신호 → 추천 점수 */
export function ReasonPopover({ open, onClose, anchorRef, recommendations }: Props) {
  const toast = useToast()
  return (
    <Popover open={open} onClose={onClose} anchorRef={anchorRef} placement="bottom-end" width={520} dim label="추천 이유">
      <div className={styles.root}>
        <header className={styles.head}>
          <Mascot expression="why" size={44} alt="" />
          <div>
            <h3 className={styles.title}>WHY? 이 {recommendations.length}개를 추천한 이유</h3>
            <p className={styles.sub}>내 기록에서 찾은 신호 → 추천 점수</p>
          </div>
        </header>
        <ul className={styles.list}>
          {recommendations.map((r) => {
            const { score, signals } = parseReason(r.reason)
            return (
              <li key={r.id} className={styles.item}>
                <div className={styles.row}>
                  <Character id={r.character} size={32} alt="" />
                  <span className={styles.name}>{shortTitle(r)}</span>
                  {score !== undefined && <span className={styles.score}>{score.toFixed(2)}</span>}
                </div>
                <div className={styles.signals}>
                  {signals.map((s) => (
                    <span key={s} className={styles.signal}>
                      {s}
                    </span>
                  ))}
                </div>
              </li>
            )
          })}
        </ul>
        <footer className={styles.foot}>
          <button
            type="button"
            className={styles.formula}
            onClick={() =>
              toast.show({
                title: '추천 공식',
                description: '최근 성공률 변화 · 해금 상태 · 미접속 일수 · 배지 진행도를 더해 0~1 점수로 매겨요.',
                tone: 'why',
                duration: 6000,
              })
            }
          >
            추천 공식 보기
          </button>
          <button
            type="button"
            className={styles.less}
            onClick={() => {
              onClose()
              toast.show({ title: '의견을 반영할게요', description: '비슷한 추천을 줄여 볼게요.' })
            }}
          >
            이런 추천 줄이기
          </button>
        </footer>
      </div>
    </Popover>
  )
}

import type { CharacterId } from '../../../api'
import { Character, cx } from '../../../components'
import styles from './TeamGraph.module.css'

interface Props {
  /** 첫 번째가 리더 */
  members: CharacterId[]
  /** 지금까지 말한 캐릭터(결과 보고 선을 켠다) */
  spoke: Set<CharacterId>
  /** 지금 말하는 캐릭터 */
  active?: CharacterId
}

const W = 320
const H = 230

/** B-13 협업 그래프: 리더 → 팀원 작업 배정(실선), 팀원 → 리더 결과 보고(점선) */
export function TeamGraph({ members, spoke, active }: Props) {
  const [leader, ...rest] = members
  if (!leader) return null
  const top = { x: W / 2, y: 40 }
  const spots = rest.map((c, i) => ({ c, x: rest.length === 1 ? W / 2 : 40 + (i * (W - 80)) / (rest.length - 1), y: H - 40 }))

  return (
    <div className={styles.wrap}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} aria-hidden>
        {spots.map((s) => (
          <g key={s.c}>
            <line x1={top.x} y1={top.y + 24} x2={s.x} y2={s.y - 24} className={styles.assign} />
            <path
              d={`M${s.x} ${s.y - 24} Q ${(top.x + s.x) / 2 + 18} ${(top.y + s.y) / 2} ${top.x + 6} ${top.y + 24}`}
              className={cx(styles.report, spoke.has(s.c) && styles.reportOn)}
            />
          </g>
        ))}
      </svg>
      {[{ c: leader, x: top.x, y: top.y }, ...spots].map((s) => (
        <span
          key={s.c}
          className={cx(styles.node, active === s.c && styles.active)}
          style={{ left: `${(s.x / W) * 100}%`, top: `${(s.y / H) * 100}%` }}
        >
          <Character id={s.c} size={48} />
        </span>
      ))}
      <div className={styles.legend}>
        <span className={styles.legendAssign}>━ 작업 배정</span>
        <span>┅ 결과 보고</span>
      </div>
    </div>
  )
}

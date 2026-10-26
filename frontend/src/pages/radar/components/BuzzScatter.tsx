import type { RadarKeyword } from '../../../api/types'
import styles from './BuzzScatter.module.css'

interface Props {
  keywords: RadarKeyword[]
  selectedId?: string | null
  onSelect: (id: string) => void
}

const W = 400
const H = 260
const PAD = 22

/** 화제성(이번 주 언급량) × 성장률(지난주 대비) 산점도 */
export function BuzzScatter({ keywords, selectedId, onSelect }: Props) {
  if (keywords.length === 0) return null
  const buzz = keywords.map((k) => k.weeks[k.weeks.length - 1] ?? 0)
  const growth = keywords.map((k) => k.changePct)
  const [bMin, bMax] = [Math.min(...buzz), Math.max(...buzz)]
  const gAbs = Math.max(10, ...growth.map((g) => Math.abs(g)))
  const x = (b: number) => PAD + ((b - bMin) / (bMax - bMin || 1)) * (W - PAD * 2)
  const y = (g: number) => H / 2 - (g / gAbs) * (H / 2 - PAD)

  return (
    <div className={styles.root}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label="화제성 × 성장률 산점도">
        <rect x="0" y="0" width={W} height={H} rx="16" className={styles.bg} />
        <line x1={W / 2} y1={PAD / 2} x2={W / 2} y2={H - PAD / 2} className={styles.axis} />
        <line x1={PAD / 2} y1={H / 2} x2={W - PAD / 2} y2={H / 2} className={styles.axis} />
        {keywords.map((k, i) => {
          const tone = k.changePct < 0 ? styles.down : k.changePct >= 20 ? styles.hot : styles.warm
          const sel = k.id === selectedId
          return (
            <g
              key={k.id}
              className={styles.dot}
              role="button"
              tabIndex={0}
              aria-label={`${k.name} · 성장률 ${Math.round(k.changePct)}%`}
              onClick={() => onSelect(k.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(k.id)
                }
              }}
            >
              <title>{`${k.name} · ${k.changePct >= 0 ? '▲' : '▼'} ${Math.abs(Math.round(k.changePct))}%`}</title>
              <circle cx={x(buzz[i])} cy={y(growth[i])} r={sel ? 12 : k.changePct >= 20 ? 10 : 8} className={tone} />
              {sel && <circle cx={x(buzz[i])} cy={y(growth[i])} r={17} className={styles.ring} />}
            </g>
          )
        })}
      </svg>
      <div className={styles.legend}>
        <span>↑ 빠르게 크는 중</span>
        <span>화제성 →</span>
      </div>
    </div>
  )
}

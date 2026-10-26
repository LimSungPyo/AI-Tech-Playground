import type { NeuronActivation } from '../../../api'
import { cx } from '../../../components'
import styles from './NeuralNet.module.css'

type Layer = NeuronActivation['layer']
const LAYERS: Layer[] = ['sensory', 'inter', 'motor']

// 아직 회차 결과가 없을 때 보여 줄 빈 뼈대(감각 6 · 중간 6 · 운동 4)
const SKELETON: NeuronActivation[] = [
  ...[1, 2, 3, 4, 5, 6].map((i) => ({ layer: 'sensory' as const, id: `S${i}`, activation: 0 })),
  ...[1, 2, 3, 4, 5, 6].map((i) => ({ layer: 'inter' as const, id: `I${i}`, activation: 0 })),
  ...[1, 2, 3, 4].map((i) => ({ layer: 'motor' as const, id: `M${i}`, activation: 0 })),
]

export interface NeuralNetProps {
  neurons?: NeuronActivation[]
  /** 이번 선택에 가장 크게 기여한 경로(뉴런 id) */
  path?: string[]
  /** 재생 중이면 활성도가 출렁인다 */
  phase?: number
  live?: boolean
  /** 경로를 굵게 강조(WHY? 딥다이브) */
  emphasizePath?: boolean
  height?: number
  className?: string
}

const W = 360

/** 감각 → 중간 → 운동 뉴런. 활성도에 따라 밝기, 층 사이 연결선 */
export function NeuralNet({ neurons, path = [], phase = 0, live, emphasizePath, height = 220, className }: NeuralNetProps) {
  const list = neurons?.length ? neurons : SKELETON
  const H = height
  const cols = LAYERS.map((layer) => list.filter((n) => n.layer === layer))
  const xs = [16, W / 2, W - 16]
  const pos = new Map<string, { x: number; y: number; a: number; i: number }>()
  cols.forEach((col, c) => {
    const gap = col.length > 1 ? (H - 32) / (col.length - 1) : 0
    col.forEach((n, i) => {
      const wave = live ? 0.75 + 0.25 * Math.sin(phase * 1.6 + i * 1.3 + c) : 1
      pos.set(n.id, { x: xs[c], y: col.length > 1 ? 16 + gap * i : H / 2, a: n.activation * wave, i })
    })
  })
  const onPath = (a: string, b: string) => {
    const i = path.indexOf(a)
    return i >= 0 && path[i + 1] === b
  }

  return (
    <svg className={cx(styles.net, className)} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`신경망 활성 상태${path.length ? ` · 경로 ${path.join(' → ')}` : ''}`}>
      <g>
        {cols.slice(0, -1).flatMap((col, c) =>
          col.flatMap((a) =>
            cols[c + 1].map((b) => {
              const pa = pos.get(a.id)!
              const pb = pos.get(b.id)!
              const hot = onPath(a.id, b.id)
              return (
                <line
                  key={`${a.id}-${b.id}`}
                  x1={pa.x}
                  y1={pa.y}
                  x2={pb.x}
                  y2={pb.y}
                  className={cx(styles.link, hot && styles.hot, hot && emphasizePath && styles.thick)}
                  style={hot ? undefined : { opacity: 0.25 + Math.min(pa.a, pb.a) * 0.5 }}
                />
              )
            }),
          ),
        )}
      </g>
      {list.map((n) => {
        const p = pos.get(n.id)!
        const strong = p.a >= 0.5 || path.includes(n.id)
        return (
          <g key={n.id} className={cx(styles.node, strong && styles.strong)}>
            {strong && <circle cx={p.x} cy={p.y} r={emphasizePath ? 12 : 14} className={styles.halo} />}
            <circle
              cx={p.x}
              cy={p.y}
              r={strong ? 10 : 6.5}
              className={styles.dot}
              style={{ fillOpacity: emphasizePath && !path.includes(n.id) ? 0 : 0.12 + Math.min(1, p.a) * 0.88 }}
            >
              <title>{`${n.id} · 활성도 ${n.activation.toFixed(2)}`}</title>
            </circle>
          </g>
        )
      })}
    </svg>
  )
}

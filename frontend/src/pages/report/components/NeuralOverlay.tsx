import styles from './NeuralOverlay.module.css'

// 마스코트 몸 위 신경망(감각 → 중간 → 운동). 좌표는 0~100 비율, 순서대로 켜진다
const NODES = [
  { id: 's1', x: 36, y: 30, layer: 0 },
  { id: 's2', x: 50, y: 24, layer: 0 },
  { id: 's3', x: 64, y: 30, layer: 0 },
  { id: 'i1', x: 40, y: 50, layer: 1 },
  { id: 'i2', x: 50, y: 56, layer: 1 },
  { id: 'i3', x: 60, y: 50, layer: 1 },
  { id: 'm1', x: 42, y: 74, layer: 2 },
  { id: 'm2', x: 50, y: 80, layer: 2 },
  { id: 'm3', x: 58, y: 74, layer: 2 },
]
const EDGES = NODES.flatMap((a) =>
  NODES.filter((b) => b.layer === a.layer + 1 && Math.abs(a.x - b.x) <= 14).map((b) => [a, b] as const),
)

/** 반전 연출 · 기술 카드 헤더에서 쓰는 신경 연결망 그림 */
/** ringOnly: 그림 자체에 신경망이 있는 드로시 neuron 표정 위에서는 고리만 */
export function NeuralOverlay({ className, ringOnly }: { className?: string; ringOnly?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className={`${styles.net} ${className ?? ''}`} aria-hidden>
      <circle cx="50" cy="52" r="47" className={styles.ring} />
      {!ringOnly &&
        EDGES.map(([a, b]) => (
          <line
            key={`${a.id}-${b.id}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            className={styles.edge}
            style={{ animationDelay: `${a.layer * 180 + 90}ms` }}
          />
        ))}
      {!ringOnly &&
        NODES.map((n) => (
          <circle
            key={n.id}
            cx={n.x}
            cy={n.y}
            r={1.8}
            className={styles.node}
            style={{ animationDelay: `${n.layer * 180}ms` }}
          />
        ))}
    </svg>
  )
}

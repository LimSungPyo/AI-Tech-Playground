import type { TechCard } from '../../../api/types'
import styles from './StepDiagram.module.css'

type Kind = TechCard['steps'][number]['kind']

const dots = (cols: number, rows: number, x0: number, y0: number, gap: number) =>
  Array.from({ length: cols * rows }, (_, i) => ({ x: x0 + (i % cols) * gap, y: y0 + Math.floor(i / cols) * gap }))

/** 기술 카드 단계별 작은 도식(원본 연구 · 메커니즘 · 단순화 · 구현) */
export function StepDiagram({ kind }: { kind: Kind }) {
  return (
    <svg viewBox="0 0 200 100" className={styles.svg} aria-hidden>
      {kind === 'research' &&
        dots(12, 5, 24, 18, 13.5).map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={(i * 7) % 5 === 0 ? 3 : 2} className={(i * 7) % 5 === 0 ? styles.hot : styles.dim} />
        ))}
      {kind === 'mechanism' && (
        <>
          {[40, 100, 160].map((x, li) =>
            [30, 50, 70].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r={6} className={li === 1 ? styles.mid : styles.hot} />),
          )}
          <path d="M50 50 H88 M112 50 H150" className={styles.arrow} markerEnd="url(#a)" />
          <defs>
            <marker id="a" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0 0 L6 3 L0 6 Z" className={styles.head} />
            </marker>
          </defs>
          <text x="40" y="94" className={styles.label}>감각</text>
          <text x="100" y="94" className={styles.label}>중간</text>
          <text x="160" y="94" className={styles.label}>운동</text>
        </>
      )}
      {kind === 'simplification' && (
        <>
          {dots(5, 4, 22, 22, 13).map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={2.4} className={styles.dim} />
          ))}
          <path d="M98 50 H120" className={styles.arrow} />
          {dots(2, 2, 150, 38, 24).map((p, i) => (
            <circle key={`s${i}`} cx={p.x} cy={p.y} r={6} className={styles.hot} />
          ))}
        </>
      )}
      {kind === 'implementation' && (
        <>
          <rect x="14" y="30" width="44" height="40" rx="8" className={styles.box} />
          <circle cx="100" cy="50" r="18" className={styles.mid} />
          <rect x="142" y="30" width="44" height="40" rx="8" className={styles.box} />
          <path d="M62 50 H78 M122 50 H138" className={styles.arrow} />
          <text x="36" y="54" className={styles.label}>입력</text>
          <text x="100" y="54" className={styles.labelOn}>뉴런</text>
          <text x="164" y="54" className={styles.label}>행동</text>
        </>
      )}
    </svg>
  )
}

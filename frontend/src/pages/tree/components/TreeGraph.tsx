import { useLayoutEffect, useRef, useState } from 'react'
import type { TreeNode } from '../../../api'
import { Character, cx, Icon } from '../../../components'
import { LEVEL_NAME, LEVEL_ORDER, nodeMeta } from '../treeMeta'
import styles from './TreeGraph.module.css'

const NODE_W = 216
const NODE_H = 72
const CANVAS_H = 440

interface Props {
  nodes: TreeNode[]
  selectedId?: string
  /** false면 진행 상태를 숨긴다(비회원) */
  showStatus: boolean
  /** 범례에서 고른 상태. 다른 상태 노드는 흐리게 */
  highlight?: TreeNode['status'] | null
  onSelect: (id: string) => void
}

/** B-12 트리 캔버스. 노드 좌표(0~100 비율)는 노드 가운데, 선은 부모 오른쪽 → 자식 왼쪽 곡선 */
export function TreeGraph({ nodes, selectedId, showStatus, highlight, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(900)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setWidth(el.clientWidth || 900)
    update()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 끝 노드가 잘리지 않도록 좌표 범위를 캔버스 안쪽(노드 반 폭만큼)으로 맞춘다
  const xs = nodes.map((n) => n.position.x)
  const ys = nodes.map((n) => n.position.y)
  const scale = (v: number, min: number, max: number, size: number, node: number) =>
    max === min ? size / 2 : node / 2 + ((size - node) * (v - min)) / (max - min)
  const px = (x: number) => scale(x, Math.min(...xs), Math.max(...xs), width, NODE_W)
  const py = (y: number) => scale(y, Math.min(...ys), Math.max(...ys), CANVAS_H, NODE_H)
  const byId = new Map(nodes.map((n) => [n.id, n]))

  // 티어 라벨은 세로 열마다 하나. 열 안에서 가장 낮은 단계 이름을 쓴다(예: 심화 + 최전선 열 → 심화)
  const columns = [...new Set(xs)].sort((a, b) => a - b)
  const tiers = columns.map((x, i) => {
    const level = nodes
      .filter((n) => n.position.x === x)
      .map((n) => n.level)
      .sort((a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b))[0]
    return { key: x, left: px(x) - NODE_W / 2, label: `TIER ${i + 1} · ${LEVEL_NAME[level]}` }
  })

  const edges = nodes.flatMap((child) =>
    child.parents
      .map((pid) => byId.get(pid))
      .filter((p): p is TreeNode => !!p)
      .map((parent) => {
        const x1 = px(parent.position.x) + NODE_W / 2
        const y1 = py(parent.position.y)
        const x2 = px(child.position.x) - NODE_W / 2
        const y2 = py(child.position.y)
        const mx = (x1 + x2) / 2
        const live = showStatus ? child.status !== 'locked' && parent.status !== 'locked' : true
        return { id: `${parent.id}-${child.id}`, d: `M${x1} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`, live }
      }),
  )

  return (
    <div className={styles.wrap}>
      <div className={styles.tiers} aria-hidden>
        {tiers.map((t) => (
          <span key={t.key} className={styles.tier} style={{ left: t.left }}>
            {t.label}
          </span>
        ))}
      </div>
      <div ref={ref} className={styles.canvas} style={{ height: CANVAS_H }}>
        <svg className={styles.edges} width={width} height={CANVAS_H} aria-hidden>
          {edges.map((e) => (
            <path key={e.id} d={e.d} className={cx(styles.edge, !e.live && styles.edgeLocked)} />
          ))}
        </svg>
        <ul className={styles.nodes} aria-label="기술 트리 노드">
          {nodes.map((n) => {
            const status = showStatus ? n.status : 'open'
            const dim = highlight && showStatus && n.status !== highlight
            return (
              <li
                key={n.id}
                className={styles.slot}
                style={{ left: px(n.position.x) - NODE_W / 2, top: py(n.position.y) - NODE_H / 2, width: NODE_W }}
              >
                <button
                  type="button"
                  className={cx(styles.node, styles[status], n.id === selectedId && styles.selected, dim && styles.dim)}
                  onClick={() => onSelect(n.id)}
                  aria-pressed={n.id === selectedId}
                >
                  <span className={styles.mark} aria-hidden>
                    {status === 'in_progress' && n.character ? (
                      <Character id={n.character} size={40} />
                    ) : status === 'done' ? (
                      <Icon name="check" size={18} />
                    ) : status === 'locked' ? (
                      '–'
                    ) : (
                      <span className={styles.ring} />
                    )}
                  </span>
                  <span className={styles.text}>
                    <span className={styles.title}>{n.title}</span>
                    <span className={styles.meta}>{nodeMeta(n, showStatus)}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

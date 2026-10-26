import { Link } from 'react-router'
import type { DexEntry, ExperimentSummary, TechCard, TreeNode } from '../../../api'
import { Badge, Button, Character, cx, Drawer, Icon, ProgressBar } from '../../../components'
import { experimentProgress, nodeCodes, nodeDescription, STATUS_LABEL } from '../treeMeta'
import styles from './NodeDetail.module.css'

interface Props {
  node: TreeNode | undefined
  nodes: TreeNode[]
  experiments: ExperimentSummary[]
  cards: TechCard[]
  dex: DexEntry[]
  isMember: boolean
  loginTo: string
  onClose: () => void
  onSelect: (id: string) => void
}

const STATUS_TONE = { done: 'success', in_progress: 'dark', open: 'success', locked: 'neutral' } as const

/** H-01 기술 트리 · 노드 상세 (오른쪽 서랍) */
export function NodeDetail({ node, nodes, experiments, cards, dex, isMember, loginTo, onClose, onSelect }: Props) {
  return (
    <Drawer open={!!node} onClose={onClose} eyebrow={node ? `NODE · ${node.title}` : undefined} className={styles.drawer}>
      {node && (
        <DetailBody
          node={node}
          nodes={nodes}
          experiments={experiments}
          cards={cards}
          dex={dex}
          isMember={isMember}
          loginTo={loginTo}
          onSelect={onSelect}
        />
      )}
    </Drawer>
  )
}

function DetailBody({ node, nodes, experiments, cards, dex, isMember, loginTo, onSelect }: Omit<Props, 'node' | 'onClose'> & { node: TreeNode }) {
  const codes = nodeCodes(node)
  const exps = codes.map((id) => experiments.find((e) => e.id === id)).filter((e): e is ExperimentSummary => !!e)
  const main = exps[0]
  const card = cards.find((c) => c.experimentId === node.experimentId)
  const mastery = isMember && node.character ? dex.find((d) => d.character === node.character && d.obtained) : undefined
  const parents = node.parents.map((id) => nodes.find((n) => n.id === id)).filter((n): n is TreeNode => !!n)
  const children = nodes.filter((n) => n.parents.includes(node.id))

  const primary = !isMember
    ? { label: '로그인하고 시작하기', to: loginTo }
    : node.status === 'locked' || !main
      ? null
      : node.status === 'in_progress' || main.status === 'in_progress'
        ? { label: `${main.code} 이어하기`, to: `/experiments/${main.id}/play` }
        : { label: `${main.code} 시작하기`, to: `/experiments/${main.id}` }

  return (
    <div className={styles.body}>
      <div className={styles.hero}>
        {node.character && <Character id={node.character} size={88} locked={isMember && node.status === 'locked'} />}
        <div className={styles.heroText}>
          <h2 className={styles.title}>{node.title}</h2>
          <div className={styles.badges}>
            {isMember && <Badge tone={STATUS_TONE[node.status]}>{STATUS_LABEL[node.status]}</Badge>}
            {mastery && <Badge tone="why">숙련도 Lv.{mastery.level}</Badge>}
          </div>
        </div>
      </div>
      <p className={styles.desc}>{nodeDescription(node)}</p>

      {mastery && (
        <div className={styles.mastery}>
          <div className={styles.masteryHead}>
            <strong>이 노드 숙련도</strong>
            <span className={styles.masteryValue}>{mastery.level} / 3</span>
          </div>
          <ProgressBar value={mastery.level} max={3} size="sm" />
          <span className={styles.caption}>
            {mastery.level >= 3 ? `${mastery.name} MASTER 달성` : `${CODE(mastery.experimentId)} 미션을 더 깨면 Lv.${mastery.level + 1}`}
          </span>
        </div>
      )}
      {isMember && node.status === 'locked' && node.unlockCondition && (
        <div className={styles.lockNote}>
          <Icon name="lock" size={16} /> {node.unlockCondition}
        </div>
      )}

      {exps.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.h3}>이 기술을 쓰는 실험</h3>
          <ul className={styles.expList}>
            {exps.map((e) => (
              <li key={e.id}>
                <Link to={`/experiments/${e.id}`} className={styles.expRow}>
                  <Character id={e.character} size={40} />
                  <span className={styles.expText}>
                    <strong>
                      {e.code} · {e.title}
                    </strong>
                    <span>{isMember ? experimentProgress(e) : e.subtitle}</span>
                  </span>
                  <Icon name="chevron-right" size={18} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(parents.length > 0 || children.length > 0) && (
        <section className={styles.section}>
          <h3 className={styles.h3}>연결된 노드</h3>
          <div className={styles.links}>
            {parents.map((p) => (
              <button key={p.id} type="button" className={cx(styles.link, styles.linkParent)} onClick={() => onSelect(p.id)}>
                ← {p.title} (선행)
              </button>
            ))}
            {children.map((c) => (
              <button key={c.id} type="button" className={styles.link} onClick={() => onSelect(c.id)}>
                {isMember && c.status === 'locked' && <Icon name="lock" size={12} />}→ {c.title}
              </button>
            ))}
          </div>
        </section>
      )}

      {card && (
        <Link to={`/cards/${card.id}`} className={styles.card}>
          <span className={styles.cardEyebrow}>TECH CARD</span>
          <strong className={styles.cardTitle}>{card.title}</strong>
          <span className={styles.cardBody}>{card.unlocked ? card.reveal.headline : '실험을 끝까지 하면 열려요'}</span>
        </Link>
      )}

      <div className={styles.footer}>
        {primary ? (
          <Button to={primary.to} size="lg" className={styles.primary}>
            {primary.label}
          </Button>
        ) : (
          <Button size="lg" disabled className={styles.primary} iconLeft={<Icon name="lock" size={16} />}>
            아직 잠겨 있어요
          </Button>
        )}
        {card && (
          <Button to={`/cards/${card.id}`} variant="secondary" size="lg">
            기술 카드
          </Button>
        )}
      </div>
    </div>
  )
}

const CODE = (id: string) => `#${id}`

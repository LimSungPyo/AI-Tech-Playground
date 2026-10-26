import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { getCards, getDex, getExperiments, getTree } from '../../api'
import type { TreeNode } from '../../api'
import { useAuth } from '../../auth/useAuth'
import { Badge, Button, EmptyState, GlassCard, Mascot, Skeleton, cx } from '../../components'
import { useApi } from '../../hooks/useApi'
import { NodeDetail } from './components/NodeDetail'
import { TreeGraph } from './components/TreeGraph'
import { defaultNode, nodeCodes, nodeDescription, STATUS_LABEL, TIER_LABEL } from './treeMeta'
import styles from './TreePage.module.css'

const LEGEND: { status: TreeNode['status']; label: string }[] = [
  { status: 'done', label: '● 완료' },
  { status: 'open', label: '○ 해금됨' },
  { status: 'locked', label: '잠김' },
]

const BLOCKS = ['LLM', '비전', '강화학습', '메모리']

// W2 world 담당 · 경로 /tree — B-12 기술 트리 · H-01 노드 상세
export default function TreePage() {
  const { isMember, status } = useAuth()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const tree = useApi((signal) => getTree(signal), [])
  const exps = useApi((signal) => getExperiments({}, signal), [])
  const cards = useApi((signal) => getCards(signal), [])
  const dex = useApi(isMember ? (signal) => getDex(signal) : null, [isMember])
  const [focusId, setFocusId] = useState<string>()
  const [highlight, setHighlight] = useState<TreeNode['status'] | null>(null)

  const nodes = tree.data?.nodes ?? []
  const openId = params.get('node') ?? undefined
  const openNode = nodes.find((n) => n.id === openId)
  const focus = nodes.find((n) => n.id === (openId ?? focusId)) ?? defaultNode(nodes)
  const showStatus = isMember
  const loginTo = `/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`

  const select = (id: string) => {
    setFocusId(id)
    setParams((p) => {
      p.set('node', id)
      return p
    })
  }
  const close = () =>
    setParams((p) => {
      p.delete('node')
      return p
    })

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>TECH TREE</span>
        <h1 className={styles.h1}>기술 트리</h1>
        <p className={styles.lead}>실험을 완료하면 다음 노드가 해금돼요. 기초 → 심화 → 최전선 순서로 확장됩니다.</p>
        {showStatus ? (
          <div className={styles.legend} role="group" aria-label="상태별로 강조하기">
            {LEGEND.map((l) => (
              <button
                key={l.status}
                type="button"
                className={cx(styles.legendChip, highlight === l.status && styles.legendOn)}
                aria-pressed={highlight === l.status}
                onClick={() => setHighlight((h) => (h === l.status ? null : l.status))}
              >
                {l.label}
              </button>
            ))}
          </div>
        ) : (
          status === 'guest' && (
            <div className={styles.guest}>
              <span>지금은 보기 전용이에요. 로그인하면 내 진행 상태와 추천이 보여요.</span>
              <Button to={loginTo} size="sm">
                로그인
              </Button>
            </div>
          )
        )}
      </header>

      <div className={styles.grid}>
        <GlassCard padding="lg" radius="lg" className={styles.canvasCard}>
          {tree.loading && !tree.data ? (
            <Skeleton height={480} />
          ) : tree.error ? (
            <EmptyState
              expression="confused"
              title="기술 트리를 불러오지 못했어요"
              description={tree.error.message}
              action={<Button onClick={tree.reload}>다시 시도</Button>}
            />
          ) : (
            <div className={styles.scroller}>
              <TreeGraph
                nodes={nodes}
                selectedId={focus?.id}
                showStatus={showStatus}
                highlight={highlight}
                onSelect={select}
              />
            </div>
          )}
        </GlassCard>

        <GlassCard padding="md" radius="lg" className={styles.side}>
          {!focus ? (
            <Skeleton shape="text" lines={8} />
          ) : (
            <SelectedNode
              node={focus}
              nodes={nodes}
              titleOf={(id) => exps.data?.find((e) => e.id === id)?.subtitle}
              showStatus={showStatus}
              loginTo={loginTo}
            />
          )}
        </GlassCard>
      </div>

      <Link to="/create" className={styles.banner}>
        <div className={styles.bannerText}>
          <span className={styles.bannerEyebrow}>COMING LATER</span>
          <strong className={styles.bannerTitle}>Create Your AI</strong>
          <span className={styles.bannerBody}>LLM · 비전 · 강화학습 · 메모리 블록을 조합해 나만의 AI를 설계하고 실험해요.</span>
        </div>
        <div className={styles.blocks} aria-hidden>
          {BLOCKS.map((b, i) => (
            <span key={b} className={styles.blockWrap}>
              {i > 0 && <span className={styles.plus}>+</span>}
              <span className={styles.block}>{b}</span>
            </span>
          ))}
        </div>
      </Link>

      <NodeDetail
        node={openNode}
        nodes={nodes}
        experiments={exps.data ?? []}
        cards={cards.data ?? []}
        dex={dex.data ?? []}
        isMember={isMember}
        loginTo={loginTo}
        onClose={close}
        onSelect={select}
      />
    </div>
  )
}

interface SelectedProps {
  node: TreeNode
  nodes: TreeNode[]
  titleOf: (experimentId: string) => string | undefined
  showStatus: boolean
  loginTo: string
}

/** B-12 오른쪽 "SELECTED NODE" 패널 */
function SelectedNode({ node, nodes, titleOf, showStatus, loginTo }: SelectedProps) {
  const parents = node.parents.map((id) => nodes.find((n) => n.id === id)).filter((n): n is TreeNode => !!n)
  const codes = nodeCodes(node)
  const doneParents = parents.filter((p) => p.status === 'done')
  const tip =
    showStatus && node.status === 'open' && doneParents.length > 0
      ? `AI 추천 · ${doneParents.map((p) => p.title).join(' · ')} 노드를 익혔으니, 다음은 ${node.title}가 잘 맞아요.`
      : null

  return (
    <div className={styles.selected}>
      <span className={styles.sideEyebrow}>SELECTED NODE</span>
      <h2 className={styles.sideTitle}>{node.title}</h2>
      <div className={styles.sideBadges}>
        <span className={styles.tierChip}>{TIER_LABEL[node.level]}</span>
        {showStatus && (
          <Badge tone={node.status === 'locked' ? 'neutral' : 'solid'}>{STATUS_LABEL[node.status]}</Badge>
        )}
      </div>
      <p className={styles.sideDesc}>{nodeDescription(node)}</p>

      {parents.length > 0 && (
        <>
          <h3 className={styles.sideH3}>선수 노드</h3>
          <div className={styles.prereq}>
            {parents.map((p) => (
              <span key={p.id} className={cx(styles.prereqChip, showStatus && p.status === 'done' && styles.prereqDone)}>
                {showStatus && p.status === 'done' ? '✓ ' : ''}
                {p.title}
              </span>
            ))}
          </div>
        </>
      )}

      {codes.length > 0 && (
        <>
          <h3 className={styles.sideH3}>이 노드의 실험</h3>
          <ul className={styles.sideExps}>
            {codes.map((id) => (
              <li key={id}>
                <Link to={`/experiments/${id}`} className={styles.sideExp}>
                  <span className={styles.sideCode}>#{id}</span>
                  {titleOf(id) ?? ''}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {tip && (
        <div className={styles.tip}>
          <Mascot expression="scientist" size={48} />
          <span>{tip}</span>
        </div>
      )}

      {showStatus ? (
        node.status === 'locked' || codes.length === 0 ? (
          <Button block disabled>
            {node.unlockCondition ?? '잠김'}
          </Button>
        ) : (
          <Button block to={node.status === 'in_progress' ? `/experiments/${codes[0]}/play` : `/experiments/${codes[0]}`}>
            {node.status === 'in_progress' ? '이어서 플레이하기' : '실험 시작하기'}
          </Button>
        )
      ) : (
        <Button block to={loginTo}>
          로그인하고 시작하기
        </Button>
      )}
    </div>
  )
}

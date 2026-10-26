// 기술 트리 노드 표시용 계산(상태 라벨 · 티어 · 실험 코드). 데이터는 GET /api/tree 응답에서 나온다.
import type { ExperimentSummary, Level, TreeNode } from '../../api'

export const TIER_LABEL: Record<Level, string> = {
  intro: 'TIER 0 · 입문',
  basic: 'TIER 1 · 기초',
  advanced: 'TIER 2 · 심화',
  frontier: 'TIER 3 · 최전선',
}

export const LEVEL_ORDER: Level[] = ['intro', 'basic', 'advanced', 'frontier']
export const LEVEL_NAME: Record<Level, string> = { intro: '입문', basic: '기초', advanced: '심화', frontier: '최전선' }

export const STATUS_LABEL: Record<TreeNode['status'], string> = {
  done: '완료',
  in_progress: '플레이 중',
  open: '해금됨',
  locked: '잠김',
}

// 설명 끝에 붙은 "완료 · EXP #007" 같은 메타 문구
const META_RE = /\s*((?:완료|해금됨|플레이 중|잠김)\s*·\s*EXP\s.*)$/

/** 설명에서 노드 메타 문구를 떼어 낸 본문 */
export function nodeDescription(node: TreeNode) {
  return node.description.replace(META_RE, '').trim()
}

/** 노드 아래 작은 줄. 예: "완료 · EXP #007", 잠김이면 "잠김" */
export function nodeMeta(node: TreeNode, showStatus: boolean) {
  const exp = nodeCodes(node)
    .map((c) => `#${c}`)
    .join(' ')
  if (!showStatus) return exp ? `EXP ${exp}` : ''
  if (node.status === 'locked') return STATUS_LABEL.locked
  const m = node.description.match(META_RE)
  if (m) return m[1]
  return exp ? `${STATUS_LABEL[node.status]} · EXP ${exp}` : STATUS_LABEL[node.status]
}

/** 이 노드에 묶인 실험 id 목록(experimentId + 설명 속 "EXP #003 #004") */
export function nodeCodes(node: TreeNode) {
  const ids = new Set<string>()
  if (node.experimentId) ids.add(node.experimentId)
  const m = node.description.match(META_RE)
  if (m) for (const code of m[1].matchAll(/#(\d{3})/g)) ids.add(code[1])
  return [...ids]
}

/** 실험 진행 한 줄. 예: "진행 중 34%", "완료 91%" */
export function experimentProgress(e: ExperimentSummary) {
  if (e.status === 'coming_soon') return e.unlockCondition ?? '오픈 예정'
  if (e.status === 'locked') return e.unlockCondition ?? '잠김'
  if (!e.progress) return '바로 시작할 수 있어요'
  const { trial, maxTrial, successRate } = e.progress
  if (trial >= maxTrial) return `완료 ${Math.round(successRate)}%`
  return `진행 중 ${Math.round((trial / maxTrial) * 100)}%`
}

/** 처음 보여 줄 노드: 해금됨 → 플레이 중 → 첫 노드 */
export function defaultNode(nodes: TreeNode[]) {
  return nodes.find((n) => n.status === 'open') ?? nodes.find((n) => n.status === 'in_progress') ?? nodes[0]
}

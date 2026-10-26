// 기술 카드 검수 규칙(F-04). 과장 표현 자동 경고와 체크리스트.
import type { TechCard } from '../../../api/types'

export type StepKind = TechCard['steps'][number]['kind']

export const STEP_ORDER: { kind: StepKind; label: string }[] = [
  { kind: 'research', label: '원본 연구' },
  { kind: 'mechanism', label: '가져온 메커니즘' },
  { kind: 'simplification', label: '단순화 방식' },
  { kind: 'implementation', label: '우리의 구현' },
]

/** 과장 표현 → 수정 제안 */
export const HYPE_FIXES: [string, string][] = [
  ['사람의 뇌를 복제하듯', '여러 도구를 골라 쓰는'],
  ['뇌를 복제', '뇌 연결 일부를 본뜬'],
  ['복제하듯', '흉내 내듯'],
  ['스스로 생각하는', '규칙에 따라 고르는'],
  ['완벽하게', '꽤 정확하게'],
  ['인간 수준', '특정 과제에서 쓸 만한 수준'],
]

/** 문장에서 처음 걸리는 과장 표현과 수정 제안 */
export function findHype(text: string): { from: string; to: string } | null {
  const hit = HYPE_FIXES.find(([from]) => text.includes(from))
  return hit ? { from: hit[0], to: hit[1] } : null
}

/** 정직 고지: 단순화 단계에 "복제가 아니"·"단순"·"근사" 같은 문구가 있는지 */
const HONEST = ['복제가 아니', '단순', '근사', '축소']

export function cardChecklist(card: TechCard) {
  const steps = STEP_ORDER.map((s) => card.steps.find((x) => x.kind === s.kind))
  const simplification = steps[2]?.body ?? ''
  return [
    { label: `출처 링크 ${card.sources.length}개 (1개 이상)`, ok: card.sources.length >= 1 },
    { label: '4단계 모두 작성', ok: steps.every((s) => s && s.title.trim() && s.body.trim()) },
    { label: '정직 고지 문구 포함', ok: HONEST.some((h) => simplification.includes(h)) },
    {
      label: `과장 표현 ${card.steps.filter((s) => findHype(`${s.title} ${s.body}`)).length}건`,
      ok: !card.steps.some((s) => findHype(`${s.title} ${s.body}`)),
    },
    { label: '연결 실험 지정', ok: Boolean(card.experimentId) },
  ]
}

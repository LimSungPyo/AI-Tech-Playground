import type { ExperimentSummary } from '../../../api/types'
import { pct } from '../experimentMeta'
import type { CardState } from '../experimentMeta'
import type { ExperimentCardProps } from './ExperimentCard'

/** 카드 캡션 · 버튼 결정 */
export function cardCopy(
  exp: ExperimentSummary,
  state: CardState,
  extra: { votePct?: number; voteDDay?: number; treeNodeId?: string; onVote?: () => void },
): Pick<ExperimentCardProps, 'caption' | 'action'> {
  const p = exp.progress
  switch (state) {
    case 'in_progress':
      return {
        caption: p ? `Trial ${p.trial} / ${p.maxTrial} · 성공률 ${pct(p.successRate)}` : '진행 중',
        action: { label: '이어하기', to: `/experiments/${exp.id}`, primary: true },
      }
    case 'done':
      return {
        caption: p ? `최종 ${pct(p.successRate)}` : '완료',
        action: { label: '다시 하기', to: `/experiments/${exp.id}/play` },
      }
    case 'open':
      return {
        caption: `${exp.subtitle} · 약 ${exp.durationMin}분`,
        action: { label: '시작하기', to: `/experiments/${exp.id}`, primary: true },
      }
    case 'coming_soon':
      return {
        caption: exp.unlockCondition ?? '오픈 예정',
        action: { label: '상세', to: `/experiments/${exp.id}/concept` },
      }
    case 'voting':
      return {
        caption:
          extra.votePct !== undefined
            ? `투표 ${extra.votePct}%${extra.voteDDay !== undefined ? ` · ${extra.voteDDay > 0 ? `D-${extra.voteDDay}` : '마감'}` : ''}`
            : (exp.unlockCondition ?? '투표 중'),
        action: { label: '투표하기', onClick: extra.onVote },
      }
    case 'locked':
      return {
        caption: exp.unlockCondition ?? '잠김',
        action: { label: '조건 보기', to: extra.treeNodeId ? `/tree?node=${extra.treeNodeId}` : '/tree' },
      }
  }
}

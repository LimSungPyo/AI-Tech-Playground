// 온보딩 선택지(고정 카피). id는 PUT /api/me/onboarding 의 interests · skill 값이다.
import type { Level, SkillLevel } from '../../api'

export const INTERESTS: { id: string; label: string; tech: string }[] = [
  { id: 'conversation', label: '대화하는 AI', tech: 'LLM · 챗봇' },
  { id: 'vision', label: '그림을 보는 AI', tech: '비전 · 이미지 인식' },
  { id: 'self_learning', label: '스스로 배우는 AI', tech: '강화학습' },
  { id: 'agent', label: '일을 맡기는 AI', tech: '에이전트' },
  { id: 'brain', label: '뇌를 닮은 AI', tech: '뇌 과학 · 커넥톰' },
  { id: 'unsure', label: '아직 잘 몰라요', tech: '드로시가 추천해 줘요' },
]

export const SKILLS: { id: SkillLevel; label: string; short: string; example: string }[] = [
  { id: 'beginner', label: '처음이에요', short: '쉬운 말로만', example: '"오른쪽에서 먹이 냄새가 나서 오른쪽으로 갔어요."' },
  {
    id: 'intermediate',
    label: '들어는 봤어요',
    short: '용어를 조금씩',
    example: '"냄새 뉴런 S3가 강하게 켜져서, 오른쪽으로 갈 확률이 78%였어요."',
  },
  {
    id: 'advanced',
    label: '직접 써봤어요',
    short: '숫자 · 수식까지',
    example: '"S3(0.82) → I5(0.67) → M2 경로 기여 0.61 · softmax p = 0.78"',
  },
]

export const LEVEL_LABEL: Record<Level, string> = { intro: '입문', basic: '기초', advanced: '심화', frontier: '최전선' }

export const interestLabel = (id: string) => INTERESTS.find((i) => i.id === id)?.label ?? id
export const skillLabel = (id: SkillLevel) => SKILLS.find((s) => s.id === id)?.label ?? id

/** 받침 유무로 조사 고르기: withJosa('웜이', '와', '과') → '웜이와' */
export function withJosa(word: string, noFinal: string, final: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0
  return word + (hasFinal ? final : noFinal)
}

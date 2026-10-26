// 캐릭터 고유 배경색(원형 무대 · 썸네일). decisions.md: 캐릭터 고유색은 토큰 예외
import type { CharacterId } from '../../api/types'

export const CHARACTER_TINT: Record<CharacterId, string> = {
  drosi: '#fbe7b0',
  wormy: '#fbdde4',
  owl: '#e2d9f3',
  octo: '#fcd9cc',
  ants: '#ecc9be',
  memo: '#dbe4f5',
  hawk: '#f3e2cc',
  parrot: '#d8f0dc',
  mappy: '#ebe3ef',
}

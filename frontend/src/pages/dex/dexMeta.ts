// 도감 표시용 라벨. 상태 이름은 Figma `D · 캐릭터 상태 흐름` 기준(알 · 아기 · 성장 · 마스터)
import type { DexEntry } from '../../api'

export const DEX_STATE_LABEL: Record<DexEntry['state'], string> = {
  egg: '알',
  baby: '아기',
  growing: '성장',
  master: '마스터',
}

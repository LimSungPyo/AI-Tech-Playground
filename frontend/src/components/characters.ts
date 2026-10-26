// 캐릭터 메타데이터와 SVG 경로. 화면 문구는 Figma `🧩 Friends Components`, 홈 친구 목록 기준.
import type { CharacterId, MascotExpression } from '../api/types'

const files = import.meta.glob<string>('../assets/characters/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
})

function svg(name: string): string {
  return files[`../assets/characters/${name}.svg`]
}

export const MASCOT_EXPRESSIONS: MascotExpression[] = [
  'default',
  'confused',
  'champion',
  'training',
  'why',
  'happy',
  'scientist',
  'neuron',
  'sleep',
  'mono',
]

export const MASCOT_LABELS: Record<MascotExpression, string> = {
  default: '기본',
  confused: '헷갈림',
  champion: '챔피언',
  training: '훈련 중',
  why: 'WHY?',
  happy: '기쁨',
  scientist: '과학자',
  neuron: '뉴런',
  sleep: '잠',
  mono: '단색',
}

export interface CharacterMeta {
  id: CharacterId
  name: string
  /** 담당 실험 코드 */
  experiment: string
  /** 실험 주제 */
  topic: string
}

export const CHARACTERS: Record<CharacterId, CharacterMeta> = {
  wormy: { id: 'wormy', name: '웜이', experiment: '#000', topic: '신경망 기초' },
  drosi: { id: 'drosi', name: '드로시', experiment: '#001', topic: '뇌 모사 AI' },
  owl: { id: 'owl', name: '부엉', experiment: '#002', topic: 'RAG' },
  octo: { id: 'octo', name: '옥토', experiment: '#003', topic: 'Tool' },
  ants: { id: 'ants', name: '앤티 팀', experiment: '#004', topic: 'Multi-Agent' },
  memo: { id: 'memo', name: '메모', experiment: '#005', topic: 'Memory' },
  hawk: { id: 'hawk', name: '매눈이', experiment: '#006', topic: '비전' },
  parrot: { id: 'parrot', name: '패롯', experiment: '#007', topic: 'LLM' },
  mappy: { id: 'mappy', name: '맵피', experiment: '#008', topic: '월드 모델' },
}

export const CHARACTER_IDS = Object.keys(CHARACTERS) as CharacterId[]

export const mascotSrc = (expression: MascotExpression) => svg(`drosi-${expression}`)
export const characterSrc = (id: CharacterId) => (id === 'drosi' ? svg('drosi-default') : svg(id))
export const logoSrc = svg('logo-app-icon')

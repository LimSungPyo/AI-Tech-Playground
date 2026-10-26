// H-03 공유 이미지 (1080 × 1080) — canvas로 그린다. 색은 토큰(CSS 변수)에서 읽는다.
import type { CharacterId, MascotExpression } from '../../../api/types'
import { characterSrc, logoSrc, mascotSrc } from '../../../components/characters'

export interface ShareImageData {
  code: string
  character: CharacterId
  characterName: string
  missionTitle: string
  stats: { label: string; value: string }[]
  url: string
}

export const SHARE_SIZE = 1080

function token(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`이미지를 불러오지 못했어요: ${src}`))
    img.src = src
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/** 받침(조사) 판단: "드로시가", "웜이가" */
const subj = (name: string) => {
  const c = name.charCodeAt(name.length - 1)
  return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 ? `${name}이` : `${name}가`
}

export async function drawShareImage(canvas: HTMLCanvasElement, d: ShareImageData) {
  const S = SHARE_SIZE
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  await document.fonts?.ready
  const sans = token('--font-sans')
  const mono = token('--font-mono')
  const ink = token('--color-text-primary')
  const sub = token('--color-text-secondary')
  const indigo = token('--color-accent-indigo')
  const white = token('--color-text-on-tint')
  const glass = token('--color-glass-solid')

  // 배경: 크림 → 라벤더
  const bg = ctx.createLinearGradient(0, 0, S, S)
  bg.addColorStop(0, token('--color-bg-cream'))
  bg.addColorStop(0.5, token('--color-bg-lavender'))
  bg.addColorStop(1, token('--color-bg-lilac'))
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, S, S)

  const expression: MascotExpression = 'champion'
  const [logo, hero] = await Promise.all([
    loadImage(logoSrc),
    loadImage(d.character === 'drosi' ? mascotSrc(expression) : characterSrc(d.character)),
  ])

  // 로고
  ctx.drawImage(logo, 72, 72, 48, 48)
  ctx.fillStyle = ink
  ctx.font = `700 26px ${sans}`
  ctx.textBaseline = 'middle'
  ctx.fillText('AI Tech Playground', 134, 97)

  // 실험 코드 배지
  ctx.font = `700 15px ${mono}`
  const badge = `EXPERIMENT ${d.code}`
  const bw = ctx.measureText(badge).width + 28
  ctx.fillStyle = indigo
  roundRect(ctx, S - 72 - bw, 83, bw, 28, 14)
  ctx.fill()
  ctx.fillStyle = white
  ctx.textAlign = 'center'
  ctx.fillText(badge, S - 72 - bw / 2, 97)

  // 캐릭터 원
  ctx.fillStyle = glass
  ctx.beginPath()
  ctx.arc(S / 2, 366, 190, 0, Math.PI * 2)
  ctx.fill()
  ctx.drawImage(hero, S / 2 - 160, 366 - 160, 320, 320)

  // 문구
  ctx.fillStyle = ink
  ctx.font = `900 56px ${sans}`
  ctx.fillText(`내가 키운 ${subj(d.characterName)}`, S / 2, 612)
  ctx.fillText(`${d.missionTitle}에 성공했어요!`, S / 2, 688)

  // 지표 타일
  ctx.font = `900 34px ${sans}`
  const widths = d.stats.map((s) => Math.max(148, ctx.measureText(s.value).width + 56))
  const gap = 16
  let x = (S - widths.reduce((a, b) => a + b, 0) - gap * (d.stats.length - 1)) / 2
  d.stats.forEach((s, i) => {
    const w = widths[i]
    ctx.fillStyle = glass
    roundRect(ctx, x, 736, w, 104, 24)
    ctx.fill()
    ctx.fillStyle = sub
    ctx.font = `500 20px ${sans}`
    ctx.fillText(s.label, x + w / 2, 768)
    ctx.fillStyle = indigo
    ctx.font = `900 34px ${sans}`
    ctx.fillText(s.value, x + w / 2, 806)
    x += w + gap
  })

  // QR 자리 + 초대 문구
  ctx.fillStyle = ink
  roundRect(ctx, 72, 898, 110, 110, 16)
  ctx.fill()
  ctx.fillStyle = white
  ctx.font = `700 26px ${mono}`
  ctx.fillText('QR', 127, 953)
  ctx.textAlign = 'left'
  ctx.fillStyle = ink
  ctx.font = `700 28px ${sans}`
  ctx.fillText('너도 AI를 직접 키워 볼래?', 200, 938)
  ctx.fillStyle = indigo
  ctx.font = `500 22px ${mono}`
  ctx.fillText(d.url, 200, 972)
}

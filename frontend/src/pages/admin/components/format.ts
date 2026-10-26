// 관리자 화면 날짜 표기. 서버 시각(ISO)을 브라우저 시간대로 보여 준다.
const pad = (n: number) => String(n).padStart(2, '0')

function parse(iso: string): Date | null {
  const t = Date.parse(iso)
  return Number.isNaN(t) ? null : new Date(t)
}

/** "10:42" */
export function hm(iso: string) {
  const d = parse(iso)
  return d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : iso
}

/** "10.18" */
export function md(iso: string) {
  const d = parse(iso)
  return d ? `${pad(d.getMonth() + 1)}.${pad(d.getDate())}` : iso
}

/** "10.18 10:42" */
export function mdhm(iso: string) {
  return `${md(iso)} ${hm(iso)}`
}

/** "2026.10.18 21:14" */
export function ymdhm(d: Date) {
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 마지막 접속: 오늘 · 어제 · 10.17 */
export function lastSeen(iso: string, now = new Date()) {
  const d = parse(iso)
  if (!d) return iso
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((day(now) - day(d)) / 86_400_000)
  if (diff <= 0) return now.getTime() - d.getTime() < 60 * 60_000 ? '방금' : '오늘'
  if (diff === 1) return '어제'
  return md(iso)
}

/** "1,284" 처럼 천 단위 쉼표 */
export const num = (n: number) => n.toLocaleString('ko-KR')

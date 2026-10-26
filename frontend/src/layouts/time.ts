/** ISO 시각 → "방금 전 · 1시간 전 · 어제 · 3일 전 · 10.13" */
export function timeAgo(iso: string, now = Date.now()) {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  const diff = Math.max(0, now - t)
  const min = Math.floor(diff / 60000)
  if (min < 1) return '방금 전'
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  const day = Math.floor(hr / 24)
  if (day === 1) return '어제'
  if (day < 7) return `${day}일 전`
  const d = new Date(t)
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

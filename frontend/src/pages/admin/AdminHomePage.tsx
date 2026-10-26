import { useState } from 'react'
import { getAdminHome, getAdminRadar, saveAdminHome } from '../../api'
import { isApiError } from '../../api/client'
import type { AdminHome, CarouselSlide } from '../../api/types'
import { Button, Character, Checkbox, IconButton, Skeleton, Toggle, cx, useModal, useToast } from '../../components'
import { useApi } from '../../hooks/useApi'
import { LoadError, PageHead, Panel, PanelSkeleton, Pill } from './components/AdminUi'
import type { PillTone } from './components/AdminUi'
import a from './components/admin.module.css'
import { characterOf, num } from './components/format'
import styles from './AdminHomePage.module.css'

interface SlideRow {
  slide: CarouselSlide
  visible: boolean
}

/** 슬라이드 배지: 첫 번째 = FEATURED, 실험하기 = NOW OPEN, 그 외 = COMING SOON */
function slideBadge(s: CarouselSlide, i: number): { label: string; tone: PillTone } {
  if (i === 0) return { label: 'FEATURED', tone: 'dark' }
  if (s.cta.includes('실험하기')) return { label: 'NOW OPEN', tone: 'success' }
  return { label: 'COMING SOON', tone: 'indigo' }
}

function dLeft(iso: string) {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  const days = Math.ceil((t - Date.now()) / 86_400_000)
  return days > 0 ? `D-${days}` : '마감'
}

// W2 admin 담당 · 경로 /admin/home — F-07 홈 캐러셀 · 투표 운영
export default function AdminHomePage() {
  const toast = useToast()
  const modal = useModal()
  const home = useApi((signal) => getAdminHome(signal), [])
  const radar = useApi((signal) => getAdminRadar(signal), [])

  // 편집용 슬라이드 목록(순서 + 노출)
  const [rows, setRows] = useState<SlideRow[] | null>(null)
  const [loaded, setLoaded] = useState<AdminHome | undefined>(undefined)
  if (home.data !== loaded) {
    setLoaded(home.data)
    setRows(home.data ? home.data.slides.map((slide) => ({ slide, visible: true })) : null)
  }
  const [picked, setPicked] = useState<string[] | null>(null)
  const [busy, setBusy] = useState<null | 'slides' | 'extend' | 'close'>(null)

  const save = async (kind: 'slides' | 'extend' | 'close', vote = home.data?.vote) => {
    if (!rows || !vote) return false
    setBusy(kind)
    try {
      const res = await saveAdminHome({ slides: rows.filter((r) => r.visible).map((r) => r.slide), vote })
      home.setData(res)
      return true
    } catch (e) {
      toast.show({ title: '저장하지 못했어요', description: isApiError(e) ? e.message : undefined, tone: 'danger' })
      return false
    } finally {
      setBusy(null)
    }
  }

  const move = (i: number, dir: -1 | 1) =>
    setRows((r) => {
      if (!r) return r
      const j = i + dir
      if (j < 0 || j >= r.length) return r
      const next = r.slice()
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  const vote = home.data?.vote
  const firstVisible = rows?.findIndex((r) => r.visible) ?? -1
  const total = vote?.options.reduce((s, o) => s + o.votes, 0) ?? 0
  const ranked = vote ? [...vote.options].sort((x, y) => y.votes - x.votes) : []

  const extend = async () => {
    if (!vote) return
    const endsAt = new Date(Date.parse(vote.endsAt) + 86_400_000).toISOString()
    if (await save('extend', { ...vote, endsAt })) toast.show({ title: '투표 마감을 하루 연장했어요', tone: 'success' })
  }
  const close = async () => {
    if (!vote) return
    const ok = await modal.alert({
      title: '투표를 마감하고 결과를 공개할까요?',
      message: `1위 "${ranked[0]?.title}" (${total ? Math.round((ranked[0].votes / total) * 100) : 0}%)가 다음 주 레이더와 D-09 결과에 공개돼요.`,
      confirmLabel: '마감하고 공개',
      cancelLabel: '취소',
    })
    if (ok && (await save('close', { ...vote, endsAt: new Date().toISOString() })))
      toast.show({ title: '투표를 마감하고 결과를 공개했어요', tone: 'success' })
  }

  const suggestions = (radar.data?.candidates ?? [])
    .filter((c) => c.status !== 'rejected')
    .sort((x, y) => y.score - x.score)
    .slice(0, 3)
  const selected = picked ?? suggestions.map((c) => c.id)

  return (
    <>
      <PageHead title="홈 캐러셀 · 투표 운영" />
      {home.error ? (
        <LoadError error={home.error} onRetry={home.reload} />
      ) : !rows || !vote ? (
        <div className={a.grid2}>
          <PanelSkeleton height={400} />
          <PanelSkeleton height={240} />
        </div>
      ) : (
        <div className={a.grid2}>
          <Panel title="홈 캐러셀 슬라이드" right={<span className={a.panelLink}>자동 넘김 3초 · 마우스 올리면 정지</span>}>
            <ol className={styles.slides}>
              {rows.map((r, i) => {
                const character = characterOf(r.slide.code) ?? r.slide.character
                const badge = slideBadge(r.slide, i === firstVisible ? 0 : 1)
                return (
                  <li key={r.slide.code} className={cx(styles.slide, !r.visible && styles.hidden)}>
                    <span className={styles.order}>
                      <IconButton icon="chevron-up" label={`${r.slide.title} 위로`} size="sm" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} />
                      <IconButton icon="chevron-down" label={`${r.slide.title} 아래로`} size="sm" variant="ghost" disabled={i === rows.length - 1} onClick={() => move(i, 1)} />
                    </span>
                    <Character id={character} size={40} />
                    <span className={styles.slideText}>
                      <strong>
                        {r.slide.code} {r.slide.title}
                      </strong>
                      <small>{r.slide.cta}</small>
                    </span>
                    <Pill tone={badge.tone}>{badge.label}</Pill>
                    <Toggle
                      className={styles.toggle}
                      aria-label={`${r.slide.title} 노출`}
                      checked={r.visible}
                      onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, visible: e.target.checked } : x)))}
                    />
                  </li>
                )
              })}
            </ol>
            <p className={styles.rule}>
              정렬 규칙: FEATURED → NOW OPEN(최신순) → COMING SOON(오픈 임박순) · 끈 슬라이드는 노출 안 함 · 사용자의 "동작 줄이기" 설정 시
              자동 넘김 끔
            </p>
            <div className={styles.saveRow}>
              <Button pill={false} loading={busy === 'slides'} disabled={busy !== null} onClick={async () => (await save('slides')) && toast.show({ title: '캐러셀 설정을 저장했어요', tone: 'success' })}>
                캐러셀 저장
              </Button>
            </div>
          </Panel>

          <div className={a.stack}>
            <Panel title={`이번 주 투표 · ${dLeft(vote.endsAt)}`} right={<span className={a.panelLink}>{num(total)}명 참여</span>}>
              <p className={a.muted}>{vote.title}</p>
              <ul className={styles.vote}>
                {vote.options.map((o) => {
                  const pct = total ? Math.round((o.votes / total) * 100) : 0
                  const lead = o.id === ranked[0]?.id
                  const character = characterOf(o.id)
                  return (
                    <li key={o.id} className={cx(lead && styles.lead)}>
                      {character && <Character id={character} size={32} />}
                      <div className={styles.voteBody}>
                        <span className={styles.voteLine}>
                          <strong>{o.title}</strong>
                          <span className={styles.pct}>{pct}%</span>
                        </span>
                        <span className={styles.bar}>
                          <span style={{ width: `${pct}%` }} />
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <div className={styles.voteActions}>
                <Button variant="secondary" size="sm" pill={false} loading={busy === 'extend'} disabled={busy !== null} onClick={() => void extend()}>
                  마감 연장
                </Button>
                <Button variant="dark" size="sm" pill={false} loading={busy === 'close'} disabled={busy !== null} onClick={() => void close()}>
                  마감하고 결과 공개
                </Button>
              </div>
            </Panel>

            <Panel title="다음 주 후보 추천" right={<span className={a.panelLink}>레이더 연동</span>}>
              {radar.error ? (
                <p className={a.muted}>레이더 후보를 불러오지 못했어요.</p>
              ) : !radar.data ? (
                <Skeleton shape="text" lines={3} />
              ) : (
                <ul className={styles.next}>
                  {suggestions.map((c) => (
                    <li key={c.id}>
                      <Checkbox
                        label={c.keyword}
                        checked={selected.includes(c.id)}
                        onChange={(e) => setPicked(e.target.checked ? [...selected, c.id] : selected.filter((x) => x !== c.id))}
                      />
                      <Pill tone="indigo">점수 {c.score.toFixed(2)}</Pill>
                    </li>
                  ))}
                </ul>
              )}
              <Button
                block
                pill={false}
                disabled={selected.length === 0}
                onClick={() => toast.show({ title: `다음 주 후보 ${selected.length}개를 확정했어요`, description: '월요일 18:00 투표 오픈 때 반영돼요', tone: 'success' })}
              >
                후보 {selected.length}개 확정
              </Button>
            </Panel>
          </div>
        </div>
      )}
    </>
  )
}

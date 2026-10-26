import { useState } from 'react'
import { useNavigate } from 'react-router'
import { getTechDrop, subscribeTechDrop } from '../../../api'
import type { ExperimentSummary, RadarKeyword } from '../../../api/types'
import { Badge, BarMini, Button, Character, Drawer, EmptyState, Icon, Skeleton, cx, useToast } from '../../../components'
import { useApi } from '../../../hooks/useApi'
import { KIND_CLASS, daysUntil, experimentStatusLabel, risingWeeks, sourceKind } from '../../home/format'
import { weekLabels } from '../radarWeeks'
import styles from './KeywordDrawer.module.css'

interface Props {
  open: boolean
  onClose: () => void
  keyword: RadarKeyword | undefined
  loading: boolean
  failed: boolean
  onRetry: () => void
  rank?: number
  /** 기준 주(월요일) ISO */
  week?: string
  experiment?: ExperimentSummary
  /** 함께 뜨는 키워드 후보 */
  related: RadarKeyword[]
  onSelect: (id: string) => void
  isMember: boolean
}

/** D-08 키워드 상세 드로어 */
export function KeywordDrawer({
  open,
  onClose,
  keyword: kw,
  loading,
  failed,
  onRetry,
  rank,
  week,
  experiment: exp,
  related,
  onSelect,
  isMember,
}: Props) {
  const toast = useToast()
  const navigate = useNavigate()
  const soon = exp && (exp.status === 'coming_soon' || exp.status === 'locked')
  const drop = useApi(open && soon && exp ? (s) => getTechDrop(exp.id, s) : null, [open, soon, exp?.id])
  const [sending, setSending] = useState(false)

  const rising = kw ? risingWeeks(kw.weeks) : 0
  const labels = kw && week ? weekLabels(week, kw.weeks.length) : []
  const subscribed = drop.data?.subscribed

  const subscribe = async () => {
    if (!exp) return
    if (!isMember) {
      navigate(`/login?returnTo=${encodeURIComponent(`/radar?keyword=${kw?.id ?? ''}`)}`)
      return
    }
    setSending(true)
    try {
      await subscribeTechDrop(exp.id)
      drop.setData((d) => (d ? { ...d, subscribed: true } : d))
      toast.show({ title: '오픈 알림을 신청했어요', description: `${exp.code} ${exp.title}`, tone: 'success' })
    } catch (e) {
      toast.show({ title: '신청하지 못했어요', description: e instanceof Error ? e.message : '', tone: 'danger' })
    } finally {
      setSending(false)
    }
  }

  return (
    <Drawer open={open} onClose={onClose} className={styles.drawer} eyebrow="KEYWORD" title={kw?.name ?? (loading ? '불러오는 중' : '키워드')}>
      {loading && !kw ? (
        <Skeleton shape="text" lines={6} />
      ) : failed || !kw ? (
        <EmptyState compact expression="confused" title="키워드를 찾지 못했어요" action={<Button onClick={onRetry}>다시 시도</Button>} />
      ) : (
        <div className={styles.root}>
          <div className={styles.badges}>
            <Badge tone={kw.changePct >= 0 ? 'success' : 'danger'} size="md">
              {kw.changePct >= 0 ? '▲' : '▼'} {Math.abs(Math.round(kw.changePct))}%
              {rising >= 2 ? ` · ${rising}주 연속 상승` : ''}
            </Badge>
            {rank !== undefined && (
              <Badge tone="solid" size="md">
                {rank}위
              </Badge>
            )}
          </div>

          <section className={styles.plain}>
            <span className={styles.plainLabel}>쉬운 말로</span>
            <p>{kw.summary}</p>
          </section>

          <section>
            <h3 className={styles.h3}>{kw.weeks.length}주 언급량</h3>
            <BarMini data={kw.weeks.map((v, i) => ({ label: labels[i] ?? `W${i + 1}`, value: v }))} height={150} label={`${kw.name} 주별 언급량`} />
          </section>

          {kw.sources.length > 0 && (
            <section>
              <h3 className={styles.h3}>대표 링크</h3>
              <ul className={styles.links}>
                {kw.sources.map((s) => {
                  const kind = sourceKind(s)
                  return (
                    <li key={s.url + s.title}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                        <span className={cx(styles.kind, styles[KIND_CLASS[kind]])}>{kind}</span>
                        <span className={styles.linkTitle}>{s.title}</span>
                        <Icon name="arrow-up-right" size={14} />
                      </a>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {exp && (
            <section className={styles.ours}>
              <Character id={exp.character} size={64} alt="" />
              <div className={styles.oursBody}>
                <span className={styles.oursLabel}>우리 서비스에서는</span>
                <strong className={styles.oursTitle}>
                  {exp.code} {exp.title} · {experimentStatusLabel(exp) || '잠김'}
                  {drop.data ? ` D-${daysUntil(drop.data.openAt)}` : ''}
                </strong>
                {soon ? (
                  subscribed ? (
                    <span className={styles.oursDone}>
                      <Icon name="check" size={14} /> 오픈 알림 받는 중
                    </span>
                  ) : (
                    <Button size="sm" variant="dark" onClick={subscribe} loading={sending} className={styles.oursBtn}>
                      오픈 알림 받기
                    </Button>
                  )
                ) : (
                  <Button size="sm" variant="dark" to={`/experiments/${exp.id}`} className={styles.oursBtn}>
                    실험 보러 가기
                  </Button>
                )}
              </div>
            </section>
          )}

          {related.length > 0 && (
            <section>
              <h3 className={styles.h3}>함께 뜨는 키워드</h3>
              <div className={styles.related}>
                {related.map((r) => (
                  <button key={r.id} type="button" className={styles.relatedChip} onClick={() => onSelect(r.id)}>
                    {r.name}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </Drawer>
  )
}

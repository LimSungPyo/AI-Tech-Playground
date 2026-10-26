import { useEffect, useState } from 'react'
import { getExperiment, getTechDrop, subscribeTechDrop } from '../../../api'
import { Badge, Button, Character, EmptyState, Icon, Modal, Skeleton, cx, useToast } from '../../../components'
import { useApi } from '../../../hooks/useApi'
import { CHARACTER_TINT } from '../characterTint'
import { LEVEL_LABEL } from '../format'
import styles from './TechDropModal.module.css'

interface Props {
  open: boolean
  onClose: () => void
  /** 실험 id("002") */
  code: string
  onSubscribed?: () => void
}

const FAQ = [
  { q: '오픈 일정이 바뀌면 알려주나요?', a: '오픈 알림을 신청했다면 일정이 바뀌는 즉시 알림 센터와 메일로 알려드려요.' },
  { q: 'RAG를 전혀 몰라도 할 수 있나요?', a: '네. 실험 안에서 필요한 개념을 단계별로 보여줘요. 막히면 노란 WHY? 버튼을 눌러 보세요.' },
  { q: '투표로 오픈 순서가 바뀌나요?', a: '매주 투표에서 가장 많이 뽑힌 실험이 다음 Tech Drop으로 먼저 열려요.' },
]

function useCountdown(iso: string | undefined) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!iso) return
    const t = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(t)
  }, [iso])
  const ms = Math.max(0, (iso ? new Date(iso).getTime() : now) - now)
  const min = Math.floor(ms / 60_000)
  return { d: Math.floor(min / 1440), h: Math.floor((min % 1440) / 60), m: min % 60 }
}

/** D-10 오픈 예정 실험 상세 — 카운트다운 · 알림 신청 · 시작 조건 */
export function TechDropModal({ open, onClose, code, onSubscribed }: Props) {
  const toast = useToast()
  const drop = useApi(open ? (s) => getTechDrop(code, s) : null, [open, code])
  const exp = useApi(open ? (s) => getExperiment(code, s) : null, [open, code])
  const [sending, setSending] = useState(false)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const left = useCountdown(drop.data?.openAt)
  const pad = (n: number) => String(n).padStart(2, '0')

  const subscribe = async () => {
    setSending(true)
    try {
      await subscribeTechDrop(code)
      drop.setData((d) => (d ? { ...d, subscribed: true } : d))
      onSubscribed?.()
      toast.show({ title: '오픈 알림을 신청했어요', description: '열리면 가장 먼저 알려드릴게요.', tone: 'success' })
    } catch (e) {
      toast.show({ title: '신청하지 못했어요', description: e instanceof Error ? e.message : '', tone: 'danger' })
    } finally {
      setSending(false)
    }
  }

  const share = async () => {
    const url = `${window.location.origin}/experiments/${code}`
    try {
      await navigator.clipboard.writeText(url)
      toast.show({ title: '링크를 복사했어요', description: url })
    } catch {
      toast.show({ title: '링크를 복사하지 못했어요', description: url, tone: 'danger' })
    }
  }

  const d = drop.data
  const e = exp.data
  // "10.31 오픈 · LLM 노드 완료 (#007)" → 날짜 항목은 빼고 조건만
  const conditions = (e?.unlockCondition ?? '')
    .split('·')
    .map((s) => s.trim())
    .filter((s) => s && !/오픈$/.test(s))
  const prereq = /#(\d{3})/.exec(e?.unlockCondition ?? '')?.[0]

  return (
    <Modal open={open} onClose={onClose} size="xl" showClose className={styles.modal}>
      {drop.loading && !d ? (
        <Skeleton height={420} />
      ) : drop.error || !d ? (
        <EmptyState compact expression="confused" title="실험 정보를 불러오지 못했어요" action={<Button onClick={drop.reload}>다시 시도</Button>} />
      ) : (
        <div className={styles.root}>
          <section className={styles.hero}>
            <div className={styles.heroText}>
              <div className={styles.eyebrow}>
                <span className={styles.kicker}>EXPERIMENT #{d.code}</span>
                <Badge tone="neutral" mono>
                  COMING SOON
                </Badge>
                {e && <Badge tone="indigo">{`${LEVEL_LABEL[e.level]} · ${e.subtitle}`}</Badge>}
              </div>
              <h2 className={styles.title}>{d.title}</h2>
              <p className={styles.body}>{d.body}</p>
              <div className={styles.countdown} aria-label={`오픈까지 ${left.d}일 ${left.h}시간 ${left.m}분`}>
                {[
                  [left.d, '일'],
                  [pad(left.h), '시간'],
                  [pad(left.m), '분'],
                ].map(([v, u]) => (
                  <span key={u} className={styles.cell}>
                    <strong>{v}</strong>
                    <span>{u}</span>
                  </span>
                ))}
              </div>
              <div className={styles.actions}>
                {d.subscribed ? (
                  <span className={styles.subscribed}>
                    <Icon name="check" size={16} /> 오픈 알림 받는 중
                  </span>
                ) : (
                  <Button onClick={subscribe} loading={sending} iconLeft={<Icon name="bell" size={16} />}>
                    오픈 알림 받기
                  </Button>
                )}
                <Button variant="secondary" onClick={share} iconLeft={<Icon name="share" size={16} />}>
                  친구에게 공유
                </Button>
              </div>
            </div>
            <div className={styles.circle} style={{ background: CHARACTER_TINT[d.character] }}>
              <Character id={d.character} size={200} alt="" />
            </div>
          </section>

          <div className={styles.row}>
            <section className={styles.preview}>
              <h3 className={styles.h3}>미리보기</h3>
              <div className={styles.video}>
                <span className={styles.play} aria-hidden>
                  ▶
                </span>
                <span>30초 티저 영상 (오픈 7일 전 공개)</span>
              </div>
            </section>
            <section className={styles.cond}>
              <h3 className={styles.h3}>시작 조건</h3>
              <ul className={styles.condList}>
                {conditions.map((c) => (
                  <li key={c}>
                    <span className={styles.todo} aria-label="아직" />
                    {c}
                  </li>
                ))}
                <li>
                  <span className={styles.done} aria-label="완료">
                    <Icon name="check" size={12} />
                  </span>
                  로그인
                </li>
              </ul>
              {prereq && <p className={styles.condTip}>{prereq} 실험을 끝내면 오픈 당일 바로 시작할 수 있어요.</p>}
            </section>
          </div>

          <section>
            <h3 className={styles.h3}>자주 묻는 질문</h3>
            <ul className={styles.faq}>
              {FAQ.map((f, i) => (
                <li key={f.q} className={styles.faqItem}>
                  <button
                    type="button"
                    className={styles.faqQ}
                    aria-expanded={faqOpen === i}
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  >
                    {f.q}
                    <span aria-hidden className={cx(styles.plus, faqOpen === i && styles.minus)}>
                      +
                    </span>
                  </button>
                  {faqOpen === i && <p className={styles.faqA}>{f.a}</p>}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </Modal>
  )
}

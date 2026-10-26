import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { getInquiries, type Inquiry } from '../../api'
import { Badge, Button, Chip, EmptyState, Icon, Logo, Skeleton, cx } from '../../components'
import { useApi } from '../../hooks/useApi'
import styles from './SupportHistoryPage.module.css'

// W2 my 담당 · 경로 /support/history (G-08 내 문의 내역)
// 넓은 화면은 목록 + 오른쪽 상세, 1024px 이하는 목록 안에서 답변을 펼친다.

type Filter = 'all' | 'received' | 'answered'

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function md(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : `${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}
function mdhm(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : `${md(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function StatusBadge({ status }: { status: Inquiry['status'] }) {
  return status === 'answered' ? <Badge tone="success">답변 완료</Badge> : <Badge tone="warning">답변 대기</Badge>
}

function Thread({ inquiry }: { inquiry: Inquiry }) {
  const [vote, setVote] = useState<'yes' | 'no' | null>(null)
  return (
    <>
      <div className={cx(styles.bubble, styles.mine)}>
        <p className={styles.who}>나 · {mdhm(inquiry.createdAt)}</p>
        {inquiry.body}
      </div>
      {inquiry.answer ? (
        <div className={cx(styles.bubble, styles.answer)}>
          <p className={styles.who}>
            <Logo iconOnly size={24} />
            AI Tech Playground 운영팀{inquiry.answeredAt && ` · ${mdhm(inquiry.answeredAt)}`}
          </p>
          {inquiry.answer}
        </div>
      ) : (
        <div className={cx(styles.bubble, styles.waiting)}>
          답변을 준비하고 있어요. 보통 24시간 안에 답하고
          {inquiry.notify === false ? '요. 알림을 받지 않기로 해서 이 화면에서 확인해 주세요.' : ', 답변이 오면 알림으로 알려드려요.'}
        </div>
      )}
      <div className={styles.foot}>
        {inquiry.answer ? (
          <div className={styles.feedback}>
            답변이 도움이 됐나요?
            <button type="button" className={styles.vote} aria-pressed={vote === 'yes'} onClick={() => setVote('yes')}>
              네
            </button>
            <button type="button" className={styles.vote} aria-pressed={vote === 'no'} onClick={() => setVote('no')}>
              아니요
            </button>
          </div>
        ) : (
          <span />
        )}
        <Button to={`/support?category=${encodeURIComponent(inquiry.category)}`} variant="secondary">
          추가로 물어보기
        </Button>
      </div>
    </>
  )
}

export default function SupportHistoryPage() {
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<Filter>('all')
  const { data, error, loading, reload } = useApi((signal) => getInquiries(signal), [])
  const list = useMemo(() => data ?? [], [data])

  const shown = filter === 'all' ? list : list.filter((q) => q.status === filter)
  const selectedId = params.get('id') ?? shown[0]?.id
  const selected = list.find((q) => q.id === selectedId)
  const waiting = list.filter((q) => q.status === 'received').length

  const select = (id: string) => setParams({ id }, { replace: true })

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>내 문의 내역</h1>
        <Button to="/support" iconLeft={<Icon name="plus" size={16} />}>
          새 문의
        </Button>
      </header>

      {loading && !data ? (
        <div className={styles.grid}>
          <div className={cx(styles.listCard, styles.list)}>
            <Skeleton height={80} />
            <Skeleton height={80} />
            <Skeleton height={80} />
          </div>
          <div className={styles.detail}>
            <Skeleton shape="text" lines={4} />
          </div>
        </div>
      ) : error ? (
        <div className={styles.listCard}>
          <EmptyState
            expression="confused"
            title="문의 내역을 불러오지 못했어요"
            description={error.message}
            action={<Button onClick={reload}>다시 시도</Button>}
          />
        </div>
      ) : list.length === 0 ? (
        <div className={styles.listCard}>
          <EmptyState
            title="아직 보낸 문의가 없어요"
            description="궁금한 점이나 이상한 점이 있으면 언제든 알려 주세요."
            action={<Button to="/support">문의하기</Button>}
          />
        </div>
      ) : (
        <div className={styles.grid}>
          <section className={styles.listCard} aria-label="문의 목록">
            <div className={styles.filters}>
              <Chip selected={filter === 'all'} onClick={() => setFilter('all')}>
                전체 {list.length}
              </Chip>
              <Chip selected={filter === 'received'} onClick={() => setFilter('received')}>
                답변 대기 {waiting}
              </Chip>
              <Chip selected={filter === 'answered'} onClick={() => setFilter('answered')}>
                완료 {list.length - waiting}
              </Chip>
            </div>
            <ul className={styles.list}>
              {shown.map((q) => {
                const active = q.id === selected?.id
                return (
                  <li key={q.id}>
                    <button
                      type="button"
                      className={cx(styles.item, active && styles.selected)}
                      aria-expanded={active}
                      onClick={() => select(q.id)}
                    >
                      <span className={styles.itemMeta}>
                        <span className={styles.id}>{q.id}</span>
                        <StatusBadge status={q.status} />
                        <span className={styles.date}>{md(q.createdAt)}</span>
                      </span>
                      <span className={styles.itemTitle}>{q.title}</span>
                    </button>
                    {active && (
                      <div className={styles.inline}>
                        <Thread key={q.id} inquiry={q} />
                      </div>
                    )}
                  </li>
                )
              })}
              {shown.length === 0 && <EmptyState compact title="해당하는 문의가 없어요" />}
            </ul>
          </section>

          <section className={styles.detail} aria-live="polite">
            {selected ? (
              <>
                <div className={styles.detailHead}>
                  <span className={styles.id}>{selected.id}</span>
                  <h2 className={styles.detailTitle}>{selected.title}</h2>
                </div>
                <p className={styles.category}>
                  {[selected.category, selected.experimentId && `#${selected.experimentId}`, selected.trial !== undefined && `Trial ${selected.trial}`]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <Thread key={selected.id} inquiry={selected} />
              </>
            ) : (
              <EmptyState compact title="문의를 골라 주세요" />
            )}
          </section>
        </div>
      )}
    </div>
  )
}

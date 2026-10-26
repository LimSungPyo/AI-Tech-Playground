import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { getAdminInquiries } from '../../api'
import type { AdminInquiries } from '../../api/types'
import { timeAgo } from '../../layouts/time'
import { Button, EmptyState, Select, Skeleton, Textarea, cx, useToast } from '../../components'
import { useApi } from '../../hooks/useApi'
import { FilterPills, LoadError, PageHead, Panel, Pill } from './components/AdminUi'
import a from './components/admin.module.css'
import { mdhm } from './components/format'
import styles from './AdminInquiriesPage.module.css'

type Item = AdminInquiries['items'][number]
type Tab = 'open' | 'report' | 'done'

/** 답변 템플릿(고정 문구) */
const TEMPLATES = [
  { value: 'bug', label: '설명 오류 인정 + 수정 예고', body: '제보 고마워요! 확인해 보니 말씀하신 부분이 실제 동작과 달랐어요. 다음 업데이트에서 바로 고칠게요.' },
  { value: 'account', label: '계정 · 기록 확인', body: '불편을 드려 죄송해요. 계정 기록을 확인해 보고, 옮겨지지 않은 기록은 복구해 드릴게요.' },
  { value: 'setting', label: '설정 방법 안내', body: '마이 > 설정 > 알림에서 원하는 알림만 골라 끌 수 있어요. 그래도 안 되면 다시 알려 주세요.' },
  { value: 'report', label: '신고 처리 결과', body: '신고 고마워요. 운영 정책에 따라 확인 후 조치했어요. 더 나은 공간을 만드는 데 큰 도움이 돼요.' },
]

const isHigh = (it: Item) => it.status.includes('높음')

// W2 admin 담당 · 경로 /admin/inquiries — F-10 문의 · 신고 (?tab=report)
export default function AdminInquiriesPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'report' ? 'report' : params.get('tab') === 'done' ? 'done' : 'open'
  const { data, error, reload } = useApi((signal) => getAdminInquiries(signal), [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [answered, setAnswered] = useState<string[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [memos, setMemos] = useState<Record<string, string>>({})
  const [template, setTemplate] = useState('')

  const items = data?.items ?? []
  const open = items.filter((i) => !answered.includes(i.id))
  const lists: Record<Tab, Item[]> = {
    open: open.filter((i) => i.kind === 'inquiry'),
    report: open.filter((i) => i.kind === 'report'),
    done: items.filter((i) => answered.includes(i.id)),
  }
  const rows = lists[tab]
  const selected = rows.find((i) => i.id === selectedId) ?? rows[0] ?? null
  const answer = selected ? (answers[selected.id] ?? '') : ''

  const send = () => {
    if (!selected) return
    if (!answer.trim()) {
      toast.show({ title: '답변 내용을 입력해 주세요', tone: 'danger' })
      return
    }
    setAnswered((x) => [...x, selected.id])
    setSelectedId(null)
    toast.show({ title: `${selected.id} 답변을 보냈어요`, description: '사용자 알림 센터 · 이메일로 전달돼요', tone: 'success' })
  }

  return (
    <>
      <PageHead title="문의 · 신고" />
      {error ? (
        <LoadError error={error} onRetry={reload} />
      ) : (
        <div className={styles.layout}>
          <Panel className={styles.listPanel}>
            <FilterPills<Tab>
              label="문의 구분"
              value={tab}
              onChange={(v) => {
                setSelectedId(null)
                setParams(v === 'open' ? {} : { tab: v })
              }}
              items={[
                { value: 'open', label: '미답변', count: data ? lists.open.length : undefined },
                { value: 'report', label: '신고', count: data ? lists.report.length : undefined },
                { value: 'done', label: '완료', count: data ? lists.done.length : undefined },
              ]}
            />
            {!data ? (
              <Skeleton height={300} />
            ) : rows.length === 0 ? (
              <EmptyState expression="happy" title="처리할 항목이 없어요" compact />
            ) : (
              <ul className={styles.list}>
                {rows.map((it) => (
                  <li key={it.id}>
                    <button
                      type="button"
                      className={cx(styles.item, selected?.id === it.id && styles.itemOn)}
                      onClick={() => setSelectedId(it.id)}
                      aria-pressed={selected?.id === it.id}
                    >
                      <span className={styles.itemTop}>
                        <span className={cx(styles.code, it.kind === 'report' && styles.codeReport)}>{it.id}</span>
                        <Pill>{it.kind === 'report' ? '신고' : '문의'}</Pill>
                        <span className={styles.ago}>{timeAgo(it.createdAt)}</span>
                      </span>
                      <strong className={styles.itemTitle}>{it.title}</strong>
                      <Pill tone={isHigh(it) ? 'danger' : 'neutral'}>{answered.includes(it.id) ? '답변 완료' : it.status}</Pill>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {selected && (
            <Panel className={styles.detail}>
              <div className={styles.detailHead}>
                <span className={cx(styles.code, selected.kind === 'report' && styles.codeReport)}>{selected.id}</span>
                <h2 className={styles.detailTitle}>{selected.title}</h2>
                <Pill tone={isHigh(selected) ? 'danger' : 'indigo'} className={styles.priority}>
                  {selected.status}
                </Pill>
              </div>
              <div className={styles.message}>
                <p className={a.muted}>
                  {selected.user} · {mdhm(selected.createdAt)} · {selected.kind === 'report' ? '신고' : '문의'}
                </p>
                <p className={styles.messageBody}>{selected.title}</p>
              </div>

              {tab === 'done' ? (
                <div className={styles.sent}>
                  <strong>보낸 답변</strong>
                  <p>{answer}</p>
                </div>
              ) : (
                <>
                  <h3 className={styles.sub}>답변</h3>
                  <Select
                    label="템플릿"
                    placeholder="템플릿 고르기"
                    value={template}
                    options={TEMPLATES.map((t) => ({ value: t.value, label: t.label }))}
                    onChange={(e) => {
                      setTemplate(e.target.value)
                      const t = TEMPLATES.find((x) => x.value === e.target.value)
                      if (t) setAnswers((s) => ({ ...s, [selected.id]: t.body }))
                    }}
                  />
                  <Textarea
                    aria-label="답변 내용"
                    rows={4}
                    placeholder="사용자에게 보낼 답변을 적어 주세요"
                    value={answer}
                    onChange={(e) => setAnswers((s) => ({ ...s, [selected.id]: e.target.value }))}
                  />
                  <Textarea
                    label="내부 메모 (사용자에게 안 보임)"
                    rows={2}
                    placeholder="@담당자 후속 조치를 남겨 주세요"
                    value={memos[selected.id] ?? ''}
                    onChange={(e) => setMemos((s) => ({ ...s, [selected.id]: e.target.value }))}
                  />
                  <div className={styles.actions}>
                    <Button variant="secondary" pill={false} onClick={() => navigate('/admin/cards')}>
                      기술 카드 수정 요청 →
                    </Button>
                    <span className={styles.spacer} />
                    <Button
                      variant="secondary"
                      pill={false}
                      onClick={() => toast.show({ title: `${selected.id}을(를) 보류했어요`, description: '미답변 목록에 남아 있어요' })}
                    >
                      보류
                    </Button>
                    <Button pill={false} onClick={send}>
                      답변 보내기
                    </Button>
                  </div>
                </>
              )}
            </Panel>
          )}
        </div>
      )}
    </>
  )
}

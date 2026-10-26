import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { getAdminCard, getAdminCards, saveAdminCard } from '../../api'
import { isApiError } from '../../api/client'
import type { TechCard, TechCardStatus } from '../../api/types'
import { Button, Character, Icon, Input, Select, Textarea, cx, useModal, useToast } from '../../components'
import { useApi } from '../../hooks/useApi'
import { CheckList, LoadError, PageHead, Panel, PanelSkeleton } from './components/AdminUi'
import a from './components/admin.module.css'
import { STEP_ORDER, cardChecklist, findHype } from './components/cardRules'
import type { StepKind } from './components/cardRules'
import { characterOf, md } from './components/format'
import styles from './AdminCardsPage.module.css'

/** 카드 status(v2) = 진행 단계 */
const STAGES: { value: TechCardStatus; label: string; title: string }[] = [
  { value: 'draft', label: '작성', title: '초안' },
  { value: 'review', label: '검토', title: '초안' },
  { value: 'approved', label: '승인', title: '승인됨' },
  { value: 'published', label: '게시', title: '게시' },
]
type Level = 'easy' | 'detail' | 'numbers'
const LEVELS: { value: Level; label: string }[] = [
  { value: 'easy', label: '쉬운 말' },
  { value: 'detail', label: '자세히' },
  { value: 'numbers', label: '숫자만' },
]

function Preview({ card, level }: { card: TechCard; level: Level }) {
  const character = characterOf(card.experimentId)
  const impl = card.steps.find((s) => s.kind === 'implementation')
  return (
    <section className={styles.preview} aria-label="사용자 화면 미리보기">
      <p className={styles.previewEyebrow}>사용자 화면 미리보기</p>
      <div className={styles.previewHead}>
        {character && <Character id={character} size={64} />}
        <div>
          <p className={styles.previewTag}>TECH CARD · #{card.experimentId}</p>
          <h3 className={styles.previewTitle}>{card.title || '제목 없음'}</h3>
        </div>
      </div>
      {level === 'easy' && <p className={styles.previewBody}>{impl?.body || card.reveal.body}</p>}
      {level === 'detail' && (
        <ol className={styles.previewSteps}>
          {STEP_ORDER.map((s, i) => {
            const step = card.steps.find((x) => x.kind === s.kind)
            return (
              <li key={s.kind}>
                <span>{String(i + 1).padStart(2, '0')}</span> {step?.title || s.label}
              </li>
            )
          })}
        </ol>
      )}
      {level === 'numbers' && (
        <dl className={styles.previewNums}>
          <div>
            <dt>출처</dt>
            <dd>{card.sources.length}</dd>
          </div>
          <div>
            <dt>생물에서 가져온 것</dt>
            <dd>{card.biologicalVsDesigned.biological.length}</dd>
          </div>
          <div>
            <dt>새로 설계한 것</dt>
            <dd>{card.biologicalVsDesigned.designed.length}</dd>
          </div>
        </dl>
      )}
    </section>
  )
}

// W2 admin 담당 · 경로 /admin/cards — F-04 기술 카드 편집기 (?id=card-001)
export default function AdminCardsPage() {
  const toast = useToast()
  const modal = useModal()
  const [params, setParams] = useSearchParams()
  const list = useApi((signal) => getAdminCards(signal), [])
  const cards = list.data?.cards
  // 기본은 검토 대기 카드(없으면 첫 카드)
  const cardId = params.get('id') ?? (cards?.find((c) => c.status === 'review') ?? cards?.[0])?.id ?? null
  const meta = cards?.find((c) => c.id === cardId)
  const card = useApi(cardId ? (signal) => getAdminCard(cardId, signal) : null, [cardId])

  // 불러온 카드를 편집용 초안으로 복사(카드가 바뀔 때만)
  const [draft, setDraft] = useState<TechCard | null>(null)
  const [loaded, setLoaded] = useState<TechCard | undefined>(undefined)
  if (card.data !== loaded) {
    setLoaded(card.data)
    setDraft(card.data ? structuredClone(card.data) : null)
  }

  const [level, setLevel] = useState<Level>('easy')
  const [comment, setComment] = useState('')
  const [newSource, setNewSource] = useState({ title: '', url: '' })
  const [saving, setSaving] = useState<null | 'save' | 'review' | 'publish'>(null)

  const setStep = (kind: StepKind, patch: Partial<{ title: string; body: string }>) =>
    setDraft((d) => {
      if (!d) return d
      const exists = d.steps.some((s) => s.kind === kind)
      const steps = exists
        ? d.steps.map((s) => (s.kind === kind ? { ...s, ...patch } : s))
        : [...d.steps, { kind, title: '', body: '', ...patch }]
      return { ...d, steps }
    })

  const save = async (kind: 'save' | 'review' | 'publish', status?: TechCardStatus) => {
    if (!draft) return false
    setSaving(kind)
    try {
      const saved = await saveAdminCard(status ? { ...draft, status } : draft)
      setLoaded(saved)
      setDraft(structuredClone(saved))
      list.setData((prev) =>
        prev
          ? { cards: prev.cards.map((c) => (c.id === saved.id ? { ...c, title: saved.title, status: saved.status ?? c.status } : c)) }
          : prev,
      )
      return true
    } catch (e) {
      toast.show({ title: '저장하지 못했어요', description: isApiError(e) ? e.message : undefined, tone: 'danger' })
      return false
    } finally {
      setSaving(null)
    }
  }

  const onSave = async () => {
    if (await save('save')) toast.show({ title: '초안을 저장했어요', tone: 'success' })
  }
  const onRequestReview = async () => {
    if (await save('review', 'review')) {
      toast.show({ title: '검토를 요청했어요', description: '검토자에게 알림이 갔어요' })
    }
  }
  const onPublish = async () => {
    if (!draft) return
    const failed = cardChecklist(draft).filter((c) => !c.ok)
    if (failed.length) {
      await modal.info({
        title: '체크리스트를 먼저 통과해 주세요',
        message: `남은 항목: ${failed.map((f) => f.label).join(', ')}`,
      })
      return
    }
    const ok = await modal.alert({
      title: '승인하고 게시할까요?',
      message: '게시하면 사용자 화면 기술 카드와 파트너 대화 답변 근거에 바로 반영돼요.',
      confirmLabel: '게시하기',
      cancelLabel: '취소',
    })
    if (ok && (await save('publish', 'published'))) {
      toast.show({ title: '기술 카드를 게시했어요', tone: 'success' })
    }
  }

  const stage = draft?.status ?? meta?.status ?? 'draft'
  const stageIndex = STAGES.findIndex((s) => s.value === stage)
  const error = list.error ?? card.error

  return (
    <>
      <PageHead title={`기술 카드 · ${draft?.title ?? ''} (${STAGES[stageIndex].title})`} />

      <div className={styles.toolbar}>
        <ol className={styles.stages} aria-label="카드 진행 단계">
          {STAGES.map((s, i) => (
            <li
              key={s.value}
              className={cx(styles.stage, i < stageIndex && styles.stageDone, i === stageIndex && styles.stageNow)}
              aria-current={i === stageIndex ? 'step' : undefined}
            >
              {i < stageIndex ? <Icon name="check" size={12} /> : <span className={styles.stageDot} />}
              {s.label}
            </li>
          ))}
        </ol>
        {meta && (
          <span className={styles.meta}>
            작성 {meta.author} · {md(meta.updatedAt)} 수정
          </span>
        )}
        {cards && (
          <Select
            aria-label="편집할 카드"
            className={styles.picker}
            value={cardId ?? ''}
            onChange={(e) => setParams({ id: e.target.value })}
            options={cards.map((c) => ({
              value: c.id,
              label: `#${c.experimentId} · ${c.title} · ${STAGES.find((s) => s.value === c.status)?.label ?? c.status}`,
            }))}
          />
        )}
      </div>

      {error ? (
        <LoadError error={error} onRetry={card.error ? card.reload : list.reload} />
      ) : !draft ? (
        <div className={a.grid2}>
          <PanelSkeleton height={480} />
          <PanelSkeleton height={240} />
        </div>
      ) : (
        <div className={a.grid2}>
          <Panel className={styles.editor}>
            <div className={styles.levels} role="radiogroup" aria-label="미리보기 설명 수준">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  role="radio"
                  aria-checked={level === l.value}
                  className={cx(a.filter, level === l.value && a.filterOn)}
                  onClick={() => setLevel(l.value)}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <Input label="카드 제목" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />

            {STEP_ORDER.map((s, i) => {
              const step = draft.steps.find((x) => x.kind === s.kind) ?? { title: '', body: '' }
              const hype = findHype(`${step.title} ${step.body}`)
              return (
                <fieldset key={s.kind} className={cx(styles.step, hype && styles.stepHype)}>
                  <legend className={styles.stepHead}>
                    <span className={styles.stepNo}>{String(i + 1).padStart(2, '0')}</span>
                    {s.label}
                    {hype && (
                      <span className={styles.hypeTag}>
                        <Icon name="warning" size={12} /> 과장 표현
                      </span>
                    )}
                  </legend>
                  <Input
                    aria-label={`${s.label} 제목`}
                    placeholder="한 줄 제목"
                    value={step.title}
                    onChange={(e) => setStep(s.kind, { title: e.target.value })}
                  />
                  <Textarea
                    aria-label={`${s.label} 설명`}
                    rows={2}
                    value={step.body}
                    onChange={(e) => setStep(s.kind, { body: e.target.value })}
                  />
                  {hype && (
                    <div className={styles.fix}>
                      <span className={styles.fixLabel}>수정 제안</span>
                      <span className={styles.fixText}>
                        "{hype.from}" → "{hype.to}"
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        pill={false}
                        onClick={() =>
                          setStep(s.kind, {
                            title: step.title.replace(hype.from, hype.to),
                            body: step.body.replace(hype.from, hype.to),
                          })
                        }
                      >
                        적용
                      </Button>
                    </div>
                  )}
                </fieldset>
              )
            })}

            <fieldset className={styles.step}>
              <legend className={styles.stepHead}>출처 링크</legend>
              <ul className={styles.sources}>
                {draft.sources.map((src, i) => (
                  <li key={`${src.url}-${i}`}>
                    <a href={src.url} target="_blank" rel="noreferrer">
                      {src.title}
                    </a>
                    <button
                      type="button"
                      className={styles.remove}
                      aria-label={`${src.title} 삭제`}
                      onClick={() => setDraft({ ...draft, sources: draft.sources.filter((_, j) => j !== i) })}
                    >
                      <Icon name="close" size={12} />
                    </button>
                  </li>
                ))}
              </ul>
              <form
                className={styles.addSource}
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!newSource.title.trim() || !newSource.url.trim()) return
                  setDraft({ ...draft, sources: [...draft.sources, { title: newSource.title.trim(), url: newSource.url.trim() }] })
                  setNewSource({ title: '', url: '' })
                }}
              >
                <Input aria-label="출처 이름" placeholder="출처 이름" value={newSource.title} onChange={(e) => setNewSource({ ...newSource, title: e.target.value })} />
                <Input aria-label="출처 URL" placeholder="https://" type="url" value={newSource.url} onChange={(e) => setNewSource({ ...newSource, url: e.target.value })} />
                <Button type="submit" size="sm" variant="secondary" pill={false}>
                  추가
                </Button>
              </form>
            </fieldset>

            <div className={styles.footer}>
              <Button variant="secondary" pill={false} loading={saving === 'save'} disabled={saving !== null} onClick={() => void onSave()}>
                저장
              </Button>
              <span className={styles.spacer} />
              <Button variant="secondary" pill={false} loading={saving === 'review'} disabled={saving !== null} onClick={() => void onRequestReview()}>
                검토 요청
              </Button>
              <Button pill={false} loading={saving === 'publish'} disabled={saving !== null || stage === 'published'} onClick={() => void onPublish()}>
                승인하고 게시
              </Button>
            </div>
          </Panel>

          <div className={a.stack}>
            <Preview card={draft} level={level} />
            <Panel
              title="검수 체크리스트"
              right={
                <span className={a.panelLink}>
                  {cardChecklist(draft).filter((c) => c.ok).length} / {cardChecklist(draft).length}
                </span>
              }
            >
              <CheckList items={cardChecklist(draft)} />
            </Panel>
            <Panel title="검토 코멘트">
              <Textarea
                aria-label="검토 코멘트"
                placeholder="검토자 의견을 남겨 주세요. 예) 04번 문장이 실제 기능보다 크게 들려요."
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </Panel>
          </div>
        </div>
      )}
    </>
  )
}

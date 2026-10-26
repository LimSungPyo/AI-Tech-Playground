import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { createInquiry, getExperiment } from '../../api'
import { useAuth } from '../../auth/useAuth'
import { Button, Checkbox, Chip, Icon, Input, Mascot, Textarea, cx, useToast } from '../../components'
import { useApi } from '../../hooks/useApi'
import styles from './SupportPage.module.css'

// W2 my 담당 · 경로 /support (G-07 문의하기)
// 플레이 화면에서 `/support?experiment=001&trial=37`로 오면 관련 실험을 자동 첨부한다.

const CATEGORIES = ['WHY? · 설명이 이상해요', '계정 · 기록', '버그 · 오류', '제안하기', '기타']
const MAX_FILES = 3

const FAQ = [
  {
    q: 'WHY? 설명과 실제 움직임이 다를 수 있나요?',
    a: 'WHY?는 그 순간 가장 크게 작용한 이유를 쉬운 말로 요약해요. 마지막 순간의 작은 보정까지는 담기지 않을 수 있어요.',
  },
  {
    q: '충돌 회피 "보정"이 뭐예요?',
    a: '장애물에 가까워지면 원래 고른 방향을 살짝 틀어 부딪히지 않게 하는 단계예요. 리플레이에서 마지막에 방향이 바뀌는 이유예요.',
  },
  {
    q: '리플레이는 어떻게 다시 보나요?',
    a: '내 실험 → 실험 카드의 리포트에서 Trial을 고르면 그 회차의 움직임과 WHY? 기록을 다시 볼 수 있어요.',
  },
]

/** hyewon@gmail.com → hy***@gmail.com */
function maskEmail(email: string) {
  const [id, domain] = email.split('@')
  if (!domain) return email
  return `${id.slice(0, 2)}***@${domain}`
}

export default function SupportPage() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const experimentId = params.get('experiment')
  const trial = params.get('trial')

  const [category, setCategory] = useState(params.get('category') ?? '')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [notify, setNotify] = useState(true)
  const [attachRelated, setAttachRelated] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const related = useApi(experimentId ? (signal) => getExperiment(experimentId, signal) : null, [experimentId])
  const relatedText = related.data
    ? `${related.data.code} ${related.data.title}${trial ? ` · Trial ${trial} 리플레이` : ''} · WHY? 기록이 함께 보내져요`
    : null

  const errors = {
    category: !category ? '문의 유형을 골라 주세요' : undefined,
    title: !title.trim() ? '제목을 적어 주세요' : undefined,
    body: !body.trim() ? '내용을 적어 주세요' : undefined,
  }
  const invalid = Boolean(errors.category || errors.title || errors.body)

  const onPickFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = ''
    const next = [...files, ...picked].slice(0, MAX_FILES)
    if (files.length + picked.length > MAX_FILES) toast.show({ title: `스크린샷은 최대 ${MAX_FILES}장까지 첨부할 수 있어요` })
    setFiles(next)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (invalid) return
    setSending(true)
    try {
      const attach = attachRelated && related.data
      const trialNo = trial ? Number(trial) : NaN
      const res = await createInquiry({
        category,
        title: title.trim(),
        body: body.trim(),
        files,
        notify,
        experimentId: attach ? related.data!.id : undefined,
        trial: attach && Number.isFinite(trialNo) ? trialNo : undefined,
      })
      toast.show({
        title: '문의를 보냈어요',
        description: `${res.id} · 보통 24시간 안에 답해요`,
        tone: 'success',
      })
      navigate(`/support/history?id=${encodeURIComponent(res.id)}`)
    } catch {
      toast.show({ title: '문의를 보내지 못했어요', description: '잠시 후 다시 시도해 주세요.', tone: 'danger' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>문의하기</h1>
      <div className={styles.grid}>
        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <fieldset className={styles.fieldset}>
            <legend className={styles.label}>어떤 문의인가요?</legend>
            <div className={styles.chips} role="radiogroup">
              {CATEGORIES.map((c) => (
                <Chip key={c} role="radio" aria-checked={category === c} selected={category === c} onClick={() => setCategory(c)}>
                  {c}
                </Chip>
              ))}
            </div>
            {submitted && errors.category && <p className={styles.error}>{errors.category}</p>}
          </fieldset>

          {relatedText && attachRelated && (
            <div>
              <p className={styles.label}>관련 실험 (자동 첨부)</p>
              <div className={styles.related}>
                <Icon name="check" size={16} className={styles.check} />
                <p>{relatedText}</p>
                <button type="button" className={styles.remove} onClick={() => setAttachRelated(false)}>
                  빼기
                </button>
              </div>
            </div>
          )}

          <Input
            label="제목"
            placeholder="한 줄로 요약해 주세요"
            value={title}
            maxLength={80}
            onChange={(e) => setTitle(e.target.value)}
            error={submitted ? errors.title : undefined}
          />
          <Textarea
            label="내용"
            placeholder="어떤 상황이었는지 자세히 적어 주시면 더 빨리 도와드릴 수 있어요"
            rows={5}
            maxLength={2000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            error={submitted ? errors.body : undefined}
          />

          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className={styles.fileInput}
              onChange={onPickFiles}
              tabIndex={-1}
              aria-hidden="true"
            />
            <button
              type="button"
              className={styles.attach}
              onClick={() => fileRef.current?.click()}
              disabled={files.length >= MAX_FILES}
            >
              ＋ 스크린샷 첨부 (최대 {MAX_FILES}장)
            </button>
            {files.length > 0 && (
              <ul className={styles.files}>
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className={styles.file}>
                    <Icon name="image" size={14} />
                    <span className={styles.fileName}>{f.name}</span>
                    <button
                      type="button"
                      className={styles.fileRemove}
                      aria-label={`${f.name} 빼기`}
                      onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    >
                      <Icon name="close" size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.reply}>
            <p className={styles.email}>
              <strong>답변 받을 이메일</strong>
              <span>{user ? maskEmail(user.email) : '-'}</span>
            </p>
            <Checkbox label="알림으로도 받기" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
          </div>

          <Button type="submit" size="lg" block loading={sending}>
            문의 보내기
          </Button>
        </form>

        <aside className={styles.side}>
          <section className={styles.faq}>
            <h2 className={styles.faqHead}>
              <Mascot expression="scientist" size={48} alt="" />
              보내기 전에, 이런 답이 있어요
            </h2>
            <ul className={styles.faqList}>
              {FAQ.map((f, i) => (
                <li key={f.q} className={cx(styles.faqItem, openFaq === i && styles.faqOpen)}>
                  <button
                    type="button"
                    className={styles.faqQ}
                    aria-expanded={openFaq === i}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    {f.q}
                    <Icon name="chevron-right" size={16} />
                  </button>
                  {openFaq === i && <p className={styles.faqA}>{f.a}</p>}
                </li>
              ))}
            </ul>
          </section>
          <div className={styles.note}>
            <p className={styles.noteTitle}>보통 24시간 안에 답해요</p>
            <p className={styles.noteBody}>
              답변은 알림 센터와 이메일로 보내드려요 · 내 문의 내역에서 진행 상황을 볼 수 있어요.
            </p>
          </div>
          <Link to="/support/history" className={styles.historyLink}>
            내 문의 내역 보기 →
          </Link>
        </aside>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { sendAdminNotification } from '../../api'
import { isApiError } from '../../api/client'
import { Button, Input, Mascot, Select, Textarea, Toggle, useModal, useToast } from '../../components'
import { FilterPills, PageHead, Panel, Pill } from './components/AdminUi'
import a from './components/admin.module.css'
import { mdhm } from './components/format'
import styles from './AdminNotificationsPage.module.css'

type Kind = 'open' | 'dormant' | 'notice' | 'answer'
const KINDS: { value: Kind; label: string }[] = [
  { value: 'open', label: '실험 오픈' },
  { value: 'dormant', label: '휴면 복귀' },
  { value: 'notice', label: '공지' },
  { value: 'answer', label: '문의 답변' },
]
const AUDIENCES: Record<Kind, { value: string; label: string }[]> = {
  open: [
    { value: 'subscribers', label: '오픈 알림 신청자' },
    { value: 'all', label: '전체 회원' },
  ],
  dormant: [{ value: 'dormant', label: '14일 이상 미접속 사용자' }],
  notice: [{ value: 'all', label: '전체 회원' }],
  answer: [{ value: 'inquirers', label: '답변 대기 문의자' }],
}
type Channel = 'app' | 'email' | 'sms'
const CHANNELS: { value: Channel; label: string }[] = [
  { value: 'app', label: '앱 알림' },
  { value: 'email', label: '이메일' },
  { value: 'sms', label: '문자' },
]

const pad = (n: number) => String(n).padStart(2, '0')
function defaultSendAt() {
  const d = new Date(Date.now() + 86_400_000)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T10:00`
}
/** 야간(21~09시) 발송 금지 가드레일 */
function isNight(local: string) {
  const d = new Date(local)
  return Number.isNaN(d.getTime()) || d.getHours() >= 21 || d.getHours() < 9
}

interface Sent {
  title: string
  audience: string
  sendAt: string
}

// W2 admin 담당 · 경로 /admin/notifications — F-12 알림 발송
export default function AdminNotificationsPage() {
  const toast = useToast()
  const modal = useModal()
  const [kind, setKind] = useState<Kind>('open')
  const [audience, setAudience] = useState(AUDIENCES.open[0].value)
  const [channels, setChannels] = useState<Record<Channel, boolean>>({ app: true, email: true, sms: false })
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sendAt, setSendAt] = useState(defaultSendAt)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState<Sent[]>([])
  const [touched, setTouched] = useState(false)

  const night = isNight(sendAt)
  const noChannel = !Object.values(channels).some(Boolean)
  const audienceLabel = AUDIENCES[kind].find((x) => x.value === audience)?.label ?? audience

  const changeKind = (k: Kind) => {
    setKind(k)
    setAudience(AUDIENCES[k][0].value)
  }

  const schedule = async () => {
    setTouched(true)
    if (!title.trim() || !body.trim() || night || noChannel) return
    const ok = await modal.alert({
      title: '알림 발송을 예약할까요?',
      message: `${audienceLabel}에게 ${mdhm(new Date(sendAt).toISOString())}에 보내요. 가드레일(주 3회 · 중복 · 알림 끈 사용자)은 자동으로 빠져요.`,
      confirmLabel: '발송 예약',
      cancelLabel: '취소',
    })
    if (!ok) return
    setBusy(true)
    try {
      const at = new Date(sendAt).toISOString()
      await sendAdminNotification({ audience, title: title.trim(), body: body.trim(), sendAt: at })
      setSent((s) => [{ title: title.trim(), audience: audienceLabel, sendAt: at }, ...s])
      toast.show({ title: '알림 발송을 예약했어요', description: `${audienceLabel} · ${mdhm(at)}`, tone: 'success' })
      setTouched(false)
    } catch (e) {
      toast.show({ title: '예약하지 못했어요', description: isApiError(e) ? e.message : undefined, tone: 'danger' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHead title="알림 발송 · 새 알림" />
      <div className={a.grid2}>
        <Panel className={styles.form}>
          <section>
            <h2 className={styles.label}>유형</h2>
            <FilterPills<Kind> label="알림 유형" value={kind} onChange={changeKind} items={KINDS} />
          </section>

          <section className={styles.target}>
            <Select label="대상" value={audience} onChange={(e) => setAudience(e.target.value)} options={AUDIENCES[kind]} />
            <span className={styles.guard}>가드레일 대상은 발송 시 자동 제외돼요</span>
          </section>

          <section>
            <h2 className={styles.label}>채널</h2>
            <div className={styles.channels}>
              {CHANNELS.map((c) => (
                <Toggle
                  key={c.value}
                  className={a.switchFirst}
                  label={c.label}
                  checked={channels[c.value]}
                  onChange={(e) => setChannels({ ...channels, [c.value]: e.target.checked })}
                />
              ))}
            </div>
            {touched && noChannel && <p className={styles.error}>채널을 하나 이상 골라 주세요</p>}
          </section>

          <section className={styles.copy}>
            <Input
              label="문구"
              placeholder="제목 · 예) 부엉이 사서가 문을 열었어요!"
              maxLength={40}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={touched && !title.trim() ? '제목을 입력해 주세요' : undefined}
            />
            <Textarea
              aria-label="본문"
              placeholder="본문 · 예) #002 RAG 탐정이 오픈했어요. AI가 답을 어디서 찾아오는지 직접 펼쳐 보세요."
              rows={3}
              maxLength={120}
              showCount
              value={body}
              onChange={(e) => setBody(e.target.value)}
              error={touched && !body.trim() ? '본문을 입력해 주세요' : undefined}
            />
          </section>

          <section>
            <label htmlFor="send-at" className={styles.label}>
              발송 시간
            </label>
            <div className={styles.when}>
              <input id="send-at" type="datetime-local" className={styles.date} value={sendAt} onChange={(e) => setSendAt(e.target.value)} />
              <Pill tone={night ? 'danger' : 'success'}>{night ? '야간 21–09시 발송 금지 ✕' : '야간 21–09시 금지 ✓'}</Pill>
            </div>
          </section>

          <div className={styles.footer}>
            <Button
              variant="secondary"
              pill={false}
              disabled={!title.trim()}
              onClick={() => toast.show({ title: '테스트 알림을 나에게 보냈어요', description: title })}
            >
              테스트 발송 (나에게)
            </Button>
            <Button pill={false} loading={busy} onClick={() => void schedule()}>
              발송 예약
            </Button>
          </div>
        </Panel>

        <div className={a.stack}>
          <Panel>
            <p className={a.muted}>미리보기 · 알림 센터(D-01)</p>
            <div className={styles.preview}>
              <Mascot expression="happy" size={48} />
              <div>
                <strong>{title || '알림 제목'}</strong>
                <p>{body || '알림 본문이 여기에 보여요.'}</p>
              </div>
            </div>
          </Panel>
          <Panel title="가드레일">
            <ul className={styles.rules}>
              <li>✓ 사용자당 주 3회 초과 시 자동 제외</li>
              <li>✓ 최근 24시간 내 같은 유형 받은 사람 제외</li>
              <li>✓ 알림 끈 사용자 제외</li>
              <li>✓ 야간(21–09시) 발송 금지</li>
            </ul>
          </Panel>
          <Panel title="최근 발송">
            {sent.length === 0 ? (
              <p className={a.muted}>이번 세션에서 예약한 알림이 아직 없어요.</p>
            ) : (
              <ul className={styles.sent}>
                {sent.map((s, i) => (
                  <li key={`${s.sendAt}-${i}`}>
                    <strong>{s.title}</strong>
                    <span className={a.muted}>
                      {mdhm(s.sendAt)} · {s.audience}
                    </span>
                    <Pill tone="indigo">예약됨</Pill>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  )
}

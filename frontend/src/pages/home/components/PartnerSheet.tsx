import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { MeHome } from '../../../api/types'
import { CHARACTERS, Character, Drawer, Icon, cx } from '../../../components'
import { CHARACTER_TINT } from '../characterTint'
import styles from './PartnerSheet.module.css'

interface Props {
  open: boolean
  onClose: () => void
  home: MeHome
}

interface Msg {
  id: number
  from: 'partner' | 'me'
  text: ReactNode
  link?: { to: string; label: string }
}

type Reply = 'go' | 'other' | 'what' | 'rest'
const REPLIES: { id: Reply; label: string }[] = [
  { id: 'go', label: '좋아, 도전할래!' },
  { id: 'other', label: '다른 거 추천해 줘' },
  { id: 'what', label: '시야 뉴런이 뭐야?' },
  { id: 'rest', label: '오늘은 쉴래' },
]

const hm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

/** D-05 파트너 대화 시트 — 빠른 답장만 지원(자유 입력은 준비 중) */
export function PartnerSheet({ open, onClose, home }: Props) {
  const { partner, recommendations } = home
  const name = CHARACTERS[partner.character].name
  const [openedAt] = useState(() => hm(new Date()))
  const [msgs, setMsgs] = useState<Msg[]>(() => [{ id: 0, from: 'partner', text: partner.message }])
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs])

  const first = recommendations[0]
  const other = recommendations.find((r) => r !== first && r.kind !== 'card') ?? recommendations[1]
  const card = recommendations.find((r) => r.kind === 'card')

  const answer = (r: Reply): Omit<Msg, 'id' | 'from'> => {
    switch (r) {
      case 'go':
        return first
          ? { text: `좋아! "${first.title}"부터 같이 해 보자. 내가 옆에서 볼게!`, link: { to: first.target, label: '바로 가기' } }
          : { text: '좋아! 실험실에서 하나 골라 보자.', link: { to: '/lab', label: '실험실 가기' } }
      case 'other':
        return other
          ? { text: `그럼 "${other.title}"는 어때? ${other.body}`, link: { to: other.target, label: '이거 할래' } }
          : { text: '지금은 이게 제일 좋아 보여! 다른 실험은 실험실에서 볼 수 있어.', link: { to: '/lab', label: '실험실 가기' } }
      case 'what':
        return {
          text: '눈으로 들어온 "장애물까지의 거리"를 받아들이는 감각 뉴런이야. 가까우면 강하게 켜져서 운동 뉴런 M4(멈춤)에 신호를 보내.',
          link: { to: card?.target ?? '/cards', label: '기술 카드에서 자세히 보기' },
        }
      case 'rest':
        return { text: '알겠어, 푹 쉬어! 내일 다시 이어서 하자. 기다리고 있을게.' }
    }
  }

  const send = (r: Reply) => {
    const label = REPLIES.find((x) => x.id === r)!.label
    setMsgs((prev) => {
      const id = prev.length
      return [...prev, { id, from: 'me', text: label }, { id: id + 1, from: 'partner', ...answer(r) }]
    })
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      className={styles.drawer}
      media={
        <span className={styles.avatar} style={{ background: CHARACTER_TINT[partner.character] }}>
          <Character id={partner.character} size={48} alt="" />
        </span>
      }
      title={`파트너 ${name}`}
      description="AI 안내자 · 내 기록을 보고 말해요"
    >
      <div className={styles.chat}>
        <div ref={listRef} className={styles.list} aria-live="polite">
          <span className={styles.time}>오늘 {openedAt}</span>
          {msgs.map((m) => (
            <div key={m.id} className={cx(styles.bubble, m.from === 'me' ? styles.me : styles.partner)}>
              <p>{m.text}</p>
              {m.link && (
                <Link to={m.link.to} className={styles.bubbleLink} onClick={onClose}>
                  <Icon name="grid" size={14} /> {m.link.label}
                </Link>
              )}
            </div>
          ))}
          <div className={styles.replies}>
            {REPLIES.map((r) => (
              <button key={r.id} type="button" className={styles.reply} onClick={() => send(r.id)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.composer}>
          <input className={styles.input} placeholder="자유롭게 물어보기 (곧 열려요)" disabled aria-label="자유롭게 물어보기 (곧 열려요)" />
          <button type="button" className={styles.send} disabled aria-label="보내기">
            ↑
          </button>
        </div>
        <p className={styles.note}>지금은 빠른 답장만 지원 · 답변은 내 실험 기록과 기술 카드만 근거로 해요.</p>
      </div>
    </Drawer>
  )
}

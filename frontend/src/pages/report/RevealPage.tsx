import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { getCard, getExperiment } from '../../api'
import { Button, CHARACTERS, Character, Icon, Mascot, cx } from '../../components'
import { useApi } from '../../hooks/useApi'
import { NeuralOverlay } from './components/NeuralOverlay'
import styles from './RevealPage.module.css'

// 13 반전 연출 타임라인(ms): 0 평소 → 600 스캔 → 1200 엑스레이 → 2000 문장 → 2400 기술 카드
const T_SCAN = 600
const T_XRAY = 1200
const T_TEXT = 2000
const CHAR_MS = 32
/** 문장이 다 나온 뒤 읽을 시간 */
const HOLD_MS = 1800

type Phase = 'normal' | 'scan' | 'xray' | 'text'

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

// W2 growth 담당 · 경로 /experiments/:id/reveal · B-09 반전 연출 (60:10356 = 13 반전 연출 스토리보드)
export default function RevealPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const exp = useApi((signal) => getExperiment(id, signal), [id])
  const cardId = exp.data?.cardId
  const card = useApi(cardId ? (signal) => getCard(cardId, signal) : null, [cardId])
  const [phase, setPhase] = useState<Phase>('normal')
  const [reduced] = useState(reduceMotion)

  const headline = card.data?.reveal.headline ?? ''
  const ready = !!card.data || !!card.error || !!exp.error
  const target = cardId ? `/cards/${cardId}` : `/experiments/${id}`

  // 데이터가 오면 타임라인 시작
  useEffect(() => {
    if (!ready) return
    if (reduced) {
      const t = window.setTimeout(() => setPhase('text'), 0)
      return () => clearTimeout(t)
    }
    const timers = [
      window.setTimeout(() => setPhase('scan'), T_SCAN),
      window.setTimeout(() => setPhase('xray'), T_XRAY),
      window.setTimeout(() => setPhase('text'), T_TEXT),
    ]
    return () => timers.forEach(clearTimeout)
  }, [ready, reduced])

  // 문장이 다 나오고 잠시 뒤 기술 카드로
  useEffect(() => {
    if (phase !== 'text') return
    const typing = reduced ? 0 : headline.length * CHAR_MS
    const t = window.setTimeout(() => navigate(target, { replace: true }), typing + HOLD_MS + (reduced ? 1200 : 0))
    return () => clearTimeout(t)
  }, [phase, headline.length, reduced, navigate, target])

  const character = exp.data?.character ?? 'drosi'
  const isDrosi = character === 'drosi'
  const dark = phase === 'xray' || phase === 'text'

  return (
    <div
      className={cx(styles.stage, dark && styles.dark, reduced && styles.reduced)}
      role="region"
      aria-label="반전 연출"
    >
      <Button
        variant={dark ? 'dark' : 'secondary'}
        size="sm"
        className={styles.skip}
        iconRight={<Icon name="chevron-right" size={14} />}
        onClick={() => navigate(target, { replace: true })}
      >
        건너뛰기
      </Button>

      <div className={styles.center}>
        <div className={cx(styles.hero, styles[phase])}>
          {/* 컷 1·2: 평소 화면 → 스캔 라인 지나가며 투명해짐 */}
          <div className={styles.normalLayer}>
            {isDrosi ? (
              <Mascot expression="champion" size={280} alt="" />
            ) : (
              <Character id={character} size={280} alt="" />
            )}
          </div>
          {/* 컷 3: 엑스레이 — 신경망 모드 */}
          <div className={styles.xrayLayer}>
            {isDrosi ? (
              <Mascot expression="neuron" size={280} alt="" />
            ) : (
              <Character id={character} size={280} alt="" className={styles.xrayChar} />
            )}
            {(phase === 'xray' || phase === 'text') && <NeuralOverlay className={styles.net} />}
          </div>
          {phase === 'scan' && <div className={styles.scanlines} aria-hidden />}
        </div>

        <p className={styles.line} aria-live="polite">
          {phase === 'text' &&
            (reduced
              ? headline
              : [...headline].map((ch, i) => (
                  <span key={i} className={styles.char} style={{ animationDelay: `${i * CHAR_MS}ms` }}>
                    {ch}
                  </span>
                )))}
          {phase === 'text' && !reduced && (
            <span className={styles.caret} style={{ animationDelay: `${headline.length * CHAR_MS}ms` }} aria-hidden />
          )}
        </p>
        {phase === 'text' && (
          <p className={styles.hint}>
            {CHARACTERS[character].name}의 기술 카드로 이동해요 ·{' '}
            <button type="button" className={styles.go} onClick={() => navigate(target, { replace: true })}>
              바로 보기
            </button>
          </p>
        )}
      </div>
    </div>
  )
}

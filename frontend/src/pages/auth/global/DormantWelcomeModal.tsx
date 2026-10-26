import { useNavigate } from 'react-router'
import { Button, Mascot, Modal } from '../../../components'
import styles from './global.module.css'

export interface DormantWelcomeModalProps {
  open: boolean
  onClose: () => void
  /** 마지막 방문 뒤 지난 날 수(예: 8 → "8일 만이에요!") */
  daysAway: number
  /** 그동안 바뀐 것들(API에서 받은 문장 목록) */
  highlights: string[]
  /** "드로시 깨우고 이어하기" 이동 경로. 기본 '/' (이어하기 카드가 있는 홈) */
  continueTo?: string
  /** "새 실험 먼저 볼래요" 이동 경로. 기본 '/lab' */
  exploreTo?: string
}

/** 07:M-07 휴면 복귀 웰컴 모달. 로그인 홈 위에 뜬다 */
export function DormantWelcomeModal({ open, onClose, daysAway, highlights, continueTo = '/', exploreTo = '/lab' }: DormantWelcomeModalProps) {
  const navigate = useNavigate()
  const go = (to: string) => {
    onClose()
    navigate(to)
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      centered
      className={styles.dormant}
      media={<Mascot expression="sleep" size={120} float />}
      title={`${daysAway}일 만이에요!`}
      description="드로시가 기다리다 잠들었어요. 그동안 바뀐 것들을 알려드릴게요."
    >
      <div className={styles.stack}>
        {highlights.length > 0 && (
          <ul className={styles.highlights}>
            {highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}
        <Button size="lg" block onClick={() => go(continueTo)}>
          드로시 깨우고 이어하기
        </Button>
        <Button variant="secondary" size="lg" block onClick={() => go(exploreTo)}>
          새 실험 먼저 볼래요
        </Button>
      </div>
    </Modal>
  )
}

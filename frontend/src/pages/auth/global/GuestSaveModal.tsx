import { useNavigate } from 'react-router'
import { Alert } from '../../../components'

export interface GuestSaveModalProps {
  open: boolean
  onClose: () => void
  /** 지금까지(이번 포함) 체험한 횟수. 4면 "벌써 4번째 훈련이에요!" */
  trials: number
}

/**
 * 08:L-06 게스트 · 기록 저장 유도(= 07:0-03 4회째 저장 유도). Glass Kit Alert 모양.
 * "가입하고 저장" → /signup(가입 완료 화면에서 atp.guestTrials를 이어받는다) · "계속 체험" → onClose
 */
export function GuestSaveModal({ open, onClose, trials }: GuestSaveModalProps) {
  const navigate = useNavigate()
  return (
    <Alert
      open={open}
      title={`벌써 ${trials}번째 훈련이에요!`}
      message={'가입하면 지금까지의 기록이\n그대로 저장돼요 · 30초면 끝나요'}
      confirmLabel="가입하고 저장"
      cancelLabel="계속 체험"
      onConfirm={() => {
        onClose()
        navigate('/signup')
      }}
      onCancel={onClose}
    />
  )
}

import { useNavigate } from 'react-router'
import type { User } from '../../../api/types'
import { BottomSheet, useToast } from '../../../components'
import { LoginForm } from '../components/LoginForm'
import { safeReturnTo } from '../lib'

export interface MobileLoginSheetProps {
  open: boolean
  onClose: () => void
  /** 로그인 성공 후 이동할 앱 경로. 없으면 지금 화면에 머문다 */
  returnTo?: string
  onSuccess?: (user: User) => void
}

/** 08:M-06 모바일 · 로그인 바텀시트. LoginPopup이 768px 이하에서 자동으로 이것을 쓴다 */
export function MobileLoginSheet({ open, onClose, returnTo, onSuccess }: MobileLoginSheetProps) {
  const navigate = useNavigate()
  const toast = useToast()
  return (
    <BottomSheet open={open} onClose={onClose} title="로그인" centered>
      <LoginForm
        variant="sheet"
        returnTo={returnTo}
        onLeave={onClose}
        onSuccess={(user) => {
          onSuccess?.(user)
          onClose()
          toast.show({ title: `다시 만나서 반가워요, ${user.nickname}님`, tone: 'success' })
          if (returnTo) navigate(safeReturnTo(returnTo))
        }}
        onSignup={() => {
          onClose()
          navigate('/signup')
        }}
      />
    </BottomSheet>
  )
}

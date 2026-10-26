import { Button, Character } from '../../../components'
import { maskEmail } from '../format'
import styles from './RememberedBanner.module.css'

interface Props {
  email: string
  onForget: () => void
}

/**
 * 07:M-01 상단 "다시 오셨네요" 배너. 토큰이 없어 사용자 정보 API를 부를 수 없으므로
 * 이 기기에 기억된 이메일만 보여준다(닉네임 · 마지막 로그인 방법은 공통 변경 요청으로 남김).
 */
export function RememberedBanner({ email, onForget }: Props) {
  return (
    <section className={styles.banner} aria-label="기억된 계정">
      <span className={styles.avatar}>
        <Character id="wormy" size={44} alt="" />
      </span>
      <div className={styles.text}>
        <strong className={styles.title}>{maskEmail(email)}님, 다시 오셨네요!</strong>
        <span className={styles.desc}>멈춘 실험이 기다리고 있어요 · 지난번 계정으로 바로 이어갈 수 있어요</span>
      </div>
      <Button to="/login" variant="primary">
        이 계정으로 계속하기
      </Button>
      <button type="button" className={styles.forget} onClick={onForget}>
        내가 아니에요
      </button>
    </section>
  )
}

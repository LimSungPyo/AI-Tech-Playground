import type { RememberedProfile } from '../../../auth/remembered'
import { Button, CHARACTERS, Character } from '../../../components'
import { PROVIDER_LABEL } from '../format'
import styles from './RememberedBanner.module.css'

interface Props {
  profile: RememberedProfile
  onForget: () => void
}

/**
 * 07:M-01 상단 "다시 오셨네요" 배너. 로그인 때 이 기기에 저장된 기억된 회원 정보
 * (닉네임 · 아바타 · 마지막 로그인 방법 · 멈춘 Trial)로 그린다. 계속하기는 M-02 로그인 화면으로.
 */
export function RememberedBanner({ profile, onForget }: Props) {
  const { nickname, avatar, provider, pausedTrial } = profile
  const method = PROVIDER_LABEL[provider]
  const partner = pausedTrial && Object.values(CHARACTERS).find((c) => c.experiment === pausedTrial.code)
  const waiting = pausedTrial
    ? `${partner?.name ?? pausedTrial.code}가 Trial ${pausedTrial.trial}에서 기다리고 있어요`
    : '멈춘 실험이 기다리고 있어요'
  return (
    <section className={styles.banner} aria-label="기억된 계정">
      <span className={styles.avatar}>
        <Character id={avatar ?? 'wormy'} size={44} alt="" />
      </span>
      <div className={styles.text}>
        <strong className={styles.title}>{nickname}님, 다시 오셨네요!</strong>
        <span className={styles.desc}>
          {waiting} · 지난번엔 {method}로 로그인했어요
        </span>
      </div>
      <Button to="/login" variant="primary">
        {method}로 계속하기
      </Button>
      <button type="button" className={styles.forget} onClick={onForget}>
        내가 아니에요
      </button>
    </section>
  )
}

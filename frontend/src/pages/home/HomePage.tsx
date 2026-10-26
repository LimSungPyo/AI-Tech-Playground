import { useState } from 'react'
import { forgetAccount, getRememberedProfile } from '../../auth/remembered'
import { useAuth } from '../../auth/useAuth'
import { Skeleton } from '../../components'
import { GuestHome } from './GuestHome'
import { MemberHome } from './MemberHome'
import styles from './HomePage.module.css'

// W2 hub 담당 · 경로 /
// 회원 → B-02 로그인 홈(첫 실험 전이면 E-03), 비회원 + 기억된 이메일 → 07:M-01, 그 외 → 0-01
export default function HomePage() {
  const { status } = useAuth()
  const [remembered, setRemembered] = useState(() => getRememberedProfile()?.email ?? null)

  if (status === 'loading') {
    return (
      <div className={styles.loading} aria-busy>
        <Skeleton height={48} width="50%" />
        <Skeleton height={420} />
      </div>
    )
  }
  if (status === 'member') return <MemberHome />
  return (
    <GuestHome
      rememberedEmail={remembered}
      onForget={() => {
        forgetAccount()
        setRemembered(null)
      }}
    />
  )
}

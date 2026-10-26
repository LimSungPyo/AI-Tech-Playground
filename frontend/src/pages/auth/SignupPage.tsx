import { getGuestTrials } from '../../auth/storage'
import { Icon, Mascot } from '../../components'
import { StepChips } from './components/AuthCard'
import { SignupForm } from './components/SignupForm'
import a from './auth.module.css'
import styles from './SignupPage.module.css'

const BENEFITS = [
  { title: '실험 기록 · 성장 그래프', body: '회차별 지표와 리플레이' },
  { title: 'AI 도감 카드', body: '훈련한 캐릭터 컬렉션' },
  { title: '기술 트리 진행', body: '해금한 노드와 추천' },
  { title: '캐릭터 레벨 · 배지', body: '예언가, WHY? 탐구자…' },
]

// W2 auth 담당 · 경로 /signup
// A-01 회원가입 (팝업 버전 08:L-03은 global/LoginPopup의 회원가입 화면)
export default function SignupPage() {
  const trials = getGuestTrials()
  return (
    <div className={styles.layout}>
      <section className={styles.card} aria-labelledby="signup-title">
        <StepChips steps={['계정 만들기', '관심사 고르기', '파트너 만나기']} current={0} />
        <h1 id="signup-title" className={a.titleLg}>
          회원가입
        </h1>
        <p className={a.lead}>1분이면 끝나요. 가입 후 바로 관심사를 고르고 첫 파트너를 만나요.</p>
        <SignupForm variant="page" />
      </section>

      <aside className={styles.side}>
        <div className={styles.benefits}>
          <h2 className={styles.sideTitle}>가입하면 저장돼요</h2>
          <ul className={styles.list}>
            {BENEFITS.map((b) => (
              <li key={b.title}>
                <span className={styles.check} aria-hidden>
                  <Icon name="check" size={14} strokeWidth={3} />
                </span>
                <span>
                  <strong>{b.title}</strong>
                  <small>{b.body}</small>
                </span>
              </li>
            ))}
          </ul>
          <div className={a.media}>
            <Mascot expression="champion" size={120} float />
          </div>
        </div>
        {trials > 0 && (
          <div className={styles.carry}>
            <strong>체험 기록 이어받기</strong>
            <p>
              로그인 없이 해본 #001 Trial 1~{trials} 기록이 가입과 동시에 계정으로 옮겨져요.
            </p>
          </div>
        )}
      </aside>
    </div>
  )
}

import { Link, useSearchParams } from 'react-router'
import { Button, Mascot } from '../../components'
import { StatusCard } from './components/StatusCard'
import styles from './errors.module.css'

// W2 my 담당 · 경로 /login-required (E-06)

/** returnTo 경로 → 화면 이름 */
const PAGE_NAMES: [prefix: string, name: string][] = [
  ['/my/experiments', '내 실험'],
  ['/my/characters', '내 캐릭터'],
  ['/my/badges', '배지'],
  ['/my/history', '학습 기록'],
  ['/my', '마이페이지'],
  ['/settings', '설정'],
  ['/notifications', '알림'],
  ['/support', '문의하기'],
  ['/onboarding', '온보딩'],
  ['/team-missions', '팀 미션'],
]

function pageName(path: string) {
  return PAGE_NAMES.find(([p]) => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`))?.[1]
}

/** 외부 주소로 튀지 않게 앱 내부 경로만 받는다 */
function safePath(raw: string | null) {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : null
}

export default function LoginRequiredPage() {
  const [params] = useSearchParams()
  const returnTo = safePath(params.get('returnTo'))
  const name = returnTo ? pageName(returnTo) : undefined
  const query = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''

  return (
    <StatusCard
      media={<Mascot expression="why" size={120} />}
      title="로그인하면 볼 수 있어요"
      description={
        name
          ? `"${name}"는 내 기록이 쌓이는 페이지라 로그인이 필요해요. 로그인하면 바로 이 화면으로 돌아와요.`
          : '내 기록이 쌓이는 페이지라 로그인이 필요해요. 로그인하면 바로 이 화면으로 돌아와요.'
      }
      extra={returnTo && <span className={styles.chip}>returnTo · {returnTo}</span>}
    >
      <Button to={`/login${query}`} size="lg" block>
        로그인
      </Button>
      <Button to={`/signup${query}`} variant="secondary" size="lg" block>
        1분 만에 가입하기
      </Button>
      <Link to="/" className={styles.link}>
        홈으로
      </Link>
    </StatusCard>
  )
}

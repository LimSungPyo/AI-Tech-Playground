import { Button, Mascot } from '../../components'
import { StatusCard } from './components/StatusCard'

// W2 my 담당 · 경로 * (E-11)
export default function NotFoundPage() {
  return (
    <StatusCard
      code="404"
      media={<Mascot expression="confused" size={128} />}
      title="길을 잃었어요"
      description="주소가 바뀌었거나 사라진 페이지예요. 드로시도 1회차엔 자주 헤맸어요."
    >
      <Button to="/" size="lg" block>
        홈으로
      </Button>
      <Button to="/lab" variant="secondary" size="lg" block>
        실험실 둘러보기
      </Button>
    </StatusCard>
  )
}

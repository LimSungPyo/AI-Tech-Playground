import { useState } from 'react'
import { Link } from 'react-router'
import { getSystemStatus } from '../../api'
import { Button, Mascot, useToast } from '../../components'
import { useApi } from '../../hooks/useApi'
import { StatusCard } from './components/StatusCard'
import styles from './errors.module.css'

// W2 my 담당 · 경로 /maintenance (E-12)

const DEFAULT_MESSAGE = '더 좋은 실험실을 위해 잠시 점검 중이에요. 진행 중인 기록은 모두 안전해요.'

/** "오늘 04:00 (약 1시간 20분 남음)" */
function formatUntil(iso: string, now = Date.now()) {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return null
  const d = new Date(t)
  const today = new Date(now)
  const sameDay = d.toDateString() === today.toDateString()
  const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const day = sameDay ? '오늘' : `${d.getMonth() + 1}.${d.getDate()}`
  const left = Math.max(0, Math.round((t - now) / 60000))
  const h = Math.floor(left / 60)
  const m = left % 60
  const remain = left > 0 ? ` (약 ${h > 0 ? `${h}시간 ` : ''}${m}분 남음)` : ''
  return `${day} ${hhmm}${remain}`
}

export default function MaintenancePage() {
  const toast = useToast()
  const [subscribed, setSubscribed] = useState(false)
  const { data } = useApi((signal) => getSystemStatus(signal), [])
  const until = data?.until ? formatUntil(data.until) : null

  const onSubscribe = () => {
    setSubscribed(true)
    toast.show({ title: '점검이 끝나면 알려드릴게요', tone: 'success' })
  }

  return (
    <StatusCard
      media={<Mascot expression="training" size={136} />}
      title="새 실험을 설치하는 중이에요"
      description={data?.message ?? DEFAULT_MESSAGE}
      extra={until && <span className={styles.eta}>예상 종료 · {until}</span>}
    >
      <Button variant="secondary" size="lg" block onClick={onSubscribe} disabled={subscribed}>
        {subscribed ? '알림 신청 완료' : '점검 끝나면 알림 받기'}
      </Button>
      <Link to="/radar" className={styles.link}>
        그동안 지난주 기술 레이더를 읽어 보세요 →
      </Link>
    </StatusCard>
  )
}

import { Spinner } from '../components/Spinner'
import styles from './PageFallback.module.css'

/** lazy 페이지를 불러오는 동안 */
export function PageFallback() {
  return (
    <div className={styles.fallback}>
      <Spinner size="lg" label="화면을 불러오고 있어요" />
    </div>
  )
}

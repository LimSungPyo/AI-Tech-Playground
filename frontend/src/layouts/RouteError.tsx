import { isRouteErrorResponse, useRouteError } from 'react-router'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import styles from './PageFallback.module.css'

/** 렌더 중 오류 · 페이지 청크 로딩 실패 시 흰 화면 대신 보여 준다 */
export function RouteError() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : '알 수 없는 오류'
  return (
    <div className={styles.fallback}>
      <EmptyState
        expression="confused"
        title="화면을 그리다 문제가 생겼어요"
        description={message}
        action={
          <>
            <Button variant="primary" onClick={() => window.location.reload()}>
              새로고침
            </Button>
            <Button variant="secondary" to="/">
              홈으로
            </Button>
          </>
        }
      />
    </div>
  )
}

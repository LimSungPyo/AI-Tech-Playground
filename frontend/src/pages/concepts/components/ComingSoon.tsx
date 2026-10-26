import { useId } from 'react'
import type { ReactNode } from 'react'
import { Badge, Button, cx } from '../../../components'
import type { ButtonProps } from '../../../components'
import styles from './ComingSoon.module.css'

/** 장기 컨셉 화면 상단 "준비 중" 배지 */
export function ComingSoonBanner({ children }: { children?: ReactNode }) {
  return (
    <div className={styles.banner} role="note">
      <Badge tone="warning" size="md" dot>
        준비 중
      </Badge>
      <span>{children ?? '아직 열리지 않은 컨셉 화면이에요. 모습만 미리 보여 드려요.'}</span>
    </div>
  )
}

type DisabledProps = Omit<Extract<ButtonProps, { to?: undefined }>, 'disabled' | 'onClick'>

/** 동작하지 않는 버튼 + 툴팁 "곧 열려요"(비활성 버튼은 호버를 받지 않아 감싸는 요소에 툴팁을 단다) */
export function SoonButton({ className, block, ...rest }: DisabledProps) {
  const tipId = useId()
  return (
    <span className={cx(styles.soon, block && styles.block)} tabIndex={0} aria-describedby={tipId}>
      <Button {...rest} block={block} className={className} disabled aria-disabled />
      <span id={tipId} role="tooltip" className={styles.tip}>
        곧 열려요
      </span>
    </span>
  )
}

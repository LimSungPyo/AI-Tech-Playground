import type { ButtonHTMLAttributes, Ref } from 'react'
import { cx } from './cx'
import { Icon } from './Icon'
import type { IconName } from './Icon'
import styles from './IconButton.module.css'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName
  /** 스크린리더용 이름(필수) */
  label: string
  variant?: 'glass' | 'ghost' | 'primary' | 'tile'
  size?: 'sm' | 'md' | 'lg'
  /** 오른쪽 위 빨간 점(안 읽음 등) */
  dot?: boolean
  ref?: Ref<HTMLButtonElement>
}

const iconSize = { sm: 16, md: 20, lg: 28 }

export function IconButton({
  icon,
  label,
  variant = 'glass',
  size = 'md',
  dot,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(styles.button, styles[variant], styles[size], className)}
      {...rest}
    >
      <Icon name={icon} size={iconSize[size]} />
      {dot && <span className={styles.dot} aria-hidden />}
    </button>
  )
}

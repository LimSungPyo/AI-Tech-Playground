import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { Link } from 'react-router'
import type { LinkProps } from 'react-router'
import { cx } from './cx'
import { Spinner } from './Spinner'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'why' | 'danger' | 'dark'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface CommonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  /** 기본 true(Glass Kit 버튼은 pill). false면 반경 16 */
  pill?: boolean
  /** 가로 꽉 채우기 */
  block?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  loading?: boolean
  className?: string
  children?: ReactNode
}

export type ButtonProps = CommonProps &
  (
    | ({ to?: undefined; ref?: Ref<HTMLButtonElement> } & ButtonHTMLAttributes<HTMLButtonElement>)
    | ({ to: LinkProps['to'] } & Omit<LinkProps, 'to' | 'className' | 'children'>)
  )

function classes(p: CommonProps) {
  return cx(
    styles.button,
    styles[p.variant ?? 'primary'],
    styles[p.size ?? 'md'],
    p.pill === false && styles.square,
    p.block && styles.block,
    p.loading && styles.loading,
    p.className,
  )
}

/** `to`를 주면 react-router Link로 그린다 */
export function Button(props: ButtonProps) {
  const { variant, size, pill, block, iconLeft, iconRight, loading, className, children, ...rest } = props
  const cls = classes({ variant, size, pill, block, loading, className })
  const inner = (
    <>
      {loading ? <Spinner size="sm" tone="inherit" /> : iconLeft}
      {children !== undefined && <span className={styles.label}>{children}</span>}
      {iconRight}
    </>
  )
  if (rest.to !== undefined) {
    return (
      <Link className={cls} {...(rest as LinkProps)}>
        {inner}
      </Link>
    )
  }
  const { type = 'button', disabled, ...btn } = rest as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...btn}>
      {inner}
    </button>
  )
}

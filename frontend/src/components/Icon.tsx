import type { SVGProps } from 'react'
import { iconPaths } from './icons'
import type { IconName } from './icons'

export type { IconName }

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
  strokeWidth?: number
  /** 스크린리더용 이름. 없으면 장식(aria-hidden)으로 본다 */
  label?: string
}

export function Icon({ name, size = 20, strokeWidth = 1.8, label, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      {iconPaths[name]}
    </svg>
  )
}

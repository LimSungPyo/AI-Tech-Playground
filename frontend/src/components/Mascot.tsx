import type { ImgHTMLAttributes } from 'react'
import type { CharacterId, MascotExpression } from '../api/types'
import { CHARACTERS, MASCOT_LABELS, characterSrc, logoSrc, mascotSrc } from './characters'
import { cx } from './cx'
import styles from './Mascot.module.css'

type ImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'>

export interface MascotProps extends ImgProps {
  expression?: MascotExpression
  size?: number
  /** 둥실둥실 떠 있는 애니메이션 */
  float?: boolean
}

/** 마스코트 드로시(표정 10종) */
export function Mascot({ expression = 'default', size = 120, float, className, alt, ...rest }: MascotProps) {
  return (
    <img
      src={mascotSrc(expression)}
      width={size}
      height={size}
      alt={alt ?? `드로시 · ${MASCOT_LABELS[expression]}`}
      draggable={false}
      className={cx(styles.img, float && styles.float, className)}
      {...rest}
    />
  )
}

export interface CharacterProps extends ImgProps {
  id: CharacterId
  size?: number
  /** 아직 만나지 못한 친구(흐리게) */
  locked?: boolean
  float?: boolean
}

/** 친구 캐릭터 8종 + 드로시 */
export function Character({ id, size = 96, locked, float, className, alt, ...rest }: CharacterProps) {
  return (
    <img
      src={characterSrc(id)}
      width={size}
      height={size}
      alt={alt ?? CHARACTERS[id].name}
      draggable={false}
      className={cx(styles.img, locked && styles.locked, float && styles.float, className)}
      {...rest}
    />
  )
}

export interface LogoProps {
  /** 아이콘만 */
  iconOnly?: boolean
  size?: number
  /** 다크 배경 위(글자 흰색) */
  onDark?: boolean
  /** 글자 대신 쓸 이름(관리자 콘솔은 "Playground") */
  text?: string
  className?: string
}

export function Logo({ iconOnly, size = 32, onDark, text = 'AI Tech Playground', className }: LogoProps) {
  return (
    <span className={cx(styles.logo, onDark && styles.onDark, className)}>
      <img src={logoSrc} width={size} height={size} alt={iconOnly ? text : ''} className={styles.logoIcon} draggable={false} />
      {!iconOnly && <span className={styles.logoText}>{text}</span>}
    </span>
  )
}

import type { CharacterId } from '../api/types'
import { Character } from './Mascot'
import { cx } from './cx'
import styles from './Avatar.module.css'

export interface AvatarProps {
  /** 캐릭터 아바타. 없으면 name의 첫 글자 */
  character?: CharacterId | null
  name?: string
  size?: number
  /** 링(파트너 · 선택 표시) */
  ring?: boolean
  className?: string
}

/** 원형 아바타. 캐릭터 그림 또는 이니셜(관리자) */
export function Avatar({ character, name = '', size = 40, ring, className }: AvatarProps) {
  return (
    <span
      className={cx(styles.avatar, ring && styles.ring, !character && styles.initial, className)}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={name || undefined}
    >
      {character ? <Character id={character} size={Math.round(size * 0.86)} alt={name} /> : name.slice(0, 1) || '?'}
    </span>
  )
}

import { cx } from '../../../components'
import type { Badge } from '../../../api'
import { badgeMeta } from './badgeMeta'
import styles from './BadgeIcon.module.css'

/** 원형 배지 아이콘. 획득 = 컬러, 미획득 = 점선 */
export function BadgeIcon({ badge, size = 48 }: { badge: Badge; size?: number }) {
  return (
    <span
      className={cx(styles.icon, !badge.obtained && styles.off)}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        ...(badge.obtained ? { background: badgeMeta(badge.id).color } : null),
      }}
      aria-hidden
    >
      {badge.icon}
    </span>
  )
}

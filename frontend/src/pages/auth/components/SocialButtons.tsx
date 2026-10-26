import type { SocialProvider } from '../../../api/types'
import { Spinner, cx } from '../../../components'
import { PROVIDER_LABEL } from '../lib'
import styles from './SocialButtons.module.css'

const PROVIDERS: SocialProvider[] = ['google', 'kakao', 'github']
const MARK: Record<SocialProvider, string> = { google: 'G', kakao: 'K', github: 'G' }

interface SocialButtonsProps {
  /** stack = 세로 큰 버튼(B-01) · row = 가로 3칸 버튼(A-01) · pill = 팝업 3칸 pill(L-01) · text = 글자만(M-06) */
  layout: 'stack' | 'row' | 'pill' | 'text'
  onSelect: (provider: SocialProvider) => void
  pending?: SocialProvider | null
  disabled?: boolean
}

/** Google · 카카오 · GitHub 버튼 묶음 */
export function SocialButtons({ layout, onSelect, pending, disabled }: SocialButtonsProps) {
  return (
    <div className={cx(styles.group, styles[layout])}>
      {PROVIDERS.map((p) => (
        <button
          key={p}
          type="button"
          className={styles.button}
          onClick={() => onSelect(p)}
          disabled={disabled || pending != null}
          aria-busy={pending === p || undefined}
        >
          {pending === p ? (
            <Spinner size="sm" />
          ) : (
            layout !== 'text' && (
              <span className={cx(styles.mark, styles[`mark-${p}`])} aria-hidden>
                {layout === 'pill' && p === 'github' ? '⌥' : MARK[p]}
              </span>
            )
          )}
          <span>{layout === 'stack' ? `${PROVIDER_LABEL[p]}로 계속하기` : PROVIDER_LABEL[p]}</span>
        </button>
      ))}
    </div>
  )
}

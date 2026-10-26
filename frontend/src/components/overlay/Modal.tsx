import { useId } from 'react'
import type { ReactNode } from 'react'
import { cx } from '../cx'
import { IconButton } from '../IconButton'
import { Overlay } from './Overlay'
import type { OverlayProps } from './Overlay'
import styles from './Modal.module.css'

interface PanelCommon extends Omit<OverlayProps, 'children' | 'placement' | 'label' | 'labelledBy' | 'describedBy'> {
  title?: ReactNode
  description?: ReactNode
  /** 제목 위 작은 라벨 */
  eyebrow?: ReactNode
  /** 제목 위 그림(마스코트 등) */
  media?: ReactNode
  /** 아래 버튼 줄 */
  footer?: ReactNode
  /** 오른쪽 위 닫기(×) */
  showClose?: boolean
  /** 글자 가운데 정렬(Glass Kit 팝업) */
  centered?: boolean
  children?: ReactNode
  className?: string
}

export interface ModalProps extends PanelCommon {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

function Body({
  title,
  description,
  eyebrow,
  media,
  footer,
  showClose,
  centered,
  children,
  onClose,
  titleId,
  descId,
}: PanelCommon & { titleId: string; descId: string }) {
  return (
    <>
      {showClose && <IconButton icon="close" label="닫기" variant="ghost" size="sm" className={styles.close} onClick={onClose} />}
      {(media || eyebrow || title || description) && (
        <header className={cx(styles.head, centered && styles.centered)}>
          {media && <div className={styles.media}>{media}</div>}
          {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
          {title && (
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
          )}
          {description && (
            <p id={descId} className={styles.desc}>
              {description}
            </p>
          )}
        </header>
      )}
      {children !== undefined && <div className={styles.body}>{children}</div>}
      {footer && <footer className={cx(styles.footer, centered && styles.footerCentered)}>{footer}</footer>}
    </>
  )
}

/** 가운데 유리 팝업. 등장 scale 0.96→1 + fade 220ms, ESC · 바깥 클릭 닫기, 포커스 트랩 */
export function Modal({ size = 'sm', className, ...p }: ModalProps) {
  const titleId = useId()
  const descId = useId()
  return (
    <Overlay
      {...p}
      placement="center"
      labelledBy={p.title ? titleId : undefined}
      describedBy={p.description ? descId : undefined}
      panelClassName={cx(styles.modal, styles[size], className)}
    >
      <Body {...p} titleId={titleId} descId={descId} />
    </Overlay>
  )
}

/** 오른쪽에서 나오는 서랍(WHY? 딥다이브, 키워드 상세) */
export function Drawer({ className, showClose = true, ...p }: PanelCommon & { width?: number }) {
  const titleId = useId()
  const descId = useId()
  return (
    <Overlay
      {...p}
      placement="right"
      labelledBy={p.title ? titleId : undefined}
      describedBy={p.description ? descId : undefined}
      panelClassName={cx(styles.drawer, className)}
    >
      <Body {...p} showClose={showClose} titleId={titleId} descId={descId} />
    </Overlay>
  )
}

/** 아래에서 올라오는 시트(파트너 대화, 모바일 로그인) */
export function BottomSheet({ className, ...p }: PanelCommon) {
  const titleId = useId()
  const descId = useId()
  return (
    <Overlay
      {...p}
      placement="bottom"
      labelledBy={p.title ? titleId : undefined}
      describedBy={p.description ? descId : undefined}
      panelClassName={cx(styles.sheet, className)}
    >
      <span className={styles.grabber} aria-hidden />
      <Body {...p} titleId={titleId} descId={descId} />
    </Overlay>
  )
}

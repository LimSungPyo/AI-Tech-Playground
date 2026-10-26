import type { ReactNode } from 'react'
import { Button } from '../Button'
import { cx } from '../cx'
import { Modal } from './Modal'
import styles from './Dialogs.module.css'

interface DialogBase {
  open: boolean
  title: ReactNode
  message?: ReactNode
  /** 제목 위 그림(마스코트 등) */
  media?: ReactNode
}

export interface AlertProps extends DialogBase {
  /** 예 */
  confirmLabel?: string
  /** 아니요 */
  cancelLabel?: string
  /** danger면 확인 버튼이 빨강(탈퇴 · 계정 조치) */
  tone?: 'primary' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

/** Alert · 예/아니요 (저장할까요? → 저장하기 · 나중에) */
export function Alert({
  open,
  title,
  message,
  media,
  confirmLabel = '확인',
  cancelLabel = '취소',
  tone = 'primary',
  onConfirm,
  onCancel,
}: AlertProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      role="alertdialog"
      title={title}
      description={message}
      media={media}
      centered
      footer={
        <>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </>
      }
    />
  )
}

export interface InfoProps extends DialogBase {
  confirmLabel?: string
  onClose: () => void
}

/** Info · 확인 1개 (메일을 보냈어요 → 확인) */
export function Info({ open, title, message, media, confirmLabel = '확인', onClose }: InfoProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={message}
      media={media}
      centered
      footer={
        <Button variant="secondary" onClick={onClose}>
          {confirmLabel}
        </Button>
      }
    />
  )
}

export interface NotifyProps extends DialogBase {
  acceptLabel?: string
  closeLabel?: string
  onAccept: () => void
  onClose: () => void
}

/** Notify · 수락/닫기 (새 실험이 열렸어요 → 보러 가기 · 닫기) */
export function Notify({
  open,
  title,
  message,
  media,
  acceptLabel = '보러 가기',
  closeLabel = '닫기',
  onAccept,
  onClose,
}: NotifyProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={message}
      media={media}
      centered
      size="md"
      footer={
        <>
          <Button variant="primary" onClick={onAccept}>
            {acceptLabel}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {closeLabel}
          </Button>
        </>
      }
    />
  )
}

export interface ActionSheetOption<V extends string = string> {
  value: V
  label: ReactNode
  /** primary: 인디고(권장) · danger: 빨강 */
  tone?: 'primary' | 'default' | 'danger'
  description?: ReactNode
}

export interface ActionSheetProps<V extends string = string> {
  open: boolean
  title?: ReactNode
  message?: ReactNode
  options: ActionSheetOption<V>[]
  cancelLabel?: string
  onSelect: (value: V) => void
  onCancel: () => void
}

/** Action Sheet · 세로 선택 (어디서부터 할까요? → 이어하기 · 처음부터 · 취소) */
export function ActionSheet<V extends string>({
  open,
  title,
  message,
  options,
  cancelLabel = '취소',
  onSelect,
  onCancel,
}: ActionSheetProps<V>) {
  return (
    <Modal open={open} onClose={onCancel} title={title} description={message} centered className={styles.sheet}>
      <ul className={styles.options}>
        {options.map((o) => (
          <li key={o.value}>
            <button type="button" className={cx(styles.option, styles[o.tone ?? 'default'])} onClick={() => onSelect(o.value)}>
              <span>{o.label}</span>
              {o.description && <span className={styles.optionDesc}>{o.description}</span>}
            </button>
          </li>
        ))}
        <li>
          <button type="button" className={cx(styles.option, styles.cancel)} onClick={onCancel}>
            {cancelLabel}
          </button>
        </li>
      </ul>
    </Modal>
  )
}

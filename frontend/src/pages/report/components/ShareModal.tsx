import { useEffect, useRef, useState } from 'react'
import { shareExperiment } from '../../../api'
import { Button, Icon, Modal, Spinner, useToast } from '../../../components'
import { drawShareImage } from './shareImage'
import type { ShareImageData } from './shareImage'
import styles from './ShareModal.module.css'

interface Props {
  open: boolean
  onClose: () => void
  experimentId: string
  data: Omit<ShareImageData, 'url'>
}

/** 리포트 "공유" → H-03 공유 이미지 미리보기 + PNG 저장 + 링크 복사(POST /share) */
export function ShareModal({ open, onClose, experimentId, data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const toast = useToast()
  const [url, setUrl] = useState<string | null>(null)
  const [drawing, setDrawing] = useState(true)

  // 열릴 때 공유 링크를 만든다
  useEffect(() => {
    if (!open || url) return
    let alive = true
    shareExperiment(experimentId)
      .then((r) => alive && setUrl(new URL(r.url, window.location.origin).toString()))
      .catch((e: unknown) => {
        if (!alive) return
        toast.show({
          title: '공유 링크를 만들지 못했어요',
          description: e instanceof Error ? e.message : undefined,
          tone: 'danger',
        })
        setUrl(`${window.location.origin}/experiments/${experimentId}`)
      })
    return () => {
      alive = false
    }
  }, [open, url, experimentId, toast])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!open || !url || !canvas) return
    let alive = true
    queueMicrotask(() => alive && setDrawing(true))
    drawShareImage(canvas, { ...data, url: url.replace(/^https?:\/\//, '') })
      .catch(() => toast.show({ title: '이미지를 그리지 못했어요', tone: 'danger' }))
      .finally(() => alive && setDrawing(false))
    return () => {
      alive = false
    }
  }, [open, url, data, toast])

  function download() {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `ai-tech-playground-${data.code.replace('#', '')}.png`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    }, 'image/png')
  }

  async function copy() {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      toast.show({
        title: '링크를 복사했어요',
        description: url,
        tone: 'success',
      })
    } catch {
      toast.show({
        title: '복사하지 못했어요',
        description: url,
        tone: 'danger',
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      eyebrow="SHARE · 1080 × 1080"
      title="결과 공유하기"
      description="이미지를 저장해 SNS에 올리거나, 링크를 친구에게 보내 보세요"
      showClose
      footer={
        <>
          <Button variant="secondary" iconLeft={<Icon name="link" size={16} />} onClick={copy} disabled={!url}>
            링크 복사
          </Button>
          <Button iconLeft={<Icon name="download" size={16} />} onClick={download} disabled={drawing}>
            이미지 저장
          </Button>
        </>
      }
    >
      <div className={styles.preview}>
        <canvas ref={canvasRef} className={styles.canvas} aria-label="공유 이미지 미리보기" role="img" />
        {drawing && (
          <div className={styles.loading}>
            <Spinner />
          </div>
        )}
      </div>
    </Modal>
  )
}

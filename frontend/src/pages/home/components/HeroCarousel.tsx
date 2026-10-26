import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Badge, Button, Character, Tag, cx } from '../../../components'
import type { CharacterId } from '../../../api/types'
import { CHARACTERS } from '../../../components'
import { CHARACTER_TINT } from '../characterTint'
import { prefersReducedMotion } from '../format'
import styles from './HeroCarousel.module.css'

export interface HeroSlide {
  code: string
  title: string
  body: string
  character: CharacterId
  badge: 'FEATURED' | 'NOW OPEN' | 'COMING SOON'
  tags: string[]
  /** 캐릭터 옆 말풍선(성공률 12% → 86% · D-14) */
  bubble?: string
  cta: string
  /** 주 버튼 동작 */
  onCta: () => void
  ctaTo?: string
  detailTo: string
}

const AUTO_MS = 3000
const MANUAL_PAUSE_MS = 10_000

const BADGE_TONE = { FEATURED: 'dark', 'NOW OPEN': 'solid', 'COMING SOON': 'neutral' } as const

interface Props {
  slides: HeroSlide[]
  initialIndex?: number
}

/**
 * 🧩 Hero Carousel — 3초마다 다음 실험으로. 마우스 · 포커스가 올라가면 멈춤,
 * ‹ › 를 누르면 10초간 자동 넘김 멈춤, 동작 줄이기 설정이면 자동 넘김 끔, 화면 밖이면 정지.
 */
export function HeroCarousel({ slides, initialIndex = 0 }: Props) {
  const [index, setIndex] = useState(initialIndex)
  const [hovered, setHovered] = useState(false)
  const [visible, setVisible] = useState(true)
  const [manualUntil, setManualUntil] = useState(0)
  const [reduced] = useState(prefersReducedMotion)
  const rootRef = useRef<HTMLElement>(null)
  const count = slides.length

  const go = useCallback(
    (next: number, manual: boolean) => {
      setIndex(((next % count) + count) % count)
      if (manual) setManualUntil(Date.now() + MANUAL_PAUSE_MS)
    },
    [count],
  )

  // 화면 밖이거나 탭이 숨겨지면 정지
  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const paused = reduced || hovered || !visible || count < 2

  useEffect(() => {
    if (paused) return
    const wait = Math.max(AUTO_MS, manualUntil - Date.now())
    const t = window.setTimeout(() => {
      if (document.visibilityState === 'hidden') {
        setManualUntil(Date.now()) // 다시 예약
        return
      }
      setIndex((i) => (i + 1) % count)
    }, wait)
    return () => window.clearTimeout(t)
  }, [paused, index, manualUntil, count])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(index + 1, true)
    else if (e.key === 'ArrowLeft') go(index - 1, true)
  }

  return (
    <section
      ref={rootRef}
      className={styles.root}
      aria-roledescription="carousel"
      aria-label="실험 소개"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHovered(false)
      }}
      onKeyDown={onKeyDown}
    >
      <div className={styles.stack} aria-live={paused ? 'polite' : 'off'}>
        {slides.map((s, i) => {
          const active = i === index
          return (
            <article
              key={s.code}
              className={cx(styles.slide, active && styles.active)}
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${count}`}
              aria-hidden={!active}
              inert={!active}
            >
              <div className={styles.text}>
                <div className={styles.eyebrow}>
                  <span className={styles.kicker}>EXPERIMENT</span>
                  <Badge tone={BADGE_TONE[s.badge]} mono>
                    {s.badge}
                  </Badge>
                </div>
                <p className={styles.code}>{s.code}</p>
                <h2 className={styles.title}>{s.title}</h2>
                <p className={styles.body}>{s.body}</p>
                <div className={styles.tags}>
                  {s.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
                <div className={styles.actions}>
                  {s.ctaTo ? (
                    <Button to={s.ctaTo} size="lg" variant={s.badge === 'COMING SOON' ? 'secondary' : 'primary'}>
                      {s.cta}
                    </Button>
                  ) : (
                    <Button size="lg" variant={s.badge === 'COMING SOON' ? 'secondary' : 'primary'} onClick={s.onCta}>
                      {s.cta}
                    </Button>
                  )}
                  <Button to={s.detailTo} size="lg" variant="secondary">
                    자세히 보기
                  </Button>
                </div>
              </div>
              <div className={styles.stage}>
                <Link
                  to={s.detailTo}
                  className={styles.circle}
                  style={{ background: CHARACTER_TINT[s.character] }}
                  tabIndex={-1}
                  aria-hidden
                >
                  <Character id={s.character} size={260} float={active && !reduced} alt="" />
                </Link>
                {s.bubble && <span className={styles.bubble}>{s.bubble}</span>}
                <span className={styles.name}>{CHARACTERS[s.character].name}</span>
              </div>
            </article>
          )
        })}
      </div>

      <div className={styles.controls}>
        <div className={styles.dots} role="tablist" aria-label="슬라이드 선택">
          {slides.map((s, i) => (
            <button
              key={s.code}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`${s.code} ${s.title}`}
              className={cx(styles.dot, i === index && styles.dotActive)}
              onClick={() => go(i, true)}
            />
          ))}
        </div>
        <span className={styles.counter}>
          {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
        </span>
        <span className={styles.hint}>{reduced ? '‹ › 로 다음 실험을 볼 수 있어요' : '3초마다 다음 실험으로 넘어가요'}</span>
        <div className={styles.arrows}>
          <button type="button" className={styles.arrow} aria-label="이전 실험" onClick={() => go(index - 1, true)}>
            ‹
          </button>
          <button type="button" className={styles.arrow} aria-label="다음 실험" onClick={() => go(index + 1, true)}>
            ›
          </button>
        </div>
      </div>
    </section>
  )
}

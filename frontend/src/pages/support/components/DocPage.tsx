import type { ReactNode } from 'react'
import { Link } from 'react-router'
import styles from './DocPage.module.css'

export interface DocSection {
  id: string
  title: string
  /** 문단 문자열 또는 번호 목록(문자열 배열) */
  body: (string | string[])[]
}

interface DocPageProps {
  eyebrow: string
  title: string
  effectiveDate: string
  intro: ReactNode
  sections: DocSection[]
}

/** 이용약관 · 개인정보처리방침 공통 문서 레이아웃(목차 + 본문) */
export function DocPage({ eyebrow, title, effectiveDate, intro, sections }: DocPageProps) {
  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.meta}>시행일 {effectiveDate}</p>
      </header>
      <div className={styles.grid}>
        <nav className={styles.toc} aria-label="목차">
          <p className={styles.tocTitle}>목차</p>
          <ol className={styles.tocList}>
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className={styles.tocLink}>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <article className={styles.doc}>
          <p className={styles.intro}>{intro}</p>
          {sections.map((s) => (
            <section key={s.id} id={s.id} className={styles.section}>
              <h2 className={styles.sectionTitle}>{s.title}</h2>
              <div className={styles.body}>
                {s.body.map((b, i) =>
                  typeof b === 'string' ? (
                    <p key={i}>{b}</p>
                  ) : (
                    <ol key={i}>
                      {b.map((li) => (
                        <li key={li}>{li}</li>
                      ))}
                    </ol>
                  ),
                )}
              </div>
            </section>
          ))}
          <p className={styles.footer}>
            궁금한 점이 있으면 <Link to="/support">문의하기</Link>로 알려 주세요.
          </p>
        </article>
      </div>
    </div>
  )
}

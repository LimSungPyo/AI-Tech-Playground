import { Link } from 'react-router'
import styles from './Footer.module.css'
import { FOOTER_LINKS } from './nav'

const YEAR = new Date().getFullYear()

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.copy}>© {YEAR} AI Tech Playground</p>
        <nav aria-label="사이트 정보">
          <ul className={styles.links}>
            {FOOTER_LINKS.map((l) => (
              <li key={l.label}>
                <Link to={l.to}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  )
}

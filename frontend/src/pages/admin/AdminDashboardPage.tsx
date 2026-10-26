import { Link } from 'react-router'
import { getAdminAudit, getAdminDashboard } from '../../api'
import type { AdminDashboard } from '../../api/types'
import { BarMini, Skeleton, cx } from '../../components'
import { useApi } from '../../hooks/useApi'
import { LoadError, PageHead, Panel, PanelSkeleton } from './components/AdminUi'
import a from './components/admin.module.css'
import { hm, md } from './components/format'
import styles from './AdminDashboardPage.module.css'

/** 할 일 문구 → 담당 화면 */
const TODO_ROUTES: { match: string; to: string; frame: string; tone: 'indigo' | 'danger' | 'warning' }[] = [
  { match: '레이더', to: '/admin/radar', frame: 'F-03', tone: 'indigo' },
  { match: '기술 카드', to: '/admin/cards', frame: 'F-04', tone: 'indigo' },
  { match: '문의', to: '/admin/inquiries', frame: 'F-10', tone: 'danger' },
  { match: '신고', to: '/admin/inquiries?tab=report', frame: 'F-10', tone: 'danger' },
  { match: '투표', to: '/admin/home', frame: 'F-07', tone: 'warning' },
]

/** "레이더 키워드 검수 대기 12" → 이름 + 값, "투표 마감 D-1 · 1,284명" → 앞뒤로 */
function splitAlert(text: string) {
  if (text.includes(' · ')) {
    const [label, ...rest] = text.split(' · ')
    return { label, value: rest.join(' · ') }
  }
  const m = text.match(/^(.*\S)\s+([\d,]+\S*)$/)
  return m ? { label: m[1], value: m[2] } : { label: text, value: '' }
}

const SYSTEM_LABEL = { ok: '정상', warning: '주의', down: '장애' } as const

const isDown = (delta: string | number) => String(delta).trim().startsWith('-')

function Kpis({ kpis }: { kpis: AdminDashboard['kpis'] }) {
  return (
    <ul className={styles.kpis}>
      {kpis.map((k) => (
        <li key={k.label} className={styles.kpi}>
          <span className={styles.kpiLabel}>{k.label}</span>
          <strong className={styles.kpiValue}>{k.value}</strong>
          <span className={cx(styles.delta, isDown(k.delta) && styles.down)}>
            {isDown(k.delta) ? '▼' : '▲'} {k.delta}
          </span>
        </li>
      ))}
    </ul>
  )
}

/** 전환율 선을 막대 높이 안에서 잘 보이게 0.15~0.85로 펼친다 */
function spread(values: number[]) {
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  return values.map((v) => (hi > lo ? 0.15 + ((v - lo) / (hi - lo)) * 0.7 : 0.5))
}

/** F-02 "최근 7일 · DAU · 전환율". v2 dau가 없으면 신규 가입으로 대신 그린다 */
function TrendChart({ dash }: { dash: AdminDashboard }) {
  const dau = dash.dau ?? dash.signups
  const peak = Math.max(...dau.map((d) => d.count))
  const rates = dash.conversion?.map((c) => c.rate)
  return (
    <>
      <BarMini
        height={220}
        data={dau.map((d) => ({ label: md(d.date), value: d.count, highlight: d.count === peak }))}
        line={rates && rates.length === dau.length ? spread(rates) : undefined}
        lineMax={1}
        label={dash.dau ? '최근 7일 DAU와 게스트 → 회원 전환율' : '최근 7일 신규 가입 수'}
      />
      <p className={styles.legend}>
        <span className={styles.legendBox} /> {dash.dau ? 'DAU' : '신규 가입'}
        {rates && (
          <span className={styles.legendLine}>
            <span className={styles.legendDash} /> 게스트 → 회원 전환율
          </span>
        )}
      </p>
    </>
  )
}

// W2 admin 담당 · 경로 /admin — F-02 대시보드
export default function AdminDashboardPage() {
  const dash = useApi((signal) => getAdminDashboard(signal), [])
  const audit = useApi((signal) => getAdminAudit(signal), [])

  return (
    <>
      <PageHead title="대시보드" />

      {dash.error ? (
        <LoadError error={dash.error} onRetry={dash.reload} />
      ) : !dash.data ? (
        <>
          <div className={styles.kpis}>
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} height={88} />
            ))}
          </div>
          <div className={styles.row}>
            <PanelSkeleton height={260} />
            <PanelSkeleton height={260} />
          </div>
        </>
      ) : (
        <>
          <Kpis kpis={dash.data.kpis} />
          <div className={styles.row}>
            <Panel title="오늘 할 일" right={<span className={a.panelLink}>{dash.data.alerts.length}건</span>}>
              <ul className={styles.todos}>
                {dash.data.alerts.map((al) => {
                  const { label, value } = splitAlert(al.text)
                  const route = TODO_ROUTES.find((r) => al.text.includes(r.match))
                  return (
                    <li key={al.text} className={cx(styles.todo, styles[`tone_${route?.tone ?? (al.level === 'info' ? 'indigo' : 'danger')}`])}>
                      <span className={cx(a.dot, styles.todoDot)} />
                      <span className={styles.todoLabel}>{label}</span>
                      <span className={styles.todoValue}>{value}</span>
                      {route && (
                        <Link to={route.to} className={styles.todoLink} aria-label={`${label} 화면으로`}>
                          {route.frame} →
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </Panel>

            <Panel
              title={dash.data.dau ? '최근 7일 · DAU · 전환율' : '최근 7일 · 신규 가입'}
              right={
                <Link to="/admin/analytics" className={a.panelLink}>
                  주 단위 보기
                </Link>
              }
            >
              <TrendChart dash={dash.data} />
            </Panel>
          </div>
        </>
      )}

      <div className={styles.row}>
        <Panel title="시스템 상태">
          {dash.error ? null : !dash.data ? (
            <Skeleton shape="text" lines={4} />
          ) : (
            <ul className={styles.system}>
              {(dash.data.system ?? []).map((s) => (
                <li key={s.name}>
                  {s.status === 'ok' ? (
                    <span className={cx(a.dot, styles.ok)} />
                  ) : (
                    <span className={cx(styles.warnMark, s.status === 'down' && styles.downMark)}>▲</span>
                  )}
                  <strong>
                    {s.name}
                    <span className="sr-only"> ({SYSTEM_LABEL[s.status]})</span>
                  </strong>
                  <span>{s.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="최근 감사 로그"
          right={
            <Link to="/admin/audit" className={a.panelLink}>
              전체 보기 →
            </Link>
          }
        >
          {audit.error ? (
            <LoadError error={audit.error} onRetry={audit.reload} />
          ) : !audit.data ? (
            <Skeleton shape="text" lines={4} />
          ) : (
            <div className={a.tableWrap}>
              <table className={a.table}>
                <thead>
                  <tr>
                    <th>시간</th>
                    <th>관리자</th>
                    <th>행동</th>
                    <th>대상</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.data.logs.slice(0, 4).map((l) => (
                    <tr key={l.at + l.action}>
                      <td className={cx(a.strong, a.num)}>{hm(l.at)}</td>
                      <td>{l.admin}</td>
                      <td className={a.wrap}>{l.action}</td>
                      <td>{l.target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  )
}

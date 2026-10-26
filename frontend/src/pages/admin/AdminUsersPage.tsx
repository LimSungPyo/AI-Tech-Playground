import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { getAdminUsers } from '../../api'
import type { AdminUserAction, AdminUserStatus, AdminUsers } from '../../api/types'
import { Avatar, Button, EmptyState, Icon, Input, Skeleton, cx } from '../../components'
import { useApi } from '../../hooks/useApi'
import { AccountActionModal } from './components/AccountActionModal'
import { FilterPills, LoadError, PageHead, Panel, Pill } from './components/AdminUi'
import type { PillTone } from './components/AdminUi'
import a from './components/admin.module.css'
import { lastSeen, md, mdhm } from './components/format'
import styles from './AdminUsersPage.module.css'

type User = AdminUsers['users'][number]
type Filter = 'all' | AdminUserStatus

const STATUS: Record<AdminUserStatus, { label: string; tone: PillTone }> = {
  active: { label: '활성', tone: 'success' },
  dormant: { label: '휴면', tone: 'neutral' },
  suspended: { label: '잠김', tone: 'danger' },
  withdrawing: { label: '탈퇴 유예', tone: 'warning' },
}

/** 상태별로 할 수 있는 계정 조치 */
function actionsFor(status: AdminUserStatus): { action: AdminUserAction; label: string; variant: 'primary' | 'secondary' | 'danger' }[] {
  switch (status) {
    case 'withdrawing':
      return [{ action: 'restore', label: '탈퇴 유예 복구', variant: 'primary' }]
    case 'suspended':
      return [{ action: 'restore', label: '잠금 해제', variant: 'primary' }]
    default:
      return [
        { action: 'warn', label: '경고 보내기', variant: 'secondary' },
        { action: 'suspend', label: '계정 잠금', variant: 'danger' },
      ]
  }
}

function UserDetail({ user, onAction }: { user: User; onAction: (a: AdminUserAction) => void }) {
  const st = STATUS[user.status]
  return (
    <Panel className={styles.detail}>
      <div className={styles.who}>
        <Avatar name={user.nickname} size={56} />
        <div>
          <h2 className={styles.name}>{user.nickname}</h2>
          <p className={a.muted}>{user.email}</p>
        </div>
      </div>
      <div className={cx(styles.banner, styles[`banner_${user.status}`])}>
        <Pill tone={st.tone}>{st.label}</Pill>
        <span>
          {user.status === 'withdrawing'
            ? '탈퇴 신청 상태예요. 유예 기간 안에는 복구할 수 있어요.'
            : user.status === 'suspended'
              ? '잠긴 계정이에요. 로그인할 수 없어요.'
              : user.status === 'dormant'
                ? '오래 접속하지 않은 휴면 계정이에요.'
                : '정상 이용 중이에요.'}
        </span>
      </div>
      <dl className={styles.facts}>
        <dt>ID</dt>
        <dd>{user.id}</dd>
        <dt>가입</dt>
        <dd>{user.joinedAt}</dd>
        <dt>최근 접속</dt>
        <dd>{mdhm(user.lastSeenAt)}</dd>
      </dl>
      <h3 className={styles.sub}>계정 조치</h3>
      <div className={styles.actions}>
        {actionsFor(user.status).map((x) => (
          <Button key={x.action} block pill={false} variant={x.variant} onClick={() => onAction(x.action)}>
            {x.label}
          </Button>
        ))}
      </div>
      <p className={a.muted}>모든 조치는 사유 입력 + 2차 인증 후 실행되고 감사 로그에 남아요.</p>
    </Panel>
  )
}

// W2 admin 담당 · 경로 /admin/users — F-08 사용자 관리 · F-09 계정 조치 확인 모달 (?q=검색어)
export default function AdminUsersPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [draftQ, setDraftQ] = useState(q)
  // 상단 검색으로 q가 바뀌면 입력칸도 맞춘다
  const [prevQ, setPrevQ] = useState(q)
  if (q !== prevQ) {
    setPrevQ(q)
    setDraftQ(q)
  }
  const { data, error, reload, setData } = useApi((signal) => getAdminUsers(q || undefined, signal), [q])
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pending, setPending] = useState<AdminUserAction | null>(null)

  const users = data?.users ?? []
  const count = (s: AdminUserStatus) => users.filter((u) => u.status === s).length
  const rows = filter === 'all' ? users : users.filter((u) => u.status === filter)
  const selected = users.find((u) => u.id === selectedId) ?? rows[0] ?? null

  const applyAction = (u: User, action: AdminUserAction) => {
    const status: AdminUserStatus | null = action === 'restore' ? 'active' : action === 'suspend' ? 'suspended' : null
    if (status) setData((prev) => (prev ? { users: prev.users.map((x) => (x.id === u.id ? { ...x, status } : x)) } : prev))
  }

  return (
    <>
      <PageHead title="사용자 관리" />
      <div className={styles.toolbar}>
        <FilterPills<Filter>
          label="계정 상태"
          value={filter}
          onChange={setFilter}
          items={[
            { value: 'all', label: '전체', count: users.length },
            { value: 'active', label: '활성', count: count('active') },
            { value: 'dormant', label: '휴면', count: count('dormant') },
            { value: 'suspended', label: '잠김', count: count('suspended') },
            { value: 'withdrawing', label: '탈퇴 유예', count: count('withdrawing') },
          ]}
        />
        <form
          role="search"
          className={styles.search}
          onSubmit={(e) => {
            e.preventDefault()
            setParams(draftQ.trim() ? { q: draftQ.trim() } : {})
          }}
        >
          <Input
            aria-label="닉네임 · 이메일 검색"
            placeholder="닉네임 · 이메일"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            iconLeft={<Icon name="search" size={16} />}
          />
        </form>
        <Pill tone="success">개인정보 마스킹 ON</Pill>
      </div>

      {error ? (
        <LoadError error={error} onRetry={reload} />
      ) : (
        <div className={a.grid2}>
          <Panel>
            {!data ? (
              <Skeleton shape="text" lines={6} />
            ) : rows.length === 0 ? (
              <EmptyState expression="sleep" title="찾는 사용자가 없어요" description={q ? `"${q}" 검색 결과가 없어요.` : undefined} compact />
            ) : (
              <div className={a.tableWrap}>
                <table className={a.table}>
                  <thead>
                    <tr>
                      <th>닉네임</th>
                      <th>이메일</th>
                      <th>상태</th>
                      <th>가입</th>
                      <th>마지막 접속</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((u) => (
                      <tr key={u.id} className={cx(a.rowButton, selected?.id === u.id && a.rowOn)} onClick={() => setSelectedId(u.id)} aria-selected={selected?.id === u.id}>
                        <td className={a.strong}>
                          <button type="button" className={styles.rowLink} onClick={() => setSelectedId(u.id)}>
                            {u.nickname}
                          </button>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <Pill tone={STATUS[u.status].tone}>{STATUS[u.status].label}</Pill>
                        </td>
                        <td className={a.num}>{md(u.joinedAt)}</td>
                        <td>{lastSeen(u.lastSeenAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          {selected && <UserDetail user={selected} onAction={setPending} />}
        </div>
      )}

      <AccountActionModal user={pending ? selected : null} action={pending} onClose={() => setPending(null)} onDone={applyAction} />
    </>
  )
}

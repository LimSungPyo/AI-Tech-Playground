import { useState } from 'react'
import { getAdminAudit, inviteAdmin } from '../../api'
import { isApiError } from '../../api/client'
import type { AdminAudit } from '../../api/types'
import { Avatar, Button, Icon, Input, Modal, Select, Skeleton, Toggle, useToast } from '../../components'
import { useApi } from '../../hooks/useApi'
import { FilterPills, LoadError, PageHead, Panel, Pill } from './components/AdminUi'
import a from './components/admin.module.css'
import { mdhm } from './components/format'
import styles from './AdminAuditPage.module.css'

type Tab = 'roles' | 'admins' | 'logs'

const ROLES = ['슈퍼관리자', '콘텐츠 에디터', 'CS 담당', '분석 뷰어']
/** 역할별 권한 정책(F-00 ③ 역할별 담당) — [슈퍼, 에디터, CS, 분석] */
const PERMISSIONS: [string, boolean[]][] = [
  ['레이더 검수 · 기술 카드 게시', [true, true, false, false]],
  ['모듈 공개 · 캐러셀 · 투표 마감', [true, false, false, false]],
  ['사용자 조회 (마스킹)', [true, false, true, true]],
  ['개인정보 원본 열람 (사유 필수)', [true, false, true, false]],
  ['계정 조치 (잠금 해제 · 복구)', [true, false, true, false]],
  ['기록 초기화 · 계정 삭제', [true, false, false, false]],
  ['알림 발송', [true, true, false, false]],
  ['데이터 분석 · CSV', [true, false, false, true]],
  ['권한 변경', [true, false, false, false]],
]

/** 위험 조치: 개인정보 열람 · 잠금 · 삭제 · 초기화 · 권한 · 공개 */
const RISKY = ['열람', '잠금', '삭제', '초기화', '권한', '공개 예약']
const isRisky = (l: AdminAudit['logs'][number]) => RISKY.some((r) => l.action.includes(r))

function PermissionMatrix() {
  return (
    <Panel title="역할별 권한" right={<span className={a.panelLink}>변경 시 슈퍼관리자 승인 필요</span>}>
      <div className={a.tableWrap}>
        <table className={a.table}>
          <thead>
            <tr>
              <th>권한</th>
              {ROLES.map((r) => (
                <th key={r} className={styles.center}>
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map(([name, allowed]) => (
              <tr key={name}>
                <td className={a.strong}>{name}</td>
                {allowed.map((ok, i) => (
                  <td key={ROLES[i]} className={styles.center}>
                    {ok ? <Icon name="check" size={14} className={styles.ok} /> : <span className={styles.no}>–</span>}
                    <span className="sr-only">{ok ? '허용' : '불가'}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

// W2 admin 담당 · 경로 /admin/audit — F-13 권한 · 감사 로그
export default function AdminAuditPage() {
  const toast = useToast()
  const { data, error, reload, setData } = useApi((signal) => getAdminAudit(signal), [])
  const [tab, setTab] = useState<Tab>('roles')
  const [riskyOnly, setRiskyOnly] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [invite, setInvite] = useState({ email: '', role: ROLES[1] })
  const [inviting, setInviting] = useState(false)

  const sendInvite = async () => {
    setInviting(true)
    try {
      const res = await inviteAdmin(invite.email.trim(), invite.role)
      setData((prev) => (prev && !prev.admins.some((x) => x.id === res.invited.id) ? { ...prev, admins: [...prev.admins, res.invited] } : prev))
      setInviteOpen(false)
      toast.show({ title: '초대 요청을 보냈어요', description: `${invite.email} · ${res.invited.role} · 슈퍼관리자 승인 대기`, tone: 'success' })
      setInvite({ email: '', role: ROLES[1] })
    } catch (e) {
      toast.show({ title: '초대하지 못했어요', description: isApiError(e) ? e.message : undefined, tone: 'danger' })
    } finally {
      setInviting(false)
    }
  }

  const roleOf = (name: string) => data?.admins.find((x) => x.name === name)?.role ?? '—'
  const logs = (data?.logs ?? []).filter((l) => !riskyOnly || isRisky(l))

  const logsPanel = (
    <Panel
      title="최근 감사 로그"
      right={<Toggle className={a.switchFirst} label="위험 조치만" checked={riskyOnly} onChange={(e) => setRiskyOnly(e.target.checked)} />}
    >
      {!data ? (
        <Skeleton shape="text" lines={5} />
      ) : (
        <div className={a.tableWrap}>
          <table className={a.table}>
            <thead>
              <tr>
                <th>시간</th>
                <th>관리자</th>
                <th>역할</th>
                <th>행동</th>
                <th>대상</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.at + l.action}>
                  <td className={`${a.strong} ${a.num}`}>{mdhm(l.at)}</td>
                  <td>{l.admin}</td>
                  <td>{roleOf(l.admin)}</td>
                  <td className={a.wrap}>
                    {l.action} {isRisky(l) && <Pill tone="danger">위험</Pill>}
                  </td>
                  <td>{l.target}</td>
                  <td className={a.num}>{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )

  return (
    <>
      <PageHead title="권한 · 감사 로그" />
      <div className={styles.toolbar}>
        <FilterPills<Tab>
          label="보기"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'roles', label: '역할 · 권한' },
            { value: 'admins', label: '관리자 계정' },
            { value: 'logs', label: '감사 로그' },
          ]}
        />
        <Button pill={false} iconLeft={<Icon name="plus" size={16} />} onClick={() => setInviteOpen(true)}>
          관리자 초대
        </Button>
      </div>

      {error ? (
        <LoadError error={error} onRetry={reload} />
      ) : (
        <div className={a.stack}>
          {tab === 'roles' && (
            <>
              <PermissionMatrix />
              {logsPanel}
            </>
          )}
          {tab === 'admins' && (
            <Panel title="관리자 계정">
              {!data ? (
                <Skeleton shape="text" lines={3} />
              ) : (
                <ul className={styles.admins}>
                  {data.admins.map((ad) => (
                    <li key={ad.id}>
                      <Avatar name={ad.name} size={36} />
                      <strong>{ad.name}</strong>
                      <span className={a.muted}>{ad.id}</span>
                      <Pill tone={ad.role === '슈퍼관리자' ? 'dark' : 'indigo'}>{ad.role}</Pill>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}
          {tab === 'logs' && logsPanel}
        </div>
      )}

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        size="sm"
        showClose
        title="관리자 초대"
        description="초대 메일의 링크로 2단계 인증을 등록하면 권한이 열려요. 슈퍼관리자 승인 후 적용돼요."
        footer={
          <>
            <Button variant="secondary" pill={false} disabled={inviting} onClick={() => setInviteOpen(false)}>
              취소
            </Button>
            <Button pill={false} loading={inviting} disabled={!/^\S+@\S+\.\S+$/.test(invite.email)} onClick={() => void sendInvite()}>
              초대 요청
            </Button>
          </>
        }
      >
        <div className={styles.inviteForm}>
          <Input label="이메일" type="email" placeholder="name@playground.ai" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
          <Select label="역할" value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })} options={ROLES.map((r) => ({ value: r, label: r }))} />
        </div>
      </Modal>
    </>
  )
}

import { useRef, useState } from 'react'
import { getMyCharacters, setPartner, type DexEntry } from '../../api'
import { useAuth } from '../../auth/useAuth'
import {
  Badge,
  Button,
  Character,
  EmptyState,
  GlassCard,
  Icon,
  ProgressBar,
  SegmentedControl,
  Skeleton,
  cx,
  useToast,
} from '../../components'
import { useApi } from '../../hooks/useApi'
import { CHARACTER_TINT, formatMonthDay } from './components/format'
import { PageTitle } from './components/PageTitle'
import my from './components/my.module.css'
import styles from './MyCharactersPage.module.css'

type Filter = 'all' | 'met' | 'found' | 'locked'

/** 상태 머신 → 화면 라벨(알 · 아기 · 성장 · 마스터) */
const STATE_LABEL: Record<DexEntry['state'], string> = {
  egg: '알',
  baby: '아기',
  growing: '성장',
  master: '마스터',
}

/** 레벨 조건(NOTES P5-3: Lv2 = 성공률 60% · Lv3 = 85% + 반전 시청) */
const LV2_RATE = 60
const LV3_RATE = 85

const kindOf = (c: DexEntry): Exclude<Filter, 'all'> => (c.obtained ? 'met' : c.title === '발견' ? 'found' : 'locked')

// W2 my 담당 · 경로 /my/characters · C-04 내 캐릭터
export default function MyCharactersPage() {
  const { user } = useAuth()
  const chars = useApi((s) => getMyCharacters(s), [])
  const toast = useToast()
  const gridRef = useRef<HTMLUListElement>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (chars.error) {
    return (
      <EmptyState
        expression="confused"
        title="캐릭터를 불러오지 못했어요"
        description={chars.error.message}
        action={<Button onClick={chars.reload}>다시 시도</Button>}
      />
    )
  }

  const list = chars.data ?? []
  const count = (k: Exclude<Filter, 'all'>) => list.filter((c) => kindOf(c) === k).length
  const partnerChar = partnerId ?? user?.partner ?? null
  const partner = list.find((c) => c.character === partnerChar) ?? list.find((c) => c.obtained)
  const featured = list.find((c) => c.id === selectedId) ?? partner
  const masters = list.filter((c) => c.state === 'master')
  const visible = filter === 'all' ? list : list.filter((c) => kindOf(c) === filter)

  const onPartner = async () => {
    if (!featured) return
    if (featured.character === partner?.character) {
      // 이미 파트너면 아래 그리드에서 다른 친구를 고르게 안내
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      toast.show({ title: '함께할 친구를 골라 주세요', description: '만난 친구를 누르면 파트너로 정할 수 있어요.' })
      return
    }
    setSaving(true)
    try {
      const res = await setPartner(featured.character)
      setPartnerId(res.partner ?? featured.character)
      toast.show({ title: `이제 ${featured.name}와 함께해요`, tone: 'success' })
    } catch (e) {
      toast.show({ title: '파트너를 바꾸지 못했어요', description: e instanceof Error ? e.message : undefined, tone: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={my.page}>
      <PageTitle
        title="내 캐릭터"
        sub={chars.data ? `만난 친구 ${count('met')} · 발견 ${count('found')} · 잠김 ${count('locked')}` : ' '}
        right={
          <SegmentedControl<Filter>
            label="캐릭터 상태"
            value={filter}
            onChange={setFilter}
            items={[
              { value: 'all', label: `전체 ${list.length}` },
              { value: 'met', label: `만남 ${count('met')}` },
              { value: 'found', label: `발견 ${count('found')}` },
              { value: 'locked', label: `잠김 ${count('locked')}` },
            ]}
          />
        }
      />

      {chars.loading || !chars.data ? (
        <>
          <Skeleton height={320} />
          <div className={styles.grid}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={230} />
            ))}
          </div>
        </>
      ) : (
        <>
          {featured && (
            <FeaturedCard
              entry={featured}
              isPartner={featured.character === partner?.character}
              saving={saving}
              onPartner={onPartner}
            />
          )}

          {masters.length >= 2 && (
            <GlassCard variant="dark" radius="lg" className={styles.team}>
              <div>
                <span className={styles.teamEyebrow}>TEAM READY</span>
                <p className={styles.teamText}>
                  마스터 {masters.length}명({masters.map((m) => m.name).join(' · ')})을 모아 팀 미션이 열렸어요!
                </p>
              </div>
              <Button to="/team-missions/t1">팀 미션 하러 가기</Button>
            </GlassCard>
          )}

          <ul ref={gridRef} className={styles.grid}>
            {visible.map((c) => (
              <CharacterCard
                key={c.id}
                entry={c}
                selected={c.id === featured?.id}
                onSelect={() => {
                  setSelectedId(c.id)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function FeaturedCard({
  entry,
  isPartner,
  saving,
  onPartner,
}: {
  entry: DexEntry
  isPartner: boolean
  saving: boolean
  onPartner: () => void
}) {
  const master = entry.state === 'master'
  const checks = [
    { label: 'Lv1 만남', ok: entry.obtained },
    { label: `Lv2 성장 · ${LV2_RATE}%`, ok: entry.level >= 2 },
    { label: `Lv3 마스터 · ${LV3_RATE}% + 반전`, ok: entry.level >= 3 },
  ]
  return (
    <GlassCard radius="lg" padding="lg" className={styles.featured}>
      <span className={styles.featuredArt} style={{ background: CHARACTER_TINT[entry.character] }}>
        <Character id={entry.character} size={200} locked={!entry.obtained} />
      </span>
      <div className={styles.featuredBody}>
        <div className={styles.featuredName}>
          <h2>{entry.obtained || entry.title === '발견' ? entry.name : '???'}</h2>
          {entry.obtained && (
            <Badge tone="dark" size="md">
              Lv.{entry.level} {entry.title}
            </Badge>
          )}
          {isPartner && (
            <Badge tone="solid" size="md" icon={<Icon name="star" size={12} />}>
              현재 파트너
            </Badge>
          )}
          <Badge tone="neutral" size="md">
            {STATE_LABEL[entry.state]}
          </Badge>
        </div>
        <p className={styles.species}>
          {entry.species} · EXP #{entry.experimentId} {entry.why.split('.')[0].length < 24 ? entry.why.split('.')[0] : ''}
        </p>

        {entry.obtained ? (
          <>
            <dl className={styles.featuredStats}>
              <div>
                <dt>만난 날</dt>
                <dd>{entry.obtainedAt ? formatMonthDay(entry.obtainedAt) : '—'}</dd>
              </div>
              <div>
                <dt>훈련 횟수</dt>
                <dd>{entry.trials ?? 0}회</dd>
              </div>
              <div>
                <dt>최고 성공률</dt>
                <dd>{entry.bestRate !== undefined ? `${Math.round(entry.bestRate)}%` : '—'}</dd>
              </div>
              <div>
                <dt>반전 시청</dt>
                <dd>{master ? '완료' : '아직'}</dd>
              </div>
            </dl>
            <ul className={styles.checks}>
              {checks.map((c) => (
                <li key={c.label} className={cx(styles.check, c.ok && styles.checkOk)}>
                  <Icon name={c.ok ? 'check' : 'lock'} size={12} />
                  {c.label}
                </li>
              ))}
            </ul>
            <div className={styles.featuredActions}>
              {master && (
                <Button variant="dark" to={`/experiments/${entry.experimentId}/reveal`}>
                  반전 모드 보기 (속 보여주기)
                </Button>
              )}
              <Button variant="secondary" to="/dex">
                도감 카드
              </Button>
              <Button variant="secondary" onClick={onPartner} loading={saving}>
                {isPartner ? '파트너 변경' : '파트너로 정하기'}
              </Button>
            </div>
          </>
        ) : (
          <div className={styles.meet}>
            <p className={styles.meetLabel}>만나는 조건</p>
            <p>{entry.meetCondition}</p>
            <p className={my.caption}>{entry.why}</p>
          </div>
        )}
      </div>
    </GlassCard>
  )
}

function CharacterCard({ entry, selected, onSelect }: { entry: DexEntry; selected: boolean; onSelect: () => void }) {
  const kind = kindOf(entry)
  const growing = entry.obtained && entry.state !== 'master'
  const nextRate = entry.level < 2 ? LV2_RATE : LV3_RATE
  return (
    <li>
      <button
        type="button"
        className={cx(styles.card, kind !== 'met' && styles.cardOff, selected && styles.cardSelected)}
        onClick={onSelect}
        aria-pressed={selected}
      >
        <span className={styles.cardArt} style={{ background: CHARACTER_TINT[entry.character] }}>
          <Character id={entry.character} size={112} locked={kind !== 'met'} />
        </span>
        <span className={styles.cardHead}>
          <span className={styles.cardName}>{kind === 'locked' ? '???' : entry.name}</span>
          {kind === 'met' ? (
            <Badge tone={entry.state === 'master' ? 'dark' : 'indigo'}>
              Lv.{entry.level} · {entry.title}
            </Badge>
          ) : (
            <Badge tone="neutral">{entry.title}</Badge>
          )}
        </span>
        {growing && <ProgressBar value={entry.bestRate ?? 0} max={nextRate} size="sm" />}
        <span className={styles.cardLine}>
          {kind === 'met'
            ? entry.state === 'master'
              ? '반전 해금 · 팀 합류 가능'
              : `Lv${entry.level + 1}까지 성공률 ${nextRate}%${entry.level >= 2 ? ' + 반전' : ''} (현재 ${Math.round(entry.bestRate ?? 0)}%)`
            : entry.meetCondition}
        </span>
      </button>
    </li>
  )
}

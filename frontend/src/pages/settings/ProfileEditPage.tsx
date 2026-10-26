import { useState } from 'react'
import { useNavigate } from 'react-router'
import { getMyCharacters, getSettings, saveOnboarding, saveSettings, updateProfile } from '../../api'
import type { CharacterId, MeSettings, User } from '../../api'
import { useAuth } from '../../auth/useAuth'
import { Avatar, Button, CHARACTERS, Character, Chip, Input, Skeleton, Toggle, cx, useToast } from '../../components'
import { useApi } from '../../hooks/useApi'
import { BackLink } from './components/BackLink'
import styles from './ProfileEditPage.module.css'

// 관심 분야 id(온보딩과 같은 값) → 화면 이름
const INTERESTS: { id: string; label: string }[] = [
  { id: 'brain', label: '뇌과학' },
  { id: 'self_learning', label: '강화학습' },
  { id: 'conversation', label: '언어 모델' },
  { id: 'vision', label: '비전' },
  { id: 'agent', label: '에이전트' },
  { id: 'robot', label: '로봇' },
]
const BIO_MAX = 40

const validNickname = (v: string) => v.trim().length >= 2 && v.trim().length <= 12

const PRIVACY_DEFAULT: NonNullable<MeSettings['privacy']> = { publicProfile: true, showInRanking: true, shareRecords: true }

// W2 my 담당 · 경로 /settings/profile — H-08 프로필 편집
export default function ProfileEditPage() {
  const { user } = useAuth()
  // 공개 범위는 설정(privacy)에 저장된다
  const settings = useApi((s) => getSettings(s), [])
  return (
    <div className={styles.page}>
      <BackLink to="/settings">설정</BackLink>
      <h1 className={styles.title}>프로필 편집</h1>
      {user && (settings.data || settings.error) ? (
        <ProfileForm key={user.id} user={user} settings={settings.data} />
      ) : (
        <Skeleton height={640} />
      )}
    </div>
  )
}

function ProfileForm({ user, settings }: { user: User; settings?: MeSettings }) {
  const { refresh } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const chars = useApi((s) => getMyCharacters(s), [])
  const privacy = { ...PRIVACY_DEFAULT, ...settings?.privacy }

  const [avatar, setAvatar] = useState<CharacterId>(user.avatar)
  const [nickname, setNickname] = useState(user.nickname)
  // User.bio는 v2 응답에 있지만 공용 타입에 아직 없다
  const [bio, setBio] = useState((user as User & { bio?: string | null }).bio ?? '')
  const [interests, setInterests] = useState<string[]>(user.interests)
  const [showNickname, setShowNickname] = useState(privacy.showInRanking)
  const [shareRecords, setShareRecords] = useState(privacy.shareRecords)
  const [saving, setSaving] = useState(false)

  const owned = chars.data?.filter((c) => c.obtained).map((c) => c.character)
  const nicknameOk = validNickname(nickname)
  const nicknameChanged = nickname.trim() !== user.nickname

  const toggleInterest = (id: string) =>
    setInterests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const save = async () => {
    if (!nicknameOk) return
    setSaving(true)
    try {
      await updateProfile({ nickname: nickname.trim(), avatar, bio: bio.trim() })
      const sameInterests = interests.length === user.interests.length && interests.every((i) => user.interests.includes(i))
      if (!sameInterests) await saveOnboarding({ interests, skill: user.skill })
      if (settings && (showNickname !== privacy.showInRanking || shareRecords !== privacy.shareRecords)) {
        await saveSettings({ ...settings, privacy: { ...privacy, showInRanking: showNickname, shareRecords } })
      }
      await refresh()
      toast.show({ title: '프로필을 저장했어요', tone: 'success' })
      navigate('/settings')
    } catch {
      toast.show({ title: '저장하지 못했어요', description: '잠시 뒤 다시 시도해 주세요', tone: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      className={styles.card}
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
    >
      <div className={styles.avatarRow}>
        <Avatar character={avatar} name={nickname} size={112} ring />
        <div>
          <p className={styles.label}>프로필 캐릭터</p>
          <p className={styles.caption}>
            획득한 캐릭터 중에서 고를 수 있어요 · 사진 업로드는 지원하지 않아요 (개인정보 보호)
          </p>
          <div className={styles.picker} role="radiogroup" aria-label="프로필 캐릭터">
            {owned
              ? owned.map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={avatar === id}
                    aria-label={CHARACTERS[id].name}
                    className={cx(styles.pick, avatar === id && styles.picked)}
                    onClick={() => setAvatar(id)}
                  >
                    <Character id={id} size={36} alt="" />
                  </button>
                ))
              : [0, 1, 2].map((i) => <Skeleton key={i} shape="circle" width={48} />)}
          </div>
        </div>
      </div>

      <Input
        label="닉네임"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        maxLength={12}
        success={nicknameOk && nicknameChanged}
        error={nicknameOk ? undefined : '2~12자로 입력해 주세요'}
        hint={nicknameOk ? '사용할 수 있어요 · 30일에 한 번 바꿀 수 있어요' : undefined}
      />
      <Input
        label="한 줄 소개"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        maxLength={BIO_MAX}
        hint={`${bio.length} / ${BIO_MAX} · 공유 카드와 랭킹에 보여요`}
      />

      <div>
        <p className={styles.label}>관심 분야 (추천에 쓰여요)</p>
        <div className={styles.chips}>
          {INTERESTS.map((it) => {
            const on = interests.includes(it.id)
            return (
              <Chip key={it.id} selected={on} onClick={() => toggleInterest(it.id)} aria-pressed={on}>
                {on ? `✓ ${it.label}` : it.label}
              </Chip>
            )
          })}
        </div>
      </div>

      <div>
        <p className={styles.label}>공개 범위</p>
        <div className={styles.visibility}>
          <Toggle
            className={styles.option}
            label="랭킹에 닉네임 공개"
            description='끄면 "익명 연구자"로 보여요'
            checked={showNickname}
            onChange={(e) => setShowNickname(e.target.checked)}
          />
          <Toggle
            className={styles.option}
            label="공유 링크에 기록 공개"
            description="친구가 내 리플레이를 볼 수 있어요"
            checked={shareRecords}
            onChange={(e) => setShareRecords(e.target.checked)}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" to="/settings">
          취소
        </Button>
        <Button type="submit" loading={saving} disabled={!nicknameOk}>
          저장하기
        </Button>
      </div>
    </form>
  )
}

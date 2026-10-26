// MeSettings(v2)에도 없는 설정값(효과음 · 다른 기기 로그아웃)을 이 기기에만 저장한다.
// 백엔드 스키마에 필드가 생기면 getSettings/saveSettings로 옮긴다.
import { useState } from 'react'

const KEY = 'atp.localPrefs'

export interface LocalPrefs {
  sound: boolean
  logoutOtherDevices: boolean
}

const DEFAULTS: LocalPrefs = {
  sound: true,
  logoutOtherDevices: true,
}

function read(): LocalPrefs {
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<LocalPrefs>) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

function write(prefs: LocalPrefs) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs))
  } catch {
    // 저장소를 못 쓰면 이번 화면에서만 유지한다
  }
}

export function useLocalPrefs() {
  const [prefs, setPrefs] = useState<LocalPrefs>(read)
  const update = <K extends keyof LocalPrefs>(key: K, value: LocalPrefs[K]) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value }
      write(next)
      return next
    })
  }
  return [prefs, update] as const
}

import type { DiaryEntry } from '../game/store'

// セーブは時代ごとに分ける（tokiwatari-<era>-v1）。平安のキーは従来どおり。
let era = 'heian'
export function setSaveEra(id: string) { era = id }
const KEY = () => `tokiwatari-${era}-v1`

export interface SaveData {
  day: number
  outfit: string | null
  zufu: string[]
  talked: Record<string, number>
  diary: DiaryEntry[]
  letterSeen: boolean
  flags: string[]
  learnedEvents?: string[]   // 見た出来事（名所や栞から）。旧セーブには無い
  hintSeen?: string[]        // 一度見せたヒント帯。旧セーブには無い
}

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY())
    return raw ? (JSON.parse(raw) as SaveData) : null
  } catch {
    return null
  }
}

export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(KEY(), JSON.stringify(data))
  } catch { /* 保存できない環境では諦める */ }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY())
  } catch { /* noop */ }
}

export function hasSave(): boolean {
  return loadSave() !== null
}

import type { DiaryEntry } from '../game/store'

const KEY = 'tokiwatari-heian-v1'

export interface SaveData {
  day: number
  outfit: string | null
  zufu: string[]
  talked: Record<string, number>
  diary: DiaryEntry[]
  letterDone: boolean
  letterSeen: boolean
}

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as SaveData) : null
  } catch {
    return null
  }
}

export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch { /* 保存できない環境では諦める */ }
}

export function hasSave(): boolean {
  return loadSave() !== null
}

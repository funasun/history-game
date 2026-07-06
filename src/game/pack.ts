// 時代パックの登録制。各篇（平安・鎌倉…）は Pack を実装して差し込む。
// store / scene / ui は getPack() 越しに現在の篇のデータと3Dを読む。
import type { ComponentType } from 'react'
import type { DialogueLine } from './store'
import type { FlowerSpec } from '../engine/textures'
import type { Circle } from './solids'

// figure は両篇で同じ狭い型（strictFunctionTypes 下で charPos を渡すため広げない）
export type PackFigure = 'aruji' | 'nyobo' | 'hime' | 'warawa'

export interface TLEvent {
  id: string; year: number; wa: string; title: string
  figure: string; line: string; deep: string; factId?: string
}

export interface Landmark {
  id: string; label: string; kind: string
  pos: [number, number]; approach: [number, number]
  events: string[]; scene: DialogueLine[]
}

export interface Fact { id: string; tag: string; short: string; deep: string }

export interface PackCharacter {
  id: string; name: string; figure: PackFigure; robes: string[]
  day: [number, number]; evening: [number, number]; scale: number
}

export interface FlowerSpot { id: string; species: string; x: number; z: number }

export interface DayEvent {
  morning?: DialogueLine[]
  evening?: { at: number; lines: DialogueLine[]; then?: 'letter' | 'roam' }
  diaryLine?: string
  facts?: string[]
  talkFacts?: Record<string, string>
  icons?: string[]
}

export interface OutfitOption { name: string; color: string; under: string }

export interface DiaryCtx {
  day: number; letterSeen: boolean; zufu: string[]
  talked: Record<string, number>; outfit: string | null; species: string[]
}
export interface DiaryExtra { lines?: string[]; icons?: string[]; factIds?: string[] }

export interface Pack {
  id: string
  // データ
  TIMELINE: TLEvent[]
  LANDMARKS: Landmark[]
  landmarkById: (id: string) => Landmark | undefined
  FACTS: Fact[]
  factById: (id: string) => Fact
  CHARACTERS: PackCharacter[]
  charById: (id: string) => PackCharacter
  charPos: (c: PackCharacter, t: number) => [number, number]
  FLOWERS: FlowerSpec[]
  FLOWER_SPOTS: FlowerSpot[]
  flowerById: (id: string) => FlowerSpec
  DAY_EVENTS: Record<number, DayEvent>
  LAST_DAY: number
  BED: { x: number; z: number }
  spawn: [number, number]
  blocked: (x: number, z: number) => boolean
  groundY: (x: number, z: number) => number
  solids: Circle[] // 木・柱・名所の当たり円（人は毎フレーム別に組む）
  // 会話
  getDialogue: (charId: string, ctx: { talked: Record<string, number>; zufu: string[]; letterSeen: boolean; day: number; flags: string[] }) => DialogueLine[]
  WAKE_LINES: DialogueLine[]
  OUTFIT_DONE_LINES: DialogueLine[]
  BED_EARLY: DialogueLine[]
  // 3D と色
  World: ComponentType
  LandmarkMesh: ComponentType<{ kind: string }>
  skyColor: (t: number) => string
  tintColor: (t: number) => string
  // 篇ごとの仕様
  hasFlowers: boolean
  hasLetter: boolean
  diaryExtras?: (ctx: DiaryCtx) => DiaryExtra
  onSleepZufu?: (day: number, zufu: string[]) => string[]
  // UI テキスト
  volume: string
  tagline: string
  prologue: string[]
  epilogue: string[]
  epilogueHint?: string
  guideRows: [string, string][]
  guideNote: string
  outfits: OutfitOption[]
  outfitTitle: string
  dateLabel: (day: number) => string
  nenpyoTitle: string
  nenpyoFoot: string
  letter?: { lines: string[]; sign: string }
}

import { heianPack } from '../heian/pack'
import { kamakuraPack } from '../kamakura/pack'
import { setSaveEra } from '../engine/save'

export const PACKS: Record<string, Pack> = {
  heian: heianPack,
  kamakura: kamakuraPack,
}

let activeId = 'heian'
export function getPack(): Pack { return PACKS[activeId] }
export function activeEraId(): string { return activeId }
export function setActiveEra(id: string) {
  if (PACKS[id]) { activeId = id; setSaveEra(id) }
}

// 開発時のみ：篇の切替と参照を検証用に露出（本番ビルドでは消える）
if (import.meta.env.DEV) {
  (globalThis as Record<string, unknown>).__pack = { getPack, setActiveEra, activeEraId, PACKS }
}

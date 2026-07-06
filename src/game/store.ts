import { create } from 'zustand'
import { getPack, setActiveEra } from './pack'
import { loadSave, writeSave, clearSave } from '../engine/save'
import { playerWorld } from './live'

export type Mode = 'home' | 'title' | 'prologue' | 'guide' | 'dialogue' | 'outfit' | 'roam' | 'letter' | 'diary' | 'epilogue'
type Then = 'outfit' | 'letter' | 'roam'

export interface DialogueLine {
  speaker?: string
  text: string
  choices?: { label: string; lines?: DialogueLine[]; flag?: string }[]
}

export interface DiaryEntry {
  day: number
  lines: string[]
  icons: string[]   // flower species ids / 'letter'
  factIds: string[]
}

interface GameState {
  mode: Mode
  day: number
  t: number
  outfit: string | null
  collected: string[]              // 今日摘んだ花のスポットid
  zufu: string[]                   // 図譜（種類）
  talked: Record<string, number>
  talkedToday: string[]
  letterSeen: boolean
  dayEventDone: boolean            // その日の宵の出来事
  flags: string[]
  learnedEvents: string[]          // 見た出来事（名所にふれて／栞から）
  diary: DiaryEntry[]
  dialogue: { lines: DialogueLine[]; i: number; then: Then } | null
  target: [number, number] | null
  pending: string | null
  playerPos: [number, number]
  bookOpen: boolean
  toast: string | null             // flower species id
  pageToast: string | null         // 名所でひらいた出来事の名（年表へ誘う）

  chooseEra: (id: string) => void
  start: (fresh: boolean) => void
  wake: () => void
  toHome: () => void
  toTitle: () => void
  toGuide: () => void
  tick: (dt: number) => void
  walkTo: (x: number, z: number) => void
  interact: (id: string) => void
  interactNearest: () => void
  arrive: (x: number, z: number) => void
  next: (choice?: number) => void
  chooseOutfit: (color: string) => void
  closeLetter: () => void
  sleep: () => void
  setBookOpen: (v: boolean) => void
  clearToast: () => void
  clearPageToast: () => void
}

const START_T = 0.2
let tAcc = 0

function interactablePos(id: string, t: number): [number, number] | null {
  const pack = getPack()
  if (id === 'bed') return [pack.BED.x + 1.2, pack.BED.z + 1]
  if (id.startsWith('char:')) {
    const c = pack.charById(id.slice(5))
    const [x, z] = pack.charPos(c, t)
    return [x, z + 1.4]
  }
  if (id.startsWith('flower:')) {
    const spot = pack.FLOWER_SPOTS.find(s => s.id === id.slice(7))
    if (spot) return [spot.x, spot.z + 0.9]
  }
  if (id.startsWith('mark:')) {
    const m = pack.landmarkById(id.slice(5))
    if (m) return m.approach
  }
  return null
}

export const useGame = create<GameState>((set, get) => ({
  mode: 'home',
  day: 1,
  t: START_T,
  outfit: null,
  collected: [],
  zufu: [],
  talked: {},
  talkedToday: [],
  letterSeen: false,
  dayEventDone: false,
  flags: [],
  learnedEvents: [],
  diary: [],
  dialogue: null,
  target: null,
  pending: null,
  playerPos: [-3, -6],
  bookOpen: false,
  toast: null,
  pageToast: null,

  // ホームで篇をえらぶ：セーブ層も切り替え、その篇の扉（Title）へ
  chooseEra: (id) => {
    setActiveEra(id)
    set({ mode: 'title', dialogue: null })
  },

  start: (fresh) => {
    const pack = getPack()
    const save = fresh ? null : loadSave()
    if (save) {
      const morning = pack.DAY_EVENTS[save.day]?.morning
      set({
        day: save.day, t: START_T, outfit: save.outfit,
        zufu: save.zufu, talked: save.talked, diary: save.diary,
        letterSeen: save.letterSeen, flags: save.flags ?? [],
        learnedEvents: save.learnedEvents ?? [],
        collected: [], talkedToday: [], dayEventDone: false,
        playerPos: pack.spawn,
        mode: morning ? 'dialogue' : 'roam',
        dialogue: morning ? { lines: morning, i: 0, then: 'roam' } : null,
      })
    } else {
      set({
        mode: 'prologue', day: 1, t: START_T, outfit: null,
        zufu: [], talked: {}, talkedToday: [], diary: [],
        letterSeen: false, dayEventDone: false, flags: [], learnedEvents: [],
        collected: [], playerPos: pack.spawn, dialogue: null,
      })
    }
  },

  wake: () => set({ mode: 'dialogue', dialogue: { lines: getPack().WAKE_LINES, i: 0, then: 'outfit' } }),

  toHome: () => set({ mode: 'home', dialogue: null }),
  toTitle: () => set({ mode: 'title', dialogue: null }),
  toGuide: () => set({ mode: 'guide', dialogue: null }),

  tick: (dt) => {
    const s = get()
    if (s.mode !== 'roam') return
    tAcc += dt * 0.0018
    if (tAcc >= 0.002) {
      set({ t: Math.min(s.t + tAcc, 0.9) })
      tAcc = 0
      maybeEvening(set, get)
    }
  },

  walkTo: (x, z) => {
    const s = get()
    if (s.mode !== 'roam') return
    // タップ地点の近くに触れられるものがあれば、そちらへ（寛容な当たり判定）
    const near = nearestInteractable(x, z, s)
    if (near) { get().interact(near); return }
    set({ target: [x, z], pending: null })
  },

  // キー操作：目の前のものに触れる
  interactNearest: () => {
    const s = get()
    if (s.mode !== 'roam') return
    const near = nearestInteractable(playerWorld.x, playerWorld.z, s, 1.7)
    if (near) get().interact(near)
  },

  interact: (id) => {
    const s = get()
    if (s.mode !== 'roam') return
    const pos = interactablePos(id, s.t)
    if (!pos) return
    const px = playerWorld.x, pz = playerWorld.z
    const d = Math.hypot(pos[0] - px, pos[1] - pz)
    if (d < 1.4) {
      set({ target: null })
      resolve(id, set, get)
    } else {
      set({ target: pos, pending: id })
    }
  },

  arrive: (x, z) => {
    const s = get()
    set({ playerPos: [x, z], target: null })
    if (s.pending) {
      const id = s.pending
      set({ pending: null })
      resolve(id, set, get)
    }
  },

  next: (choice) => {
    const s = get()
    const d = s.dialogue
    if (!d) return
    const line = d.lines[d.i]
    let lines = d.lines
    if (line.choices) {
      if (choice == null) return
      const chosen = line.choices[choice]
      if (chosen.flag && !s.flags.includes(chosen.flag)) set({ flags: [...s.flags, chosen.flag] })
      const extra = chosen.lines ?? []
      lines = [...d.lines.slice(0, d.i + 1), ...extra, ...d.lines.slice(d.i + 1)]
    }
    if (d.i + 1 < lines.length) {
      set({ dialogue: { ...d, lines, i: d.i + 1 } })
    } else {
      if (d.then === 'outfit') set({ dialogue: null, mode: 'outfit' })
      else if (d.then === 'letter') set({ dialogue: null, mode: 'letter' })
      else {
        set({ dialogue: null, mode: 'roam' })
        maybeEvening(set, get)
      }
    }
  },

  chooseOutfit: (color) => {
    set({
      outfit: color, mode: 'dialogue',
      dialogue: { lines: getPack().OUTFIT_DONE_LINES, i: 0, then: 'roam' },
    })
  },

  closeLetter: () => {
    const s = get()
    set({ letterSeen: true, mode: 'roam', t: Math.max(s.t, 0.72) })
  },

  sleep: () => {
    const pack = getPack()
    const s = get()
    if (s.day >= pack.LAST_DAY) {
      clearSave()
      set({ mode: 'epilogue', dialogue: null, target: null, pending: null })
      return
    }
    const day = s.day + 1
    const morning = pack.DAY_EVENTS[day]?.morning
    // 篇ごとの図譜フック（平安：最終日にもみぢの押し葉が挟まる）
    const zufu = pack.onSleepZufu ? pack.onSleepZufu(day, s.zufu) : s.zufu
    set({
      day, t: START_T, collected: [], talkedToday: [], dayEventDone: false, zufu,
      mode: morning ? 'dialogue' : 'roam',
      dialogue: morning ? { lines: morning, i: 0, then: 'roam' } : null,
      target: null, pending: null, playerPos: pack.spawn,
    })
    writeSave({
      day, outfit: s.outfit, zufu, talked: s.talked,
      diary: s.diary, letterSeen: s.letterSeen, flags: s.flags,
      learnedEvents: s.learnedEvents,
    })
  },

  setBookOpen: (v) => set({ bookOpen: v }),
  clearToast: () => set({ toast: null }),
  clearPageToast: () => set({ pageToast: null }),
}))

if (import.meta.env.DEV) (window as unknown as { game: typeof useGame }).game = useGame

function nearestInteractable(x: number, z: number, s: GameState, radius = 1.3): string | null {
  const pack = getPack()
  const cand: [string, number, number][] = []
  for (const c of pack.CHARACTERS) {
    const [cx, cz] = pack.charPos(c, s.t)
    cand.push([`char:${c.id}`, cx, cz])
  }
  for (const f of pack.FLOWER_SPOTS) {
    if (!s.collected.includes(f.id)) cand.push([`flower:${f.id}`, f.x, f.z])
  }
  for (const m of pack.LANDMARKS) cand.push([`mark:${m.id}`, m.pos[0], m.pos[1]])
  cand.push(['bed', pack.BED.x, pack.BED.z])
  let best: string | null = null
  let bestD = radius
  for (const [id, cx, cz] of cand) {
    const d = Math.hypot(cx - x, cz - z)
    if (d < bestD) { bestD = d; best = id }
  }
  return best
}

type Set = (p: Partial<GameState>) => void
type Get = () => GameState

function beat(set: Set, get: Get) {
  set({ t: Math.min(get().t + 0.055, 0.9) })
}

function maybeEvening(set: Set, get: Get) {
  const s = get()
  if (s.mode !== 'roam' || s.dayEventDone) return
  const ev = getPack().DAY_EVENTS[s.day]?.evening
  if (ev && s.t >= ev.at) {
    set({
      dayEventDone: true, target: null, pending: null, mode: 'dialogue',
      dialogue: { lines: ev.lines, i: 0, then: ev.then ?? 'roam' },
    })
  }
}

function resolve(id: string, set: Set, get: Get) {
  const pack = getPack()
  const s = get()
  if (id === 'bed') {
    // 宵の出来事が残っていれば、先にそちらへ
    const ev = pack.DAY_EVENTS[s.day]?.evening
    if (!s.dayEventDone && ev && s.t >= ev.at) {
      maybeEvening(set, get)
      return
    }
    // 平安の一日目だけは文（手紙）を見てから寝る。文のない篇は素通り。
    const gate = s.day === 1 && pack.hasLetter && !s.letterSeen
    if (s.t >= 0.7 && !gate) {
      openDiary(set, get)
    } else {
      set({ mode: 'dialogue', dialogue: { lines: pack.BED_EARLY, i: 0, then: 'roam' } })
    }
    return
  }
  if (id.startsWith('mark:')) {
    const m = pack.landmarkById(id.slice(5))
    if (!m) return
    // 名所にふれる＝その出来事を見た。頁がひらき、年表に加わる。
    const fresh = m.events.filter(e => !s.learnedEvents.includes(e))
    const title = fresh.length ? (pack.TIMELINE.find(e => e.id === fresh[0])?.title ?? null) : null
    const learnedEvents = [...new Set([...s.learnedEvents, ...m.events])]
    set({
      learnedEvents,
      pageToast: title,
      mode: 'dialogue',
      dialogue: { lines: m.scene, i: 0, then: 'roam' },
    })
    return
  }
  if (id.startsWith('char:')) {
    const charId = id.slice(5)
    const lines = pack.getDialogue(charId, {
      talked: s.talked, zufu: s.zufu, letterSeen: s.letterSeen, day: s.day, flags: s.flags,
    })
    set({
      talked: { ...s.talked, [charId]: (s.talked[charId] ?? 0) + 1 },
      talkedToday: s.talkedToday.includes(charId) ? s.talkedToday : [...s.talkedToday, charId],
      mode: 'dialogue',
      dialogue: { lines, i: 0, then: 'roam' },
    })
    beat(set, get)
    return
  }
  if (id.startsWith('flower:')) {
    const spotId = id.slice(7)
    const spot = pack.FLOWER_SPOTS.find(f => f.id === spotId)
    if (!spot || s.collected.includes(spotId)) return
    const zufu = s.zufu.includes(spot.species) ? s.zufu : [...s.zufu, spot.species]
    set({ collected: [...s.collected, spotId], zufu, toast: spot.species })
    beat(set, get)
    maybeEvening(set, get)
  }
}

// 宵の絵日記：今日の体験から1〜2行と栞を組む（読ませない）
function openDiary(set: Set, get: Get) {
  const pack = getPack()
  const s = get()
  const lines: string[] = []
  const icons: string[] = []
  const factIds: string[] = []
  const dayEv = pack.DAY_EVENTS[s.day]

  if (dayEv?.diaryLine) lines.push(dayEv.diaryLine)
  if (dayEv?.facts) factIds.push(...dayEv.facts)
  if (dayEv?.icons) icons.push(...dayEv.icons)

  const species = [...new Set(s.collected.map(id => pack.FLOWER_SPOTS.find(f => f.id === id)!.species))]
  if (species.length >= 3) {
    lines.push('けふ、庭で花をたくさん摘んだ。')
  } else if (species.length > 0) {
    lines.push(`けふ、庭で${pack.flowerById(species[0]).kana}を摘んだ。`)
  }
  icons.push(...species)

  // 篇ごとの宵の栞（平安の一日目など）
  if (pack.diaryExtras) {
    const extra = pack.diaryExtras({
      day: s.day, letterSeen: s.letterSeen, zufu: s.zufu,
      talked: s.talked, outfit: s.outfit, species,
    })
    if (extra.lines) lines.push(...extra.lines)
    if (extra.icons) icons.push(...extra.icons)
    if (extra.factIds) factIds.push(...extra.factIds)
  }

  // その日の会話から加わる栞
  if (dayEv?.talkFacts) {
    for (const [charId, factId] of Object.entries(dayEv.talkFacts)) {
      if (s.talkedToday.includes(charId)) factIds.push(factId)
    }
  }

  if (lines.length === 0) lines.push('けふは、ただ庭をあるいた。')

  const entry: DiaryEntry = {
    day: s.day,
    lines: lines.slice(0, 2),
    icons: [...new Set(icons)].slice(0, 5),
    factIds: [...new Set(factIds)].slice(0, 3),
  }
  set({ diary: [...s.diary, entry], mode: 'diary' })
}

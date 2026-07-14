import { create } from 'zustand'
import { getPack, getArea, setActiveEra, setAreaId } from './pack'
import type { TLEvent } from './pack'
import { loadSave, writeSave, clearSave } from '../engine/save'
import { playerWorld, tapMark, koiCall, resetCam, focusVision, releaseVision } from './live'
import { pluck } from '../engine/ambience'

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
  vision: string | null                // 頁がひらいている名所（幻視の場面を演じる）
  target: [number, number] | null
  pending: string | null
  playerPos: [number, number]
  bookOpen: boolean
  toast: string | null             // flower species id
  pageToast: string | null         // 名所でひらいた出来事の名（年表へ誘う）
  nearby: { id: string; label: string } | null  // 足もとの触れられるもの（下部の札に出す）
  area: string                     // いまいる場面（エリアid）
  fade: boolean                    // 場面替えの暗転
  hint: { id: string; text: string } | null     // 画面上部のヒント帯（初回だけ）
  hintQueue: { id: string; text: string }[]
  hintSeen: string[]
  spotFacts: string[]              // けふ、遊びの場で得た栞

  chooseEra: (id: string) => void
  travel: (gateId: string) => void
  dismissHint: () => void
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
  if (id.startsWith('gate:')) {
    const g = getArea().gates.find(g => g.id === id.slice(5))
    if (g) return g.pos
  }
  if (id.startsWith('spot:')) {
    const p = getArea().SPOTS.find(p => p.id === id.slice(5))
    if (p) return p.pos
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
  vision: null,
  target: null,
  pending: null,
  playerPos: [-3, -6],
  bookOpen: false,
  toast: null,
  pageToast: null,
  nearby: null,
  area: 'tei',
  fade: false,
  hint: null,
  hintQueue: [],
  hintSeen: [],
  spotFacts: [],

  // ホームで篇をえらぶ：セーブ層も切り替え、その篇の扉（Title）へ
  chooseEra: (id) => {
    setActiveEra(id)
    releaseVision()
    set({ mode: 'title', dialogue: null, vision: null, area: getPack().homeArea })
  },

  start: (fresh) => {
    const pack = getPack()
    const save = fresh ? null : loadSave()
    setAreaId(pack.homeArea)
    resetCam()
    releaseVision()
    set({ vision: null })
    if (save) {
      const morning = pack.DAY_EVENTS[save.day]?.morning
      set({
        day: save.day, t: START_T, outfit: save.outfit,
        zufu: save.zufu, talked: save.talked, diary: save.diary,
        letterSeen: save.letterSeen, flags: save.flags ?? [],
        learnedEvents: save.learnedEvents ?? [],
        hintSeen: save.hintSeen ?? [], hint: null, hintQueue: [],
        collected: [], talkedToday: [], dayEventDone: false, spotFacts: [],
        playerPos: pack.spawn, area: pack.homeArea, fade: false,
        mode: morning ? 'dialogue' : 'roam',
        dialogue: morning ? { lines: morning, i: 0, then: 'roam' } : null,
      })
    } else {
      set({
        mode: 'prologue', day: 1, t: START_T, outfit: null,
        zufu: [], talked: {}, talkedToday: [], diary: [],
        letterSeen: false, dayEventDone: false, flags: [], learnedEvents: [],
        hintSeen: [], hint: null, hintQueue: [], spotFacts: [],
        collected: [], playerPos: pack.spawn, area: pack.homeArea, fade: false,
        dialogue: null,
      })
    }
  },

  // 門にふれる：暗転して隣の場面へ。物忌みの日は出られない。
  travel: (gateId) => {
    const s = get()
    if (s.mode !== 'roam' || s.fade) return
    const pack = getPack()
    const gate = getArea().gates.find(g => g.id === gateId)
    if (!gate) return
    const noTravel = pack.DAY_EVENTS[s.day]?.noTravel
    if (noTravel && gate.to !== pack.homeArea) {
      set({ mode: 'dialogue', dialogue: { lines: [{ text: noTravel }], i: 0, then: 'roam' }, target: null, pending: null })
      return
    }
    set({ fade: true, target: null, pending: null, nearby: null })
    window.setTimeout(() => {
      setAreaId(gate.to)
      playerWorld.set(gate.spawn[0], 0, gate.spawn[1])
      useGame.setState({ area: gate.to, playerPos: gate.spawn, fade: false })
      const hint = pack.areas[gate.to]?.arriveHint
      if (hint) queueHint(`area:${gate.to}`, hint)
    }, 300)
  },

  dismissHint: () => {
    const s = get()
    if (!s.hint) return
    const seen = s.hintSeen.includes(s.hint.id) ? s.hintSeen : [...s.hintSeen, s.hint.id]
    const [next, ...rest] = s.hintQueue
    set({ hint: next ?? null, hintQueue: rest, hintSeen: seen })
  },

  wake: () => set({ mode: 'dialogue', dialogue: { lines: getPack().WAKE_LINES, i: 0, then: 'outfit' } }),

  toHome: () => { document.title = '時渡り草子'; releaseVision(); set({ mode: 'home', dialogue: null, vision: null }) },
  toTitle: () => { releaseVision(); set({ mode: 'title', dialogue: null, vision: null }) },
  toGuide: () => set({ mode: 'guide', dialogue: null }),

  tick: (dt) => {
    const s = get()
    if (s.mode !== 'roam') return
    tAcc += dt * 0.0018
    if (tAcc >= 0.002) {
      set({ t: Math.min(s.t + tAcc, 0.9) })
      tAcc = 0
      maybeEvening(set, get)
      maybeHints(get)
    }
  },

  walkTo: (x, z) => {
    const s = get()
    if (s.mode !== 'roam') return
    // タップ地点の近くに触れられるものがあれば、そちらへ（寛容な当たり判定）
    const near = nearestInteractable(x, z, s)
    if (near) { get().interact(near); return }
    tapMark.x = x; tapMark.z = z; tapMark.t = 0.8
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
    const px = playerWorld.x, pz = playerWorld.z
    // 名所は「中心から reach 内」ならもう触れたとみなし、即その頁をひらく（反応を軽く）
    if (id.startsWith('mark:')) {
      const m = getPack().landmarkById(id.slice(5))
      if (m && Math.hypot(m.pos[0] - px, m.pos[1] - pz) <= m.reach) {
        set({ target: null, pending: null })
        resolve(id, set, get)
        return
      }
    }
    if (id.startsWith('gate:')) {
      const g = getArea().gates.find(g => g.id === id.slice(5))
      if (g && Math.hypot(g.pos[0] - px, g.pos[1] - pz) <= g.reach) {
        set({ target: null, pending: null })
        resolve(id, set, get)
        return
      }
    }
    const pos = interactablePos(id, s.t)
    if (!pos) return
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
      releaseVision()
      if (d.then === 'outfit') set({ dialogue: null, vision: null, mode: 'outfit' })
      else if (d.then === 'letter') set({ dialogue: null, vision: null, mode: 'letter' })
      else {
        set({ dialogue: null, vision: null, mode: 'roam' })
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
    setAreaId(pack.homeArea)
    set({
      day, t: START_T, collected: [], talkedToday: [], dayEventDone: false, zufu,
      spotFacts: [], area: pack.homeArea,
      mode: morning ? 'dialogue' : 'roam',
      dialogue: morning ? { lines: morning, i: 0, then: 'roam' } : null,
      target: null, pending: null, playerPos: pack.spawn,
    })
    writeSave({
      day, outfit: s.outfit, zufu, talked: s.talked,
      diary: s.diary, letterSeen: s.letterSeen, flags: s.flags,
      learnedEvents: s.learnedEvents, hintSeen: s.hintSeen,
    })
  },

  setBookOpen: (v) => set({ bookOpen: v }),
  clearToast: () => set({ toast: null }),
  clearPageToast: () => set({ pageToast: null }),
}))

if (import.meta.env.DEV) (window as unknown as { game: typeof useGame }).game = useGame

// いちばん近い触れられるものを返す。名所は当たり円より広い reach まで受けるので、
// 「光の方をタップ／近づく」だけで拾える（花・人・褥は radius のまま）。
// いまの場面（エリア）にあるものだけを見る。
function nearestInteractable(x: number, z: number, s: GameState, radius = 1.3): string | null {
  const pack = getPack()
  const area = getArea()
  let best: string | null = null
  let bestD = Infinity
  const consider = (id: string, cx: number, cz: number, rad: number) => {
    const d = Math.hypot(cx - x, cz - z)
    if (d <= rad && d < bestD) { bestD = d; best = id }
  }
  for (const c of area.CHARACTERS) {
    const [cx, cz] = pack.charPos(c, s.t)
    consider(`char:${c.id}`, cx, cz, radius)
  }
  for (const f of area.FLOWER_SPOTS) {
    if (!s.collected.includes(f.id)) consider(`flower:${f.id}`, f.x, f.z, radius)
  }
  for (const m of area.LANDMARKS) consider(`mark:${m.id}`, m.pos[0], m.pos[1], Math.max(radius, m.reach))
  for (const g of area.gates) consider(`gate:${g.id}`, g.pos[0], g.pos[1], Math.max(radius, g.reach))
  for (const p of area.SPOTS) consider(`spot:${p.id}`, p.pos[0], p.pos[1], Math.max(radius, p.reach))
  if (area.hasBed) consider('bed', pack.BED.x, pack.BED.z, radius)
  return best
}

// いま歩いている先（pending）に「触れた」といえる円。名所・門・遊び場は reach、ほかは足もと。
export function pendingFireCircle(id: string, t: number): { x: number; z: number; r: number } | null {
  const pack = getPack()
  if (id.startsWith('mark:')) {
    const m = pack.landmarkById(id.slice(5))
    return m ? { x: m.pos[0], z: m.pos[1], r: m.reach } : null
  }
  if (id.startsWith('gate:')) {
    const g = getArea().gates.find(g => g.id === id.slice(5))
    return g ? { x: g.pos[0], z: g.pos[1], r: g.reach } : null
  }
  if (id.startsWith('spot:')) {
    const p = getArea().SPOTS.find(p => p.id === id.slice(5))
    return p ? { x: p.pos[0], z: p.pos[1], r: p.reach } : null
  }
  const pos = interactablePos(id, t)
  return pos ? { x: pos[0], z: pos[1], r: 1.1 } : null
}

// 足もとの触れられるもの（下部の札／スペース操作の対象）を、名で返す。
function nearbyLabel(id: string): string {
  const pack = getPack()
  if (id === 'bed') return 'ねどこで やすむ'
  if (id.startsWith('char:')) return `${pack.charById(id.slice(5)).name}と 話す`
  if (id.startsWith('flower:')) {
    const spot = pack.FLOWER_SPOTS.find(f => f.id === id.slice(7))
    return spot ? `${pack.flowerById(spot.species).kana}を 摘む` : '摘む'
  }
  if (id.startsWith('mark:')) {
    const m = pack.landmarkById(id.slice(5))
    return m ? `${m.label}の頁を ひらく` : ''
  }
  if (id.startsWith('gate:')) {
    const g = getArea().gates.find(g => g.id === id.slice(5))
    return g ? `${g.label}へ ゆく` : ''
  }
  if (id.startsWith('spot:')) {
    const p = getArea().SPOTS.find(p => p.id === id.slice(5))
    return p ? p.label : ''
  }
  return ''
}

export function findNearby(x: number, z: number): { id: string; label: string } | null {
  const s = useGame.getState()
  if (s.mode !== 'roam') return null
  const id = nearestInteractable(x, z, s, 1.7)
  return id ? { id, label: nearbyLabel(id) } : null
}

type Set = (p: Partial<GameState>) => void
type Get = () => GameState

function beat(set: Set, get: Get) {
  set({ t: Math.min(get().t + 0.055, 0.9) })
}

function maybeEvening(set: Set, get: Get) {
  const s = get()
  if (s.mode !== 'roam' || s.dayEventDone) return
  const pack = getPack()
  const ev = pack.DAY_EVENTS[s.day]?.evening
  if (ev && s.t >= ev.at) {
    // 外の場面にいたら、まず邸へ帰ってから宵の出来事（ひとこと添えて）
    let lines = ev.lines
    if (s.area !== pack.homeArea) {
      setAreaId(pack.homeArea)
      playerWorld.set(pack.spawn[0], 0, pack.spawn[1])
      set({ area: pack.homeArea, playerPos: pack.spawn, nearby: null })
      lines = [{ text: '日が暮れてきた。……もどらなくちゃ。' }, ...ev.lines]
    }
    set({
      dayEventDone: true, target: null, pending: null, mode: 'dialogue',
      dialogue: { lines, i: 0, then: ev.then ?? 'roam' },
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
    const evs = fresh
      .map(e => pack.TIMELINE.find(t => t.id === e))
      .filter((e): e is TLEvent => !!e)
    const learnedEvents = [...new Set([...s.learnedEvents, ...m.events])]
    const lines = [...m.scene]
    // 語りのあとに、年号つきの一行を添える（読み物ではなく「頁が増えた」合図）
    if (evs.length) {
      const listed = evs.slice(0, 2).map(e => `${e.year}年『${e.title}』`).join('、')
      const rest = evs.length > 2 ? ` ほか${evs.length - 2}件` : ''
      lines.push({ speaker: '年表', text: `頁が加わった——${listed}${rest}。絵日記の年表で、くわしく読める。` })
    }
    // 出題と重なった時だけ、令和の受験生の声がひとこと漏れる（押し付けの解説にしない）
    if (evs.some(e => pack.exam.some(q => q.eventId === e.id))) {
      lines.push({ speaker: 'わたし', text: '——あ、これ、テストに出てたやつだ。' })
    }
    // 幻視：頁がひらくあいだ、名所の前で出来事が演じられる（篇が場面を持つときだけ）。
    // カメラは「名所→接近点」の向きへ回りこみ、場面が正面にくる
    const hasVision = !!pack.VisionMesh
    if (hasVision) {
      const yaw = Math.atan2(m.approach[0] - m.pos[0], m.approach[1] - m.pos[1])
      focusVision(yaw, m.visionDist ?? 1)
    }
    set({
      learnedEvents,
      pageToast: evs.length ? evs[0].title : null,
      mode: 'dialogue',
      dialogue: { lines, i: 0, then: 'roam' },
      vision: hasVision ? m.id : null,
    })
    if (evs.length) queueHint('book', '右上の草子をひらくと、年表と持ちこんだ試験が読める')
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
    queueHint('flower', '摘んだ草花は、宵の絵日記の図譜にたまってゆく')
    beat(set, get)
    maybeEvening(set, get)
    return
  }
  if (id.startsWith('gate:')) {
    get().travel(id.slice(5))
    return
  }
  if (id.startsWith('spot:')) {
    const p = getArea().SPOTS.find(p => p.id === id.slice(5))
    if (!p) return
    if (p.kind === 'koi') koiCall.t = 6
    if (p.kind === 'koto') pluck()
    if (p.factId && !s.spotFacts.includes(p.factId)) set({ spotFacts: [...s.spotFacts, p.factId] })
    if (p.lines) set({ mode: 'dialogue', dialogue: { lines: p.lines, i: 0, then: 'roam' } })
    return
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

  // けふ、遊びの場（市・琴・鯉…）で得た栞
  factIds.push(...s.spotFacts)

  if (lines.length === 0) lines.push('けふは、ただ庭をあるいた。')

  const entry: DiaryEntry = {
    day: s.day,
    lines: lines.slice(0, 2),
    icons: [...new Set(icons)].slice(0, 5),
    factIds: [...new Set(factIds)].slice(0, 3),
  }
  set({ diary: [...s.diary, entry], mode: 'diary' })
}

// ---------- 初回ヒント帯（読ませない：一文だけ、数秒で消える） ----------

// 一度見たものは二度と出さない。出ている間は列に積んで、順に一枚ずつ。
export function queueHint(id: string, text: string) {
  const s = useGame.getState()
  if (s.hintSeen.includes(id)) return
  if (s.hint?.id === id || s.hintQueue.some(h => h.id === id)) return
  if (s.hint) useGame.setState({ hintQueue: [...s.hintQueue, { id, text }] })
  else useGame.setState({ hint: { id, text } })
}

// 場面に応じて折々に出すヒント。tick から低頻度で呼ばれる。
function maybeHints(get: Get) {
  const s = get()
  const pack = getPack()
  if (s.mode !== 'roam') return
  // 目覚めて最初の朝：歩きかた → ふれかた → 見まわしかた → 門
  if (s.day === 1 && s.area === pack.homeArea) {
    queueHint('walk', '行きたい所をタップ（長押しでも、矢印キーでも）あるける')
    queueHint('touch', '光るものや人のそばへゆくと、下に札が出る——ふれてみよう')
    queueHint('cam', '右下の ⟲ ⟳ で、あたりを見まわせる')
    const gh = getArea().gateHint
    if (getArea().gates.length && gh) queueHint('gate', gh)
  }
  // 日が暮れたら、寝所へ
  if (s.t >= 0.7 && s.area === pack.homeArea) {
    queueHint('night', '日が暮れた。寝所にふれると、宵の絵日記をつけて眠れる')
  }
}

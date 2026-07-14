// 平安篇のパック。邸（寝殿造の庭）と都大路（朱雀大路）、ふたつの場面を束ねる。
import type { Pack, AreaDef, DiaryCtx, DiaryExtra } from '../game/pack'
import { toKanji } from '../game/ui/date'
import { TIMELINE, LANDMARKS, landmarkById } from './timeline'
import { FACTS, factById } from './facts'
import { CHARACTERS, MIYAKO_CHARACTERS, ALL_CHARACTERS, charById, charPos } from './characters'
import { FLOWERS, FLOWER_SPOTS, flowerById } from './flowers'
import { DAY_EVENTS, LAST_DAY } from './days'
import { BED, blocked, groundY, TREES, PILLARS, LANTERNS } from './layout'
import { MIYAKO_TREES, MIYAKO_EXTRA_SOLIDS, miyakoBlocked, miyakoGroundY } from './miyako'
import { getDialogue, WAKE_LINES, OUTFIT_DONE_LINES, BED_EARLY } from './dialogues'
import { skyColor, tintColor } from './palette'
import { HeianWorld, HeianLandmarkMesh } from './world'
import { MiyakoWorld } from './worldMiyako'
import { buildSolids } from '../game/solids'
import { EXAM, EXAM_TITLE } from './exam'

// 名所はふたつの場面に分かれて立つ（草子の頁引きは LANDMARKS 全体で行う）
const TEI_LANDMARKS = LANDMARKS.filter(l => l.id === 'mido' || l.id === 'funade')
const MIYAKO_LANDMARKS = LANDMARKS.filter(l => l.id === 'mon' || l.id === 'tou' || l.id === 'ichi')

// 邸の当たり：木・柱・灯籠・棟門の柱。御堂は layout.blocked() の矩形で実寸（hall:0）。
const TEI_SOLIDS = buildSolids({
  trees: TREES,
  pillars: PILLARS,
  landmarks: TEI_LANDMARKS,
  landmarkR: { hall: 0, boat: 0 },
  extra: [
    { x: 1.9, z: 19, r: 0.28 }, { x: 4.1, z: 19, r: 0.28 },   // 棟門の二本の柱
    ...LANTERNS.map(([x, z]) => ({ x, z, r: 0.3 })),           // 石灯籠
  ],
})

// 都大路の当たり：並木・五重塔の土台・市の店と牛車（板屋は miyakoBlocked の矩形）。
// 羅城門は歩ける際（z=-28.8）より南に立つので当たり不要。
const MIYAKO_SOLIDS = buildSolids({
  trees: MIYAKO_TREES,
  landmarks: MIYAKO_LANDMARKS,
  landmarkR: { pagoda: 2.0 },
  extra: [
    ...MIYAKO_EXTRA_SOLIDS,
    { x: 8.9, z: 16.1, r: 0.28 }, { x: 11.1, z: 16.1, r: 0.28 }, // 邸の門の柱
  ],
})

// 場面：邸（寝殿造の庭）
const TEI: AreaDef = {
  id: 'tei', label: '邸',
  World: HeianWorld,
  blocked, groundY,
  solids: TEI_SOLIDS,
  LANDMARKS: TEI_LANDMARKS,
  CHARACTERS,
  FLOWER_SPOTS,
  SPOTS: [
    {
      id: 'koto', label: '琴', kind: 'koto', pos: [-0.5, -8.8], reach: 1.6,
      lines: [{ text: '弦をはじくと、澄んだ音が御簾のむこうまで渡っていった。' }],
      factId: 'kangen',
    },
    {
      id: 'koi', label: '鯉に餌を', kind: 'koi', pos: [0, 3.6], reach: 1.5,
      lines: [{ text: '米粒をまくと、鯉が水脈をひいて寄ってきた。' }],
    },
  ],
  gates: [
    { id: 'minami', label: '都大路', pos: [3, 18.4], reach: 2.2, to: 'miyako', spawn: [9.4, 12.2] },
  ],
  hasBed: true,
  gateHint: '南の門から、邸の外へも出られる',
}

// 場面：都大路（朱雀大路）
const MIYAKO: AreaDef = {
  id: 'miyako', label: '都大路',
  World: MiyakoWorld,
  blocked: miyakoBlocked, groundY: miyakoGroundY,
  solids: MIYAKO_SOLIDS,
  LANDMARKS: MIYAKO_LANDMARKS,
  CHARACTERS: MIYAKO_CHARACTERS,
  FLOWER_SPOTS: [],
  SPOTS: [
    {
      id: 'kinu', label: '絹の店', kind: 'stall', pos: [13.2, -2.3], reach: 1.7,
      lines: [{ text: '反物のつやをひろげて見せてくれた。銭より、米や布で払う人が多いという。' }],
      factId: 'ichiba',
    },
    {
      id: 'uo', label: '干し魚の店', kind: 'stall', pos: [13.2, 2.5], reach: 1.7,
      lines: [{ text: '干した鮎がずらり。日暮れの鐘とともに、市はしまうのだそうだ。' }],
    },
  ],
  gates: [
    { id: 'yashiki', label: '邸', pos: [10, 14.5], reach: 2.2, to: 'tei', spawn: [3, 15.8] },
  ],
  hasBed: false,
  arriveHint: 'ここは都の大路。市や塔をたずね、人にも話しかけてみよう',
}

// 宵の絵日記：平安一日目だけの栞（文・草花・摂関・襲/寝殿）
function diaryExtras(c: DiaryCtx): DiaryExtra {
  const lines: string[] = []
  const icons: string[] = []
  const factIds: string[] = []
  if (c.day === 1) {
    if (c.letterSeen) {
      lines.push('萩の君から、もみぢの文をもらった。')
      icons.push('letter')
      factIds.push('fumi')
    }
    if (c.species.length > 0) {
      factIds.push((c.zufu.length >= 3 && (c.talked['kojiju'] ?? 0) >= 2) ? 'nanakusa' : 'akikusa')
    }
    if ((c.talked['aruji'] ?? 0) >= 2) factIds.push('sekkan')
    factIds.push(c.outfit ? 'kasane' : 'shinden')
  }
  return { lines, icons, factIds }
}

// 七日目の朝、もみぢの押し葉が図譜にも挟まる
function onSleepZufu(day: number, zufu: string[]): string[] {
  return day === LAST_DAY && !zufu.includes('momiji') ? [...zufu, 'momiji'] : zufu
}

export const heianPack: Pack = {
  id: 'heian',
  TIMELINE, LANDMARKS, landmarkById,
  FACTS, factById,
  CHARACTERS: ALL_CHARACTERS, charById, charPos,
  FLOWERS, FLOWER_SPOTS, flowerById,
  DAY_EVENTS, LAST_DAY,
  BED, spawn: [-3, -6],
  areas: { tei: TEI, miyako: MIYAKO },
  homeArea: 'tei',
  getDialogue, WAKE_LINES, OUTFIT_DONE_LINES, BED_EARLY,
  LandmarkMesh: HeianLandmarkMesh, skyColor, tintColor,
  hasFlowers: true, hasLetter: true,
  diaryExtras, onSleepZufu,

  examTitle: EXAM_TITLE,
  exam: EXAM,

  volume: '平安篇',
  tagline: 'みやこの秋、七日の日記',
  prologue: [
    '……だめだ。ぜんぜん、わかんない。',
    '「794年、都をうつした天皇」——名前、覚えたはずなのに。',
    '教科書のなかの人なんて、会ったこともないもん。',
    '秒針の音だけが、やけに、おおきい。',
    '……まぶたが、おもい。',
  ],
  epilogue: [
    '——チャイム？',
    'はっと顔をあげると、教室だった。',
    '夢……にしては、たしかな手ざわりだった。',
    '袖にまだ、あの庭の、秋の匂いがのこってる。',
    'ペンをにぎる。——あれ。書ける。',
    '会ったことのある人の名前は、わすれない。',
  ],
  epilogueHint: 'つぎの頁——大問二『鎌倉時代』',
  guideRows: [
    ['あるく', '行きたい方を、タップ'],
    ['ふれる', '光る名所や、草花・人に'],
    ['えらぶ', 'ことばは、心のままに'],
    ['みまわす', '右下の ⟲⟳ で、ぐるり'],
  ],
  guideNote: '光の柱がのぼる名所にふれると時代の頁がひらき、答案のこたえが埋まってゆく。南の門をくぐれば都大路へ。日が暮れたら、寝所で宵の絵日記を。',
  outfits: [
    { name: '山吹', color: '#e0a63e', under: '#c98a2e' },
    { name: '朽葉', color: '#a8683a', under: '#8a5a30' },
    { name: '桔梗', color: '#7a6fae', under: '#5a5490' },
  ],
  outfitTitle: 'けふの色目',
  outfitNote: '袿を重ねて季節をまとう「かさねの色目」。けふの気分でえらんでいい。',
  dateLabel: (day: number) => `長月${toKanji(15 + day)}日`,
  nenpyoTitle: '平安のあゆみ',
  nenpyoFoot: '庭の名所にふれ、七日を生きて、頁をうめてゆく。',
  letter: { lines: ['もみぢ、ひとえだ。君に。', 'あしたも、庭で。'], sign: '——萩' },
}

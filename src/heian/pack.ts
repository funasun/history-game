// 平安篇のパック。既存の heian/* をそのまま束ね、Pack として供する。
import type { Pack, DiaryCtx, DiaryExtra } from '../game/pack'
import { toKanji } from '../game/ui/date'
import { TIMELINE, LANDMARKS, landmarkById } from './timeline'
import { FACTS, factById } from './facts'
import { CHARACTERS, charById, charPos } from './characters'
import { FLOWERS, FLOWER_SPOTS, flowerById } from './flowers'
import { DAY_EVENTS, LAST_DAY } from './days'
import { BED, blocked, groundY, TREES, PILLARS } from './layout'
import { getDialogue, WAKE_LINES, OUTFIT_DONE_LINES, BED_EARLY } from './dialogues'
import { skyColor, tintColor } from './palette'
import { HeianWorld, HeianLandmarkMesh } from './world'
import { buildSolids } from '../game/solids'
import { EXAM, EXAM_TITLE } from './exam'

// 木・柱・名所に当たりを付ける。塔は土台ぶんだけ円で塞ぐ。
// 御堂は角ばった土台なので円ではなく layout.blocked() の矩形で実寸に塞ぐ（hall:0）。
// 門は柱のあいだ（中央 x=3）をくぐれるよう、柱の実寸だけ extra 円で塞ぐ。舟着きは水ぎわなので素通り（0）。
const HEIAN_SOLIDS = buildSolids({
  trees: TREES,
  pillars: PILLARS,
  landmarks: LANDMARKS,
  landmarkR: { gate: 0, pagoda: 2.0, hall: 0, boat: 0 },
  extra: [
    { x: 0.8, z: 17, r: 0.4 }, { x: 5.2, z: 17, r: 0.4 }, // 朱雀門の二本の柱
  ],
})

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
  CHARACTERS, charById, charPos,
  FLOWERS, FLOWER_SPOTS, flowerById,
  DAY_EVENTS, LAST_DAY,
  BED, spawn: [-3, -6], blocked, groundY, solids: HEIAN_SOLIDS,
  getDialogue, WAKE_LINES, OUTFIT_DONE_LINES, BED_EARLY,
  World: HeianWorld, LandmarkMesh: HeianLandmarkMesh, skyColor, tintColor,
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
  ],
  guideNote: '光の柱がのぼる名所にふれると時代の頁がひらき、答案のこたえが埋まってゆく。日が暮れたら、寝所で宵の絵日記を。',
  outfits: [
    { name: '山吹', color: '#e0a63e', under: '#c98a2e' },
    { name: '朽葉', color: '#a8683a', under: '#8a5a30' },
    { name: '桔梗', color: '#7a6fae', under: '#5a5490' },
  ],
  outfitTitle: 'けふの色目',
  dateLabel: (day: number) => `長月${toKanji(15 + day)}日`,
  nenpyoTitle: '平安のあゆみ',
  nenpyoFoot: '庭の名所にふれ、七日を生きて、頁をうめてゆく。',
  letter: { lines: ['もみぢ、ひとえだ。君に。', 'あしたも、庭で。'], sign: '——萩' },
}

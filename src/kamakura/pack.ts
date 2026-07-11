// 鎌倉篇のパック。武家の都・五日の日記。草花摘みと文の場面はない。
import type { Pack } from '../game/pack'
import { toKanji } from '../game/ui/date'
import { TIMELINE, LANDMARKS, landmarkById } from './timeline'
import { FACTS, factById } from './facts'
import { CHARACTERS, charById, charPos } from './characters'
import { FLOWERS, FLOWER_SPOTS, flowerById } from './flowers'
import { DAY_EVENTS, LAST_DAY } from './days'
import { BED, SPAWN, blocked, groundY, TREES } from './layout'
import { getDialogue, WAKE_LINES, OUTFIT_DONE_LINES, BED_EARLY } from './dialogues'
import { skyColor, tintColor } from './palette'
import { KamakuraWorld, KamakuraLandmarkMesh } from './world'
import { buildSolids } from '../game/solids'
import { EXAM, EXAM_TITLE } from './exam'

// 木に当たりを付ける。社殿・大仏・政庁は角ばった土台なので、円ではなく
// layout.blocked() の矩形（BUILDINGS）で実寸に塞ぐ。由比ヶ浜は海がすでに壁。
// 大鳥居はくぐれるが、二本の柱の実寸だけ extra 円で塞ぐ。
const KAMAKURA_SOLIDS = buildSolids({
  trees: TREES,
  extra: [
    { x: -2.76, z: 5, r: 0.34 }, { x: 2.76, z: 5, r: 0.34 }, // 大鳥居の二本の柱
  ],
})

export const kamakuraPack: Pack = {
  id: 'kamakura',
  TIMELINE, LANDMARKS, landmarkById,
  FACTS, factById,
  CHARACTERS, charById, charPos,
  FLOWERS, FLOWER_SPOTS, flowerById,
  DAY_EVENTS, LAST_DAY,
  BED, spawn: SPAWN, blocked, groundY, solids: KAMAKURA_SOLIDS,
  getDialogue, WAKE_LINES, OUTFIT_DONE_LINES, BED_EARLY,
  World: KamakuraWorld, LandmarkMesh: KamakuraLandmarkMesh, skyColor, tintColor,
  hasFlowers: false, hasLetter: false,

  examTitle: EXAM_TITLE,
  exam: EXAM,

  volume: '鎌倉篇',
  tagline: '武家の都、五日の日記',
  prologue: [
    'つぎ、大問二。鎌倉時代——こっちも、あやしい。',
    '「いい国つくろう」の、その先が出てこない。',
    'さっきの夢。あの庭の、あの人たち。',
    'もういちど目を閉じたら、続きが見られる気がする。',
    '……秒針の音が、とおくなる。',
  ],
  epilogue: [
    '——チャイム。こんどこそ、ほんものの。',
    '顔をあげる。答案用紙。窓の外の、秋の空。',
    '潮の匂いは、もう、しない。',
    'でも、由比ヶ浜の波の音を、耳がおぼえてる。',
    'ペンが走る。守護、執権、御成敗式目——',
    '体でおぼえたことは、きえない。',
  ],
  epilogueHint: '試験、終了。',
  guideRows: [
    ['あるく', '行きたい方を、タップ'],
    ['ふれる', '光る名所や、人に'],
    ['えらぶ', 'ことばは、心のままに'],
  ],
  guideNote: '光の柱がのぼる名所にふれると時代の頁がひらき、答案のこたえが埋まってゆく。日が暮れたら、寝所で宵の絵日記を。',
  outfits: [
    { name: '紺', color: '#31517a', under: '#25405f' },
    { name: '萌黄', color: '#6a7f3f', under: '#54662f' },
    { name: '褐', color: '#4a3f36', under: '#352c25' },
  ],
  outfitTitle: 'けふの直垂',
  dateLabel: (day: number) => `霜月${toKanji(9 + day)}日`,
  nenpyoTitle: '鎌倉のあゆみ',
  nenpyoFoot: '都の名所にふれ、五日を生きて、頁をうめてゆく。',
}

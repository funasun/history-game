// 鎌倉篇のパック。武家の都・五日の日記。草花摘みと文の場面はない。
// 場面はふたつ：浜（鎌倉の中心）と、切通しのむこうの谷戸（武士の館）。
import type { Pack, AreaDef } from '../game/pack'
import { toKanji } from '../game/ui/date'
import { TIMELINE, LANDMARKS, landmarkById } from './timeline'
import { FACTS, factById } from './facts'
import { CHARACTERS, YATO_CHARACTERS, ALL_CHARACTERS, charById, charPos } from './characters'
import { FLOWERS, FLOWER_SPOTS, flowerById } from './flowers'
import { DAY_EVENTS, LAST_DAY } from './days'
import { BED, SPAWN, blocked, groundY, TREES } from './layout'
import { YATO_TREES, YATO_SPAWN, MATO, BABA, yatoBlocked, yatoGroundY } from './yato'
import { getDialogue, WAKE_LINES, OUTFIT_DONE_LINES, BED_EARLY } from './dialogues'
import { skyColor, tintColor } from './palette'
import { KamakuraWorld, KamakuraLandmarkMesh } from './world'
import { YatoWorld } from './worldYato'
import { KamakuraVision } from './visions'
import { buildSolids } from '../game/solids'
import { EXAM, EXAM_TITLE } from './exam'

// 木に当たりを付ける。社殿・大仏・政庁は角ばった土台なので、円ではなく
// layout.blocked() の矩形（BUILDINGS）で実寸に塞ぐ。由比ヶ浜は海がすでに壁。
// 大鳥居はくぐれるが、二本の柱の実寸だけ extra 円で塞ぐ。切通しの岩壁も円で。
const KAMAKURA_SOLIDS = buildSolids({
  trees: TREES,
  extra: [
    { x: -2.76, z: 5, r: 0.34 }, { x: 2.76, z: 5, r: 0.34 }, // 大鳥居の二本の柱
    { x: -21.2, z: -9.8, r: 1.3 }, { x: -21.2, z: -6.2, r: 1.3 }, // 西の切通しの岩壁
  ],
})

// 谷戸の当たり：木・的（射抜けぬよう）・厩の秣。館と堀と塀は yatoBlocked の矩形。
const YATO_SOLIDS = buildSolids({
  trees: YATO_TREES,
  extra: [
    ...MATO.map(([x, z]) => ({ x, z, r: 0.4 })),          // 三つの的
    { x: BABA.x, z: (BABA.z0 + BABA.z1) / 2, r: 0.0001 }, // （馬場は塞がない）
  ],
})

// 場面：浜（鎌倉の中心。八幡宮・大仏・政庁・由比ヶ浜、そして笠懸と市）
const HAMA: AreaDef = {
  id: 'hama', label: '鎌倉',
  World: KamakuraWorld,
  blocked, groundY,
  solids: KAMAKURA_SOLIDS,
  LANDMARKS,
  CHARACTERS,
  FLOWER_SPOTS,
  SPOTS: [
    {
      id: 'kasagake', label: '笠懸', kind: 'kasagake', pos: [6.5, 10.4], reach: 2.4,
      lines: [
        { text: '浜で、馬上の武者が的を射ていた。笠懸というらしい。' },
        { text: '流鏑馬、犬追物とならぶ、弓馬のきたえ。' },
        { text: '一所懸命——命がけで、先祖ゆずりの地を守るための備え。' },
      ],
      factId: 'bushi',
    },
  ],
  gates: [
    { id: 'kiridoshi', label: '切通し', pos: [-20.6, -8], reach: 1.7, to: 'yato', spawn: YATO_SPAWN },
  ],
  hasBed: true,
  gateHint: '西の切通しから、谷戸の館へもゆける',
}

// 場面：谷戸（切通しのむこう。武士の館・的場の流鏑馬・二毛作の田）
const YATO: AreaDef = {
  id: 'yato', label: '谷戸',
  World: YatoWorld,
  blocked: yatoBlocked, groundY: yatoGroundY,
  solids: YATO_SOLIDS,
  LANDMARKS: [],
  CHARACTERS: YATO_CHARACTERS,
  FLOWER_SPOTS: [],
  SPOTS: [
    {
      id: 'matoba', label: '的場', kind: 'matoba', pos: [-7.6, 0.5], reach: 2.4,
      lines: [
        { text: '馬場を、武者が駆けぬける。走る馬から、的を射る——流鏑馬。' },
        { text: '「いざ鎌倉」——ひとたび事あらば、命がけで将軍に馳せ参じる。' },
        { text: 'それが御恩にこたえる、御家人の奉公というものだ。' },
      ],
      factId: 'goon',
    },
    {
      id: 'ta', label: '麦の田', kind: 'ta', pos: [4.4, 4.4], reach: 2.2,
      lines: [
        { text: '刈りあとの田に、麦の芽がのびていた。' },
        { text: '同じ田で米と麦を、年に二度——二毛作。' },
        { text: '草木灰を肥やしに、牛馬と鉄の鍬で、実りはふえてゆく。' },
      ],
      factId: 'sangyo',
    },
  ],
  gates: [
    { id: 'hama', label: '浜へ', pos: [15, 2], reach: 1.8, to: 'hama', spawn: [-19, -8] },
  ],
  hasBed: false,
  arriveHint: '切通しのむこう、谷戸の館。的場や田をたずねてみよう',
}

export const kamakuraPack: Pack = {
  id: 'kamakura',
  TIMELINE, LANDMARKS, landmarkById,
  FACTS, factById,
  CHARACTERS: ALL_CHARACTERS, charById, charPos,
  FLOWERS, FLOWER_SPOTS, flowerById,
  DAY_EVENTS, LAST_DAY,
  BED, spawn: SPAWN,
  areas: { hama: HAMA, yato: YATO },
  homeArea: 'hama',
  getDialogue, WAKE_LINES, OUTFIT_DONE_LINES, BED_EARLY,
  LandmarkMesh: KamakuraLandmarkMesh, VisionMesh: KamakuraVision, skyColor, tintColor,
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
    ['みまわす', '右下の ⟲⟳ で、ぐるり'],
  ],
  outfitNote: '武家のふだん着は直垂。動きやすさが、鎌倉の気風。',
  guideNote: '光の柱がのぼる名所にふれると時代の頁がひらき、その出来事が眼前に演じられる。西の切通しをくぐれば谷戸の館へ。日が暮れたら、寝所で宵の絵日記を。',
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

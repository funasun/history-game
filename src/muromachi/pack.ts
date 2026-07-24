// 室町篇のパック。将軍の都・五日の日記。草花摘みと文の場面はない。
// 場面はふたつ：京（花の御所・金閣・能舞台・銀閣、そして書院と市）と、
// 西の舟着きから川をくだった先の、会合衆がみずから治める湊。
import type { Pack, AreaDef } from '../game/pack'
import { toKanji } from '../game/ui/date'
import { TIMELINE, LANDMARKS, landmarkById } from './timeline'
import { FACTS, factById } from './facts'
import { CHARACTERS, MINATO_CHARACTERS, ALL_CHARACTERS, charById, charPos } from './characters'
import { FLOWERS, FLOWER_SPOTS, flowerById } from './flowers'
import { DAY_EVENTS, LAST_DAY } from './days'
import { BED, SPAWN, blocked, groundY, TREES } from './layout'
import { MINATO_SPAWN, MINATO_TREES, minatoBlocked, minatoGroundY } from './minato'
import { getDialogue, WAKE_LINES, OUTFIT_DONE_LINES, BED_EARLY } from './dialogues'
import { skyColor, tintColor } from './palette'
import { KyoWorld, MuromachiLandmarkMesh } from './world'
import { MinatoWorld } from './worldMinato'
import { MuromachiVision } from './visions'
import { buildSolids } from '../game/solids'
import { EXAM, EXAM_TITLE } from './exam'

// 名所の建屋は layout.blocked() / minatoBlocked() の矩形で実寸に塞ぐ。
// buildSolids は木立と、矩形に入らぬ小さな建屋（書院）を当たり円で足すだけ。
const KYO_SOLIDS = buildSolids({
  trees: TREES,
  extra: [
    { x: 8.5, z: -3, r: 1.5 }, // 書院（会所の一室）——矩形に入らぬので円で塞ぐ
  ],
})
const MINATO_SOLIDS = buildSolids({ trees: MINATO_TREES })

// 名所をエリアで分ける：京に四つ（幕府・金閣・能・銀閣）、湊に一つ（会合の湊）。
const KYO_LANDMARKS = LANDMARKS.filter(l => l.kind !== 'minato')
const MINATO_LANDMARKS = LANDMARKS.filter(l => l.kind === 'minato')

// 場面：京（室町大路の走る盆地。花の御所・金閣・能舞台・銀閣、書院と市）
const KYO: AreaDef = {
  id: 'kyo', label: '京',
  World: KyoWorld,
  blocked, groundY,
  solids: KYO_SOLIDS,
  LANDMARKS: KYO_LANDMARKS,
  CHARACTERS,
  FLOWER_SPOTS,
  SPOTS: [
    {
      id: 'shoin', label: '書院', kind: 'shoin', pos: [8.5, -1.4], reach: 2.2,
      lines: [
        { text: '会所の一室に、畳が一面にしきつめられていた。' },
        { text: '明かり障子のやわらかな光。床の間に、墨の一幅と生け花。' },
        { text: '畳・障子・床の間——書院造は、いまの和室のはじまり。' },
      ],
      factId: 'shoin',
    },
  ],
  gates: [
    { id: 'minato', label: '西の舟着き', pos: [-19, 7], reach: 1.8, to: 'minato', spawn: MINATO_SPAWN },
  ],
  hasBed: true,
  gateHint: '西のはずれの舟着きから、川をくだって湊へもゆける',
}

// 場面：湊（会合衆の自治の町。沖の勘合船・会合所・土倉・市・寄合・勘合の卓）
const MINATO: AreaDef = {
  id: 'minato', label: '湊',
  World: MinatoWorld,
  blocked: minatoBlocked, groundY: minatoGroundY,
  solids: MINATO_SOLIDS,
  LANDMARKS: MINATO_LANDMARKS,
  CHARACTERS: MINATO_CHARACTERS,
  FLOWER_SPOTS: [],
  SPOTS: [
    {
      id: 'fuda', label: '勘合の卓', kind: 'fuda', pos: [3.5, -5.8], reach: 2.2,
      lines: [
        { text: '汀ちかくの卓に、木の合い札がならんでいた。' },
        { text: '勘合——これを持つ船だけが、明との商いをゆるされる。' },
        { text: '海賊の倭寇と、正しい貿易船を見分けるためのしるし。' },
      ],
      factId: 'kango',
    },
    {
      id: 'ichi', label: '市', kind: 'ichi', pos: [8, 5.4], reach: 2.4,
      lines: [
        { text: '布屋根の下に、俵や壺、海のむこうの品がならぶ。' },
        { text: '同じ商いの者が座をむすび、月に何度も市がたつ。' },
        { text: '飛びかうのは、明から渡ってきた銅銭——明銭。' },
      ],
      factId: 'za',
    },
    {
      id: 'so', label: '寄合', kind: 'so', pos: [-9, 2], reach: 2.4,
      lines: [
        { text: 'むしろに車座で、村の衆が額をよせていた。' },
        { text: '村人がむすぶ惣——寄合で、村のおきてをみずから定める。' },
        { text: '団結した惣は、ときに徳政をもとめ、一揆にも立つ。' },
      ],
      factId: 'so',
    },
  ],
  gates: [
    { id: 'kyo', label: '京へ', pos: [14, 8], reach: 1.8, to: 'kyo', spawn: [-16.5, 7] },
  ],
  hasBed: false,
  arriveHint: '会合衆が治める、自治の湊。市・寄合・勘合の卓をたずねてみよう',
}

export const muromachiPack: Pack = {
  id: 'muromachi',
  TIMELINE, LANDMARKS, landmarkById,
  FACTS, factById,
  CHARACTERS: ALL_CHARACTERS, charById, charPos,
  FLOWERS, FLOWER_SPOTS, flowerById,
  DAY_EVENTS, LAST_DAY,
  BED, spawn: SPAWN,
  areas: { kyo: KYO, minato: MINATO },
  homeArea: 'kyo',
  getDialogue, WAKE_LINES, OUTFIT_DONE_LINES, BED_EARLY,
  LandmarkMesh: MuromachiLandmarkMesh, VisionMesh: MuromachiVision, skyColor, tintColor,
  hasFlowers: false, hasLetter: false,

  examTitle: EXAM_TITLE,
  exam: EXAM,

  volume: '室町篇',
  tagline: '将軍の都、五日の日記',
  prologue: [
    'つぎ、大問三。室町時代——金閣、銀閣、応仁の乱。',
    '名前は知ってる。でも、順番も、つながりも、あやふや。',
    'まぶたが重い。さっきの夢の、あの都のつづきが見たい。',
    'ほんの少しだけ。目を、閉じる。',
    '……秒針の音が、とおくなる。',
  ],
  epilogue: [
    '——チャイム。こんどこそ、ほんものの。',
    '顔をあげる。答案用紙。窓の外は、秋の空。',
    '金と銀、ふたつの楼閣。まぶしさと、しずけさ。',
    'ペンが走る。勘合、惣、応仁の乱、下剋上——',
    '将軍の世は、民の力で、大きくうねっていた。',
    '体でおぼえたことは、きえない。',
  ],
  epilogueHint: '試験、終了。',
  guideRows: [
    ['あるく', '行きたい方を、タップ'],
    ['ふれる', '光る名所や、人に'],
    ['えらぶ', 'ことばは、心のままに'],
    ['みまわす', '右下の ⟲⟳ で、ぐるり'],
  ],
  guideNote: '光の柱がのぼる名所にふれると時代の頁がひらき、その出来事が眼前に演じられる。西のはずれの舟着きから川をくだれば、会合衆の治める湊へ。日が暮れたら、寝所で宵の絵日記を。',
  outfits: [
    { name: '縹', color: '#3f6790', under: '#2e4d6d' },
    { name: '柿', color: '#a6552e', under: '#834126' },
    { name: '萌黄', color: '#6a7f3f', under: '#54662f' },
  ],
  outfitTitle: 'けふの小袖',
  outfitNote: '小袖は、この世にひろまる新しいふだん着。身分をこえて、京をいろどる。',
  dateLabel: (day: number) => `神無月${toKanji(6 + day)}日`,
  nenpyoTitle: '室町のあゆみ',
  nenpyoFoot: '都と湊の名所にふれ、五日を生きて、頁をうめてゆく。',
}

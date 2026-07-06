// 鎌倉篇のパック。武家の都・五日の日記。草花摘みと文の場面はない。
import type { Pack } from '../game/pack'
import { toKanji } from '../game/ui/date'
import { TIMELINE, LANDMARKS, landmarkById } from './timeline'
import { FACTS, factById } from './facts'
import { CHARACTERS, charById, charPos } from './characters'
import { FLOWERS, FLOWER_SPOTS, flowerById } from './flowers'
import { DAY_EVENTS, LAST_DAY } from './days'
import { BED, SPAWN, blocked, groundY } from './layout'
import { getDialogue, WAKE_LINES, OUTFIT_DONE_LINES, BED_EARLY } from './dialogues'
import { skyColor, tintColor } from './palette'
import { KamakuraWorld, KamakuraLandmarkMesh } from './world'

export const kamakuraPack: Pack = {
  id: 'kamakura',
  TIMELINE, LANDMARKS, landmarkById,
  FACTS, factById,
  CHARACTERS, charById, charPos,
  FLOWERS, FLOWER_SPOTS, flowerById,
  DAY_EVENTS, LAST_DAY,
  BED, spawn: SPAWN, blocked, groundY,
  getDialogue, WAKE_LINES, OUTFIT_DONE_LINES, BED_EARLY,
  World: KamakuraWorld, LandmarkMesh: KamakuraLandmarkMesh, skyColor, tintColor,
  hasFlowers: false, hasLetter: false,

  volume: '鎌倉篇',
  tagline: '武家の都、五日の日記',
  prologue: [
    '令和八年、秋。おばあちゃんの家の、蔵のなか。',
    'あの古い草子を、もう一度ひらいてみた。',
    'まっさらな頁の隅に、あたらしい字が浮かぶ——『鎌倉』。',
    'どこからか潮の匂いがして、目の前が金いろにかすみ、',
    'わたしは、また、その世へ落ちていった。',
  ],
  epilogue: [
    '——目をさますと、蔵のなかだった。',
    '手のなかの草子は、五日ぶんの絵日記でふくらんでいる。',
    'さいごの頁に、小さな弓と、波の絵が、ひとつずつ。',
    '「武士の世は、ここから始まったんだ。」',
    '八百年まえの潮騒が、まだ耳の奥に残っていた。',
  ],
  epilogueHint: 'おわり',
  guideRows: [
    ['あるく', '行きたい方を、タップ'],
    ['ふれる', '名所や人に、近づいて'],
    ['えらぶ', 'ことばは、心のままに'],
  ],
  guideNote: '日が暮れたら、宵に絵日記を。五日を生きて、目をさます。',
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

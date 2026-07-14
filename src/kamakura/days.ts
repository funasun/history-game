import type { DialogueLine } from '../game/store'

// 五日間の背骨：朝の出来事・宵の出来事・日記の一行・栞
export interface DayEvent {
  morning?: DialogueLine[]
  evening?: { at: number; lines: DialogueLine[]; then?: 'letter' | 'roam' }
  diaryLine?: string
  facts?: string[]
  talkFacts?: Record<string, string>
  icons?: string[]
}

export const DAY_EVENTS: Record<number, DayEvent> = {
  1: {
    diaryLine: '鎌倉という、武家の都に来た。',
    facts: ['bushi'],
    talkFacts: { warabe: 'sangyo', nomin: 'sangyo' },
  },

  2: {
    morning: [
      { speaker: '尼御台', text: 'よう来た、時渡りの童。' },
      { speaker: '尼御台', text: 'あの朱の宮は、鶴岡八幡宮。武士の心のよりどころ。' },
      { speaker: '尼御台', text: '頼朝どのが守護と地頭をおき、鎌倉に幕府をひらいた。' },
      { speaker: '尼御台', text: '将軍は御家人を守り、御家人は将軍のために戦う。' },
      { speaker: '尼御台', text: '御恩と奉公——それが、この世のかなめじゃ。' },
    ],
    diaryLine: '八幡宮に詣で、御恩と奉公を知った。',
    facts: ['goon'],
    talkFacts: { gokenin: 'bushi' },
  },

  3: {
    morning: [
      { speaker: '尼御台', text: '源氏の将軍は、わずか三代で絶えた。' },
      { speaker: '尼御台', text: 'いまは北条の執権が、政をあずかっておる。' },
      { speaker: '尼御台', text: 'かつて後鳥羽上皇が、幕府をたおさんと兵をあげた。' },
      {
        speaker: '尼御台', text: '御家人の心が、みだれかけたそのとき——',
        choices: [
          {
            label: '尼御台は、なんと？',
            lines: [
              { speaker: '尼御台', text: 'わたしは皆の前で、頼朝どのの御恩を説いたのじゃ。' },
              { speaker: '尼御台', text: '「山より高く、海より深い御恩を忘れるな」とな。' },
            ],
          },
          {
            label: 'それで、どうなった？',
            lines: [
              { speaker: '尼御台', text: '御家人は心をひとつにし、そして勝った。' },
              { speaker: '尼御台', text: '承久の乱——武家が、公家をこえた日じゃ。' },
            ],
          },
        ],
      },
      { speaker: '尼御台', text: '幕府は京に六波羅探題をおき、朝廷を見はることとなった。' },
    ],
    diaryLine: '承久の乱の話をきいた。武家が、公家をこえた日。',
    facts: ['jokyu', 'onnaji'],
  },

  4: {
    morning: [
      { speaker: '浜の童', text: 'ねえねえ、大仏さま、もう見た？' },
      { speaker: '浜の童', text: '西のほう、長谷にいらっしゃる青いほとけさま。' },
      { speaker: '浜の童', text: 'このごろ、あたらしい仏さまの教えがはやってるんだ。' },
      { speaker: '浜の童', text: '念仏をとなえれば、だれでも救われるんだって。' },
      { speaker: '浜の童', text: 'むずかしい修行はいらないの。ふしぎだねえ。' },
    ],
    diaryLine: '大仏と、新しい仏教のことを知った。',
    facts: ['shinbukkyo', 'unkei'],
  },

  5: {
    morning: [
      { speaker: '御家人', text: '海のむこうから、元の大軍が二度も来た。' },
      { speaker: '御家人', text: '「てつはう」という、火を噴くたまに肝をつぶしたわ。' },
      { speaker: '御家人', text: '防塁をきずき、大風も吹いて、どうにか追いかえした。' },
      { speaker: '御家人', text: 'じゃがな……命がけで戦うても、恩賞の地はわずか。' },
      { speaker: '御家人', text: '御家人の暮らしは、年ごとに苦しゅうなるばかりよ。' },
    ],
    evening: {
      at: 0.62,
      lines: [
        { speaker: '御家人', text: '時渡りの童。おぬしの草子、頁はみちたか。' },
        { speaker: '御家人', text: 'この武家の世の行く末、しかと見とどけてゆけ。' },
        { speaker: 'わたし', text: 'うん。……わすれない。' },
      ],
    },
    diaryLine: '海を見た。武士の世のゆくすえを、胸にきざんだ。',
    facts: ['genko', 'mujo'],
  },
}

export const LAST_DAY = 5

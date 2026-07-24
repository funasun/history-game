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
    diaryLine: '室町のみやこ、京に来た。',
    facts: ['kanrei'],
    talkFacts: { warabe: 'za' },
  },

  2: {
    morning: [
      { speaker: '富子', text: 'よう来やった、時渡りの童。' },
      { speaker: '富子', text: 'あの門は、将軍の御所——花の御所じゃ。' },
      { speaker: '富子', text: '後醍醐の帝の新政はやぶれ、足利尊氏どのが京に幕府をひらいた。' },
      { speaker: '富子', text: '三代義満どのの世に、南北朝はひとつになり、幕府は花ひらいた。' },
      { speaker: '富子', text: '金色の楼閣も、この世の栄えのしるしよ。' },
    ],
    diaryLine: '花の御所に詣で、将軍の世を知った。',
    facts: ['kenmu'],
    talkFacts: { doboshu: 'kitayama' },
  },

  3: {
    morning: [
      { speaker: '京童', text: 'ねえねえ、西の川くだったところに、湊があるんだよ。' },
      { speaker: '京童', text: '海のむこうの明や琉球と、船で商いしてるんだって。' },
      { speaker: '京童', text: 'あそこは、えらい人じゃなくて——町の衆が自分たちで治めてるの。' },
      { speaker: '京童', text: '会合衆っていう、お金もちの商人たちがね。' },
      { speaker: '京童', text: '行ってみなよ。おもしろい人がいるからさ。' },
    ],
    diaryLine: '湊にわたり、海のむこうとの商いを知った。',
    facts: ['ryukyu'],
    talkFacts: { egoshu: 'kango' },
  },

  4: {
    morning: [
      { speaker: '富子', text: 'このごろ、民が徳政をもとめて騒ぐ。' },
      { speaker: '富子', text: '村の者どもが惣をむすび、寄合で心をひとつにするのじゃ。' },
      {
        speaker: '富子', text: '馬借を先がけに、民が実力で立ちあがる——土一揆よ。',
        choices: [
          {
            label: '徳政とは？',
            lines: [
              { speaker: '富子', text: '借りた銭を、帳消しにせよという訴えじゃ。' },
              { speaker: '富子', text: '正長の年、その声は京をゆるがした。' },
            ],
          },
          {
            label: '幕府は、どうする？',
            lines: [
              { speaker: '富子', text: 'おさえきれず、徳政令を出すこともあった。' },
              { speaker: '富子', text: '民のちからは、もう、あなどれぬ。' },
            ],
          },
        ],
      },
      { speaker: '富子', text: '世は、上から下へだけでは、動かぬようになった。' },
    ],
    diaryLine: '民のちからが世を動かすさまを見た。',
    facts: ['so', 'ikki'],
  },

  5: {
    morning: [
      { speaker: '同朋衆', text: '時渡りの童。能は観たか。' },
      { speaker: '同朋衆', text: '観阿弥・世阿弥の親子が、幽玄の芸に高めた舞よ。' },
      { speaker: '同朋衆', text: 'されど、はなやぎの世は永くはつづかなんだ。' },
      { speaker: '同朋衆', text: '将軍の跡目あらそいから、応仁の乱——十一年、京は焼けた。' },
      { speaker: '同朋衆', text: '義政どのは東山にしりぞき、しずかな銀閣を建てられた。' },
    ],
    evening: {
      at: 0.62,
      lines: [
        { speaker: '同朋衆', text: '時渡りの童。おぬしの草子、頁はみちたか。' },
        { speaker: '同朋衆', text: '下の者が上をたおす世が、もう、そこまで来ておる。' },
        { speaker: '同朋衆', text: 'この乱世の行く末を、しかと見とどけてゆけ。' },
        { speaker: 'わたし', text: 'うん。……わすれない。' },
      ],
    },
    diaryLine: '能を観、乱のあとの静けさにふれた。武家の世は、戦国へ。',
    facts: ['higashiyama', 'onin'],
    talkFacts: { doboshu: 'noh' },
  },
}

export const LAST_DAY = 5

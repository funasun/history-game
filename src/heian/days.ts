import type { DialogueLine } from '../game/store'
import { LETTER_LINES } from './dialogues'

// 七日間の背骨：朝の出来事・宵の出来事・日記の一行・栞
export interface DayEvent {
  morning?: DialogueLine[]
  evening?: { at: number; lines: DialogueLine[]; then?: 'letter' | 'roam' }
  diaryLine?: string
  facts?: string[]
  talkFacts?: Record<string, string>   // その日その人と話していたら加わる栞
  icons?: string[]
}

export const DAY_EVENTS: Record<number, DayEvent> = {
  1: {
    evening: { at: 0.6, lines: LETTER_LINES, then: 'letter' },
  },

  2: {
    morning: [
      { speaker: '小侍従', text: 'おはやう。よくねむれた？' },
      { speaker: '小侍従', text: '姫さまへの返し、まだでしょう。' },
      { speaker: '小侍従', text: '文をもらったら、歌でかえすのがならわしよ。' },
      { speaker: '小侍従', text: 'むずかしい字はいらないの、仮名でいいのよ。' },
      {
        speaker: '小侍従', text: 'さ、どの歌にする？',
        choices: [
          {
            label: '「もみぢばは君のことばのいろに似て」', flag: 'henka',
            lines: [{ speaker: '小侍従', text: '秋の色をかさねたのね。よい返し。' }],
          },
          {
            label: '「秋かぜがはこんでくれたふみひとつ」', flag: 'henka',
            lines: [{ speaker: '小侍従', text: '風のたよりとは、しゃれたこと。' }],
          },
          {
            label: '「にはの花あしたも君と見たいです」', flag: 'henka',
            lines: [{ speaker: '小侍従', text: 'すなおでいちばん。歌は心よ。' }],
          },
        ],
      },
      { speaker: '小侍従', text: '仮名の字はね、漢字をくずして生まれたの。' },
      { speaker: '小侍従', text: '女手ともよばれて、女や子どもの味方。' },
      { speaker: '小侍従', text: '文は、小菊にとどけさせるわね。' },
    ],
    diaryLine: '姫さまに、返しの歌をおくった。',
    facts: ['henka', 'kana'],
    talkFacts: { kogiku: 'shokuji' },
  },

  3: {
    morning: [
      { speaker: '殿', text: 'けふは物忌みじゃ。だれも門を出てはならん。' },
      { speaker: '殿', text: '陰陽師が、方角が悪いと申してな。' },
      {
        speaker: '小侍従', text: 'こういう日は、静かに過ごすのよ。',
        choices: [
          {
            label: 'ものいみ、って？',
            lines: [
              { speaker: '小侍従', text: '悪いことを避けて、家にこもる日のこと。' },
              { speaker: '小侍従', text: '暦も方角も、陰陽師さまが占うのよ。' },
            ],
          },
          { label: 'ふうん', lines: [{ speaker: '小侍従', text: 'お庭のなかなら、歩いていいのよ。' }] },
        ],
      },
    ],
    diaryLine: 'けふは物忌み。みな、静かに過ごした。',
    facts: ['monoimi'],
    talkFacts: { kogiku: 'toki' },
  },

  4: {
    morning: [
      { speaker: '萩の君', text: 'いいものがあるの。貝合はせをしましょう。' },
      { speaker: '萩の君', text: '対の貝は、この世にひとつしかないのよ。' },
      {
        speaker: '萩の君', text: 'さあ、どっちが対でしょう？',
        choices: [
          {
            label: '右の貝', flag: 'kai',
            lines: [{ speaker: '萩の君', text: 'あたり！　あなた、目がいいのね。' }],
          },
          {
            label: '左の貝', flag: 'kai',
            lines: [{ speaker: '萩の君', text: 'ざんねん、こっちでした。……ふふ。' }],
          },
        ],
      },
      { speaker: '小菊', text: 'つぎはお庭で、蹴鞠ごっこしようよ！' },
    ],
    diaryLine: '姫さまと、貝合はせをした。',
    facts: ['kaiawase'],
    talkFacts: { kogiku: 'kemari', kojiju: 'monogatari' },
  },

  5: {
    morning: [
      { speaker: '殿', text: 'その草子、めずらしい絵じゃな。' },
      { speaker: '殿', text: '唐渡りの品……ではなさそうか。' },
      { speaker: '殿', text: '唐への船はな、百年もまえにやんだのじゃ。' },
      { speaker: '殿', text: '菅原道真公が、もう要らぬと申されてな。' },
      { speaker: '殿', text: 'いまは、この国ぶりの美しさが花よ。' },
      { speaker: '小侍従', text: '仮名も大和絵も、この御代のものですものね。' },
    ],
    diaryLine: '殿から、唐の船の話をきいた。',
    facts: ['kentoshi', 'kokufu'],
    talkFacts: { kogiku: 'shoen' },
  },

  6: {
    morning: [
      { speaker: '小菊', text: 'たいへん、たいへん！' },
      { speaker: '小菊', text: '殿さまが、受領にならはったって！' },
      { speaker: '小侍従', text: '遠い国の、国司さまになるということ。' },
      { speaker: '小侍従', text: 'この邸のみなで、任国へ下るのよ。' },
      { speaker: '小侍従', text: '……あなたとの別れも、近いのかもね。' },
    ],
    evening: {
      at: 0.62,
      lines: [
        { speaker: '萩の君', text: '……きてくれたのね。' },
        { speaker: '萩の君', text: 'わたし、都をはなれるの、こわい。' },
        {
          speaker: '萩の君', text: '……ねえ、どう思う？',
          choices: [
            { label: 'きっとだいじょうぶ', lines: [{ speaker: '萩の君', text: '……うん。あなたが言うなら。' }] },
            { label: 'わたしも、さみしい', lines: [{ speaker: '萩の君', text: '……いっしょね。ふふ、少しらくになった。' }] },
          ],
        },
        { speaker: '萩の君', text: '月がきれい。もうすこし、ここにいましょう。' },
      ],
    },
    diaryLine: '殿さまが、受領にならはった。',
    facts: ['zuryo', 'mappo'],
  },

  7: {
    morning: [
      { speaker: '小侍従', text: 'あすの朝、みなで発つのよ。' },
      { speaker: '萩の君', text: '……これ、あなたに。' },
      { speaker: '萩の君', text: 'もみぢの押し葉。わすれないでね。' },
      { speaker: '小菊', text: 'またあそぼうね！　ぜったいだよ！' },
      { speaker: '殿', text: '達者でな、ふしぎな童よ。' },
      { speaker: '小侍従', text: 'あなたの草子も、頁がみちるころね。' },
      { speaker: '小侍従', text: '今宵は、ゆっくりおやすみなさい。' },
    ],
    evening: {
      at: 0.65,
      lines: [
        { speaker: '萩の君', text: '……月、きれいね。' },
        { speaker: '萩の君', text: 'あなたのこと、歌にして持っていくわ。' },
        { speaker: 'わたし', text: 'うん。……わたしも、日記に書く。' },
      ],
    },
    diaryLine: '萩の君と、わかれの日。……わすれない。',
    facts: ['wakare', 'monogatari'],
    icons: ['momiji'],
  },
}

export const LAST_DAY = 7

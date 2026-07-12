import type { DialogueLine } from '../game/store'

// 会話は一文ずつ・短く（北極星1）。学びは埋め込むが説明しない。

export const WAKE_LINES: DialogueLine[] = [
  { speaker: '小侍従', text: 'おや、目が覚めた？' },
  { speaker: '小侍従', text: 'ふしぎな子。蔵の陰にたおれていたのよ。' },
  { speaker: '小侍従', text: 'その古い草子、だいじそうに抱えて。' },
  { speaker: '小侍従', text: '殿が、しばらく置いてよいと。' },
  { speaker: '小侍従', text: '装束はね、季節に合う色をえらぶの。「色目」というのよ。' },
  { speaker: '小侍従', text: 'さ、身支度をなさい。' },
]

export const OUTFIT_DONE_LINES: DialogueLine[] = [
  { speaker: '小侍従', text: 'まあ、秋らしいよい色。' },
  { speaker: '小侍従', text: 'お庭でも歩いてらっしゃい。' },
  { speaker: '小侍従', text: '気になるものには、触れてみることね。' },
]

export const LETTER_LINES: DialogueLine[] = [
  { speaker: '小菊', text: '文だよ！　姫さまから、お文！' },
]

export const BED_EARLY: DialogueLine[] = [
  { speaker: 'わたし', text: 'まだ、ねむくない。' },
]

interface DialogueCtx {
  talked: Record<string, number>  // これまでに話した回数（今回を含まない）
  zufu: string[]                  // 集めた花の種類
  letterSeen: boolean
  day: number
  flags: string[]
}

export function getDialogue(charId: string, ctx: DialogueCtx): DialogueLine[] {
  const n = ctx.talked[charId] ?? 0
  switch (charId) {
    case 'kojiju':
      if (ctx.day === 1) {
        if (n === 0) return [
          { speaker: '小侍従', text: '歌をひとつ、教えましょうか。' },
          { speaker: '小侍従', text: '「秋の野に　咲きたる花を　指折りて」……' },
          { speaker: '小侍従', text: 'つづきは、お花を摘んでから。' },
        ]
        if (ctx.zufu.length >= 3 && n >= 1) return [
          { speaker: '小侍従', text: 'あら、ずいぶん摘んだこと。' },
          { speaker: '小侍従', text: '「かき数ふれば　七種の花」。' },
          { speaker: '小侍従', text: 'それが、さっきの歌のつづきよ。' },
        ]
        return [
          { speaker: '小侍従', text: 'お庭の花は、みな歌になるのよ。' },
        ]
      }
      if (ctx.day === 2) return [
        { speaker: '小侍従', text: '返しの文は、小菊がとどけたわ。' },
        { speaker: '小侍従', text: '字はね、くりかえし書けば上手になるもの。' },
        { speaker: '小侍従', text: '手習いも、たいせつなお勤めよ。' },
      ]
      if (ctx.day === 3) return [
        { speaker: '小侍従', text: '物忌みの日は、歌を書き写して過ごすの。' },
        { speaker: '小侍従', text: '静かな日にしか、できないこともあるのよ。' },
      ]
      if (ctx.day === 4) return [
        { speaker: '小侍従', text: '宮中では、女房がたが物語をお書きとか。' },
        { speaker: '小侍従', text: '『源氏の物語』——紫式部さまの。' },
        { speaker: '小侍従', text: '『枕草子』の清少納言さまも、仮名の人よ。' },
      ]
      if (ctx.day === 5) return [
        { speaker: '小侍従', text: '唐渡りの品は「からもの」といって宝物。' },
        { speaker: '小侍従', text: 'でも、この国のものも負けていないでしょう。' },
      ]
      if (ctx.day === 6) return [
        { speaker: '小侍従', text: 'この世は末の世だと、みな言うけれど。' },
        { speaker: '小侍従', text: '阿弥陀さまを念ずれば、極楽に生まれるとか。' },
        { speaker: '小侍従', text: 'だから殿方は、御堂を建てたがるのよ。' },
      ]
      return [
        { speaker: '小侍従', text: 'あなたの草子、もう頁がみちるころね。' },
        { speaker: '小侍従', text: '……ふしぎな子。どうか、達者でね。' },
      ]

    case 'aruji':
      if (ctx.day === 1) {
        if (n === 0) return [
          { speaker: '殿', text: '見なれぬ童だな。……まあよい。' },
          { speaker: '殿', text: '邸のうちは、好きに歩け。' },
        ]
        if (n === 1) return [
          { speaker: '殿', text: '摂関家さまに、文を書かねばならん。' },
          { speaker: '殿', text: '……位というものは、重いのう。' },
        ]
        return [
          { speaker: '殿', text: 'そなたは、のんきでよいな。' },
        ]
      }
      if (ctx.day === 2) return [
        { speaker: '殿', text: '文の紙にも、格というものがあってな。' },
        { speaker: '殿', text: '陸奥紙は上等、檀紙もよい。' },
        { speaker: '殿', text: '……まあ、童には要らぬ話か。' },
      ]
      if (ctx.day === 3) return [
        { speaker: '殿', text: '方角の悪い日に出かけるときはな。' },
        { speaker: '殿', text: '前の晩によそに泊まって、方角を変えるのじゃ。' },
        { speaker: '殿', text: '方違え、というてな。' },
      ]
      if (ctx.day === 4) return [
        { speaker: '殿', text: '蹴鞠はな、落とさず蹴りつづけるのが妙技。' },
        { speaker: '殿', text: '所作の美しさこそが、勝ち負けよ。' },
      ]
      if (ctx.day === 5) return [
        { speaker: '殿', text: '唐の都は長安。それは大きな都であったそうな。' },
        { speaker: '殿', text: 'だが、もう船は行かぬ。……唐も滅んだしな。' },
      ]
      if (ctx.day === 6) return [
        { speaker: '殿', text: '受領となれば、任国の政も税も、わしの肩よ。' },
        { speaker: '殿', text: '財も成るがな。……ふ、ふ。' },
        { speaker: '殿', text: '都を離れるのは、寂しいがのう。' },
      ]
      return [
        { speaker: '殿', text: '世話になったな、ふしぎな童よ。' },
        { speaker: '殿', text: '縁があれば、また会おうぞ。' },
      ]

    case 'hagi':
      if (ctx.day === 1) {
        if (n === 0) return [
          { speaker: '萩の君', text: 'あなたが、蔵で拾われた子？' },
          { speaker: '萩の君', text: 'わたしは萩。秋の生まれなの。' },
          {
            speaker: '萩の君', text: 'ねえ、りんだうの花、知ってる？',
            choices: [
              { label: '知ってる', lines: [{ speaker: '萩の君', text: 'なら、摘んできて見せて。' }] },
              { label: '知らない', lines: [{ speaker: '萩の君', text: '青い、小さな花よ。さがしてみて。' }] },
            ],
          },
        ]
        if (ctx.zufu.includes('rindou') && n === 1) return [
          { speaker: '萩の君', text: 'あ、りんだう！' },
          { speaker: '萩の君', text: '……青は、空の色ににてる。' },
          { speaker: '萩の君', text: 'あなた、いいものを見つける子ね。' },
        ]
        if (n === 1) return [
          { speaker: '萩の君', text: '池のほとりは、風がきもちいいの。' },
        ]
        return [
          { speaker: '萩の君', text: 'あなたといると、たいくつしないわ。' },
        ]
      }
      if (ctx.day === 2) {
        if (ctx.flags.includes('henka')) return [
          { speaker: '萩の君', text: '返しの歌、とどいたわ。' },
          { speaker: '萩の君', text: '……ふふ、字がのびのびしてる。' },
          { speaker: '萩の君', text: 'また書いてね。こんどは、もっと長く。' },
        ]
        return [
          { speaker: '萩の君', text: 'お文の返し、待ってるんだから。' },
        ]
      }
      if (ctx.day === 3) return [
        { speaker: '萩の君', text: '物忌みの日って、たいくつ。' },
        { speaker: '萩の君', text: 'だから貝の絵に、色をぬっていたの。' },
      ]
      if (ctx.day === 4) return [
        { speaker: '萩の君', text: '貝合はせ、たのしかったわね。' },
        { speaker: '萩の君', text: 'こんどは雛あそびも、双六もしましょう。' },
      ]
      if (ctx.day === 5) return [
        { speaker: '萩の君', text: '父さまが、なにか大事なお話をなさってた。' },
        { speaker: '萩の君', text: '……なんだか、むねがざわざわするの。' },
      ]
      if (ctx.day === 6) return [
        { speaker: '萩の君', text: '父さまのこと、聞いたのね。' },
        { speaker: '萩の君', text: '……夜に、池のほとりで待ってる。' },
      ]
      return [
        { speaker: '萩の君', text: '押し葉、だいじにしてね。' },
        { speaker: '萩の君', text: 'あなたに会えて、ほんとうによかった。' },
        { speaker: '萩の君', text: '千年たっても、わすれないわ。' },
      ]

    case 'kogiku':
      if (ctx.day === 1) {
        if (n === 0) return [
          { speaker: '小菊', text: 'お客さまだ、お客さまだ！' },
          { speaker: '小菊', text: 'お庭のをみなへし、咲いてるよ！' },
        ]
        return [
          { speaker: '小菊', text: 'かくれんぼ、しない？　……またこんど！' },
        ]
      }
      if (ctx.day === 2) return [
        { speaker: '小菊', text: '朝餉、もう食べた？' },
        { speaker: '小菊', text: 'ごはんはね、朝と夕の二度だけなんだよ。' },
        { speaker: '小菊', text: '姫さまは白いお強飯、ぼくは麦がゆ！' },
      ]
      if (ctx.day === 3) return [
        { speaker: '小菊', text: 'いまはね、たぶん巳の刻！' },
        { speaker: '小菊', text: '時はね、ねずみとかうしとか、十二支で数えるんだ。' },
        { speaker: '小菊', text: 'お寺の鐘が、教えてくれるよ。' },
      ]
      if (ctx.day === 4) return [
        { speaker: '小菊', text: '殿方の蹴鞠、見たことある？' },
        { speaker: '小菊', text: '「アリ、ヤア、オウ」ってかけ声するんだよ。' },
        { speaker: '小菊', text: '地面に落としたら、おしまい！' },
      ]
      if (ctx.day === 5) return [
        { speaker: '小菊', text: '都の外はね、田んぼがずーっとつづいてるんだ。' },
        { speaker: '小菊', text: 'お米は、えらい人の荘園にはこばれるんだって。' },
        { speaker: '小菊', text: 'ぼくのとうちゃん、その荘園の生まれ。' },
      ]
      if (ctx.day === 6) return [
        { speaker: '小菊', text: 'おひっこし、ぼくもついていくんだ。' },
        { speaker: '小菊', text: '遠い国って、どんなとこかなあ。' },
      ]
      return [
        { speaker: '小菊', text: 'またあそぼうね！　ぜったいだよ！' },
        { speaker: '小菊', text: 'ゆびきり！' },
      ]

    // ---------- 都大路の人びと ----------
    case 'ichime':
      if (n === 0) return [
        { speaker: '市女', text: 'いらっしゃい。東の市は、なんでもあるよ。' },
        { speaker: '市女', text: '絹に、塩に、干し魚。……見ておいき。' },
      ]
      if (ctx.day >= 5) return [
        { speaker: '市女', text: '唐物はもう入らないねえ。船が絶えたから。' },
        { speaker: '市女', text: 'そのぶん、この国の品が良くなったのさ。' },
      ]
      return [
        { speaker: '市女', text: '市がひらくのは、日のあるうちだけ。' },
        { speaker: '市女', text: '夕鐘が鳴ったら、みんな帰るんだよ。' },
      ]

    case 'okina':
      if (n === 0) return [
        { speaker: '翁', text: 'この門が、羅城門。都の南のはてじゃ。' },
        { speaker: '翁', text: 'この先は、もう都の外……行くでないぞ。' },
      ]
      if (ctx.day >= 4) return [
        { speaker: '翁', text: '東国では、武士とやらが力をつけておるそうな。' },
        { speaker: '翁', text: '……都の栄えも、いつまでつづくかのう。' },
      ]
      return [
        { speaker: '翁', text: '昔はな、この大路を唐の使いも歩いたもんじゃ。' },
        { speaker: '翁', text: 'いまは、荷車と童ばかりよ。ほっほ。' },
      ]

    case 'michiwara':
      if (n === 0) return [
        { speaker: '大路の童', text: 'きみ、見ない顔！　どこの子？' },
        { speaker: '大路の童', text: '牛車が来たら、はしっこに寄るんだよ。' },
      ]
      return [
        { speaker: '大路の童', text: 'あの塔、五重塔っていうんだ。東寺の。' },
        { speaker: '大路の童', text: 'てっぺんまで、鳥しかのぼれないね。' },
      ]
  }
  return []
}

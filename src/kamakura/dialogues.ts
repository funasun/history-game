import type { DialogueLine } from '../game/store'

// 会話は一文ずつ・短く（北極星1）。学びは埋め込むが説明しない。

export const WAKE_LINES: DialogueLine[] = [
  { speaker: '御家人', text: 'おい、しっかりせよ。浜辺に倒れておったぞ。' },
  { speaker: '御家人', text: 'ここは鎌倉。武家の都だ。' },
  { speaker: '御家人', text: '京の帝ではのうて、将軍がおさめる世よ。' },
  { speaker: '御家人', text: 'その古びた草子、はなさず抱えておったな。' },
  { speaker: '御家人', text: 'まずは身なりをととのえよ、旅の童。' },
]

export const OUTFIT_DONE_LINES: DialogueLine[] = [
  { speaker: '御家人', text: 'うむ、悪うない。武者らしゅうなった。' },
  { speaker: '御家人', text: '都をあるいて、気になるものに触れてみよ。' },
  { speaker: '御家人', text: '名所にふれれば、草子に新たな頁が生まれよう。' },
]

// 鎌倉では文（手紙）の場面はない（型のためだけに残す）
export const LETTER_LINES: DialogueLine[] = []

export const BED_EARLY: DialogueLine[] = [
  { speaker: 'わたし', text: 'まだ、ねむくない。' },
]

interface DialogueCtx {
  talked: Record<string, number>
  zufu: string[]
  letterSeen: boolean
  day: number
  flags: string[]
}

export function getDialogue(charId: string, ctx: DialogueCtx): DialogueLine[] {
  const n = ctx.talked[charId] ?? 0
  switch (charId) {
    case 'gokenin':
      if (ctx.day <= 1) {
        if (n === 0) return [
          { speaker: '御家人', text: 'わしは御家人。将軍に仕える武士よ。' },
          { speaker: '御家人', text: '先祖ゆずりの土地を、命がけで守っておる。' },
          { speaker: '御家人', text: '一所懸命——そういう言葉があるのだ。' },
        ]
        return [
          { speaker: '御家人', text: 'ふだんは流鏑馬や笠懸で、弓馬をきたえておる。' },
        ]
      }
      if (ctx.day === 2) return [
        { speaker: '御家人', text: 'わしらの館は、堀と塀にかこまれておってな。' },
        { speaker: '御家人', text: 'まわりの田畑も、みずから治めておるのだ。' },
        { speaker: '御家人', text: 'いざ鎌倉、と聞けば、すぐさま馳せ参じる。' },
      ]
      if (ctx.day === 3) return [
        { speaker: '御家人', text: '執権の北条どのが、御成敗式目を定められた。' },
        { speaker: '御家人', text: '武家のならいを、道理でしるした法よ。' },
        { speaker: '御家人', text: 'もめごとの裁きも、これでおおやけになった。' },
      ]
      if (ctx.day === 4) return [
        { speaker: '御家人', text: '市がたつ日は、遠くの品もならぶ。' },
        { speaker: '御家人', text: '田では米と麦を、年に二度もつくるそうな。' },
        { speaker: '御家人', text: '世は、少しずつ豊かになってゆくのかもしれぬ。' },
      ]
      return [
        { speaker: '御家人', text: '元との戦は、勝ってなお報われなんだ。' },
        { speaker: '御家人', text: '……武士の忠義とは、かくも重いものよ。' },
      ]

    case 'amagozen':
      if (ctx.day <= 1) {
        if (n === 0) return [
          { speaker: '尼御台', text: 'わたしは尼御台。夫は、はやくに逝った。' },
          { speaker: '尼御台', text: 'この世では、女も領地をゆずり受ける。' },
          { speaker: '尼御台', text: '女の地頭も、めずらしくはないのじゃ。' },
        ]
        return [
          { speaker: '尼御台', text: '一族をたばねるのも、女の務めのひとつよ。' },
        ]
      }
      if (ctx.day === 2) return [
        { speaker: '尼御台', text: '頼朝どのは、この鎌倉に武家の府をひらいた。' },
        { speaker: '尼御台', text: '山にかこまれ、南は海。守るによい地じゃ。' },
      ]
      if (ctx.day === 3) return [
        { speaker: '尼御台', text: 'あの承久の日、わたしは声をふりしぼった。' },
        { speaker: '尼御台', text: '御家人の心が、ひとつになるようにと。' },
      ]
      if (ctx.day === 4) return [
        { speaker: '尼御台', text: '世は無常。おごる者も、いつかは滅ぶ。' },
        { speaker: '尼御台', text: '平家の物語を、琵琶法師が語りあるいておる。' },
      ]
      return [
        { speaker: '尼御台', text: 'この府も、いつか終わりを迎えよう。' },
        { speaker: '尼御台', text: '……それでも、生きた日々は消えはせぬ。' },
      ]

    case 'nomin':
      if (ctx.day <= 1) {
        if (n === 0) return [
          { speaker: '農人', text: 'おや、切通しをこえて来なすったか。' },
          { speaker: '農人', text: 'わしは館の田をあずかる百姓よ。' },
          { speaker: '農人', text: '秋に米を刈って、いまは麦を育てておる。' },
          { speaker: '農人', text: 'おなじ田で年に二度——二毛作というんじゃ。' },
        ]
        return [
          { speaker: '農人', text: '草木を焼いた灰をまくと、麦がよう育つでな。' },
        ]
      }
      if (ctx.day === 2) return [
        { speaker: '農人', text: '館の殿さまは、この谷戸の田畑を治めておられる。' },
        { speaker: '農人', text: '朝な夕なの蹄の音は、的場のお稽古よ。' },
      ]
      if (ctx.day === 3) return [
        { speaker: '農人', text: '鉄の鍬に、牛や馬。田おこしも楽になっての。' },
        { speaker: '農人', text: 'とれ高は、じいさまの頃よりずんとふえた。' },
      ]
      if (ctx.day === 4) return [
        { speaker: '農人', text: '刈った麦は、浜の市で銭にかわる。' },
        { speaker: '農人', text: '宋銭というての、海のむこうから来た銭じゃよ。' },
      ]
      return [
        { speaker: '農人', text: '戦のあとは、年貢が重うなるばかりでの……。' },
        { speaker: '農人', text: 'それでも田は、うらぎらぬ。今日も麦の世話よ。' },
      ]

    case 'warabe':
      if (ctx.day <= 1) {
        if (n === 0) return [
          { speaker: '浜の童', text: 'あっ、時渡りの子だ！ 浜で拾われたんでしょ。' },
          { speaker: '浜の童', text: 'この先の浜で、市がたつんだよ。' },
          { speaker: '浜の童', text: 'お米や麦、宋から来た銅銭でも買えるんだ。' },
        ]
        return [
          { speaker: '浜の童', text: '海のむこうには、大きな国があるんだって。' },
        ]
      }
      if (ctx.day === 2) return [
        { speaker: '浜の童', text: '八幡宮のお祭り、見た？ 流鏑馬がすごいんだ！' },
        { speaker: '浜の童', text: '走る馬から、的をつぎつぎ射るんだよ。' },
      ]
      if (ctx.day === 3) return [
        { speaker: '浜の童', text: 'えらいお侍さんたちが、御所に集まってた。' },
        { speaker: '浜の童', text: 'なにか、大事な決めごとだったのかな。' },
      ]
      if (ctx.day === 4) return [
        { speaker: '浜の童', text: '大仏さま、大きいでしょ！ 中はからっぽなんだよ。' },
        { speaker: '浜の童', text: 'ぼく、こないだ足の指をよじ登ったんだ。ないしょね。' },
      ]
      return [
        { speaker: '浜の童', text: '元がせめてきたときは、こわかったなあ。' },
        { speaker: '浜の童', text: 'でも、大きな風が吹いて、船をしずめたんだ。' },
      ]
  }
  return []
}

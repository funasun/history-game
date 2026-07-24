import type { DialogueLine } from '../game/store'

// 会話は一文ずつ・短く（北極星1）。学びは埋め込むが説明しない。

export const WAKE_LINES: DialogueLine[] = [
  { speaker: '同朋衆', text: 'おや、こんなところで倒れておったか。しっかりせよ。' },
  { speaker: '同朋衆', text: 'ここは京。されど、むかしの帝の都とはちがう。' },
  { speaker: '同朋衆', text: 'いまは将軍が、この京から天下をおさめる世よ。' },
  { speaker: '同朋衆', text: 'その古びた草子、はなさず抱えておったな。' },
  { speaker: '同朋衆', text: 'まずは身なりをととのえよ、旅の童。' },
]

export const OUTFIT_DONE_LINES: DialogueLine[] = [
  { speaker: '同朋衆', text: 'うむ、悪うない。都の者らしゅうなった。' },
  { speaker: '同朋衆', text: '大路をあるいて、気になるものに触れてみよ。' },
  { speaker: '同朋衆', text: '名所にふれれば、草子に新たな頁が生まれよう。' },
]

// 室町では文（手紙）の場面はない（型のためだけに残す）
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
    case 'doboshu':
      if (ctx.day <= 1) {
        if (n === 0) return [
          { speaker: '同朋衆', text: 'わしは同朋衆。将軍のそばで、芸と美をあずかる者よ。' },
          { speaker: '同朋衆', text: '名に「阿弥」をいただき、身分をこえて技をみがく。' },
          { speaker: '同朋衆', text: 'この京は、いま美しきものであふれておる。' },
        ]
        return [
          { speaker: '同朋衆', text: '茶をたて、花をいけ、庭をつくる——みな、われらの務め。' },
        ]
      }
      if (ctx.day === 2) return [
        { speaker: '同朋衆', text: '北山の金閣を見たか。金色にかがやく、義満どのの楼閣よ。' },
        { speaker: '同朋衆', text: '公家の雅と、武家・禅の気風がとけあうておる。' },
        { speaker: '同朋衆', text: 'これぞ、北山の文化じゃ。' },
      ]
      if (ctx.day === 3) return [
        { speaker: '同朋衆', text: '明から渡った書画は、それはみごとなものよ。' },
        { speaker: '同朋衆', text: '墨一色で山水を描く水墨画——雪舟という僧が大成した。' },
      ]
      if (ctx.day === 4) return [
        { speaker: '同朋衆', text: '茶の湯も生け花も、このごろ形をととのえてきた。' },
        { speaker: '同朋衆', text: '身分をこえて、寄合の座で美をわかちあうのじゃ。' },
      ]
      return [
        { speaker: '同朋衆', text: '東山の銀閣は、金閣とはちがう。' },
        { speaker: '同朋衆', text: '簡素で、しずかで——わびの心をたたえておる。' },
        { speaker: '同朋衆', text: '畳と障子の書院造は、いまの世にも受けつがれよう。' },
      ]

    case 'tomiko':
      if (ctx.day <= 1) {
        if (n === 0) return [
          { speaker: '富子', text: 'わたしは将軍の御台所。政も銭も、女とてあずかる。' },
          { speaker: '富子', text: 'この京の真ん中に、花の御所——将軍の館がある。' },
          { speaker: '富子', text: 'そこから、天下のまつりごとが動くのじゃ。' },
        ]
        return [
          { speaker: '富子', text: '関所をもうけ、銭をあつめるのも、府をささえるため。' },
        ]
      }
      if (ctx.day === 2) return [
        { speaker: '富子', text: '将軍を助ける管領は、細川・斯波・畠山の三家がつとめる。' },
        { speaker: '富子', text: '国々をおさめるは、力をつけた守護大名たちよ。' },
      ]
      if (ctx.day === 3) return [
        { speaker: '富子', text: '明との商いは、府に大きな利をもたらす。' },
        { speaker: '富子', text: '銅銭がどっと入り、世に銭がまわるようになった。' },
      ]
      if (ctx.day === 4) return [
        { speaker: '富子', text: '民の一揆はおそろしい。されど、無下にもできぬ。' },
        { speaker: '富子', text: '惣の団結は、もはや世のかたちのひとつなのじゃ。' },
      ]
      return [
        { speaker: '富子', text: '跡目のあらそいが、あの大乱をまねいてしもうた。' },
        { speaker: '富子', text: '京は焼け、守護は国へ帰って争う……下剋上の世よ。' },
      ]

    case 'warabe':
      if (ctx.day <= 1) {
        if (n === 0) return [
          { speaker: '京童', text: 'あっ、時渡りの子だ！ 大路で倒れてたんでしょ。' },
          { speaker: '京童', text: 'この先で市がたつんだよ。月に何度もひらくんだ。' },
          { speaker: '京童', text: '同じ商いの人たちが座をむすんで、店を出してるの。' },
        ]
        return [
          { speaker: '京童', text: '明から来た銅銭で、なんでも買えちゃうんだよ。' },
        ]
      }
      if (ctx.day === 2) return [
        { speaker: '京童', text: '花の御所って、庭も池もそれはきれいなんだって。' },
        { speaker: '京童', text: 'えらいお侍さんが、いつも出たり入ったりしてるよ。' },
      ]
      if (ctx.day === 3) return [
        { speaker: '京童', text: '馬借のおじさんたち、荷を馬にのせて京と湊を行き来してる。' },
        { speaker: '京童', text: 'ときどき、みんなで集まって怖い顔で相談してるんだ。' },
      ]
      if (ctx.day === 4) return [
        { speaker: '京童', text: '祇園祭、知ってる？ 山や鉾をひいて、京をねり歩くの。' },
        { speaker: '京童', text: '町の衆が、自分たちの手でやるお祭りなんだよ。' },
      ]
      return [
        { speaker: '京童', text: '戦がはじまったとき、京はぜんぶ焼けちゃったんだって。' },
        { speaker: '京童', text: 'でも町の人たちが、またお祭りを立て直したんだ。すごいでしょ。' },
      ]

    case 'egoshu':
      if (ctx.day <= 1) {
        if (n === 0) return [
          { speaker: '会合衆', text: 'おや、京から川をくだって来なすったか。' },
          { speaker: '会合衆', text: 'わしはこの湊をあずかる会合衆——町の商人よ。' },
          { speaker: '会合衆', text: 'この町に、殿さまはおらぬ。町の衆が、みずから治める。' },
          { speaker: '会合衆', text: '銭と船で、海のむこうとつながっておるのだ。' },
        ]
        return [
          { speaker: '会合衆', text: '堀をめぐらせ、傭兵をやとい、町はみずから守る。' },
        ]
      }
      if (ctx.day === 2) return [
        { speaker: '会合衆', text: '沖の大船が見えるか。あれが勘合の船よ。' },
        { speaker: '会合衆', text: '勘合という合い札を持つ船だけが、明と商いをゆるされる。' },
        { speaker: '会合衆', text: '海賊の倭寇とは、そこで見分けるのじゃ。' },
      ]
      if (ctx.day === 3) return [
        { speaker: '会合衆', text: '琉球の船も来る。あの国は中継貿易でさかえておってな。' },
        { speaker: '会合衆', text: '日本、明、朝鮮、南の島じま——品を仲だちして富をなす。' },
      ]
      if (ctx.day === 4) return [
        { speaker: '会合衆', text: '村の衆は惣をむすび、寄合でおきてを決める。' },
        { speaker: '会合衆', text: '団結すれば、徳政をもとめて一揆にも立つ。' },
        { speaker: '会合衆', text: 'もはや、民は治められるだけの者ではないのよ。' },
      ]
      return [
        { speaker: '会合衆', text: '京が乱れても、海の商いは絶えぬ。' },
        { speaker: '会合衆', text: 'この湊のにぎわいこそ、新しい世のしるしよ。' },
      ]
  }
  return []
}

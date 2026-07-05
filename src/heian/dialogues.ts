import type { DialogueLine } from '../game/store'

// 会話は一文ずつ・短く（北極星1）。学びは埋め込むが説明しない。

export const WAKE_LINES: DialogueLine[] = [
  { speaker: '小侍従', text: 'おや、目が覚めた？' },
  { speaker: '小侍従', text: 'ふしぎな子。蔵の陰にたおれていたのよ。' },
  { speaker: '小侍従', text: '殿が、しばらく置いてよいと。' },
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
}

export function getDialogue(charId: string, ctx: DialogueCtx): DialogueLine[] {
  const n = ctx.talked[charId] ?? 0
  switch (charId) {
    case 'kojiju':
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

    case 'aruji':
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

    case 'hagi':
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

    case 'kogiku':
      if (n === 0) return [
        { speaker: '小菊', text: 'お客さまだ、お客さまだ！' },
        { speaker: '小菊', text: 'お庭のをみなへし、咲いてるよ！' },
      ]
      return [
        { speaker: '小菊', text: 'かくれんぼ、しない？　……またこんど！' },
      ]
  }
  return []
}

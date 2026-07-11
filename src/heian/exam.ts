// 持ちこんだ試験・大問一（平安時代）。
// 全名所を巡り、暮らし（会話・栞）も拾えば全問埋まる配分にする。
// eventId の出来事を「見た」（learnedEvents か、その factId の栞）で、こたえが埋まる。
import type { ExamQ } from '../game/pack'

export const EXAM_TITLE = '大問一　平安時代'

export const EXAM: ExamQ[] = [
  {
    id: 'q1', eventId: 'sento',
    q: '794年、都を平安京にうつした天皇はだれか。',
    a: '桓武天皇',
  },
  {
    id: 'q2', eventId: 'bukkyo',
    q: '唐から帰り、比叡山延暦寺を建てて天台宗をひらいた僧はだれか。',
    a: '最澄',
  },
  {
    id: 'q3', eventId: 'kentoshi',
    q: '894年、菅原道真の建議で停止された、唐への使節を何というか。',
    a: '遣唐使',
  },
  {
    id: 'q4', eventId: 'kokufu',
    q: '宮中に仕え、『源氏物語』を書いた人物はだれか。',
    a: '紫式部',
  },
  {
    id: 'q5', eventId: 'sekkan',
    q: '藤原道長のころ全盛となった、天皇の外戚として実権をにぎる政治を何というか。',
    a: '摂関政治',
  },
  {
    id: 'q6', eventId: 'mappo',
    q: '藤原頼通が宇治に建てた、十円硬貨にも刻まれる阿弥陀堂を何というか。',
    a: '平等院鳳凰堂',
  },
  {
    id: 'q7', eventId: 'insei',
    q: '1086年に白河上皇がはじめた、位をゆずったのち上皇が行う政治を何というか。',
    a: '院政',
  },
  {
    id: 'q8', eventId: 'genpei',
    q: '1185年、壇ノ浦の戦いでほろびたのは何氏か。',
    a: '平氏',
  },
]

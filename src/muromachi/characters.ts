// 室町の京に生きる人々（位置は時間帯で移る）
export interface CharacterDef {
  id: string
  name: string
  figure: 'aruji' | 'nyobo' | 'hime' | 'warawa'
  robes: string[]        // 外→内の重ね色
  day: [number, number]
  evening: [number, number]
  scale: number
}

export const CHARACTERS: CharacterDef[] = [
  {
    // 同朋衆：将軍に仕え、芸能と美をつかさどる。阿弥号をもつ者たち。
    id: 'doboshu', name: '同朋衆', figure: 'aruji',
    robes: ['#3a3630', '#6a6258', '#c8bfa8'],
    day: [10.5, -3.4], evening: [4.0, 2.4], scale: 1.9,
  },
  {
    // 富子：将軍の御台所。政（まつりごと）にも銭にも通じた女人。日野富子のおもかげ。
    id: 'tomiko', name: '富子', figure: 'nyobo',
    robes: ['#7a2f3a', '#b5566a', '#d8b7c0', '#efe8d6'],
    day: [-3.6, -10], evening: [2.4, -8.4], scale: 1.72,
  },
  {
    // 京童：市や祭りのことを、なんでも知っている都の子。
    id: 'warabe', name: '京童', figure: 'warawa',
    robes: ['#5a6a3a', '#e7dcc0'],
    day: [-5.0, 6.5], evening: [-5.0, 6.5], scale: 1.26,
  },
]

// 湊（会合の町）に生きる人
export const MINATO_CHARACTERS: CharacterDef[] = [
  {
    // 会合衆：湊をみずから治める豪商。勘合貿易と町の自治を知る。
    id: 'egoshu', name: '会合衆', figure: 'aruji',
    robes: ['#2f3a3a', '#4a5a52', '#c8b888'],
    day: [7.6, 2.2], evening: [1.6, -1.6], scale: 1.72,
  },
]

export const ALL_CHARACTERS = [...CHARACTERS, ...MINATO_CHARACTERS]

export const charById = (id: string) => ALL_CHARACTERS.find(c => c.id === id)!
export const charPos = (c: CharacterDef, t: number): [number, number] =>
  t >= 0.62 ? c.evening : c.day

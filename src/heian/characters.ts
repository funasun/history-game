// 邸に暮らす人々（位置は時間帯で移る＝日課）
export interface CharacterDef {
  id: string
  name: string           // 会話での呼び名
  figure: 'aruji' | 'nyobo' | 'hime' | 'warawa'
  robes: string[]        // 外→内の重ね色
  day: [number, number]  // 昼の居場所 [x, z]
  evening: [number, number]
  scale: number
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'aruji', name: '殿', figure: 'aruji',
    robes: ['#4a4458', '#f2ecd9'],
    day: [-2, -8], evening: [-2, -8], scale: 1.9,
  },
  {
    id: 'kojiju', name: '小侍従', figure: 'nyobo',
    robes: ['#8a4a3e', '#c8a24b', '#e0cfa0', '#7a6fae', '#f2ecd9'],
    day: [0.5, -4.6], evening: [-4, -7], scale: 1.8,
  },
  {
    id: 'hagi', name: '萩の君', figure: 'hime',
    robes: ['#b05a8a', '#e0a0b8', '#f2ecd9', '#7a6fae'],
    day: [-9.5, 3.4], evening: [10, -7.5], scale: 1.55,
  },
  {
    id: 'kogiku', name: '小菊', figure: 'warawa',
    robes: ['#d88a3e', '#f2ecd9'],
    day: [8.5, -3.2], evening: [8.5, -3.2], scale: 1.25,
  },
]

// 都大路の人びと（市女・門守の翁・大路の童）。日がな同じ所に立つ
export const MIYAKO_CHARACTERS: CharacterDef[] = [
  {
    id: 'ichime', name: '市女', figure: 'nyobo',
    robes: ['#7a6a4a', '#a8946a', '#f2ecd9'],
    day: [11.5, 2.6], evening: [11.5, 2.6], scale: 1.7,
  },
  {
    id: 'okina', name: '翁', figure: 'aruji',
    robes: ['#6a6a62', '#f2ecd9'],
    day: [2.2, -24.5], evening: [2.2, -24.5], scale: 1.6,
  },
  {
    id: 'michiwara', name: '大路の童', figure: 'warawa',
    robes: ['#8a7a5a', '#f2ecd9'],
    day: [-3, 4], evening: [-3, 4], scale: 1.25,
  },
]

// 全員（会話や名前引きは場面をまたいで参照される）
export const ALL_CHARACTERS = [...CHARACTERS, ...MIYAKO_CHARACTERS]

export const charById = (id: string) => ALL_CHARACTERS.find(c => c.id === id)!
export const charPos = (c: CharacterDef, t: number): [number, number] =>
  t >= 0.62 ? c.evening : c.day

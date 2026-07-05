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

export const charById = (id: string) => CHARACTERS.find(c => c.id === id)!
export const charPos = (c: CharacterDef, t: number): [number, number] =>
  t >= 0.62 ? c.evening : c.day

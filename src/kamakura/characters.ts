// 鎌倉に生きる人々（位置は時間帯で移る）
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
    // 御家人：将軍に仕える武士。烏帽子に直垂。
    id: 'gokenin', name: '御家人', figure: 'aruji',
    robes: ['#3a4a5c', '#e7dcc0'],
    day: [11, -6], evening: [4.2, 2.2], scale: 1.95,
  },
  {
    // 尼御台：政（まつりごと）を見つめる女人。北条政子のおもかげ。
    id: 'amagozen', name: '尼御台', figure: 'nyobo',
    robes: ['#3b352e', '#5a5148', '#8a8070', '#e7dcc0'],
    day: [-3.5, -10], evening: [2.6, -8.6], scale: 1.7,
  },
  {
    // 浜の童：市や海のことを、なんでも知っている。
    id: 'warabe', name: '浜の童', figure: 'warawa',
    robes: ['#7a5a38', '#e7dcc0'],
    day: [-4.5, 7.5], evening: [-4.5, 7.5], scale: 1.25,
  },
]

export const charById = (id: string) => CHARACTERS.find(c => c.id === id)!
export const charPos = (c: CharacterDef, t: number): [number, number] =>
  t >= 0.62 ? c.evening : c.day

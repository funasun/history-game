// 秋の草花（図譜の対象）
export interface FlowerSpec {
  id: string
  kana: string          // 図譜に載る名（かな）
  petal: string         // 花の色
  accent: string        // 芯・実の色
  stem: string
  form: 'kiku' | 'bell' | 'dots' | 'plume' | 'spray' | 'maple'
}

export const FLOWERS: FlowerSpec[] = [
  { id: 'kiku',      kana: 'きく',       petal: '#f4efdd', accent: '#e0b83e', stem: '#5a7f5f', form: 'kiku' },
  { id: 'rindou',    kana: 'りんだう',   petal: '#5c5f9e', accent: '#3a3f7a', stem: '#4d6e52', form: 'bell' },
  { id: 'ominaeshi', kana: 'をみなへし', petal: '#e6c33e', accent: '#c9a52e', stem: '#6a8a58', form: 'dots' },
  { id: 'susuki',    kana: 'すすき',     petal: '#d8c49a', accent: '#c2a878', stem: '#a89a6a', form: 'plume' },
  { id: 'hagi',      kana: 'はぎ',       petal: '#b05a8a', accent: '#8a3e6a', stem: '#5a7a4a', form: 'spray' },
  { id: 'momiji',    kana: 'もみぢ',     petal: '#c7462e', accent: '#a83420', stem: '#6e5138', form: 'maple' },
]

export const flowerById = (id: string) => FLOWERS.find(f => f.id === id)!

// 庭のどこに生えるか（インスタンス）
export interface FlowerSpot { id: string; species: string; x: number; z: number }
export const FLOWER_SPOTS: FlowerSpot[] = [
  { id: 'kiku-a',      species: 'kiku',      x: -1.5, z: -2.2 },
  { id: 'kiku-b',      species: 'kiku',      x: 1.2,  z: -1.6 },
  { id: 'rindou-a',    species: 'rindou',    x: -12,  z: 1.5 },
  { id: 'rindou-b',    species: 'rindou',    x: -14.5,z: 5 },
  { id: 'ominaeshi-a', species: 'ominaeshi', x: 10,   z: 2 },
  { id: 'ominaeshi-b', species: 'ominaeshi', x: 12.5, z: 4.5 },
  { id: 'susuki-a',    species: 'susuki',    x: 7,    z: 9.5 },
  { id: 'hagi-a',      species: 'hagi',      x: -13,  z: 9 },
  { id: 'momiji-a',    species: 'momiji',    x: 16,   z: 9 },
  // 広がった外苑に咲く（歩けば見つかる）
  { id: 'kiku-c',      species: 'kiku',      x: -20,  z: -6 },
  { id: 'rindou-c',    species: 'rindou',    x: -21,  z: 10 },
  { id: 'hagi-b',      species: 'hagi',      x: -18,  z: 16 },
  { id: 'ominaeshi-c', species: 'ominaeshi', x: 18,   z: 8 },
  { id: 'susuki-b',    species: 'susuki',    x: 15,   z: 15 },
  { id: 'momiji-b',    species: 'momiji',    x: -3,   z: 17 },
  { id: 'kiku-d',      species: 'kiku',      x: 9,    z: 14.5 },
]

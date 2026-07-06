// 「時渡り草子」は日本史の時代をめぐるシリーズ。篇はこれからも増えてゆく。
// いまは平安篇のみ遊べる（available）。ほかは近日。
export interface Era {
  id: string
  name: string      // 時代名（例：平安）
  year: string      // はじまりの目安（年表用）
  volume?: string   // 篇の名（遊べる巻のみ）
  available: boolean
}

export const ERAS: Era[] = [
  { id: 'jomon',    name: '縄文',     year: '前14000', available: false },
  { id: 'yayoi',    name: '弥生',     year: '前4世紀', available: false },
  { id: 'kofun',    name: '古墳',     year: '3世紀',   available: false },
  { id: 'asuka',    name: '飛鳥',     year: '592',     available: false },
  { id: 'nara',     name: '奈良',     year: '710',     available: false },
  { id: 'heian',    name: '平安',     year: '794',     volume: '平安篇', available: true },
  { id: 'kamakura', name: '鎌倉',     year: '1185',    available: false },
  { id: 'muromachi',name: '室町',     year: '1336',    available: false },
  { id: 'sengoku',  name: '戦国',     year: '1467',    available: false },
  { id: 'azuchi',   name: '安土桃山', year: '1573',    available: false },
  { id: 'edo',      name: '江戸',     year: '1603',    available: false },
  { id: 'meiji',    name: '明治',     year: '1868',    available: false },
]

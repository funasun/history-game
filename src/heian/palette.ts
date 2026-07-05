// 岩絵具パレット（平安データセット）
export const P = {
  gofun: '#f2ecd9',   // 胡粉
  sumi: '#2a241e',    // 墨
  shu: '#c73e3a',     // 朱
  kin: '#c8a24b',     // 金泥
  rokusho: '#5a7f5f', // 緑青
  gunjo: '#3a5a8c',   // 群青
  kuchiba: '#a8683a', // 朽葉
  yamabuki: '#e0a63e',// 山吹
  kikyo: '#7a6fae',   // 桔梗
  sand: '#e6dcc2',    // 南庭の白砂
  wood: '#9c7a52',    // 簀子
  woodDark: '#6e5138',// 母屋の床
  water: '#6f8fae',   // 池
}

// 時刻 t(0..1) → 空・地の色（暁→朝→昼→夕→宵）
const KEYS: [number, string, string][] = [
  // t, 空, 画面ティント(multiply)
  [0.00, '#cfc0c8', '#dcd0dc'],
  [0.18, '#e9e2ce', '#ffffff'],
  [0.45, '#ece6d2', '#ffffff'],
  [0.62, '#dfa678', '#f0c9a0'],
  [0.75, '#8a7a92', '#b9a9c9'],
  [0.90, '#3a4260', '#7d88b5'],
  [1.00, '#2c3350', '#6b76a6'],
]

function hexLerp(a: string, b: string, k: number): string {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16))
  const pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16))
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * k))
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('')
}

export function skyColor(t: number): string { return sample(t, 1) }
export function tintColor(t: number): string { return sample(t, 2) }

function sample(t: number, idx: 1 | 2): string {
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [t0] = KEYS[i]
    const [t1] = KEYS[i + 1]
    if (t >= t0 && t <= t1) {
      const k = (t - t0) / (t1 - t0)
      return hexLerp(KEYS[i][idx], KEYS[i + 1][idx], k)
    }
  }
  return KEYS[KEYS.length - 1][idx]
}

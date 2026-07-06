// 岩絵具パレット（鎌倉データセット）：武家の都、質実で海ぞいの色
export const P = {
  gofun: '#efe8d6',    // 胡粉
  sumi: '#2a241e',     // 墨
  shu: '#b23a2b',      // 朱（八幡宮・鳥居）やや渋い
  kin: '#b7902f',      // 金
  bronze: '#6f8074',   // 青銅（大仏の緑青）
  bronzeDark: '#586a5f',
  matsu: '#3f5c46',    // 松の緑
  hill: '#47603f',     // 囲む山
  hillDark: '#39502f',
  sea: '#4f6f88',      // 相模の海
  seaFoam: '#89a3b4',  // 波がしら
  sand: '#d8cca8',     // 浜・大路の土
  earth: '#a89a76',    // 地面
  wood: '#7d6144',     // 板
  woodDark: '#553f28', // 梁
  roof: '#4a4038',     // 板葺の屋根
  ishi: '#9a958a',     // 石段・礎石
  tetsu: '#3b3a38',    // 鉄・甲冑
}

// 時刻 t(0..1) → 空・画面ティント（暁→朝→昼→夕→宵）。海ぞいゆえ、やや青みを強く。
const KEYS: [number, string, string][] = [
  [0.00, '#c3c2cc', '#d6d4dc'],
  [0.18, '#dfe0d6', '#ffffff'],
  [0.45, '#e2e2d2', '#ffffff'],
  [0.62, '#d69a72', '#eec39a'],
  [0.75, '#7f7690', '#b1a6c2'],
  [0.90, '#333a58', '#77839f'],
  [1.00, '#262c48', '#656f92'],
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

// 岩絵具パレット（室町データセット）：将軍の都、金と銀・雅と禅がとけあう色
export const P = {
  gofun: '#efe8d6',    // 胡粉
  sumi: '#2a241e',     // 墨
  shu: '#c0392f',      // 朱（社殿・柱）
  kin: '#d4a72c',      // 金（金閣）
  kinDeep: '#b0842a',
  gin: '#c8ccd0',      // 銀（銀閣）
  ginDeep: '#a7abb0',
  matsu: '#3f5c46',    // 松の緑
  hill: '#4a6340',     // 囲む山（東山・北山）
  hillDark: '#3a4f30',
  kawa: '#5f7f92',     // 鴨川・淀
  kawaFoam: '#93aab8', // 瀬がしら
  sand: '#d3c8a6',     // 大路の土
  earth: '#a89a76',    // 地面
  wood: '#7d6144',     // 板・柱
  woodDark: '#553f28', // 梁
  roof: '#6b5a44',     // 檜皮葺の屋根
  tile: '#6a6e70',     // 瓦
  ishi: '#9a958a',     // 石段・礎石・白砂
  tetsu: '#3b3a38',    // 鉄・甲冑
}

// 時刻 t(0..1) → 空・画面ティント（暁→朝→昼→夕→宵）。内陸ゆえ、やや暖かく。
const KEYS: [number, string, string][] = [
  [0.00, '#c6c2c0', '#dad4d0'],
  [0.18, '#e2ded0', '#ffffff'],
  [0.45, '#e6e2cf', '#ffffff'],
  [0.62, '#dca06e', '#f0c79a'],
  [0.75, '#84788c', '#b4a7bf'],
  [0.90, '#37395a', '#79809c'],
  [1.00, '#282c46', '#67708f'],
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

// 湊（みなと）：会合衆がみずから治める、自治の港町。京から川をくだった先。
// 北は海——沖に勘合船が浮かび、明・琉球とむすぶ。堀と塀にかこまれ、市がたち、
// 蔵（土倉）がならぶ。教科書の「町衆の自治」「勘合貿易」「土一揆」を歩ける場に。
import * as THREE from 'three'
import { fbm, valueNoise, smoothstep, rectDist, type Rect } from '../engine/procedural'
import type { TreeDef, HillDef } from './layout'

// 遊べる境界（三方の陸と、北の海のあいだ）
export const MINATO_BOUNDS = { minX: -15, maxX: 15, minZ: -12, maxZ: 12 }

// 京からの入り（東の陸門を抜けた口）
export const MINATO_SPAWN: [number, number] = [11.5, 8]

// 北の海（波打ちぎわの先＝入れない）。汀線はこの z より北
export const SHORE_Z = -9.5

// 会合所（町衆の寄合の館）と、蔵（土倉——金貸し）
export const KAIGOSHO = { x0: -10.5, x1: -5.5, z0: -7.5, z1: -4.2 }
export const KURA = { x0: 6.0, x1: 9.2, z0: -6.5, z1: -3.3 }

export const MINATO_TREES: TreeDef[] = [
  { x: -13, z: 3, kind: 'pine', s: 1.2 },
  { x: 13, z: 1.5, kind: 'pine', s: 1.2 },
  { x: -8, z: 10.5, kind: 'maple', s: 1.0 },
  { x: 9.5, z: 10.5, kind: 'pine', s: 1.15 },
  { x: 0, z: 11, kind: 'pine', s: 1.1 },
]

// 入れない矩形：北の海・会合所・蔵
const RECTS: { x0: number; x1: number; z0: number; z1: number }[] = [
  { x0: MINATO_BOUNDS.minX, x1: MINATO_BOUNDS.maxX, z0: MINATO_BOUNDS.minZ, z1: SHORE_Z }, // 海
  KAIGOSHO,
  KURA,
]

export function minatoBlocked(x: number, z: number): boolean {
  if (x < MINATO_BOUNDS.minX || x > MINATO_BOUNDS.maxX || z < MINATO_BOUNDS.minZ || z > MINATO_BOUNDS.maxZ) return true
  for (const b of RECTS) {
    if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1) return true
  }
  return false
}

// 湊は平らな地面（段差は歩かない）
export function minatoGroundY(_x: number, _z: number): number {
  return 0
}

// ---------- 地形：東西南を陸に、北を海にひらく港 ----------
const MGROUND_Y = -0.02
const MPLAY: Rect = { x0: MINATO_BOUNDS.minX, x1: MINATO_BOUNDS.maxX, z0: SHORE_Z, z1: MINATO_BOUNDS.maxZ }

// 山（丘）は東西を主に。北は海へ、南は淀（川）の口へひらく。
// カメラは player の 18 ほど後ろに退く（縦画面ではさらに）。山が近すぎると
// 引いたカメラが尾根の裏へまわり、盆地が緑の壁でふさがれる。京と同じく、
// 囲む山は遠くへ置き、南はあけて引きしろをつくる。
const MHILLS: HillDef[] = [
  // 東西の山（港をかこむ。迫らせぬよう遠くへ引く）
  { x: -25, z: -3, r: 10, h: 7 },
  { x: -26, z: 8, r: 10, h: 6.5 },
  { x: 25, z: -3, r: 10, h: 7 },
  { x: 26, z: 8, r: 10, h: 6.5 },
  // 南は川口へひらく——低い丘を隅に置くだけ（中央はあけ、カメラの引きしろに）
  { x: -21, z: 27, r: 9, h: 4 },
  { x: 21, z: 27, r: 9, h: 4 },
]

export function minatoRelief(x: number, z: number): number {
  const d = rectDist(x, z, MPLAY)
  const edge = d
    + (fbm(x * 0.22 + 5.1, z * 0.22 + 3.7, 2) - 0.5) * 2.0
    + (valueNoise(x * 0.85 + 2.3, z * 0.85 + 8.1) - 0.5) * 1.1
  const pad = smoothstep(1.8, 6.5, edge)
  let h = 0
  if (pad > 0) {
    const ridge = 0.78 + fbm(x * 0.07 + 6.6, z * 0.07 + 1.4, 3) * 0.5
    let hills = 0
    for (const hill of MHILLS) {
      const dx = x - hill.x, dz = z - hill.z
      hills += hill.h * Math.exp(-(dx * dx + dz * dz) / (hill.r * hill.r * 0.5)) * ridge
    }
    // 陸側のうねり（海側にはつくらない）
    h += smoothstep(2, 12, d) * 1.4 * (0.3 + fbm(x * 0.035 + 3.9, z * 0.035 + 7.2, 3) * 1.3)
      * smoothstep(SHORE_Z, SHORE_Z + 6, z)
    h += hills * smoothstep(SHORE_Z, SHORE_Z + 4, z)
    h *= pad
  }
  // 北の海：汀線から海底へ。線を fbm で蛇行させて規則的な鋸歯を崩す
  const coast = (fbm(x * 0.08 + 4.4, 6.6, 3) - 0.5) * 3.6 * smoothstep(9, 15, Math.abs(x))
  h -= 2.6 * smoothstep(SHORE_Z + 0.7 + coast, SHORE_Z - 6 + coast, z)
  return MGROUND_Y + h
}

const M_SOIL_A = new THREE.Color('#a3966f')
const M_SOIL_B = new THREE.Color('#968a64')
const M_SAND_A = new THREE.Color('#d3c8a6')
const M_SAND_B = new THREE.Color('#c8bc98')
const M_GRASS_A = new THREE.Color('#7c8b57')
const M_GRASS_B = new THREE.Color('#6f8250')
const M_HILL = new THREE.Color('#4a6340')
const M_HILL_DK = new THREE.Color('#3a4f30')
const M_ROCK = new THREE.Color('#7b776a')
const M_BED_SHALLOW = new THREE.Color('#a89f80')
const M_BED_DEEP = new THREE.Color('#55684f')
const scratch = new THREE.Color()

export function minatoGroundColor(x: number, z: number, y: number, ny: number, out: THREE.Color): void {
  const d = rectDist(x, z, MPLAY)
  // 港町の土
  out.copy(M_SOIL_A).lerp(M_SOIL_B, valueNoise(x * 0.13 + 1.9, z * 0.13 + 7.3))
  // 山裾の草
  const g = smoothstep(1, 6, d)
  if (g > 0) out.lerp(scratch.copy(M_GRASS_A).lerp(M_GRASS_B, valueNoise(x * 0.1 + 4.2, z * 0.1 + 2.6)), g)
  // 高くなるほど山の緑、尾根は深く
  const h1 = smoothstep(0.8, 3.2, y)
  if (h1 > 0) out.lerp(M_HILL, h1)
  const h2 = smoothstep(3.6, 7, y)
  if (h2 > 0) out.lerp(M_HILL_DK, h2)
  // 険しい面は岩肌
  const rk = smoothstep(0.66, 0.5, ny) * smoothstep(0.7, 1.6, y)
  if (rk > 0) out.lerp(M_ROCK, rk * 0.55)
  // 汀の砂——南北（z）と高さ（y）の両方で溶かし込む
  const sandLine = z + (valueNoise(x * 0.3 + 3.1, z * 0.3 + 5.5) - 0.5) * 2.4
  const sandEdge = y + (valueNoise(x * 0.55 + 7.7, z * 0.55 + 1.1) - 0.5) * 0.9
  const sand = smoothstep(SHORE_Z + 4, SHORE_Z + 0.4, sandLine) * smoothstep(1.5, 0.12, sandEdge)
  if (sand > 0) out.lerp(scratch.copy(M_SAND_A).lerp(M_SAND_B, valueNoise(x * 0.2 + 2.8, z * 0.2 + 4.1)), sand)
  // 水の下：浅瀬の砂からゆっくり海底の色へ
  const uw = smoothstep(-0.12, -0.5, y)
  if (uw > 0) out.lerp(scratch.copy(M_BED_SHALLOW).lerp(M_BED_DEEP, smoothstep(-0.3, -2.6, y)), uw)
}

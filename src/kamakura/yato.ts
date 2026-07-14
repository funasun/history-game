// 谷戸（やと）の地割りと地形。切通しのむこう、山あいの谷に武士の館が立つ。
// 教科書の「武士の館」の絵——堀と塀、母屋、的場（流鏑馬）、二毛作の田——を
// 歩ける場所として立てる。文字ではなく、暮らしのかたちで見せる。
import * as THREE from 'three'
import { fbm, valueNoise, smoothstep, rectDist, type Rect } from '../engine/procedural'
import type { TreeDef, HillDef } from './layout'

// 遊べる境界（三方の山と、東の切通しのあいだ）
export const YATO_BOUNDS = { minX: -16, maxX: 16, minZ: -14, maxZ: 14 }

// 浜からの入り（切通しを抜けた東の口）
export const YATO_SPAWN: [number, number] = [13.5, 2]

// 武士の館：母屋・板塀・堀。南にひとつだけ口（門と橋）をあける
export const HALL = { x0: -2.6, x1: 2.6, z0: -10.0, z1: -6.6 }
export const FENCE = { x0: -5.2, x1: 5.2, z0: -11.6, z1: -4.2, gap: 0.9 }   // 南の門は |x|<gap
export const MOAT = { x0: -6.9, x1: 6.9, z0: -13.2, z1: -2.3, w: 1.0, gap: 1.0 } // 橋は |x|<gap

// 厩の囲い（馬が草を食む）
export const PEN = { x0: -6, x1: -3, z0: 3, z1: 6 }

// 二毛作の田（霜月＝米を刈ったあとの麦の季節）。径（z≈2）の南に広がる
export const PADDY = { x0: 5.0, x1: 11.7, z0: 3.4, z1: 8.6 }

// 的場（流鏑馬の馬場と、三つの的）
export const BABA = { x: -10, z0: -8, z1: 8 }
export const MATO: [number, number][] = [[-11.5, -4], [-11.5, 0.5], [-11.5, 5]]

export const YATO_TREES: TreeDef[] = [
  { x: -13.5, z: -11, kind: 'pine', s: 1.2 },
  { x: -14, z: 8.5, kind: 'pine', s: 1.25 },
  { x: 2.5, z: -0.8, kind: 'pine', s: 1.1 },
  { x: -1.5, z: 8.5, kind: 'maple', s: 1.05 },
  { x: 12.5, z: 9.5, kind: 'pine', s: 1.15 },
  { x: 12.8, z: -4, kind: 'maple', s: 1.1 },
  { x: 8, z: -7, kind: 'pine', s: 1.2 },
  { x: -9, z: 11.5, kind: 'maple', s: 1.0 },
]

// 入れない矩形：母屋・板塀（南は門の口）・堀（南は橋の分）・厩の囲い
const RECTS: { x0: number; x1: number; z0: number; z1: number }[] = [
  HALL,
  { x0: FENCE.x0, x1: FENCE.x1, z0: FENCE.z0 - 0.15, z1: FENCE.z0 + 0.15 },   // 塀・北
  { x0: FENCE.x0 - 0.15, x1: FENCE.x0 + 0.15, z0: FENCE.z0, z1: FENCE.z1 },   // 塀・西
  { x0: FENCE.x1 - 0.15, x1: FENCE.x1 + 0.15, z0: FENCE.z0, z1: FENCE.z1 },   // 塀・東
  { x0: FENCE.x0, x1: -FENCE.gap, z0: FENCE.z1 - 0.15, z1: FENCE.z1 + 0.15 }, // 塀・南西
  { x0: FENCE.gap, x1: FENCE.x1, z0: FENCE.z1 - 0.15, z1: FENCE.z1 + 0.15 },  // 塀・南東
  { x0: MOAT.x0, x1: MOAT.x1, z0: MOAT.z0, z1: MOAT.z0 + MOAT.w },            // 堀・北
  { x0: MOAT.x0, x1: MOAT.x0 + MOAT.w, z0: MOAT.z0, z1: MOAT.z1 },            // 堀・西
  { x0: MOAT.x1 - MOAT.w, x1: MOAT.x1, z0: MOAT.z0, z1: MOAT.z1 },            // 堀・東
  { x0: MOAT.x0, x1: -MOAT.gap, z0: MOAT.z1 - MOAT.w, z1: MOAT.z1 },          // 堀・南西
  { x0: MOAT.gap, x1: MOAT.x1, z0: MOAT.z1 - MOAT.w, z1: MOAT.z1 },           // 堀・南東
  PEN,
]

export function yatoBlocked(x: number, z: number): boolean {
  if (x < YATO_BOUNDS.minX || x > YATO_BOUNDS.maxX || z < YATO_BOUNDS.minZ || z > YATO_BOUNDS.maxZ) return true
  for (const b of RECTS) {
    if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1) return true
  }
  return false
}

// 谷戸は平らな谷底（段差は歩かない）
export function yatoGroundY(_x: number, _z: number): number {
  return 0
}

// ---------- 地形：三方を山にかこまれた谷。東にだけ切通しの切れ込み ----------
const YGROUND_Y = -0.02
const YPLAY: Rect = { x0: YATO_BOUNDS.minX, x1: YATO_BOUNDS.maxX, z0: YATO_BOUNDS.minZ, z1: YATO_BOUNDS.maxZ }

const YHILLS: HillDef[] = [
  { x: -21, z: -8, r: 9, h: 7 },
  { x: -22, z: 4, r: 10, h: 8 },
  { x: -18, z: 13, r: 8, h: 6 },
  { x: 21, z: -9, r: 9, h: 7 },
  { x: 22, z: 10, r: 9, h: 6.5 },
  { x: -8, z: -20, r: 10, h: 8 },
  { x: 8, z: -20, r: 10, h: 8 },
  { x: 0, z: -23, r: 12, h: 9 },
  { x: -6, z: 20, r: 10, h: 7 },
  { x: 8, z: 20, r: 10, h: 7 },
  { x: 0, z: 23, r: 12, h: 8 },
]

export function yatoRelief(x: number, z: number): number {
  const d = rectDist(x, z, YPLAY)
  // 縁のノイズ二段——立ちあがりの人工的な鋸歯を消す（浜とおなじ手当て）
  const edge = d
    + (fbm(x * 0.22 + 2.7, z * 0.22 + 6.1, 2) - 0.5) * 2.0
    + (valueNoise(x * 0.85 + 5.5, z * 0.85 + 9.9) - 0.5) * 1.1
  const pad = smoothstep(1.8, 6.5, edge)
  let h = 0
  if (pad > 0) {
    const ridge = 0.78 + fbm(x * 0.07 + 7.3, z * 0.07 + 2.9, 3) * 0.5
    let hills = 0
    for (const hill of YHILLS) {
      const dx = x - hill.x, dz = z - hill.z
      hills += hill.h * Math.exp(-(dx * dx + dz * dz) / (hill.r * hill.r * 0.5)) * ridge
    }
    h += smoothstep(2, 12, d) * 1.5 * (0.3 + fbm(x * 0.035 + 6.2, z * 0.035 + 1.8, 3) * 1.3)
    h += hills
    h *= pad
  }
  // 東の切通し：峠をうがつ低い切れ込み（浜への口。門は x=15, z=2）
  h *= 1 - 0.9 * Math.exp(-((x - 20) ** 2) / 110 - ((z - 2) ** 2) / 9)
  return YGROUND_Y + h
}

const Y_SOIL_A = new THREE.Color('#a3966f')
const Y_SOIL_B = new THREE.Color('#968a64')
const Y_GRASS_A = new THREE.Color('#7c8b57')
const Y_GRASS_B = new THREE.Color('#6f8250')
const Y_HILL = new THREE.Color('#47603f')
const Y_HILL_DK = new THREE.Color('#39502f')
const Y_ROCK = new THREE.Color('#7b776a')
const scratch = new THREE.Color()

export function yatoGroundColor(x: number, z: number, y: number, ny: number, out: THREE.Color): void {
  const d = rectDist(x, z, YPLAY)
  // 谷底の土。ところどころに草の斑（浜より、いくぶん青い谷）
  out.copy(Y_SOIL_A).lerp(Y_SOIL_B, valueNoise(x * 0.13 + 2.2, z * 0.13 + 8.5))
  const gg = smoothstep(0.5, 0.82, valueNoise(x * 0.11 + 5.1, z * 0.11 + 3.9)) * 0.45
  if (gg > 0) out.lerp(scratch.copy(Y_GRASS_A).lerp(Y_GRASS_B, valueNoise(x * 0.1 + 9.4, z * 0.1 + 1.2)), gg)
  // 山裾の草、松の山、尾根、岩肌（浜とおなじ流儀）
  const g = smoothstep(1, 6, d)
  if (g > 0) out.lerp(scratch.copy(Y_GRASS_A).lerp(Y_GRASS_B, valueNoise(x * 0.1 + 1.7, z * 0.1 + 6.3)), g)
  const h1 = smoothstep(0.8, 3.2, y)
  if (h1 > 0) out.lerp(Y_HILL, h1)
  const h2 = smoothstep(3.6, 7, y)
  if (h2 > 0) out.lerp(Y_HILL_DK, h2)
  const rk = smoothstep(0.66, 0.5, ny) * smoothstep(0.7, 1.6, y)
  if (rk > 0) out.lerp(Y_ROCK, rk * 0.55)
}

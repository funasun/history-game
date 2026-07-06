// 寝殿造の間取り（データ駆動：時代差し替え層）
import { P } from './palette'

export interface FloorDef { x: number; z: number; w: number; d: number; h: number; color: string }
export interface TreeDef { x: number; z: number; kind: 'maple' | 'pine'; s: number }

// 床（寝殿・対屋・渡殿）。y=0が地面、hは床の高さ
export const FLOORS: FloorDef[] = [
  { x: -2, z: -8,   w: 12,  d: 8,   h: 0.35, color: P.wood },     // 寝殿（簀子含む）
  { x: -2, z: -8.4, w: 8,   d: 5,   h: 0.42, color: P.woodDark }, // 母屋
  { x: 11, z: -8,   w: 7,   d: 7,   h: 0.35, color: P.wood },     // 東の対
  { x: 11, z: -8.4, w: 4.4, d: 4.2, h: 0.42, color: P.woodDark },
  { x: 6,  z: -8,   w: 3,   d: 2.4, h: 0.35, color: '#8a6a46' },  // 渡殿
]

// 柱（床の縁に立てる）
export const PILLARS: [number, number][] = [
  [-7.6, -11.6], [-4, -11.6], [-2, -11.6], [1, -11.6], [3.6, -11.6],
  [-7.6, -4.4], [-4, -4.4], [-2, -4.4], [1, -4.4], [3.6, -4.4],
  [-7.6, -8], [3.6, -8],
  [7.8, -11.2], [14.2, -11.2], [7.8, -4.8], [14.2, -4.8],
]

// 御簾（北側に下がる簾）
export const MISU: { x: number; z: number; w: number }[] = [
  { x: -5, z: -11.5, w: 3.4 }, { x: -1, z: -11.5, w: 3.4 }, { x: 2.6, z: -11.5, w: 3 },
  { x: 11, z: -11.1, w: 3.6 },
]

// 池（楕円）・中島
export const POND = { x: -3, z: 8, rx: 8.5, rz: 4.2 }
export const ISLAND = { x: -4.5, z: 8.5, r: 1.7 }

// 遣水（北東から池へ）
export const STREAM: { x: number; z: number; w: number; len: number; rot: number }[] = [
  { x: 13, z: -1, w: 0.9, len: 7, rot: 0.5 },
  { x: 9,  z: 2.5, w: 0.9, len: 6, rot: 0.9 },
  { x: 5,  z: 5.5, w: 0.9, len: 5, rot: 1.15 },
]

// 木々（築地塀ぞい）
export const TREES: TreeDef[] = [
  { x: -17, z: -10, kind: 'pine', s: 1.2 },
  { x: -16.5, z: -2, kind: 'maple', s: 1.1 },
  { x: -17, z: 6, kind: 'maple', s: 1.3 },
  { x: 17, z: -1, kind: 'maple', s: 1.2 },
  { x: 16, z: 9, kind: 'maple', s: 1.4 },
  { x: 17.5, z: -11, kind: 'pine', s: 1.3 },
  { x: -12, z: 12, kind: 'pine', s: 1.0 },
  { x: 6, z: 12.5, kind: 'maple', s: 1.1 },
  // 広がった外苑（築地塀ぞい）
  { x: -23, z: -8, kind: 'pine', s: 1.4 },
  { x: -23, z: 3, kind: 'maple', s: 1.2 },
  { x: -22.5, z: 13, kind: 'maple', s: 1.3 },
  { x: 23, z: -9, kind: 'pine', s: 1.4 },
  { x: 23.5, z: 8, kind: 'maple', s: 1.2 },
  { x: 24, z: 15, kind: 'maple', s: 1.1 },
  { x: -16, z: 17, kind: 'maple', s: 1.2 },
  { x: -6, z: 17.5, kind: 'pine', s: 1.2 },
  { x: 13, z: 17.5, kind: 'maple', s: 1.3 },
  { x: 10, z: 13, kind: 'maple', s: 1.0 },
]

// 築地塀（内側の遊び場の境界）：都をあるく心地になるよう、南と東西へ広げた
export const BOUNDS = { minX: -25, maxX: 25, minZ: -14, maxZ: 19 }

// 南庭の白砂（寝殿と池のあいだの、儀式と遊びの庭）。境界いっぱいではなく中央の矩形
export const SAND = { x: 2, z: -0.3, w: 26, d: 7.6 }

// 褥（眠る場所：寝殿の西）と几帳
export const BED = { x: -5.5, z: -8.5 }
export const KICHO = [
  { x: -7.2, z: -8.5, rot: Math.PI / 2 },
  { x: -5.5, z: -10.2, rot: 0 },
]

// 移動できない場所（池・床の外周は乗れる）
export function blocked(x: number, z: number): boolean {
  if (x < BOUNDS.minX || x > BOUNDS.maxX || z < BOUNDS.minZ || z > BOUNDS.maxZ) return true
  const dx = (x - POND.x) / POND.rx
  const dz = (z - POND.z) / POND.rz
  if (dx * dx + dz * dz < 1) {
    const ix = x - ISLAND.x, iz = z - ISLAND.z
    if (ix * ix + iz * iz > ISLAND.r * ISLAND.r) return true
  }
  return false
}

// その地点の床の高さ（床の上に乗る）
export function groundY(x: number, z: number): number {
  for (const f of FLOORS) {
    if (Math.abs(x - f.x) <= f.w / 2 && Math.abs(z - f.z) <= f.d / 2) return f.h
  }
  return 0
}

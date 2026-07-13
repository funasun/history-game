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

// 反橋（北の岸から中島へ）。渡れる帯と、そのふくらみ
export const BRIDGE = { x0: -5.1, x1: -3.9, z0: 3.6, z1: 7.0, rise: 0.55 }
export function bridgeY(z: number): number {
  const k = (z - BRIDGE.z0) / (BRIDGE.z1 - BRIDGE.z0)
  return BRIDGE.rise * Math.sin(Math.PI * Math.min(1, Math.max(0, k)))
}

// 庭の石灯籠（見た目と当たりの共通の芯）
export const LANTERNS: [number, number][] = [
  [7.2, 6.8],
  [-7.6, 2.0],
]

// 阿弥陀堂の土台（角ばった建物は円ではなく矩形で実寸に塞ぐ）。
// world.tsx の base[6.4,0.4,3.2]@[-9,_,14] に合わせ、南面 z=12.3 は接近点(z=11.4)より北に残す。
export const HALL_RECT = { x0: -12.3, x1: -5.7, z0: 12.3, z1: 15.7 }

// 遣水（東の築地塀の下をくぐって庭に入り、白砂のきわを縫って池へそそぐ）。
// かつては三枚の板を別々に置いていて、曲がり角で川が切れて見えた——
// いまは折れ線の芯だけを持ち、見た目は world.tsx が一本のリボンに張る。
// 起点は東山の裾（起伏が y=0.015 を越える先まで遡らせ、丘にもぐって消える体）、
// 終点は池の水面の下（もぐって合流）。空からの俯瞰でも切り口が見えない
export const STREAM_W = 0.9
export const STREAM_PATH: { x: number; z: number }[] = [
  { x: 35, z: -11 },
  { x: 31, z: -9.3 },
  { x: 27, z: -7.6 },
  { x: 21.5, z: -5.2 },
  { x: 16, z: -2.7 },
  { x: 12.6, z: -0.6 },
  { x: 10.4, z: 0.5 },
  { x: 8.6, z: 2.2 },
  { x: 7.6, z: 3.4 },
  { x: 6.2, z: 4.6 },
  { x: 4.6, z: 6.2 },
  { x: 3.2, z: 7.9 },
]

// 木々（築地塀ぞい）
export const TREES: TreeDef[] = [
  { x: -17, z: -10, kind: 'pine', s: 1.2 },
  { x: -16.5, z: -2, kind: 'maple', s: 1.1 },
  { x: -17, z: 6, kind: 'maple', s: 1.3 },
  { x: 17, z: -1, kind: 'maple', s: 1.2 },
  { x: 16, z: 9, kind: 'maple', s: 1.4 },
  { x: 17.5, z: -11, kind: 'pine', s: 1.3 },
  { x: -15.5, z: 11, kind: 'pine', s: 1.0 },  // 阿弥陀堂の西どなり（御堂に枝がかからぬよう離す）
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

const onBridge = (x: number, z: number) =>
  x > BRIDGE.x0 && x < BRIDGE.x1 && z > BRIDGE.z0 && z < BRIDGE.z1

// 移動できない場所（池・床の外周は乗れる。反橋の上は渡れる）
export function blocked(x: number, z: number): boolean {
  if (x < BOUNDS.minX || x > BOUNDS.maxX || z < BOUNDS.minZ || z > BOUNDS.maxZ) return true
  // 阿弥陀堂の土台（矩形）
  if (x > HALL_RECT.x0 && x < HALL_RECT.x1 && z > HALL_RECT.z0 && z < HALL_RECT.z1) return true
  const dx = (x - POND.x) / POND.rx
  const dz = (z - POND.z) / POND.rz
  if (dx * dx + dz * dz < 1) {
    if (onBridge(x, z)) return false
    const ix = x - ISLAND.x, iz = z - ISLAND.z
    if (ix * ix + iz * iz > ISLAND.r * ISLAND.r) return true
  }
  return false
}

// その地点の床の高さ（床の上に乗る。反橋はふくらみに沿う）
export function groundY(x: number, z: number): number {
  for (const f of FLOORS) {
    if (Math.abs(x - f.x) <= f.w / 2 && Math.abs(z - f.z) <= f.d / 2) return f.h
  }
  if (onBridge(x, z)) return bridgeY(z)
  return 0
}

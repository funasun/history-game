// 都大路（朱雀大路）の間取り。邸の門を出た先の、もうひとつの場面。
// 奥（-z）が都の南＝羅城門。手前（+z）が北の住まいの区。東寺の塔と東の市は東側。
import type { TreeDef } from './layout'
import type { Circle } from '../game/solids'

export const MIYAKO_BOUNDS = { minX: -16, maxX: 16, minZ: -34, maxZ: 20 }

// 朱雀大路の路面（この帯だけ土の色がかわる）
export const ROAD = { x0: -7, x1: 7 }

// これより南は羅城門のきわ。門はくぐれない（都の外は、また別の物語）
export const RAJO_Z = -28.8

// 板屋の列（矩形で塞ぐ）。市の広場・塔の空き地・邸への小路はあけてある
export interface HouseRow { x0: number; x1: number; z0: number; z1: number }
export const HOUSES: HouseRow[] = [
  // 西側
  { x0: -15, x1: -8.5, z0: -26, z1: -22 },
  { x0: -15, x1: -8.5, z0: -15, z1: -11 },
  { x0: -15, x1: -8.5, z0: -4, z1: 0 },
  { x0: -15, x1: -8.5, z0: 8, z1: 12 },
  // 東側（塔の空き地 z∈[-23,-11]・市の広場 z∈[-7,5.5]・門前 z>9 はあける）
  { x0: 8.5, x1: 15, z0: -27, z1: -23 },
  { x0: 8.5, x1: 15, z0: -11, z1: -7 },
  { x0: 8.5, x1: 15, z0: 5.5, z1: 9 },
]

// 大路ぞいの並木と、空き地の木
export const MIYAKO_TREES: TreeDef[] = [
  { x: -7.9, z: -25, kind: 'maple', s: 1.1 },
  { x: 7.9, z: -21, kind: 'pine', s: 1.2 },
  { x: -7.9, z: -13, kind: 'pine', s: 1.15 },
  { x: 7.9, z: -13.5, kind: 'maple', s: 1.1 },
  { x: -7.9, z: -2, kind: 'maple', s: 1.2 },
  { x: 7.9, z: -5.6, kind: 'pine', s: 1.05 },
  { x: -7.9, z: 9, kind: 'pine', s: 1.1 },
  { x: 7.9, z: 10.5, kind: 'maple', s: 1.25 },
  { x: -7.9, z: 16.5, kind: 'maple', s: 1.15 },
  { x: -12, z: -19, kind: 'maple', s: 1.3 },
  { x: 14.5, z: -13.8, kind: 'pine', s: 1.2 },
  { x: -11, z: 18, kind: 'pine', s: 1.3 },
  { x: 13.5, z: 17.5, kind: 'maple', s: 1.2 },
]

// 駐めてある牛車（見た目と当たりの共通の芯）
export const PARKED_CART = { x: -10.5, z: 4 }

// 市の店の台など、実寸で塞ぎたい小物
export const MIYAKO_EXTRA_SOLIDS: Circle[] = [
  { x: 12.5, z: 0, r: 0.95 },    // 市の中店（唐物の棚）
  { x: 13.2, z: -2.3, r: 0.85 }, // 絹の店
  { x: 13.2, z: 2.5, r: 0.85 },  // 干し魚の店
  { x: PARKED_CART.x, z: PARKED_CART.z, r: 1.3 },
]

// 邸の築地塀（門の左右）。worldMiyako の壁の見た目と揃えて実寸で塞ぐ
const WALLS: HouseRow[] = [
  { x0: 6.6, x1: 8.8, z0: 16.1, z1: 16.7 },
  { x0: 11.2, x1: 16, z0: 16.1, z1: 16.7 },
]

export function miyakoBlocked(x: number, z: number): boolean {
  const B = MIYAKO_BOUNDS
  if (x < B.minX || x > B.maxX || z < B.minZ || z > B.maxZ) return true
  if (z < RAJO_Z) return true
  for (const h of HOUSES) {
    if (x > h.x0 && x < h.x1 && z > h.z0 && z < h.z1) return true
  }
  for (const w of WALLS) {
    if (x > w.x0 && x < w.x1 && z > w.z0 && z < w.z1) return true
  }
  return false
}

export const miyakoGroundY = () => 0

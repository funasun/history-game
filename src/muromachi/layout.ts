// 室町の京の地割り（データ駆動：時代差し替え層）
// 三方を山にかこまれた盆地。室町大路が南北にはしり、将軍の花の御所へむかう。
// 北西に金閣、東に能舞台、南東に銀閣。西のはずれの舟着きから、湊へゆける。
export interface TreeDef { x: number; z: number; kind: 'maple' | 'pine'; s: number }
export interface HillDef { x: number; z: number; r: number; h: number }

// 遊べる境界。−z が北（花の御所・北山）、+z が南（都の出口）。
export const BOUNDS = { minX: -22, maxX: 22, minZ: -20, maxZ: 20 }

// 室町大路（南北の土の大路）。北の花の御所から南の出口へ
export const OMICHI = { x: 0, w: 5.4, z0: -14, z1: 18 }
// 一条の辻（東西の道）：金閣・大路・能舞台をむすぶ
export const TSUJI = { z: -8, w: 4.4, x0: -13, x1: 15 }

// 出発地点（大路の南より、花の御所を望む）
export const SPAWN: [number, number] = [0, 8]
// 旅の宿（褥）
export const BED = { x: 6.6, z: 3.0 }

// 金閣の鏡湖池（水面。入れない）。楼閣の西〜前面にひろがる
export const POND = { x0: -18.6, x1: -14.6, z0: -14.2, z1: -8.8 }

// 囲む山（北山・東山・西山。南は淀へひらく）
export const HILLS: HillDef[] = [
  { x: -27, z: -10, r: 11, h: 8 },
  { x: -28, z: 2, r: 11, h: 8 },
  { x: -26, z: 13, r: 9, h: 6 },
  { x: 27, z: -10, r: 11, h: 8 },
  { x: 28, z: 2, r: 11, h: 8 },
  { x: 26, z: 13, r: 9, h: 6 },
  { x: -12, z: -27, r: 11, h: 9 },
  { x: 12, z: -27, r: 11, h: 9 },
  { x: 0, z: -30, r: 14, h: 11 },
  { x: -24, z: 21, r: 8, h: 4 },
  { x: 24, z: 21, r: 8, h: 4 },
]

// 木々（松を主に、紅葉もいくらか）
export const TREES: TreeDef[] = [
  { x: -6.5, z: -3, kind: 'pine', s: 1.2 },
  { x: 6.8, z: -2, kind: 'pine', s: 1.2 },
  { x: -8.6, z: 4, kind: 'maple', s: 1.05 },
  { x: 8.6, z: 5, kind: 'pine', s: 1.25 },
  { x: -18, z: -2, kind: 'pine', s: 1.35 },
  { x: 18.5, z: 1, kind: 'pine', s: 1.3 },
  { x: -8, z: -6.5, kind: 'maple', s: 1.0 },    // 金閣のほとり
  { x: 10, z: -12.5, kind: 'maple', s: 1.05 },
  { x: -16.5, z: -13, kind: 'pine', s: 1.2 },
  { x: 16.5, z: -12.5, kind: 'pine', s: 1.2 },
  { x: 16.5, z: 11, kind: 'maple', s: 1.05 },   // 銀閣のほとり
  { x: -19, z: 12, kind: 'pine', s: 1.15 },
  { x: 19.5, z: 9, kind: 'pine', s: 1.15 },
]

// 名所の据わり（建物の土台）。角ばった建物は円ではなく矩形で実寸に塞ぐ。
// world.tsx の基壇に合わせ、接近点（南面の外）は矩形の外に残す。
export const BUILDINGS: { x0: number; x1: number; z0: number; z1: number }[] = [
  { x0: -4.6, x1: 4.6, z0: -19.2, z1: -13.4 },   // 花の御所の築地・主殿
  { x0: -14.7, x1: -11.3, z0: -13.7, z1: -10.4 }, // 金閣（楼閣の据わり）
  { x0: 12.1, x1: 15.9, z0: -7.9, z1: -4.1 },     // 能舞台の据わり
  { x0: 11.4, x1: 14.6, z0: 7.4, z1: 10.6 },      // 銀閣の据わり
]

// 移動できない場所：境界の外、名所の土台、金閣の池
export function blocked(x: number, z: number): boolean {
  if (x < BOUNDS.minX || x > BOUNDS.maxX || z < BOUNDS.minZ || z > BOUNDS.maxZ) return true
  if (x > POND.x0 && x < POND.x1 && z > POND.z0 && z < POND.z1) return true
  for (const b of BUILDINGS) {
    if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1) return true
  }
  return false
}

// 京は段差の上を歩かない（名所は据わりもの）。地面は一律 0。
export function groundY(_x: number, _z: number): number {
  return 0
}

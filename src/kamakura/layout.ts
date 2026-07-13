// 鎌倉の地割り（データ駆動：時代差し替え層）
// 山にかこまれ、南は相模の海。若宮大路が海から八幡宮へまっすぐのびる。
export interface TreeDef { x: number; z: number; kind: 'maple' | 'pine'; s: number }
export interface HillDef { x: number; z: number; r: number; h: number }

// 遊べる境界（山と海のあいだ）。−z が北（八幡宮）、+z が南（海）。
export const BOUNDS = { minX: -22, maxX: 22, minZ: -20, maxZ: 20 }

// 海：この線より南（+z）は波打ちぎわの先＝入れない
export const SEA_Z = 13
// 浜（砂）の帯：大路の南のはずれから渚まで
export const BEACH = { z0: 8.5, z1: SEA_Z }

// 若宮大路（海から八幡宮へ north–south の土の道）
export const OMICHI = { x: 0, w: 5.2, z0: -14, z1: 16 }

// 出発地点（大路の南より、八幡宮を望む）
export const SPAWN: [number, number] = [0, 6]
// 旅の宿（褥）
export const BED = { x: 6.6, z: 2.6 }

// 囲む山（塀のかわり。境界の外にならべる）
export const HILLS: HillDef[] = [
  { x: -26, z: -12, r: 10, h: 7 },
  { x: -28, z: 3, r: 11, h: 8 },
  { x: -25, z: 15, r: 8, h: 5 },
  { x: 26, z: -10, r: 10, h: 7 },
  { x: 28, z: 5, r: 11, h: 8 },
  { x: 25, z: 16, r: 8, h: 5 },
  { x: -12, z: -26, r: 10, h: 8 },
  { x: 12, z: -26, r: 10, h: 8 },
  { x: 0, z: -29, r: 13, h: 10 },
]

// 木々（松を主に、紅葉もいくらか）
export const TREES: TreeDef[] = [
  { x: -6, z: -5, kind: 'pine', s: 1.25 },
  { x: 6.5, z: -3, kind: 'pine', s: 1.2 },
  { x: -8.5, z: 3, kind: 'pine', s: 1.15 },
  { x: 8.5, z: 5, kind: 'pine', s: 1.3 },
  { x: -18, z: 1, kind: 'pine', s: 1.35 },
  { x: 18, z: -1, kind: 'pine', s: 1.3 },
  { x: -10, z: -13.5, kind: 'maple', s: 1.05 },
  { x: 9.5, z: -13.5, kind: 'maple', s: 1.0 },
  { x: -16, z: -14, kind: 'pine', s: 1.2 },
  { x: 16, z: -14, kind: 'pine', s: 1.2 },
  // 磯の松は渚（SEA_Z=13）より陸側の砂浜に。z=17 は海のなかで幹が水没して見えた
  { x: -16, z: 10.8, kind: 'pine', s: 1.1 },
  { x: 15.5, z: 10.4, kind: 'pine', s: 1.1 },
  { x: -19, z: -10, kind: 'pine', s: 1.2 },
  { x: 19.5, z: 9, kind: 'pine', s: 1.15 },
]

// 名所の据わり（社殿・大仏・政庁の土台）。角ばった建物は円ではなく矩形で実寸に塞ぐ。
// world.tsx の石壇・基壇・土壇に合わせ、接近点（南面の外）は矩形の外に残す。
export const BUILDINGS: { x0: number; x1: number; z0: number; z1: number }[] = [
  { x0: -4.1, x1: 4.1, z0: -19.1, z1: -13.0 },   // 鶴岡八幡宮の石壇
  { x0: -17.1, x1: -11.0, z0: -5.8, z1: -0.2 },  // 鎌倉大仏の基壇・蓮座
  { x0: 8.9, x1: 17.1, z0: -12.1, z1: -6.0 },    // 政庁の土壇
]

// 移動できない場所：境界の外、海のなか、名所の土台
export function blocked(x: number, z: number): boolean {
  if (x < BOUNDS.minX || x > BOUNDS.maxX || z < BOUNDS.minZ || z > BOUNDS.maxZ) return true
  if (z >= SEA_Z) return true
  for (const b of BUILDINGS) {
    if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1) return true
  }
  return false
}

// 鎌倉は段差の上を歩かない（名所は据わりもの）。地面は一律 0。
export function groundY(_x: number, _z: number): number {
  return 0
}

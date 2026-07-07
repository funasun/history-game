// 当たり判定の芯。円で「そこには入れない」を表す。
// pack.ts から独立させて import 循環を避ける（layout だけに依存）。
export interface Circle { x: number; z: number; r: number }

interface SolidInput {
  trees?: readonly { x: number; z: number; s: number }[]
  pillars?: readonly (readonly [number, number])[]
  landmarks?: readonly { pos: [number, number]; approach: [number, number]; kind: string }[]
  // 名所ごとの当たり半径（0 以下＝すり抜けられる＝当たりを置かない）
  landmarkR?: Record<string, number>
  // 追加の当たり円（門柱・鳥居の柱など、実寸で塞ぎたい小物）
  extra?: readonly Circle[]
}

// 木・柱・名所を当たり円の配列に変換する。
// 名所は「接近点（触れに行く立ち位置）」より必ず内側で止まるよう半径を詰める。
// これで当たりを付けても会話・調べる操作が壊れない。
export function buildSolids(input: SolidInput): Circle[] {
  const out: Circle[] = []
  for (const t of input.trees ?? []) out.push({ x: t.x, z: t.z, r: 0.4 + 0.05 * t.s })
  for (const p of input.pillars ?? []) out.push({ x: p[0], z: p[1], r: 0.34 })
  for (const m of input.landmarks ?? []) {
    const base = input.landmarkR?.[m.kind] ?? 0
    if (base <= 0) continue
    const dApp = Math.hypot(m.pos[0] - m.approach[0], m.pos[1] - m.approach[1])
    const r = Math.min(base, dApp - 0.85) // 接近点は必ず円の外側に残す
    if (r > 0.15) out.push({ x: m.pos[0], z: m.pos[1], r })
  }
  for (const c of input.extra ?? []) out.push({ ...c })
  return out
}

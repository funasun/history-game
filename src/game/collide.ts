import { getPack } from './pack'
import type { Circle } from './solids'

// 人（登場人物）は時刻で立ち位置が変わるので、毎フレーム円を組み直す。
function charCircles(t: number): Circle[] {
  const pack = getPack()
  const cs = pack.CHARACTERS
  const out: Circle[] = []
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i]
    const [x, z] = pack.charPos(c, t)
    out.push({ x, z, r: 0.34 + 0.12 * c.scale })
  }
  return out
}

// 円の中に入っていたら、いちばん近い縁までそっと押し出す。
function ejectFrom(nx: number, nz: number, circles: readonly Circle[]): [number, number] {
  for (let i = 0; i < circles.length; i++) {
    const s = circles[i]
    const dx = nx - s.x
    const dz = nz - s.z
    const d2 = dx * dx + dz * dz
    if (d2 < s.r * s.r) {
      const d = Math.sqrt(d2) || 1e-4
      nx = s.x + (dx / d) * s.r
      nz = s.z + (dz / d) * s.r
    }
  }
  return [nx, nz]
}

// 壁は軸ごとに滑らせ、物と人は円で押し出す。
// 押し出した先が壁の中なら、その一歩は無かったことにする（＝止まる）。
export function resolveMove(px: number, pz: number, nx: number, nz: number, t: number): [number, number] {
  const blocked = getPack().blocked
  if (blocked(nx, nz)) {
    if (!blocked(nx, pz)) nz = pz
    else if (!blocked(px, nz)) nx = px
    else { nx = px; nz = pz }
  }
  ;[nx, nz] = ejectFrom(nx, nz, getPack().solids)
  ;[nx, nz] = ejectFrom(nx, nz, charCircles(t))
  if (blocked(nx, nz)) return [px, pz]
  return [nx, nz]
}

// 開発時のみ：当たり判定を rAF 抜きで直接検証できるようにする（本番ビルドでは消える）
if (import.meta.env.DEV) {
  (globalThis as Record<string, unknown>).__collide = {
    resolveMove,
    charCircles,
    solids: () => getPack().solids,
  }
}

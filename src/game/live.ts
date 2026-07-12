// フレームごとに動く生の状態（storeを介さない共有）
import * as THREE from 'three'

export const playerWorld = new THREE.Vector3(-3, 0, -6)

// 押されている移動キー
export const heldKeys = new Set<string>()

// マウス/指のドラッグ操舵：押し続けているあいだ、カーソルの指す方へ歩く。
// on はドラッグ判定が確定してから true になる（素早い単クリックでは立たない）。
export const drive = { on: false }

// カメラの向きと引き。yawGoal/distGoal へ毎フレーム緩やかに寄る。
// 回転は45°刻み（⟲⟳ボタン・q/eキー）、引きはピンチ/ホイールで連続。
export const cam = { yaw: 0, dist: 1, yawGoal: 0, distGoal: 1 }
export function rotateCam(dir: 1 | -1) { cam.yawGoal += dir * Math.PI / 4 }
export function zoomCam(delta: number) {
  cam.distGoal = Math.min(1.6, Math.max(0.55, cam.distGoal + delta))
}
export function resetCam() { cam.yaw = 0; cam.yawGoal = 0; cam.dist = 1; cam.distGoal = 1 }

// タップ移動の目印（地面に立つ小さな波紋）。t は残り時間
export const tapMark = { x: 0, z: 0, t: 0 }

// 鯉寄せ：餌を撒いてからの残り時間。池の鯉がこの間だけ岸へ寄る
export const koiCall = { t: 0 }

// タブが裏に回ると rAF が止まり、戻った最初のフレームに「留守のあいだ全部」の dt が渡る。
// そのままだと一日が一瞬で暮れてしまうので、1フレームぶんとして扱う時間に上限を置く。
export function clampDt(dt: number): number {
  return Math.min(dt, 0.1)
}

// 開発時のみ、当たり判定の検証用にプレイヤー位置を覗けるようにする（本番ビルドでは消える）
if (import.meta.env.DEV) (globalThis as Record<string, unknown>).__pw = playerWorld

const DIRS: Record<string, [number, number]> = {
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
}

export function isMoveKey(key: string): boolean {
  return key in DIRS
}

// 押下中キーの合成方向（正規化）。押されていなければ null
export function keyDir(): [number, number] | null {
  let x = 0, z = 0
  for (const k of heldKeys) {
    const d = DIRS[k]
    if (d) { x += d[0]; z += d[1] }
  }
  if (x === 0 && z === 0) return null
  const len = Math.hypot(x, z)
  return [x / len, z / len]
}

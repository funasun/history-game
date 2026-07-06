// 現在の篇の3D世界を描く（中身は各 pack.World が持つ）。
import { getPack } from '../game/pack'

export function World() {
  const W = getPack().World
  return <W />
}

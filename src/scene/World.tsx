// 現在の場面（エリア）の3D世界を描く（中身は各エリアの World が持つ）。
import { getArea } from '../game/pack'

export function World() {
  const W = getArea().World
  return <W />
}

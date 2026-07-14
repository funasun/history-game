// 幻視：名所の頁がひらいているあいだ、その場で出来事が演じられる。
// どの場面を演じるかは篇（pack.VisionMesh）にゆだねる——文字だけの学びにしない。
// i はいまの行（語りのすすみに合わせて場面が動く）。
import { useGame } from '../game/store'
import { getPack } from '../game/pack'

export function Visions() {
  const vision = useGame(s => s.vision)
  const i = useGame(s => s.dialogue?.i ?? 0)
  const V = getPack().VisionMesh
  if (!vision || !V) return null
  return <V id={vision} i={i} />
}

// 都大路（朱雀大路）の3D。邸の門を出た先、もうひとつの場面。
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { useGame } from '../game/store'
import { P } from './palette'
import { MIYAKO_BOUNDS, ROAD, HOUSES, MIYAKO_TREES, PARKED_CART, miyakoBlocked } from './miyako'
import { toTexture, groundCanvas } from '../engine/textures'
import { clampDt } from '../game/live'
import { Tree3D, useGroundTex } from './world'

const noRay = () => null
const PLANK = '#6a5844'      // 板葺の屋根
const PLANK_DK = '#57483a'

export function MiyakoWorld() {
  const walkTo = useGame(s => s.walkTo)
  const groundTex = useGroundTex('ground-miyako', '#b0a684', '#a09678', '#c0b494', 26)
  const roadTex = useMemo(() => {
    const t = toTexture('ground-road', () => groundCanvas('#c9bc9c', '#b9ac8c', '#d6caa8'))
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(4, 15)
    return t
  }, [])

  const onGround = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const x = e.point.x, z = e.point.z
    if (!miyakoBlocked(x, z)) walkTo(x, z)
  }

  const B = MIYAKO_BOUNDS
  const roadW = ROAD.x1 - ROAD.x0
  const roadLen = B.maxZ - B.minZ
  const roadZ = (B.maxZ + B.minZ) / 2

  return (
    <group>
      {/* 地面 */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} onClick={onGround}>
        <planeGeometry args={[160, 160]} />
        <meshLambertMaterial map={groundTex} />
      </mesh>
      {/* 朱雀大路の路面 */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, roadZ]} onClick={onGround}>
        <planeGeometry args={[roadW, roadLen]} />
        <meshLambertMaterial map={roadTex} />
      </mesh>
      {/* 車の轍（わだち） */}
      {[-2.62, -1.38, 1.6, 2.9].map((x, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.004, roadZ]} raycast={noRay}>
          <planeGeometry args={[0.2, roadLen - 4]} />
          <meshLambertMaterial color="#bcb08f" />
        </mesh>
      ))}
      {/* 側溝の水 */}
      {[ROAD.x0 - 0.45, ROAD.x1 + 0.45].map((x, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.006, roadZ]} raycast={noRay}>
          <planeGeometry args={[0.5, roadLen]} />
          <meshLambertMaterial color="#7c93a6" />
        </mesh>
      ))}

      {/* 板屋の列 */}
      {HOUSES.map((h, i) => <Itaya key={i} h={h} i={i} />)}

      {/* 羅城（門の左右へつづく都の壁） */}
      {[-10.8, 10.8].map((x, i) => (
        <group key={i} position={[x, 0, -29.6]}>
          <mesh><boxGeometry args={[10.4, 4.4, 0.9]} /><meshLambertMaterial color="#a89878" /></mesh>
          <mesh position={[0, 2.36, 0]}><boxGeometry args={[10.6, 0.32, 1.3]} /><meshLambertMaterial color={PLANK} /></mesh>
        </group>
      ))}

      {/* 北のはし：邸の築地塀と棟門 */}
      {[[7.7, 2.2], [13.6, 4.8]].map(([cx, w], i) => (
        <group key={i} position={[cx, 0, 16.4]}>
          <mesh position={[0, 0.65, 0]}><boxGeometry args={[w, 1.3, 0.6]} /><meshLambertMaterial color="#ab9d80" /></mesh>
          <mesh position={[0, 1.38, 0]}><boxGeometry args={[w + 0.2, 0.18, 0.9]} /><meshLambertMaterial color={PLANK} /></mesh>
        </group>
      ))}
      <group position={[10, 0, 16.1]}>
        {[-1.1, 1.1].map((x, i) => (
          <mesh key={i} position={[x, 1.05, 0]}><boxGeometry args={[0.26, 2.1, 0.26]} /><meshLambertMaterial color="#7a5a3e" /></mesh>
        ))}
        <mesh position={[0, 2.05, 0]}><boxGeometry args={[2.8, 0.22, 0.4]} /><meshLambertMaterial color="#7a5a3e" /></mesh>
        <mesh position={[0, 2.34, 0]}><boxGeometry args={[3.3, 0.24, 1.2]} /><meshLambertMaterial color={PLANK} /></mesh>
      </group>

      {/* 市の店（絹・干し魚） */}
      <KinuStall />
      <UoStall />

      {/* 駐めてある牛車 */}
      <ParkedGissha />
      {/* 大路をゆく牛車 */}
      <Gissha />
      {/* 道ゆく人びと */}
      <Walker x={-4.5} mid={-8} amp={14} speed={0.055} phase={0.4} robe="#7a6a4a" hat />
      <Walker x={1.6} mid={-2} amp={13} speed={0.042} phase={2.6} robe="#5a6a72" />
      <Walker x={4.8} mid={-12} amp={11} speed={0.065} phase={4.4} robe="#8a5a46" />

      {/* 並木と空き地の木 */}
      {MIYAKO_TREES.map((tr, i) => <Tree3D key={i} x={tr.x} z={tr.z} kind={tr.kind} s={tr.s} />)}
    </group>
  )
}

// 板屋（庶民の家）：石を置いた板葺屋根。道に向いて戸を開ける
function Itaya({ h, i }: { h: { x0: number; x1: number; z0: number; z1: number }; i: number }) {
  const cx = (h.x0 + h.x1) / 2
  const cz = (h.z0 + h.z1) / 2
  const w = h.x1 - h.x0
  const d = h.z1 - h.z0
  const west = cx < 0
  const face = west ? h.x1 : h.x0        // 道に向く面
  const bodyC = i % 2 ? '#9c8468' : '#8f7a5e'
  const doorX = face + (west ? 0.02 : -0.02)
  const stones = useMemo(() => {
    const arr: [number, number][] = []
    for (let k = 0; k < 4; k++) arr.push([(k - 1.5) * w * 0.22 + ((i * 7 + k * 3) % 5) * 0.1 - 0.2, (k % 2 ? 0.6 : -0.5)])
    return arr
  }, [w, i])
  return (
    <group position={[cx, 0, cz]}>
      <mesh position={[0, 0.8, 0]}><boxGeometry args={[w - 0.3, 1.6, d - 0.3]} /><meshLambertMaterial color={bodyC} /></mesh>
      {/* 板葺の屋根（緩い切妻） */}
      <mesh position={[0, 1.86, -d / 4 + 0.08]} rotation-x={0.38}><boxGeometry args={[w + 0.5, 0.09, d / 2 + 0.55]} /><meshLambertMaterial color={PLANK} /></mesh>
      <mesh position={[0, 1.86, d / 4 - 0.08]} rotation-x={-0.38}><boxGeometry args={[w + 0.5, 0.09, d / 2 + 0.55]} /><meshLambertMaterial color={PLANK} /></mesh>
      <mesh position={[0, 2.12, 0]}><boxGeometry args={[w + 0.6, 0.1, 0.34]} /><meshLambertMaterial color={PLANK_DK} /></mesh>
      {/* 屋根に置いた石 */}
      {stones.map(([sx, sk], k) => (
        <mesh key={k} position={[sx, 1.98, sk * d * 0.3]} raycast={noRay}>
          <boxGeometry args={[0.22, 0.14, 0.2]} />
          <meshLambertMaterial color="#8f8a7c" />
        </mesh>
      ))}
      {/* 道に向いた戸と窓 */}
      <mesh position={[doorX - cx, 0.62, -d * 0.16]} rotation-y={west ? Math.PI / 2 : -Math.PI / 2} raycast={noRay}>
        <planeGeometry args={[0.72, 1.24]} />
        <meshLambertMaterial color="#4a3c2c" />
      </mesh>
      <mesh position={[doorX - cx, 0.95, d * 0.2]} rotation-y={west ? Math.PI / 2 : -Math.PI / 2} raycast={noRay}>
        <planeGeometry args={[0.8, 0.5]} />
        <meshLambertMaterial color="#5c4c38" />
      </mesh>
      <NightWindow x={doorX - cx} z={d * 0.2} west={west} seed={i} />
    </group>
  )
}

// 夜、窓にともるあかり
function NightWindow({ x, z, west, seed }: { x: number; z: number; west: boolean; seed: number }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(({ clock }) => {
    const t = useGame.getState().t
    const night = Math.min(1, Math.max(0, (t - 0.58) / 0.14))
    if (mat.current) mat.current.opacity = night * (0.4 + 0.12 * Math.sin(clock.elapsedTime * 3 + seed * 2.1))
  })
  return (
    <mesh position={[x + (west ? 0.012 : -0.012), 0.95, z]} rotation-y={west ? Math.PI / 2 : -Math.PI / 2} raycast={noRay}>
      <planeGeometry args={[0.74, 0.44]} />
      <meshBasicMaterial ref={mat} color="#ffc36a" transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

// 絹の店（反物を垂らした店）
function KinuStall() {
  return (
    <group position={[13.2, 0, -2.3]} rotation-y={-Math.PI / 2}>
      {[[-1.1, 0.6], [1.1, 0.6]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.55, z]}><boxGeometry args={[0.14, 1.1, 0.14]} /><meshLambertMaterial color="#7a5a3e" /></mesh>
      ))}
      {[[-1.1, -0.6], [1.1, -0.6]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.8, z]}><boxGeometry args={[0.14, 1.6, 0.14]} /><meshLambertMaterial color="#7a5a3e" /></mesh>
      ))}
      <mesh position={[0, 1.42, 0]} rotation-x={-0.26}><boxGeometry args={[2.6, 0.09, 1.5]} /><meshLambertMaterial color="#8a6a46" /></mesh>
      <mesh position={[0, 1.18, 0.55]}><boxGeometry args={[2.2, 0.06, 0.06]} /><meshLambertMaterial color="#5a4632" /></mesh>
      {[['#b05a8a', -0.6], ['#e0cfa0', 0], [P.kikyo, 0.6]].map(([c, x], i) => (
        <mesh key={i} position={[x as number, 0.72, 0.56]} rotation-y={Math.PI} raycast={noRay}>
          <planeGeometry args={[0.44, 0.9]} />
          <meshLambertMaterial color={c as string} side={2} />
        </mesh>
      ))}
      <mesh position={[0, 0.42, -0.2]}><boxGeometry args={[2.0, 0.4, 0.8]} /><meshLambertMaterial color={P.wood} /></mesh>
    </group>
  )
}

// 干し魚の店（掛けならべた干物と桶）
function UoStall() {
  return (
    <group position={[13.2, 0, 2.5]} rotation-y={-Math.PI / 2}>
      {[[-1.1, 0.6], [1.1, 0.6]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.55, z]}><boxGeometry args={[0.14, 1.1, 0.14]} /><meshLambertMaterial color="#7a5a3e" /></mesh>
      ))}
      {[[-1.1, -0.6], [1.1, -0.6]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.8, z]}><boxGeometry args={[0.14, 1.6, 0.14]} /><meshLambertMaterial color="#7a5a3e" /></mesh>
      ))}
      <mesh position={[0, 1.42, 0]} rotation-x={-0.26}><boxGeometry args={[2.6, 0.09, 1.5]} /><meshLambertMaterial color="#7a6248" /></mesh>
      <mesh position={[0, 1.12, 0.55]}><boxGeometry args={[2.2, 0.05, 0.05]} /><meshLambertMaterial color="#5a4632" /></mesh>
      {[-0.8, -0.45, -0.1, 0.25, 0.6].map((x, i) => (
        <mesh key={i} position={[x, 0.9, 0.56]} rotation-z={0.15 * (i % 2 ? 1 : -1)} raycast={noRay}>
          <boxGeometry args={[0.09, 0.42, 0.03]} />
          <meshLambertMaterial color="#9a8060" />
        </mesh>
      ))}
      <mesh position={[0, 0.42, -0.2]}><boxGeometry args={[2.0, 0.4, 0.8]} /><meshLambertMaterial color={P.wood} /></mesh>
      <mesh position={[0.85, 0.26, 0.5]}><cylinderGeometry args={[0.2, 0.17, 0.5, 10]} /><meshLambertMaterial color="#8a7456" /></mesh>
    </group>
  )
}

// 牛車の車輪（スポークつき。回すのは rotation.x）
function Wheel({ x, z, refObj }: { x: number; z: number; refObj?: React.RefObject<THREE.Group> }) {
  return (
    <group ref={refObj} position={[x, 0.55, z]} rotation-z={Math.PI / 2}>
      <mesh><cylinderGeometry args={[0.55, 0.55, 0.07, 16]} /><meshLambertMaterial color="#4a3c2c" /></mesh>
      <mesh position={[0, 0.045, 0]}><boxGeometry args={[1.0, 0.03, 0.07]} /><meshLambertMaterial color="#6a5844" /></mesh>
      <mesh position={[0, 0.045, 0]} rotation-y={Math.PI / 2}><boxGeometry args={[1.0, 0.03, 0.07]} /><meshLambertMaterial color="#6a5844" /></mesh>
    </group>
  )
}

// 牛車の屋形と車輪（向き +z）
function CartBody({ wheelL, wheelR }: { wheelL?: React.RefObject<THREE.Group>; wheelR?: React.RefObject<THREE.Group> }) {
  return (
    <group>
      <mesh position={[0, 1.05, -0.5]}><boxGeometry args={[0.95, 0.95, 1.35]} /><meshLambertMaterial color="#8a6a46" /></mesh>
      <mesh position={[0, 1.62, -0.5]}><boxGeometry args={[1.15, 0.14, 1.6]} /><meshLambertMaterial color={PLANK} /></mesh>
      <mesh position={[0, 1.0, 0.19]} raycast={noRay}><planeGeometry args={[0.8, 0.7]} /><meshLambertMaterial color="#e0d8b8" side={2} /></mesh>
      <Wheel x={-0.62} z={-0.5} refObj={wheelL} />
      <Wheel x={0.62} z={-0.5} refObj={wheelR} />
    </group>
  )
}

// 大路をゆく牛車（牛が引く。端で折り返す）
function Gissha() {
  const g = useRef<THREE.Group>(null)
  const wheelL = useRef<THREE.Group>(null!)
  const wheelR = useRef<THREE.Group>(null!)
  const st = useRef({ z: -6, dir: 1 })
  useFrame(({ clock }, rawDt) => {
    const dt = clampDt(rawDt)
    const s = st.current
    const sp = 1.1
    s.z += s.dir * sp * dt
    if (s.z > 12) { s.z = 12; s.dir = -1 }
    if (s.z < -24) { s.z = -24; s.dir = 1 }
    if (g.current) {
      g.current.position.set(-2, 0, s.z)
      g.current.rotation.y = s.dir > 0 ? 0 : Math.PI
      const c = g.current.children[0] as THREE.Group | undefined
      if (c) c.position.y = 0.02 * Math.sin(clock.elapsedTime * 6)
    }
    const roll = (s.dir * sp * dt) / 0.55
    if (wheelL.current) wheelL.current.rotation.x += roll
    if (wheelR.current) wheelR.current.rotation.x += roll
  })
  return (
    <group ref={g}>
      {/* 牛（ゆっくり歩む） */}
      <group position={[0, 0, 1.5]}>
        <mesh position={[0, 0.62, 0]}><boxGeometry args={[0.56, 0.52, 1.05]} /><meshLambertMaterial color="#4a4038" /></mesh>
        <mesh position={[0, 0.78, 0.62]}><boxGeometry args={[0.34, 0.32, 0.4]} /><meshLambertMaterial color="#3e352e" /></mesh>
        {[-0.2, 0.2].map((x, i) => (
          <mesh key={i} position={[x, 0.98, 0.6]} rotation-z={x > 0 ? -0.5 : 0.5}>
            <cylinderGeometry args={[0.025, 0.04, 0.26, 6]} />
            <meshLambertMaterial color="#d8d0c0" />
          </mesh>
        ))}
        {[[-0.18, 0.32], [0.18, 0.32], [-0.18, -0.35], [0.18, -0.35]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.18, z]}><boxGeometry args={[0.13, 0.4, 0.13]} /><meshLambertMaterial color="#3e352e" /></mesh>
        ))}
      </group>
      {/* 轅（ながえ） */}
      {[-0.38, 0.38].map((x, i) => (
        <mesh key={i} position={[x, 0.62, 0.55]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.035, 0.035, 1.7, 6]} />
          <meshLambertMaterial color="#5a4632" />
        </mesh>
      ))}
      <CartBody wheelL={wheelL} wheelR={wheelR} />
    </group>
  )
}

// 駐めてある牛車（轅を下ろして牛はいない）
function ParkedGissha() {
  return (
    <group position={[PARKED_CART.x, 0, PARKED_CART.z]} rotation-y={0.4}>
      {[-0.38, 0.38].map((x, i) => (
        <mesh key={i} position={[x, 0.36, 0.6]} rotation-x={Math.PI / 2 + 0.32}>
          <cylinderGeometry args={[0.035, 0.035, 1.7, 6]} />
          <meshLambertMaterial color="#5a4632" />
        </mesh>
      ))}
      <mesh position={[0, 0.1, 1.32]}><boxGeometry args={[1.0, 0.2, 0.16]} /><meshLambertMaterial color="#6a5844" /></mesh>
      <CartBody />
    </group>
  )
}

// 道ゆく人（大路を行き来する。ひとりは市女笠）
function Walker({ x, mid, amp, speed, phase, robe, hat }: {
  x: number; mid: number; amp: number; speed: number; phase: number; robe: string; hat?: boolean
}) {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!g.current) return
    const et = clock.elapsedTime
    const k = et * speed * Math.PI * 2 + phase
    const z = mid + amp * Math.sin(k)
    g.current.position.set(x, 0.045 * Math.abs(Math.sin(et * 5.2 + phase)), z)
    g.current.rotation.y = Math.cos(k) > 0 ? 0 : Math.PI
  })
  return (
    <group ref={g}>
      <mesh position={[0, 0.55, 0]}><coneGeometry args={[0.34, 1.1, 10]} /><meshLambertMaterial color={robe} /></mesh>
      <mesh position={[0, 1.22, 0]}><sphereGeometry args={[0.17, 12, 10]} /><meshLambertMaterial color="#e8c8a8" /></mesh>
      {hat
        ? <mesh position={[0, 1.4, 0]}><coneGeometry args={[0.5, 0.22, 12]} /><meshLambertMaterial color="#c8b888" /></mesh>
        : <mesh position={[0, 1.36, 0]}><sphereGeometry args={[0.13, 10, 8]} /><meshLambertMaterial color="#2a2018" /></mesh>}
    </group>
  )
}

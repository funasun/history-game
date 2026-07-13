// 都大路（朱雀大路）の3D。邸の門を出た先、もうひとつの場面。
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { useGame } from '../game/store'
import { P } from './palette'
import { MIYAKO_BOUNDS, ROAD, HOUSES, MIYAKO_TREES, PARKED_CART, MIYAKO_EXTRA_SOLIDS, miyakoBlocked } from './miyako'
import { toTexture, groundCanvas } from '../engine/textures'
import { clampDt } from '../game/live'
import { Tree3D } from './world'
import { buildGroundGeometry, scatterPoints, applyInstances, mulberry32 } from '../engine/procedural'
import { miyakoRelief, miyakoGroundColor } from './terrain'

const noRay = () => null
const PLANK = '#6a5844'      // 板葺の屋根
const PLANK_DK = '#57483a'

export function MiyakoWorld() {
  const walkTo = useGame(s => s.walkTo)
  // 起伏と頂点色の地面（大路は平ら、都の外れに野と東山が起きる）
  const groundGeo = useMemo(() => buildGroundGeometry(170, 150, miyakoRelief, miyakoGroundColor), [])
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
      {/* 地面（起伏と頂点色） */}
      <mesh geometry={groundGeo} onClick={onGround}>
        <meshLambertMaterial vertexColors />
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

      {/* 道端の草・都のはての野山・条坊につらなる家並み */}
      <MiyakoVegetation />
    </group>
  )
}

// 都のにぎわいの背景。種で決まる散布——きのうと同じ都。
// 見た目だけ（当たりなし・raycast なし）
function MiyakoVegetation() {
  const group = useMemo(() => {
    const g = new THREE.Group()
    const color = new THREE.Color()
    const B = MIYAKO_BOUNDS

    // --- 道端の草（大路と側溝を外し、店・牛車のきわを避ける） ---
    const tufts = scatterPoints(90, 137, { x0: B.minX + 0.6, x1: B.maxX - 0.6, z0: B.minZ + 0.6, z1: B.maxZ - 0.6 },
      (x, z) => !miyakoBlocked(x, z) && Math.abs(x) > ROAD.x1 + 1.1
        && MIYAKO_EXTRA_SOLIDS.every(c => (x - c.x) ** 2 + (z - c.z) ** 2 > (c.r + 0.5) ** 2)
        && (x - 10) ** 2 + (z - 16.4) ** 2 > 6)
    const tuftGeo = new THREE.ConeGeometry(0.2, 0.38, 4)
    const tuftMat = new THREE.MeshLambertMaterial({ flatShading: true })
    const tuftMesh = new THREE.InstancedMesh(tuftGeo, tuftMat, tufts.length)
    applyInstances(tuftMesh, tufts, (p, d, i) => {
      const s = 0.7 + p.rand * 0.8
      d.position.set(p.x, 0.16 * s, p.z)
      d.rotation.y = p.rand * Math.PI
      d.scale.setScalar(s)
      color.setHSL(0.12 + p.rand * 0.09, 0.3, 0.4 + ((p.rand * 7) % 1) * 0.09)
      tuftMesh.setColorAt(i, color)
    })

    // --- 都のはての木立（東山の紅葉、野の松） ---
    const wild = { x0: -78, x1: 78, z0: -78, z1: 78 }
    const trees = scatterPoints(120, 522, wild, (_x, _z, h) => h > 0.45 && h < 4, miyakoRelief)
    const trunkGeo = new THREE.CylinderGeometry(0.09, 0.16, 1.2, 5)
    const trunkMat = new THREE.MeshLambertMaterial({ color: '#6e553c', flatShading: true })
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, trees.length)
    applyInstances(trunks, trees, (p, d) => {
      const s = 0.9 + p.rand * 0.8
      d.position.set(p.x, p.h + 0.55 * s, p.z)
      d.rotation.y = p.rand * Math.PI * 2
      d.scale.setScalar(s)
    })
    const pines = trees.filter(p => p.rand < 0.5)
    const maples = trees.filter(p => p.rand >= 0.5)
    const pineGeo = new THREE.ConeGeometry(0.9, 1.7, 6)
    const pineMat = new THREE.MeshLambertMaterial({ flatShading: true })
    const pineMesh = new THREE.InstancedMesh(pineGeo, pineMat, pines.length)
    applyInstances(pineMesh, pines, (p, d, i) => {
      const s = 0.9 + p.rand * 0.8
      d.position.set(p.x, p.h + 1.45 * s, p.z)
      d.rotation.y = p.rand * 6
      d.scale.setScalar(s)
      color.setHSL(0.32 + p.rand * 0.05, 0.3, 0.24 + ((p.rand * 11) % 1) * 0.07)
      pineMesh.setColorAt(i, color)
    })
    const mapleGeo = new THREE.IcosahedronGeometry(0.95, 0)
    const mapleMat = new THREE.MeshLambertMaterial({ flatShading: true })
    const mapleMesh = new THREE.InstancedMesh(mapleGeo, mapleMat, maples.length)
    applyInstances(mapleMesh, maples, (p, d, i) => {
      const s = 0.9 + p.rand * 0.8
      d.position.set(p.x, p.h + 1.5 * s, p.z)
      d.rotation.set(p.rand * 3, p.rand * 6, p.rand * 2)
      d.scale.setScalar(s)
      color.setHSL(0.03 + p.rand * 0.07, 0.5, 0.32 + ((p.rand * 13) % 1) * 0.1)
      mapleMesh.setColorAt(i, color)
    })

    // --- 条坊につらなる家並み（碁盤の目にそろう板屋根） ---
    const rnd = mulberry32(816)
    const homes: { x: number; z: number; h: number; r: number }[] = []
    for (let gx = -74; gx <= 74; gx += 7.2) {
      for (let gz = -76; gz <= 70; gz += 6.8) {
        if (rnd() < 0.42) continue
        const px = gx + (rnd() - 0.5) * 2.2
        const pz = gz + (rnd() - 0.5) * 2.2
        if (px > B.minX - 3.5 && px < B.maxX + 3.5 && pz > B.minZ - 3.5 && pz < B.maxZ + 3.5) continue // 場面そのもの
        if (Math.abs(px) < 9.5) continue // 朱雀大路のつづき（北も南も）
        if (px > 4 && px < 18 && pz > 20 && pz < 40) continue // 邸の敷地
        const h = miyakoRelief(px, pz)
        if (h > 1.6) continue // 山には建てない
        homes.push({ x: px, z: pz, h, r: rnd() })
      }
    }
    const bodyGeo = new THREE.BoxGeometry(5.2, 1.25, 3.5)
    const bodyMat = new THREE.MeshLambertMaterial({ color: '#a4957a', flatShading: true })
    const bodies = new THREE.InstancedMesh(bodyGeo, bodyMat, homes.length)
    const roofGeo = new THREE.BoxGeometry(5.9, 0.4, 4.2)
    const roofMat = new THREE.MeshLambertMaterial({ flatShading: true })
    const roofs = new THREE.InstancedMesh(roofGeo, roofMat, homes.length)
    const dummy = new THREE.Object3D()
    homes.forEach((hm, i) => {
      dummy.position.set(hm.x, hm.h + 0.62, hm.z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.setScalar(0.9 + hm.r * 0.3)
      dummy.updateMatrix()
      bodies.setMatrixAt(i, dummy.matrix)
      dummy.position.y = hm.h + 1.42
      dummy.updateMatrix()
      roofs.setMatrixAt(i, dummy.matrix)
      color.setHSL(0.08, 0.14, 0.3 + ((hm.r * 9) % 1) * 0.08)
      roofs.setColorAt(i, color)
    })
    bodies.instanceMatrix.needsUpdate = true
    roofs.instanceMatrix.needsUpdate = true

    for (const m of [tuftMesh, pineMesh, mapleMesh, roofs]) {
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
    for (const m of [tuftMesh, trunks, pineMesh, mapleMesh, bodies, roofs]) {
      m.raycast = () => {}
      g.add(m)
    }
    return g
  }, [])
  return <primitive object={group} />
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
    if (mat.current) mat.current.opacity = night * (0.8 + 0.2 * Math.sin(clock.elapsedTime * 3 + seed * 2.1))
  })
  // 夜ティント(multiply)に沈まないよう、明るめの色・大きめの面で「灯りのにじみ」ごと描く
  return (
    <mesh position={[x + (west ? 0.012 : -0.012), 0.95, z]} rotation-y={west ? Math.PI / 2 : -Math.PI / 2} raycast={noRay}>
      <planeGeometry args={[1.06, 0.62]} />
      <meshBasicMaterial ref={mat} color="#ffe2a0" transparent opacity={0} depthWrite={false} />
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
    // 夜は牛車も宿へ。人かげとともに大路から消える
    const night = Math.min(1, Math.max(0, (useGame.getState().t - 0.58) / 0.14))
    if (g.current) g.current.visible = night < 0.55
    if (night >= 0.55) return
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
    // 日が暮れると、大路から人かげが絶える
    const night = Math.min(1, Math.max(0, (useGame.getState().t - 0.58) / 0.14))
    g.current.visible = night < 0.55
    if (!g.current.visible) return
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

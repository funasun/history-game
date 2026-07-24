// 湊（会合の町）の3D。京から川をくだった先の、自治の港町。
// 北は海——沖に勘合船が浮かぶ。会合所（町衆の寄合の館）と土倉（金貸しの蔵）、
// 市がたつ。教科書の「町衆の自治」「勘合貿易」「土一揆・惣」を歩ける場に。
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { useGame } from '../game/store'
import { P } from './palette'
import {
  MINATO_BOUNDS, SHORE_Z, KAIGOSHO, KURA, MINATO_TREES,
  minatoBlocked, minatoRelief, minatoGroundColor,
} from './minato'
import { buildGroundGeometry, buildRibbonGeometry, scatterPoints, applyInstances, smoothstep } from '../engine/procedural'
import { KTree } from './world'
import { KWalker, Bashaku, Banner, IdleHorse } from './liveActors'

const noRay = () => null
const SKIN = '#e8c8a8'

export function MinatoWorld() {
  const walkTo = useGame(s => s.walkTo)
  const onGround = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const x = e.point.x, z = e.point.z
    if (!minatoBlocked(x, z)) walkTo(x, z)
  }
  const groundGeo = useMemo(() => buildGroundGeometry(200, 190, minatoRelief, minatoGroundColor), [])
  // 汀の波がしら（うねる芯＋端を絞るリボン）
  const foamGeos = useMemo(() => [
    { z: SHORE_Z - 0.7, w: 1.2, f: 0.33, p: 1.1, a: 0.28 },
    { z: SHORE_Z - 2.6, w: 0.7, f: 0.24, p: 3.6, a: 0.44 },
  ].map(({ z, w, f, p, a }) => {
    const pts = Array.from({ length: 15 }, (_, i) => {
      const x = -18 + i * (36 / 14)
      return { x, z: z + Math.sin(x * f + p) * a }
    })
    return buildRibbonGeometry(pts, i =>
      w * Math.max(0.05, smoothstep(0, 2.2, i) * smoothstep(14, 11.8, i) * (0.8 + 0.25 * Math.sin(i * 2.1) ** 2)))
  }), [])

  return (
    <group>
      {/* 地面（港町の土・山肌・汀の砂から海の底まで） */}
      <mesh geometry={groundGeo} onClick={onGround}>
        <meshLambertMaterial vertexColors />
      </mesh>

      {/* 町の道（東の陸門から会合所・市へ） */}
      <mesh rotation-x={-Math.PI / 2} position={[3, 0.006, 6.5]} onClick={onGround}>
        <planeGeometry args={[22, 2.4]} /><meshLambertMaterial color="#a99a72" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.007, 0]} onClick={onGround}>
        <planeGeometry args={[2.2, 12]} /><meshLambertMaterial color="#a99a72" />
      </mesh>

      {/* 北の海（波がうねる） */}
      <MinatoSea />
      {foamGeos.map((g, i) => (
        <mesh key={i} geometry={g} position-y={0.05} raycast={noRay}>
          <meshLambertMaterial color={P.kawaFoam} />
        </mesh>
      ))}

      {/* 桟橋：汀から沖の勘合船へ */}
      <Sanbashi />
      {/* 沖の遠い船（会合衆いわく「沖の大船」） */}
      <DistantShip x={-8} z={-16} s={1.1} ry={0.3} />
      <DistantShip x={9} z={-19} s={1.3} ry={-0.4} />

      {/* 会合所（町衆の寄合の館） */}
      <Kaigosho />
      {/* 土倉（金貸しの蔵。白いなまこ壁） */}
      <Dozo />

      {/* 東の陸門（京へもどる口の目印） */}
      <RikuMon x={14} z={8} />

      {/* 市：座をむすんだ店がならぶ（'ichi' の場のまわり） */}
      <Ichi />
      {/* 寄合：惣の談合（'so' の場のまわり、会合所の南） */}
      <Yoriai x={-9} z={2} />
      {/* 勘合の卓：合い札をあらためる（'fuda' の場、汀ちかく） */}
      <KangoFuda x={3.5} z={-6.2} />

      {/* 木々 */}
      {MINATO_TREES.map((t, i) => (
        <KTree key={i} x={t.x} z={t.z} kind={t.kind} s={t.s} />
      ))}

      <MinatoVegetation />

      {/* 町ゆく衆（自治の町のにぎわい） */}
      <KWalker x={2.5} mid={4} amp={6} speed={0.02} phase={0.6} robe="#4a5a52" />
      <KWalker x={-2.0} mid={3} amp={5} speed={0.025} phase={3.1} robe="#6a5a48" kasa />
      {/* 馬借：荷を陸門から汀へ運ぶ */}
      <Bashaku x0={12} z0={7} x1={2} z1={-4} period={11} phase={0.5} />
      <IdleHorse x={11.5} z={4.5} ry={-0.8} />
    </group>
  )
}

// 北の海。汀では波をゼロに、沖ほど大きくうねる
function MinatoSea() {
  const mesh = useRef<THREE.Mesh>(null)
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(140, 80, 90, 40)
    g.rotateX(-Math.PI / 2)
    return g
  }, [])
  const base = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry])
  const CZ = SHORE_Z - 38
  useFrame(({ clock }) => {
    if (!mesh.current) return
    const t = clock.elapsedTime
    const pos = mesh.current.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3]
      const wz = base[i * 3 + 2] + CZ
      // 汀（z=SHORE_Z）で波をゼロに——砂と海の刺し違いを出さない
      const amp = 0.24 * smoothstep(SHORE_Z, SHORE_Z - 18, wz)
      pos.setY(i, (
        Math.sin(x * 0.13 + t * 1.2) * 0.5 +
        Math.sin(wz * 0.15 + t * 0.8) * 0.35 +
        Math.sin((x + wz) * 0.05 + t * 0.45) * 0.3
      ) * amp)
    }
    pos.needsUpdate = true
  })
  return (
    <mesh ref={mesh} geometry={geometry} position={[0, -0.05, CZ]} raycast={noRay}>
      <meshLambertMaterial color="#4d6f83" transparent opacity={0.84} />
    </mesh>
  )
}

// 桟橋：汀から沖（勘合船）へのびる板の道
function Sanbashi() {
  return (
    <group raycast={noRay}>
      <mesh position={[0, 0.16, -9.6]}><boxGeometry args={[1.6, 0.16, 3.2]} /><meshLambertMaterial color={P.wood} /></mesh>
      {[[-0.7, -8.4], [0.7, -8.4], [-0.7, -10.8], [0.7, -10.8]].map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.0, pz]}><cylinderGeometry args={[0.07, 0.07, 0.6, 6]} /><meshLambertMaterial color={P.woodDark} /></mesh>
      ))}
    </group>
  )
}

// 沖の遠い船（見た目だけの小さな勘合船）
function DistantShip({ x, z, s = 1, ry = 0 }: { x: number; z: number; s?: number; ry?: number }) {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (g.current) g.current.rotation.z = Math.sin(clock.elapsedTime * 0.6 + x) * 0.04
  })
  return (
    <group position={[x, 0.05, z]} rotation-y={ry} scale={s} raycast={noRay}>
      <group ref={g}>
        <mesh position={[0, 0.3, 0]}><boxGeometry args={[2.4, 0.5, 0.9]} /><meshLambertMaterial color={P.woodDark} /></mesh>
        <mesh position={[0, 1.3, 0]}><cylinderGeometry args={[0.05, 0.06, 2.0, 6]} /><meshLambertMaterial color="#4a4038" /></mesh>
        <mesh position={[0, 1.5, 0]} rotation-y={Math.PI / 2}><planeGeometry args={[1.5, 1.4]} /><meshLambertMaterial color="#c7b58c" side={THREE.DoubleSide} /></mesh>
      </group>
    </group>
  )
}

// 会合所：町衆が寄りあう館。板葺の大屋根、幟に「会」。
function Kaigosho() {
  const cx = (KAIGOSHO.x0 + KAIGOSHO.x1) / 2
  const cz = (KAIGOSHO.z0 + KAIGOSHO.z1) / 2
  const w = KAIGOSHO.x1 - KAIGOSHO.x0
  const d = KAIGOSHO.z1 - KAIGOSHO.z0
  return (
    <group position={[cx, 0, cz]} raycast={noRay}>
      <mesh position={[0, 0.2, 0]}><boxGeometry args={[w, 0.4, d]} /><meshLambertMaterial color={P.earth} /></mesh>
      {/* 柱（南面） */}
      {[-w / 2 + 0.4, -0.5, 0.5, w / 2 - 0.4].map((px, i) => (
        <mesh key={i} position={[px, 1.2, d / 2 - 0.2]}><boxGeometry args={[0.2, 1.8, 0.2]} /><meshLambertMaterial color={P.woodDark} /></mesh>
      ))}
      {/* 板壁の身舎 */}
      <mesh position={[0, 1.35, -0.3]}><boxGeometry args={[w - 0.6, 1.9, d - 1.0]} /><meshLambertMaterial color={P.wood} /></mesh>
      {/* 縁側 */}
      <mesh position={[0, 0.5, d / 2 - 0.5]}><boxGeometry args={[w - 0.4, 0.14, 0.8]} /><meshLambertMaterial color={P.woodDark} /></mesh>
      {/* 板葺の大屋根（切妻） */}
      <mesh position={[0, 2.6, 0]}><boxGeometry args={[w + 0.6, 0.4, d + 0.6]} /><meshLambertMaterial color={P.roof} /></mesh>
      <mesh position={[0, 2.95, 0]}><boxGeometry args={[w - 0.8, 0.34, d - 0.6]} /><meshLambertMaterial color={P.roof} /></mesh>
      <mesh position={[0, 3.25, 0]}><boxGeometry args={[w - 2.4, 0.28, d - 1.6]} /><meshLambertMaterial color={P.woodDark} /></mesh>
      {/* 幟（会） */}
      <Banner x={-w / 2 - 0.4} z={d / 2 - 0.1} phase={0.5} c="#c8b888" />
    </group>
  )
}

// 土倉（どそう）：金貸しの蔵。厚い白壁と小さな窓、重い屋根。
function Dozo() {
  const cx = (KURA.x0 + KURA.x1) / 2
  const cz = (KURA.z0 + KURA.z1) / 2
  const w = KURA.x1 - KURA.x0
  const d = KURA.z1 - KURA.z0
  return (
    <group position={[cx, 0, cz]} raycast={noRay}>
      <mesh position={[0, 0.15, 0]}><boxGeometry args={[w + 0.2, 0.3, d + 0.2]} /><meshLambertMaterial color={P.ishi} /></mesh>
      {/* 白い塗り壁 */}
      <mesh position={[0, 1.35, 0]}><boxGeometry args={[w, 2.3, d]} /><meshLambertMaterial color="#d8d2c2" /></mesh>
      {/* 腰のなまこ壁（黒い格子のおもかげ） */}
      <mesh position={[0, 0.6, d / 2 + 0.01]}><boxGeometry args={[w, 0.7, 0.04]} /><meshLambertMaterial color={P.tetsu} /></mesh>
      {/* 小さな戸（南面） */}
      <mesh position={[0, 1.1, d / 2 + 0.03]}><boxGeometry args={[0.8, 1.4, 0.06]} /><meshLambertMaterial color={P.woodDark} /></mesh>
      {/* 重い瓦屋根 */}
      <mesh position={[0, 2.7, 0]}><boxGeometry args={[w + 0.5, 0.4, d + 0.5]} /><meshLambertMaterial color={P.tile} /></mesh>
      <mesh position={[0, 3.0, 0]}><boxGeometry args={[w - 0.4, 0.3, d - 0.4]} /><meshLambertMaterial color={P.tile} /></mesh>
    </group>
  )
}

// 東の陸門：京へもどる口。塀と門と、東へのびる道の目印。
function RikuMon({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]} raycast={noRay}>
      {/* 門柱と小屋根 */}
      {[-1.1, 1.1].map((px, i) => (
        <mesh key={i} position={[px, 1.1, 0]}><boxGeometry args={[0.28, 2.2, 0.28]} /><meshLambertMaterial color={P.woodDark} /></mesh>
      ))}
      <mesh position={[0, 2.15, 0]}><boxGeometry args={[3.0, 0.24, 0.4]} /><meshLambertMaterial color={P.roof} /></mesh>
      <mesh position={[0, 2.4, 0]}><boxGeometry args={[3.4, 0.18, 1.0]} /><meshLambertMaterial color={P.roof} /></mesh>
      {/* 両脇の塀 */}
      {[-2.4, 2.4].map((px, i) => (
        <mesh key={i} position={[px, 0.9, 0]}><boxGeometry args={[2.2, 1.8, 0.2]} /><meshLambertMaterial color="#c3b59a" /></mesh>
      ))}
    </group>
  )
}

// 市：座をむすんだ店がならぶ。布屋根の下に品と、あきんど。夜はしまう。
function Ichi() {
  const day = useGame(s => s.day)
  const t = useGame(s => s.t)
  if (t >= 0.72) return null
  const stalls = [
    { x: 7.0, z: 4.4, c: '#b8a06a', ry: 0.1 },
    { x: 9.4, z: 5.6, c: '#8a9a78', ry: -0.14 },
    { x: 6.6, z: 6.8, c: '#a98f68', ry: 0.2 },
  ]
  // 市は日ごとに品ぞろえがかわる（にぎわいの変化を、そっと）
  const lively = day % 2 === 0
  return (
    <group raycast={noRay}>
      {stalls.map((s, i) => (
        <group key={i} position={[s.x, 0, s.z]} rotation-y={s.ry}>
          {[[-0.85, -0.55], [0.85, -0.55], [-0.85, 0.55], [0.85, 0.55]].map(([dx, dz], k) => (
            <mesh key={k} raycast={noRay} position={[dx, 0.8, dz]}><cylinderGeometry args={[0.045, 0.055, 1.6, 5]} /><meshLambertMaterial color="#7a6448" /></mesh>
          ))}
          <mesh raycast={noRay} position={[0, 1.64, 0]} rotation-z={0.06}><boxGeometry args={[2.15, 0.06, 1.5]} /><meshLambertMaterial color={s.c} /></mesh>
          <mesh raycast={noRay} position={[0, 0.4, 0]}><boxGeometry args={[1.7, 0.12, 1.0]} /><meshLambertMaterial color="#8a7458" /></mesh>
          {/* 品：俵・壺・布 */}
          <mesh raycast={noRay} position={[-0.4, 0.58, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.16, 0.16, 0.55, 8]} /><meshLambertMaterial color="#c8b070" /></mesh>
          <mesh raycast={noRay} position={[0.2, 0.6, 0.12]}><sphereGeometry args={[0.16, 10, 8]} /><meshLambertMaterial color={i % 2 ? '#8a6a55' : '#6a7f8a'} /></mesh>
          {lively && <mesh raycast={noRay} position={[0.5, 0.6, -0.15]}><boxGeometry args={[0.4, 0.14, 0.5]} /><meshLambertMaterial color="#a45a58" /></mesh>}
          {/* あきんど（座のうしろ） */}
          <group position={[0, 0, -0.95]}>
            <mesh raycast={noRay} position={[0, 0.36, 0]}><coneGeometry args={[0.3, 0.72, 9]} /><meshLambertMaterial color={i % 2 ? '#5c5240' : '#4a5060'} /></mesh>
            <mesh raycast={noRay} position={[0, 0.82, 0]}><sphereGeometry args={[0.15, 12, 10]} /><meshLambertMaterial color={SKIN} /></mesh>
          </group>
        </group>
      ))}
    </group>
  )
}

// 寄合：惣の談合。むしろに車座で、村のおきてを決める衆。
function Yoriai({ x, z }: { x: number; z: number }) {
  const seats = [0, 1, 2, 3, 4]
  return (
    <group position={[x, 0, z]} raycast={noRay}>
      {/* むしろ */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}><planeGeometry args={[2.6, 2.6]} /><meshLambertMaterial color="#b6a570" /></mesh>
      {seats.map((k) => {
        const a = (k / seats.length) * Math.PI * 2 + 0.3
        return (
          <group key={k} position={[Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9]} rotation-y={-a + Math.PI / 2}>
            <mesh raycast={noRay} position={[0, 0.3, 0]}><coneGeometry args={[0.26, 0.6, 9]} /><meshLambertMaterial color={k % 2 ? '#57503f' : '#454b3f'} /></mesh>
            <mesh raycast={noRay} position={[0, 0.68, 0]}><sphereGeometry args={[0.13, 12, 10]} /><meshLambertMaterial color={SKIN} /></mesh>
          </group>
        )
      })}
    </group>
  )
}

// 勘合の卓：合い札をあらためる小さな机。汀ちかくに置く。
function KangoFuda({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]} raycast={noRay}>
      <mesh position={[0, 0.4, 0]}><boxGeometry args={[1.1, 0.1, 0.7]} /><meshLambertMaterial color={P.wood} /></mesh>
      {[[-0.45, -0.25], [0.45, -0.25], [-0.45, 0.25], [0.45, 0.25]].map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.2, pz]}><boxGeometry args={[0.08, 0.4, 0.08]} /><meshLambertMaterial color={P.woodDark} /></mesh>
      ))}
      {/* 合い札（勘合）を数枚 */}
      {[-0.2, 0.05, 0.28].map((dx, i) => (
        <mesh key={i} position={[dx, 0.48, 0.02]} rotation-z={0.02 * i}><boxGeometry args={[0.22, 0.03, 0.34]} /><meshLambertMaterial color={i === 1 ? P.shu : '#d8cdb2'} /></mesh>
      ))}
    </group>
  )
}

// 山肌の松原・草・岩（見た目だけ。種で決まる散布）
function MinatoVegetation() {
  const group = useMemo(() => {
    const g = new THREE.Group()
    const color = new THREE.Color()

    // 町のふちの草（道・建物・汀を避ける）
    const tufts = scatterPoints(55, 611, { x0: MINATO_BOUNDS.minX + 0.6, x1: MINATO_BOUNDS.maxX - 0.6, z0: SHORE_Z + 0.5, z1: MINATO_BOUNDS.maxZ - 0.6 },
      (x, z) => !minatoBlocked(x, z)
        && !(z > 5.3 && z < 7.7 && x > -8 && x < 14)   // 東西の道
        && !(x > -1.1 && x < 1.1)                        // 南北の道
        && MINATO_TREES.every(tr => (x - tr.x) ** 2 + (z - tr.z) ** 2 > 1))
    const tuftGeo = new THREE.ConeGeometry(0.2, 0.38, 4)
    const tuftMat = new THREE.MeshLambertMaterial({ flatShading: true })
    const tuftMesh = new THREE.InstancedMesh(tuftGeo, tuftMat, tufts.length)
    applyInstances(tuftMesh, tufts, (p, d, i) => {
      const s = 0.7 + p.rand * 0.8
      d.position.set(p.x, 0.16 * s, p.z)
      d.rotation.y = p.rand * Math.PI
      d.scale.setScalar(s)
      color.setHSL(0.22 + p.rand * 0.07, 0.3, 0.34 + ((p.rand * 7) % 1) * 0.08)
      tuftMesh.setColorAt(i, color)
    })

    // 東西南の山の松原（北の海にはつくらない）
    const wild = { x0: -80, x1: 80, z0: -6, z1: 80 }
    const pinesPts = scatterPoints(120, 344, wild, (_x, _z, h) => h > 0.7 && h < 7, minatoRelief)
    const trunkGeo = new THREE.CylinderGeometry(0.09, 0.16, 1.2, 5)
    const trunkMat = new THREE.MeshLambertMaterial({ color: '#5d4a34', flatShading: true })
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, pinesPts.length)
    applyInstances(trunks, pinesPts, (p, d) => {
      const s = 0.9 + p.rand * 0.9
      d.position.set(p.x, p.h + 0.55 * s, p.z)
      d.rotation.y = p.rand * Math.PI * 2
      d.scale.setScalar(s)
    })
    const pineGeo = new THREE.ConeGeometry(0.95, 1.75, 6)
    const pineMat = new THREE.MeshLambertMaterial({ flatShading: true })
    const pineMesh = new THREE.InstancedMesh(pineGeo, pineMat, pinesPts.length)
    applyInstances(pineMesh, pinesPts, (p, d, i) => {
      const s = 0.9 + p.rand * 0.9
      d.position.set(p.x, p.h + 1.45 * s, p.z)
      d.rotation.y = p.rand * 6
      d.scale.setScalar(s)
      color.setHSL(0.33 + p.rand * 0.05, 0.32, 0.2 + ((p.rand * 11) % 1) * 0.08)
      pineMesh.setColorAt(i, color)
    })

    // 磯と山の岩
    const rocks = scatterPoints(34, 190, { x0: -80, x1: 80, z0: -14, z1: 80 },
      (_x, z, h) => (h > 0.25 && h < 8) || (z < SHORE_Z && h > -0.3 && h < 0.2), minatoRelief)
    const rockGeo = new THREE.IcosahedronGeometry(0.5, 0)
    const rockMat = new THREE.MeshLambertMaterial({ flatShading: true })
    const rockMesh = new THREE.InstancedMesh(rockGeo, rockMat, rocks.length)
    applyInstances(rockMesh, rocks, (p, d, i) => {
      const s = 0.6 + p.rand * 1.6
      d.position.set(p.x, p.h + 0.12 * s, p.z)
      d.rotation.set(p.rand * 4, p.rand * 8, p.rand * 5)
      d.scale.set(s, s * (0.6 + p.rand * 0.5), s)
      color.setHSL(0.58, 0.04, 0.4 + ((p.rand * 11) % 1) * 0.12)
      rockMesh.setColorAt(i, color)
    })

    for (const m of [tuftMesh, pineMesh, rockMesh]) {
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
    for (const m of [tuftMesh, trunks, pineMesh, rockMesh]) {
      m.raycast = () => {}
      g.add(m)
    }
    return g
  }, [])
  return <primitive object={group} />
}

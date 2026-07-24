// 室町の京の3D。時代パックの World / LandmarkMesh として供する。
// 三方を山にかこまれた盆地に、室町大路が南北にはしる。北に花の御所、北西に金閣、
// 東に能舞台、南東に銀閣。西のはずれの舟着きから、川をくだって湊へゆける。
// 山は起伏の地形そのもの（HILLS のデータどおりに立つ）。名所の立体は下の
// MuromachiLandmarkMesh が持ち、engine が各名所の座標に据える（すべて +z 向き）。
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { useGame } from '../game/store'
import { P } from './palette'
import { OMICHI, TSUJI, POND, TREES, BED, SPAWN, blocked } from './layout'
import { buildGroundGeometry, scatterPoints, applyInstances } from '../engine/procedural'
import { kyoRelief, kyoGroundColor } from './terrain'
import { KWalker, Bashaku } from './liveActors'

const noRay = () => null

export function KyoWorld() {
  const walkTo = useGame(s => s.walkTo)
  const onGround = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const x = e.point.x, z = e.point.z
    if (!blocked(x, z)) walkTo(x, z)
  }
  const omichiZc = (OMICHI.z0 + OMICHI.z1) / 2
  const omichiD = OMICHI.z1 - OMICHI.z0
  const tsujiXc = (TSUJI.x0 + TSUJI.x1) / 2
  const tsujiW = TSUJI.x1 - TSUJI.x0
  const pondXc = (POND.x0 + POND.x1) / 2
  const pondZc = (POND.z0 + POND.z1) / 2
  // 起伏と頂点色の地面（遊び場は平ら、三方に山が立つ）
  const groundGeo = useMemo(() => buildGroundGeometry(240, 210, kyoRelief, kyoGroundColor), [])

  return (
    <group>
      {/* 地面（都の土・山肌） */}
      <mesh geometry={groundGeo} onClick={onGround}>
        <meshLambertMaterial vertexColors />
      </mesh>

      {/* 室町大路（南北の土の大路） */}
      <mesh rotation-x={-Math.PI / 2} position={[OMICHI.x, 0.006, omichiZc]} onClick={onGround}>
        <planeGeometry args={[OMICHI.w, omichiD]} />
        <meshLambertMaterial color={P.sand} />
      </mesh>
      {/* 一条の辻（東西の道：金閣・大路・能舞台をむすぶ） */}
      <mesh rotation-x={-Math.PI / 2} position={[tsujiXc, 0.005, TSUJI.z]} onClick={onGround}>
        <planeGeometry args={[tsujiW, TSUJI.w]} />
        <meshLambertMaterial color={P.sand} />
      </mesh>

      {/* 金閣の鏡湖池（水面。入れない） */}
      <KagamiIke x={pondXc} z={pondZc} w={POND.x1 - POND.x0} d={POND.z1 - POND.z0} />

      {/* 木々（松を主に、紅葉もいくらか） */}
      {TREES.map((t, i) => (
        <KTree key={i} x={t.x} z={t.z} kind={t.kind} s={t.s} />
      ))}

      {/* 山の草・松原・岩 */}
      <KyoVegetation />

      {/* 大路をゆく町衆（南北に往き来。夜はやすむ） */}
      <KWalker x={-1.5} mid={2} amp={12} speed={0.02} phase={0.4} robe="#5a6a4a" kasa />
      <KWalker x={0.4} mid={0} amp={13} speed={0.015} phase={2.6} robe="#7a5a6e" />
      <KWalker x={1.6} mid={-1} amp={10} speed={0.024} phase={4.4} robe="#4a566a" />
      {/* 馬借：荷を積んだ馬が、大路を京と湊のあいだへ往き来する */}
      <Bashaku x0={2.0} z0={16} x1={2.0} z1={-6} period={13} phase={0.3} />

      {/* 書院（座敷飾り）——同朋衆のしつらえ。書院造にふれられる小さな会所 */}
      <Shoin x={8.5} z={-3} />

      {/* 西のはずれの舟着き（川をくだって湊へ。門の目印） */}
      <Funatsuki x={-19} z={7.4} />
    </group>
  )
}

// 鏡湖池：金閣をうつす静かな水面（ごくゆるい波）
function KagamiIke({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  const mesh = useRef<THREE.Mesh>(null)
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(w, d, 16, 18)
    g.rotateX(-Math.PI / 2)
    return g
  }, [w, d])
  const base = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry])
  useFrame(({ clock }) => {
    if (!mesh.current) return
    const t = clock.elapsedTime
    const pos = mesh.current.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const px = base[i * 3], pz = base[i * 3 + 2]
      pos.setY(i, (Math.sin(px * 0.8 + t * 0.7) + Math.sin(pz * 0.7 + t * 0.5)) * 0.03)
    }
    pos.needsUpdate = true
  })
  return (
    <mesh ref={mesh} geometry={geometry} position={[x, 0.02, z]} raycast={noRay}>
      <meshLambertMaterial color={P.kawa} transparent opacity={0.86} />
    </mesh>
  )
}

// 書院（会所の一室）：畳・明かり障子・床の間をそなえた、和室の原型。
// 前面（+z）はひらいて、なかの床の間が見える。座敷飾りは同朋衆の務め。
function Shoin({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]} raycast={noRay}>
      {/* 縁と床（畳） */}
      <mesh raycast={noRay} position={[0, 0.2, 0]}><boxGeometry args={[3.0, 0.4, 2.6]} /><meshLambertMaterial color={P.wood} /></mesh>
      <mesh raycast={noRay} position={[0, 0.41, 0.1]}><boxGeometry args={[2.5, 0.04, 2.0]} /><meshLambertMaterial color="#b9b487" /></mesh>
      {/* 畳の目地（前後に一本） */}
      <mesh raycast={noRay} position={[0, 0.44, 0.1]}><boxGeometry args={[2.5, 0.02, 0.03]} /><meshLambertMaterial color="#8f8a5f" /></mesh>
      {/* 柱 */}
      {[[-1.4, 1.15], [1.4, 1.15], [-1.4, -1.15], [1.4, -1.15]].map(([px, pz], i) => (
        <mesh key={i} raycast={noRay} position={[px, 1.15, pz]}><boxGeometry args={[0.14, 1.7, 0.14]} /><meshLambertMaterial color={P.woodDark} /></mesh>
      ))}
      {/* 背面の壁と、床の間（床がまえ） */}
      <mesh raycast={noRay} position={[0, 1.1, -1.2]}><boxGeometry args={[2.7, 1.6, 0.12]} /><meshLambertMaterial color={P.gofun} /></mesh>
      <mesh raycast={noRay} position={[-0.75, 0.95, -1.05]}><boxGeometry args={[0.9, 1.3, 0.18]} /><meshLambertMaterial color="#3a332b" /></mesh>
      {/* 掛軸（墨の一幅）と、生けた花 */}
      <mesh raycast={noRay} position={[-0.75, 1.15, -0.98]}><boxGeometry args={[0.34, 0.9, 0.02]} /><meshLambertMaterial color="#d8cdb2" /></mesh>
      <mesh raycast={noRay} position={[-0.4, 0.62, -0.95]}><cylinderGeometry args={[0.06, 0.08, 0.24, 8]} /><meshLambertMaterial color="#4a4038" /></mesh>
      <mesh raycast={noRay} position={[-0.4, 0.82, -0.95]}><sphereGeometry args={[0.12, 10, 8]} /><meshLambertMaterial color="#7c8b57" /></mesh>
      {/* 明かり障子（左右の袖壁） */}
      {[-1.35, 1.35].map((sx, i) => (
        <mesh key={i} raycast={noRay} position={[sx, 1.0, -0.2]}><boxGeometry args={[0.06, 1.4, 1.8]} /><meshLambertMaterial color="#e7e0cc" /></mesh>
      ))}
      {/* 檜皮ふうの屋根 */}
      <mesh raycast={noRay} position={[0, 2.15, -0.1]}><boxGeometry args={[3.4, 0.28, 3.0]} /><meshLambertMaterial color={P.roof} /></mesh>
      <mesh raycast={noRay} position={[0, 2.4, -0.1]}><boxGeometry args={[2.2, 0.24, 1.9]} /><meshLambertMaterial color={P.woodDark} /></mesh>
    </group>
  )
}

// 西の舟着き：川べりの板の桟橋と、つながれた小舟。門の目印。
function Funatsuki({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]} raycast={noRay}>
      {/* 川の水（西へひろがる） */}
      <mesh rotation-x={-Math.PI / 2} position={[-1.8, 0.0, 0]} raycast={noRay}>
        <planeGeometry args={[4.5, 6.5]} /><meshLambertMaterial color={P.kawa} transparent opacity={0.85} />
      </mesh>
      {/* 桟橋 */}
      <mesh raycast={noRay} position={[-0.4, 0.14, 0]}><boxGeometry args={[2.2, 0.14, 1.1]} /><meshLambertMaterial color={P.wood} /></mesh>
      {[[-1.3, -0.5], [-1.3, 0.5], [0.5, -0.5], [0.5, 0.5]].map(([px, pz], i) => (
        <mesh key={i} raycast={noRay} position={[px, 0.02, pz]}><cylinderGeometry args={[0.06, 0.06, 0.4, 6]} /><meshLambertMaterial color={P.woodDark} /></mesh>
      ))}
      {/* 小舟 */}
      <group position={[-2.0, 0.1, 0.3]} rotation-y={0.2} raycast={noRay}>
        <mesh raycast={noRay} position={[0, 0.1, 0]}><boxGeometry args={[0.7, 0.24, 2.0]} /><meshLambertMaterial color={P.woodDark} /></mesh>
        <mesh raycast={noRay} position={[0, 0.02, 1.05]} rotation-x={0.5}><boxGeometry args={[0.55, 0.2, 0.5]} /><meshLambertMaterial color={P.woodDark} /></mesh>
      </group>
    </group>
  )
}

// 松と紅葉。谷戸・湊の場面でも使う共通の木。
export function KTree({ x, z, kind, s }: { x: number; z: number; kind: 'maple' | 'pine'; s: number }) {
  const blobs = kind === 'maple'
    ? [
        { dx: 0, dy: 2.4, dz: 0, r: 1.05, c: '#c05a26' },
        { dx: -0.75, dy: 2.05, dz: 0.2, r: 0.78, c: '#9f4620' },
        { dx: 0.72, dy: 2.15, dz: -0.15, r: 0.72, c: '#cf7a2e' },
      ]
    : [
        { dx: 0, dy: 2.7, dz: 0, r: 1.0, c: P.matsu },
        { dx: -0.85, dy: 2.15, dz: 0.2, r: 0.72, c: P.hillDark },
        { dx: 0.82, dy: 2.3, dz: -0.15, r: 0.68, c: P.matsu },
      ]
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 1.15, 0]} raycast={noRay}>
        <cylinderGeometry args={[0.12, 0.19, 2.3, 10]} />
        <meshLambertMaterial color={P.woodDark} />
      </mesh>
      {blobs.map((b, i) => (
        <mesh key={i} position={[b.dx, b.dy, b.dz]} scale={[1, kind === 'pine' ? 0.5 : 0.8, 1]} raycast={noRay}>
          <sphereGeometry args={[b.r, 16, 12]} />
          <meshLambertMaterial color={b.c} />
        </mesh>
      ))}
    </group>
  )
}

// 山肌の松原・草・岩（見た目だけ。種で決まる散布）
function KyoVegetation() {
  const group = useMemo(() => {
    const g = new THREE.Group()
    const color = new THREE.Color()

    // 遊び場のふちの草（大路・辻・池・宿・名所・木のきわを避ける）
    const tufts = scatterPoints(80, 417, { x0: -21.4, x1: 21.4, z0: -19.4, z1: 19.4 },
      (x, z) => !blocked(x, z)
        && Math.abs(x - OMICHI.x) > OMICHI.w / 2 + 0.9
        && Math.abs(z - TSUJI.z) > TSUJI.w / 2 + 0.9
        && (x - BED.x) ** 2 + (z - BED.z) ** 2 > 3.2
        && (x - SPAWN[0]) ** 2 + (z - SPAWN[1]) ** 2 > 2.4
        && !(x < -16 && z > 3 && z < 12)   // 西の舟着き
        && TREES.every(tr => (x - tr.x) ** 2 + (z - tr.z) ** 2 > 1))
    const tuftGeo = new THREE.ConeGeometry(0.2, 0.38, 4)
    const tuftMat = new THREE.MeshLambertMaterial({ flatShading: true })
    const tuftMesh = new THREE.InstancedMesh(tuftGeo, tuftMat, tufts.length)
    applyInstances(tuftMesh, tufts, (p, d, i) => {
      const s = 0.7 + p.rand * 0.8
      d.position.set(p.x, 0.16 * s, p.z)
      d.rotation.y = p.rand * Math.PI
      d.scale.setScalar(s)
      color.setHSL(0.2 + p.rand * 0.08, 0.3, 0.34 + ((p.rand * 7) % 1) * 0.08)
      tuftMesh.setColorAt(i, color)
    })

    // 三方の山の松原
    const wild = { x0: -110, x1: 110, z0: -95, z1: 95 }
    const pinesPts = scatterPoints(180, 733, wild, (_x, _z, h) => h > 0.7 && h < 7, kyoRelief)
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

    // 岩
    const rocks = scatterPoints(40, 977, wild, (_x, _z, h) => h > 0.25 && h < 8, kyoRelief)
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

// ===================== 名所の立体（すべて +z＝南 向き） =====================
export function MuromachiLandmarkMesh({ kind }: { kind: string }) {
  if (kind === 'kinkaku') return <Kinkaku />
  if (kind === 'bakufu') return <HanaGosho />
  if (kind === 'noh') return <NohStage />
  if (kind === 'ginkaku') return <Ginkaku />
  return <KangoBune /> // minato
}

// 金閣（鹿苑寺）：三層の楼閣。一層は白い寝殿造、上二層は金色。頂に鳳凰。
function Kinkaku() {
  return (
    <group>
      {/* 基壇 */}
      <mesh position={[0, 0.2, 0]}><boxGeometry args={[3.4, 0.4, 3.4]} /><meshLambertMaterial color={P.ishi} /></mesh>
      {/* 一層（法水院・寝殿造。白壁と木の柱） */}
      <mesh position={[0, 1.0, 0]}><boxGeometry args={[3.0, 1.2, 3.0]} /><meshLambertMaterial color={P.gofun} /></mesh>
      {[-1.4, -0.47, 0.47, 1.4].map((px, i) => (
        <mesh key={i} position={[px, 1.0, 1.52]}><boxGeometry args={[0.12, 1.2, 0.1]} /><meshLambertMaterial color={P.woodDark} /></mesh>
      ))}
      <mesh position={[0, 1.72, 0]} rotation-y={Math.PI / 4}><coneGeometry args={[2.5, 0.5, 4]} /><meshLambertMaterial color={P.roof} /></mesh>
      {/* 二層（潮音洞・金色） */}
      <mesh position={[0, 2.35, 0]}><boxGeometry args={[2.5, 1.05, 2.5]} /><meshLambertMaterial color={P.kin} /></mesh>
      {/* 高欄（縁） */}
      <mesh position={[0, 1.9, 1.34]}><boxGeometry args={[2.6, 0.08, 0.1]} /><meshLambertMaterial color={P.kinDeep} /></mesh>
      <mesh position={[0, 3.0, 0]} rotation-y={Math.PI / 4}><coneGeometry args={[2.05, 0.45, 4]} /><meshLambertMaterial color={P.roof} /></mesh>
      {/* 三層（究竟頂・金色） */}
      <mesh position={[0, 3.55, 0]}><boxGeometry args={[1.8, 0.95, 1.8]} /><meshLambertMaterial color={P.kin} /></mesh>
      <mesh position={[0, 4.25, 0]} rotation-y={Math.PI / 4}><coneGeometry args={[1.5, 0.7, 4]} /><meshLambertMaterial color={P.roof} /></mesh>
      {/* 宝珠と鳳凰 */}
      <mesh position={[0, 4.68, 0]}><sphereGeometry args={[0.12, 10, 8]} /><meshLambertMaterial color={P.kinDeep} /></mesh>
      <group position={[0, 4.95, 0]}>
        <mesh><boxGeometry args={[0.12, 0.24, 0.36]} /><meshLambertMaterial color={P.kin} /></mesh>
        <mesh position={[0, 0.06, -0.28]} rotation-x={0.5}><coneGeometry args={[0.06, 0.4, 6]} /><meshLambertMaterial color={P.kin} /></mesh>
        <mesh position={[0, 0.22, 0.1]} rotation-x={-0.3}><coneGeometry args={[0.05, 0.24, 6]} /><meshLambertMaterial color={P.kinDeep} /></mesh>
      </group>
    </group>
  )
}

// 花の御所（室町殿）：築地塀にかこまれ、南に四脚門。なかに檜皮葺の寝殿。
function HanaGosho() {
  const wallC = P.gofun, coping = P.tile
  return (
    <group>
      {/* 築地塀（白壁＋瓦の笠） */}
      {[
        { x: 0, y: 0.9, z: -3.0, w: 9.2, h: 1.8, d: 0.3 },     // 北
        { x: -4.45, y: 0.9, z: -0.2, w: 0.3, h: 1.8, d: 5.6 }, // 西
        { x: 4.45, y: 0.9, z: -0.2, w: 0.3, h: 1.8, d: 5.6 },  // 東
        { x: -3.05, y: 0.9, z: 2.6, w: 3.1, h: 1.8, d: 0.3 },  // 南（西より）
        { x: 3.05, y: 0.9, z: 2.6, w: 3.1, h: 1.8, d: 0.3 },   // 南（東より）
      ].map((s, i) => (
        <group key={i}>
          <mesh position={[s.x, s.y, s.z]}><boxGeometry args={[s.w, s.h, s.d]} /><meshLambertMaterial color={wallC} /></mesh>
          <mesh position={[s.x, s.h + 0.05, s.z]}><boxGeometry args={[s.w + 0.16, 0.14, s.d + 0.16]} /><meshLambertMaterial color={coping} /></mesh>
        </group>
      ))}
      {/* 四脚門（南） */}
      {[-1.0, 1.0].map((px, i) => (
        <mesh key={i} position={[px, 1.0, 2.6]}><boxGeometry args={[0.24, 2.0, 0.24]} /><meshLambertMaterial color={P.woodDark} /></mesh>
      ))}
      <mesh position={[0, 2.1, 2.6]}><boxGeometry args={[2.8, 0.2, 0.9]} /><meshLambertMaterial color={P.roof} /></mesh>
      <mesh position={[0, 2.32, 2.6]}><boxGeometry args={[3.2, 0.16, 1.2]} /><meshLambertMaterial color={P.roof} /></mesh>
      {/* 寝殿（母屋）：白壁・朱の柱・檜皮の入母屋屋根 */}
      <group position={[0, 0, -0.8]}>
        <mesh position={[0, 0.35, 0]}><boxGeometry args={[6.2, 0.4, 3.2]} /><meshLambertMaterial color={P.wood} /></mesh>
        {[-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((px, i) => (
          <mesh key={i} position={[px, 1.25, 1.5]}><boxGeometry args={[0.18, 1.5, 0.18]} /><meshLambertMaterial color={P.shu} /></mesh>
        ))}
        <mesh position={[0, 1.3, -0.2]}><boxGeometry args={[5.4, 1.6, 2.4]} /><meshLambertMaterial color={P.gofun} /></mesh>
        {/* 蔀戸（朱の格子）と縁 */}
        <mesh position={[0, 1.2, 1.05]}><boxGeometry args={[5.4, 1.4, 0.12]} /><meshLambertMaterial color={P.shu} /></mesh>
        <mesh position={[0, 0.62, 1.55]}><boxGeometry args={[5.8, 0.14, 0.7]} /><meshLambertMaterial color={P.woodDark} /></mesh>
        {/* 檜皮葺の大屋根（入母屋・反り） */}
        <mesh position={[0, 2.5, -0.1]}><boxGeometry args={[7.2, 0.5, 4.0]} /><meshLambertMaterial color={P.roof} /></mesh>
        <mesh position={[0, 2.92, -0.1]}><boxGeometry args={[4.8, 0.42, 2.6]} /><meshLambertMaterial color={P.roof} /></mesh>
        <mesh position={[0, 3.28, -0.1]}><boxGeometry args={[2.4, 0.3, 1.4]} /><meshLambertMaterial color={P.woodDark} /></mesh>
      </group>
    </group>
  )
}

// 能舞台：白洲にのぞむ四本柱の舞台。背に松の鏡板（+z＝客のほうを向く）。
function NohStage() {
  return (
    <group>
      {/* 白洲（玉砂利） */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 1.3]}><planeGeometry args={[4.4, 2.6]} /><meshLambertMaterial color={P.ishi} /></mesh>
      {/* 舞台の板床 */}
      <mesh position={[0, 0.32, 0]}><boxGeometry args={[3.0, 0.5, 3.0]} /><meshLambertMaterial color="#b09461" /></mesh>
      <mesh position={[0, 0.58, 0]}><boxGeometry args={[2.9, 0.05, 2.9]} /><meshLambertMaterial color="#c2a874" /></mesh>
      {/* 四本柱 */}
      {[[-1.3, 1.3], [1.3, 1.3], [-1.3, -1.3], [1.3, -1.3]].map(([px, pz], i) => (
        <mesh key={i} position={[px, 1.6, pz]}><boxGeometry args={[0.16, 2.4, 0.16]} /><meshLambertMaterial color={P.woodDark} /></mesh>
      ))}
      {/* 背面の鏡板（松を描く。-z にたて、松は +z を向く） */}
      <mesh position={[0, 1.7, -1.42]}><boxGeometry args={[2.9, 2.0, 0.12]} /><meshLambertMaterial color="#c9b57e" /></mesh>
      <group position={[0, 1.5, -1.34]}>
        <mesh position={[0, 0.6, 0]}><cylinderGeometry args={[0.06, 0.09, 1.3, 6]} /><meshLambertMaterial color="#5a4a34" /></mesh>
        {[[0, 1.25, 0.62], [-0.6, 1.0, 0.5], [0.62, 1.05, 0.5]].map(([bx, by, r], i) => (
          <mesh key={i} position={[bx, by, 0.02]} scale={[1, 0.6, 0.2]}><sphereGeometry args={[r, 12, 10]} /><meshLambertMaterial color={P.matsu} /></mesh>
        ))}
      </group>
      {/* 入母屋の屋根 */}
      <mesh position={[0, 2.95, 0]}><boxGeometry args={[3.7, 0.4, 3.7]} /><meshLambertMaterial color={P.roof} /></mesh>
      <mesh position={[0, 3.3, 0]} rotation-y={Math.PI / 4}><coneGeometry args={[2.5, 0.8, 4]} /><meshLambertMaterial color={P.roof} /></mesh>
      {/* 橋掛り（西へのびる廊。松三本のおもかげ） */}
      <mesh position={[-2.5, 0.45, -0.6]}><boxGeometry args={[2.2, 0.34, 1.0]} /><meshLambertMaterial color="#b09461" /></mesh>
      <mesh position={[-2.5, 1.9, -0.6]}><boxGeometry args={[2.4, 0.24, 1.2]} /><meshLambertMaterial color={P.roof} /></mesh>
      {[-1.7, -2.5, -3.3].map((bx, i) => (
        <mesh key={i} position={[bx, 0.95, 0]}><boxGeometry args={[0.12, 0.9, 0.12]} /><meshLambertMaterial color={P.woodDark} /></mesh>
      ))}
    </group>
  )
}

// 銀閣（慈照寺観音殿）：二層の楼閣。簡素な木と銀鼠。前に向月台の砂。
function Ginkaku() {
  return (
    <group>
      {/* 銀沙灘（白砂）と向月台（砂の円錐台） */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 2.2]}><planeGeometry args={[3.4, 2.2]} /><meshLambertMaterial color={P.sand} /></mesh>
      <mesh position={[0, 0.45, 2.4]}><cylinderGeometry args={[0.55, 0.85, 0.9, 20]} /><meshLambertMaterial color="#d8cdaa" /></mesh>
      {/* 基壇 */}
      <mesh position={[0, 0.2, 0]}><boxGeometry args={[3.0, 0.4, 3.0]} /><meshLambertMaterial color={P.ishi} /></mesh>
      {/* 一層（心空殿・書院造。木と白） */}
      <mesh position={[0, 1.0, 0]}><boxGeometry args={[2.7, 1.2, 2.7]} /><meshLambertMaterial color={P.gofun} /></mesh>
      {[-1.25, -0.42, 0.42, 1.25].map((px, i) => (
        <mesh key={i} position={[px, 1.0, 1.37]}><boxGeometry args={[0.12, 1.2, 0.1]} /><meshLambertMaterial color={P.woodDark} /></mesh>
      ))}
      <mesh position={[0, 1.72, 0]} rotation-y={Math.PI / 4}><coneGeometry args={[2.2, 0.5, 4]} /><meshLambertMaterial color={P.roof} /></mesh>
      {/* 二層（潮音閣・銀鼠） */}
      <mesh position={[0, 2.35, 0]}><boxGeometry args={[2.0, 1.05, 2.0]} /><meshLambertMaterial color={P.gin} /></mesh>
      <mesh position={[0, 1.9, 1.06]}><boxGeometry args={[2.1, 0.08, 0.1]} /><meshLambertMaterial color={P.ginDeep} /></mesh>
      <mesh position={[0, 3.02, 0]} rotation-y={Math.PI / 4}><coneGeometry args={[1.7, 0.72, 4]} /><meshLambertMaterial color={P.roof} /></mesh>
      {/* 宝珠 */}
      <mesh position={[0, 3.5, 0]}><sphereGeometry args={[0.12, 10, 8]} /><meshLambertMaterial color={P.kinDeep} /></mesh>
    </group>
  )
}

// 勘合船：湊の沖に浮かぶ、明とむすぶ交易の大船（+z＝岸のほうへ舷を向ける）。
function KangoBune() {
  return (
    <group>
      {/* 船体 */}
      <mesh position={[0, 0.4, 0]}><boxGeometry args={[4.4, 0.8, 1.5]} /><meshLambertMaterial color={P.woodDark} /></mesh>
      <mesh position={[-2.35, 0.75, 0]} rotation-z={0.55}><boxGeometry args={[0.9, 0.7, 1.4]} /><meshLambertMaterial color="#43331f" /></mesh>
      <mesh position={[2.35, 0.75, 0]} rotation-z={-0.55}><boxGeometry args={[0.9, 0.7, 1.4]} /><meshLambertMaterial color="#43331f" /></mesh>
      {/* 舷側の板 */}
      <mesh position={[0, 0.85, 0.66]}><boxGeometry args={[4.0, 0.4, 0.1]} /><meshLambertMaterial color={P.wood} /></mesh>
      <mesh position={[0, 0.85, -0.66]}><boxGeometry args={[4.0, 0.4, 0.1]} /><meshLambertMaterial color={P.wood} /></mesh>
      {/* 船室（艫のほう） */}
      <mesh position={[-1.1, 1.25, 0]}><boxGeometry args={[1.5, 0.9, 1.3]} /><meshLambertMaterial color={P.wood} /></mesh>
      <mesh position={[-1.1, 1.82, 0]}><boxGeometry args={[1.7, 0.24, 1.5]} /><meshLambertMaterial color={P.roof} /></mesh>
      {/* 帆柱と網代帆 */}
      <mesh position={[0.6, 2.1, 0]}><cylinderGeometry args={[0.08, 0.1, 3.4, 8]} /><meshLambertMaterial color="#4a4038" /></mesh>
      <mesh position={[0.6, 2.3, 0]} rotation-y={Math.PI / 2}><planeGeometry args={[2.2, 2.4]} /><meshLambertMaterial color="#c7b58c" side={THREE.DoubleSide} /></mesh>
      {/* 帆の桟 */}
      {[-0.9, 0, 0.9].map((dy, i) => (
        <mesh key={i} position={[0.6, 2.3 + dy, 0]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.03, 0.03, 2.2, 5]} /><meshLambertMaterial color="#5a4a34" /></mesh>
      ))}
      {/* 「勘合」の合い札をかかげる幟（艫） */}
      <mesh position={[-2.1, 1.7, 0]}><cylinderGeometry args={[0.04, 0.04, 2.2, 6]} /><meshLambertMaterial color="#5a4632" /></mesh>
      <mesh position={[-1.85, 2.3, 0]}><boxGeometry args={[0.5, 0.7, 0.03]} /><meshLambertMaterial color={P.shu} /></mesh>
    </group>
  )
}

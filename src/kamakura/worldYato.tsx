// 谷戸の3D。切通しのむこうの山あいに、武士の館——堀と塀、母屋、的場の流鏑馬、
// 二毛作の麦の田、厩。教科書の「武士の館」の想像図を、歩ける暮らしとして立てる。
import { useMemo } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { useGame } from '../game/store'
import { P } from './palette'
import {
  YATO_TREES, HALL, FENCE, MOAT, PEN, PADDY, BABA, MATO,
  yatoBlocked, yatoRelief, yatoGroundColor,
} from './yato'
import { buildGroundGeometry, scatterPoints, applyInstances } from '../engine/procedural'
import { KTree } from './world'
import { MountedArcher, Farmer, IdleHorse, Banner } from './liveActors'

const noRay = () => null

export function YatoWorld() {
  const walkTo = useGame(s => s.walkTo)
  const onGround = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const x = e.point.x, z = e.point.z
    if (!yatoBlocked(x, z)) walkTo(x, z)
  }
  const groundGeo = useMemo(() => buildGroundGeometry(180, 170, yatoRelief, yatoGroundColor), [])
  return (
    <group>
      {/* 谷底と、三方の山 */}
      <mesh geometry={groundGeo} onClick={onGround}>
        <meshLambertMaterial vertexColors />
      </mesh>

      {/* 径：切通しの口から西へ、折れて館の橋へ */}
      <mesh rotation-x={-Math.PI / 2} position={[11.5, 0.006, 2]} onClick={onGround}>
        <planeGeometry args={[9.0, 2.2]} /><meshLambertMaterial color="#a08e68" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[3.4, 0.007, 2]} onClick={onGround}>
        <planeGeometry args={[7.4, 1.9]} /><meshLambertMaterial color="#a08e68" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.008, -0.6]} onClick={onGround}>
        <planeGeometry args={[1.9, 5.4]} /><meshLambertMaterial color="#a08e68" />
      </mesh>

      {/* 武士の館：堀・板塀・門と橋・母屋 */}
      <Yakata />

      {/* 的場：流鏑馬の稽古（走る馬から、三つの的を射る） */}
      <MountedArcher x0={BABA.x} z0={BABA.z0} x1={BABA.x} z1={BABA.z1} targets={MATO} period={6.5} />

      {/* 二毛作の田と、働く農人 */}
      <Mugita />
      <Farmer x={6.4} z={4.6} ry={-0.4} phase={0} />
      <Farmer x={9.8} z={7.2} ry={2.6} phase={2.2} />

      {/* 厩の囲いと馬 */}
      <Umaya />

      {/* 東の切通し（浜への口） */}
      <KiridoshiYato />

      {/* 木々 */}
      {YATO_TREES.map((t, i) => (
        <KTree key={i} x={t.x} z={t.z} kind={t.kind} s={t.s} />
      ))}

      <YatoVegetation />
    </group>
  )
}

// 武士の館。堀にかこまれ、板塀がめぐり、南の門に橋がかかる。
// 御家人のことば「わしらの館は、堀と塀にかこまれておってな」を、そのまま立てる。
function Yakata() {
  const hallX = (HALL.x0 + HALL.x1) / 2
  const hallZ = (HALL.z0 + HALL.z1) / 2
  const fenceW = FENCE.x1 - FENCE.x0
  const fenceD = FENCE.z1 - FENCE.z0
  const fenceZc = (FENCE.z0 + FENCE.z1) / 2
  const southLen = -FENCE.gap - FENCE.x0
  const moatN = MOAT.z0 + MOAT.w / 2
  const moatS = MOAT.z1 - MOAT.w / 2
  const moatZc = (MOAT.z0 + MOAT.z1) / 2
  const moatD = MOAT.z1 - MOAT.z0
  const southSegLen = -MOAT.gap - MOAT.x0
  return (
    <group raycast={noRay}>
      {/* 堀の水 */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, moatN]} raycast={noRay}>
        <planeGeometry args={[MOAT.x1 - MOAT.x0, MOAT.w]} /><meshLambertMaterial color="#4a6a62" transparent opacity={0.92} />
      </mesh>
      {[MOAT.x0 + MOAT.w / 2, MOAT.x1 - MOAT.w / 2].map((mx, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[mx, 0.02, moatZc]} raycast={noRay}>
          <planeGeometry args={[MOAT.w, moatD]} /><meshLambertMaterial color="#4a6a62" transparent opacity={0.92} />
        </mesh>
      ))}
      {[-1, 1].map(s => (
        <mesh key={s} rotation-x={-Math.PI / 2} position={[s * (MOAT.gap + southSegLen / 2), 0.02, moatS]} raycast={noRay}>
          <planeGeometry args={[southSegLen, MOAT.w]} /><meshLambertMaterial color="#4a6a62" transparent opacity={0.92} />
        </mesh>
      ))}

      {/* 橋（門へわたる板橋） */}
      <mesh position={[0, 0.12, moatS]} raycast={noRay}>
        <boxGeometry args={[1.7, 0.14, MOAT.w + 0.9]} /><meshLambertMaterial color={P.wood} />
      </mesh>
      {[-0.78, 0.78].map((bx, i) => (
        <mesh key={i} position={[bx, 0.3, moatS]} raycast={noRay}>
          <boxGeometry args={[0.1, 0.12, MOAT.w + 0.9]} /><meshLambertMaterial color={P.woodDark} />
        </mesh>
      ))}

      {/* 板塀（南は門の口をあける） */}
      <mesh position={[0, 0.55, FENCE.z0]} raycast={noRay}>
        <boxGeometry args={[fenceW, 1.1, 0.16]} /><meshLambertMaterial color={P.wood} />
      </mesh>
      {[FENCE.x0, FENCE.x1].map((fx, i) => (
        <mesh key={i} position={[fx, 0.55, fenceZc]} raycast={noRay}>
          <boxGeometry args={[0.16, 1.1, fenceD]} /><meshLambertMaterial color={P.wood} />
        </mesh>
      ))}
      {[-1, 1].map(s => (
        <mesh key={s} position={[s * (FENCE.gap + southLen / 2), 0.55, FENCE.z1]} raycast={noRay}>
          <boxGeometry args={[southLen, 1.1, 0.16]} /><meshLambertMaterial color={P.wood} />
        </mesh>
      ))}
      {/* 塀の笠木 */}
      {[
        { x: 0, z: FENCE.z0, w: fenceW + 0.2, d: 0.28 },
        { x: FENCE.x0, z: fenceZc, w: 0.28, d: fenceD },
        { x: FENCE.x1, z: fenceZc, w: 0.28, d: fenceD },
        { x: -(FENCE.gap + southLen / 2), z: FENCE.z1, w: southLen, d: 0.28 },
        { x: FENCE.gap + southLen / 2, z: FENCE.z1, w: southLen, d: 0.28 },
      ].map((k, i) => (
        <mesh key={i} position={[k.x, 1.14, k.z]} raycast={noRay}>
          <boxGeometry args={[k.w, 0.08, k.d]} /><meshLambertMaterial color={P.woodDark} />
        </mesh>
      ))}

      {/* 門（二本柱と小屋根） */}
      {[-0.95, 0.95].map((gx, i) => (
        <mesh key={i} position={[gx, 0.95, FENCE.z1]} raycast={noRay}>
          <boxGeometry args={[0.24, 1.9, 0.24]} /><meshLambertMaterial color={P.woodDark} />
        </mesh>
      ))}
      <mesh position={[0, 1.8, FENCE.z1]} raycast={noRay}>
        <boxGeometry args={[2.5, 0.2, 0.3]} /><meshLambertMaterial color={P.woodDark} />
      </mesh>
      <mesh position={[0, 2.02, FENCE.z1]} raycast={noRay}>
        <boxGeometry args={[2.9, 0.14, 1.0]} /><meshLambertMaterial color={P.roof} />
      </mesh>

      {/* 白旗（源氏の白）——門の橋のたもとに */}
      <Banner x={-1.5} z={-3.7} phase={0.7} />
      <Banner x={1.5} z={-3.7} phase={2.4} />

      {/* 母屋：板葺の質実な住まい */}
      <group position={[hallX, 0, hallZ]}>
        <mesh position={[0, 0.15, 0]} raycast={noRay}>
          <boxGeometry args={[5.2, 0.3, 3.4]} /><meshLambertMaterial color={P.earth} />
        </mesh>
        {[-2.0, -0.7, 0.7, 2.0].map((px, i) => (
          <mesh key={i} position={[px, 1.2, 1.3]} raycast={noRay}>
            <boxGeometry args={[0.22, 1.8, 0.22]} /><meshLambertMaterial color={P.woodDark} />
          </mesh>
        ))}
        <mesh position={[0, 1.25, -0.25]} raycast={noRay}>
          <boxGeometry args={[4.6, 1.9, 2.4]} /><meshLambertMaterial color={P.wood} />
        </mesh>
        {/* 縁側 */}
        <mesh position={[0, 0.48, 1.25]} raycast={noRay}>
          <boxGeometry args={[4.8, 0.14, 0.8]} /><meshLambertMaterial color={P.woodDark} />
        </mesh>
        {/* 板葺の屋根（石をのせた素朴な二段） */}
        <mesh position={[0, 2.42, 0.15]} raycast={noRay}>
          <boxGeometry args={[5.8, 0.34, 3.8]} /><meshLambertMaterial color={P.roof} />
        </mesh>
        <mesh position={[0, 2.72, 0.1]} raycast={noRay}>
          <boxGeometry args={[3.8, 0.3, 2.4]} /><meshLambertMaterial color={P.roof} />
        </mesh>
        <mesh position={[0, 2.98, 0.1]} raycast={noRay}>
          <boxGeometry args={[1.8, 0.22, 1.2]} /><meshLambertMaterial color={P.woodDark} />
        </mesh>
        {[-1.4, 0.2, 1.6].map((rx, i) => (
          <mesh key={i} position={[rx, 2.64, 0.6 + (i % 2) * 0.5]} raycast={noRay}>
            <sphereGeometry args={[0.14, 8, 6]} /><meshLambertMaterial color="#6f6b5e" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// 二毛作の麦の田。米を刈ったあとの田に、麦の列がのびる（霜月）
function Mugita() {
  const cx = (PADDY.x0 + PADDY.x1) / 2
  const cz = (PADDY.z0 + PADDY.z1) / 2
  const w = PADDY.x1 - PADDY.x0
  const d = PADDY.z1 - PADDY.z0
  const rows = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.085, 0.3, 4)
    const mat = new THREE.MeshLambertMaterial({ flatShading: true })
    const pts: { x: number; z: number; rand: number; h: number }[] = []
    for (let z = PADDY.z0 + 0.7; z <= PADDY.z1 - 0.6; z += 0.62) {
      if (Math.abs(z - cz) < 0.32) continue // 中の畦をよける
      for (let x = PADDY.x0 + 0.5; x <= PADDY.x1 - 0.4; x += 0.52) {
        pts.push({ x, z, rand: ((x * 73 + z * 131) % 7) / 7, h: 0 })
      }
    }
    const mesh = new THREE.InstancedMesh(geo, mat, pts.length)
    const color = new THREE.Color()
    applyInstances(mesh, pts, (p, dm, i) => {
      const s = 0.75 + p.rand * 0.6
      dm.position.set(p.x + (p.rand - 0.5) * 0.14, 0.13 * s, p.z + (p.rand - 0.5) * 0.1)
      dm.rotation.y = p.rand * Math.PI
      dm.scale.setScalar(s)
      color.setHSL(0.24 + p.rand * 0.05, 0.42, 0.34 + ((p.rand * 5) % 1) * 0.09)
      mesh.setColorAt(i, color)
    })
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.raycast = () => {}
    return mesh
  }, [cz])
  return (
    <group raycast={noRay}>
      {/* 土（刈りあとの湿り） */}
      <mesh rotation-x={-Math.PI / 2} position={[cx, 0.012, cz]} raycast={noRay}>
        <planeGeometry args={[w, d]} /><meshLambertMaterial color="#6e6248" />
      </mesh>
      {/* 畦：まわりと、中に一本 */}
      {[
        { x: cx, z: PADDY.z0, w: w + 0.26, d: 0.26 },
        { x: cx, z: PADDY.z1, w: w + 0.26, d: 0.26 },
        { x: PADDY.x0, z: cz, w: 0.26, d: d },
        { x: PADDY.x1, z: cz, w: 0.26, d: d },
        { x: cx, z: cz, w: w, d: 0.24 },
      ].map((k, i) => (
        <mesh key={i} position={[k.x, 0.07, k.z]} raycast={noRay}>
          <boxGeometry args={[k.w, 0.14, k.d]} /><meshLambertMaterial color="#a08e68" />
        </mesh>
      ))}
      {/* 麦の列 */}
      <primitive object={rows} />
    </group>
  )
}

// 厩：囲いのなかで馬が草を食む
function Umaya() {
  const posts: [number, number][] = [
    [PEN.x0, PEN.z0], [(PEN.x0 + PEN.x1) / 2, PEN.z0], [PEN.x1, PEN.z0],
    [PEN.x0, PEN.z1], [(PEN.x0 + PEN.x1) / 2, PEN.z1], [PEN.x1, PEN.z1],
    [PEN.x0, (PEN.z0 + PEN.z1) / 2], [PEN.x1, (PEN.z0 + PEN.z1) / 2],
  ]
  const w = PEN.x1 - PEN.x0
  const d = PEN.z1 - PEN.z0
  const cx = (PEN.x0 + PEN.x1) / 2
  const cz = (PEN.z0 + PEN.z1) / 2
  return (
    <group raycast={noRay}>
      {posts.map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.48, pz]} raycast={noRay}>
          <cylinderGeometry args={[0.055, 0.065, 0.96, 5]} /><meshLambertMaterial color={P.woodDark} />
        </mesh>
      ))}
      {[0.42, 0.78].map((y, i) => (
        <group key={i}>
          <mesh position={[cx, y, PEN.z0]} raycast={noRay}><boxGeometry args={[w, 0.07, 0.07]} /><meshLambertMaterial color={P.wood} /></mesh>
          <mesh position={[cx, y, PEN.z1]} raycast={noRay}><boxGeometry args={[w, 0.07, 0.07]} /><meshLambertMaterial color={P.wood} /></mesh>
          <mesh position={[PEN.x0, y, cz]} raycast={noRay}><boxGeometry args={[0.07, 0.07, d]} /><meshLambertMaterial color={P.wood} /></mesh>
          <mesh position={[PEN.x1, y, cz]} raycast={noRay}><boxGeometry args={[0.07, 0.07, d]} /><meshLambertMaterial color={P.wood} /></mesh>
        </group>
      ))}
      {/* 秣（まぐさ）の山 */}
      <mesh position={[PEN.x0 + 0.7, 0.22, PEN.z0 + 0.7]} raycast={noRay}>
        <coneGeometry args={[0.45, 0.5, 8]} /><meshLambertMaterial color="#b9a86a" />
      </mesh>
      <IdleHorse x={cx + 0.3} z={cz + 0.3} ry={0.6} />
    </group>
  )
}

// 東の切通し（谷戸がわの口）。岩の壁のあいだから、浜へもどる
function KiridoshiYato() {
  const rocks: { x: number; z: number; s: number; ry: number }[] = [
    { x: 15.6, z: -0.3, s: 1.8, ry: 0.9 }, { x: 14.9, z: -1.1, s: 1.2, ry: 2.8 },
    { x: 16.4, z: 0.4, s: 2.3, ry: 4.6 },
    { x: 15.6, z: 4.3, s: 1.8, ry: 1.9 }, { x: 14.9, z: 5.1, s: 1.2, ry: 3.9 },
    { x: 16.4, z: 3.6, s: 2.3, ry: 5.7 },
  ]
  return (
    <group raycast={noRay}>
      {rocks.map((r, i) => (
        <mesh key={i} position={[r.x, r.s * 0.62, r.z]} rotation-y={r.ry} scale={[r.s * 0.8, r.s * 1.25, r.s]} raycast={noRay}>
          <icosahedronGeometry args={[1, 0]} />
          <meshLambertMaterial color={i % 2 ? '#767263' : '#7f7b6c'} flatShading />
        </mesh>
      ))}
    </group>
  )
}

// 谷戸の草・山肌の松原・岩（見た目だけ。種で決まる散布）
function YatoVegetation() {
  const group = useMemo(() => {
    const g = new THREE.Group()
    const color = new THREE.Color()

    // 谷底の草（径・田・的場の走路・館まわりをよける）
    const tufts = scatterPoints(70, 512, { x0: -15.4, x1: 15.4, z0: -13.4, z1: 13.4 },
      (x, z) => !yatoBlocked(x, z)
        && !(x > PADDY.x0 - 0.6 && x < PADDY.x1 + 0.6 && z > PADDY.z0 - 0.6 && z < PADDY.z1 + 0.6)
        && Math.abs(x - BABA.x) > 1.7 && !(x > -13 && x < -10.5 && z > -6 && z < 7)
        && !(z > 0.7 && z < 3.3 && x > -1.4)
        && !(x > -1.4 && x < 1.4 && z > -3.8 && z < 3.3)
        && !(x > MOAT.x0 - 0.4 && x < MOAT.x1 + 0.4 && z > MOAT.z0 - 0.4 && z < MOAT.z1 + 0.4)
        && YATO_TREES.every(tr => (x - tr.x) ** 2 + (z - tr.z) ** 2 > 1))
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

    // 山肌の松原
    const wild = { x0: -70, x1: 70, z0: -60, z1: 60 }
    const pinesPts = scatterPoints(130, 881, wild, (_x, _z, h) => h > 0.7 && h < 7, yatoRelief)
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
    const rocks = scatterPoints(26, 313, wild, (_x, _z, h) => h > 0.25 && h < 8, yatoRelief)
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

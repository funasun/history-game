// 鎌倉の武家の都の3D。時代パックの World / LandmarkMesh として供する。
// 山にかこまれ、南は相模の海。若宮大路が海から八幡宮へまっすぐのびる。
// 山は起伏の地形そのもの（HILLS のデータどおりに立つ）、海は波のうねる面。
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { useGame } from '../game/store'
import { P } from './palette'
import { SEA_Z, BEACH, OMICHI, TREES, BED, SPAWN, blocked } from './layout'
import { buildGroundGeometry, buildRibbonGeometry, scatterPoints, applyInstances, smoothstep } from '../engine/procedural'
import { hamaRelief, hamaGroundColor } from './terrain'
import { MountedArcher, KWalker } from './liveActors'

export function KamakuraWorld() {
  const walkTo = useGame(s => s.walkTo)
  const onGround = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const x = e.point.x, z = e.point.z
    if (!blocked(x, z)) walkTo(x, z)
  }
  const roadZc = (OMICHI.z0 + BEACH.z0) / 2
  const roadD = BEACH.z0 - OMICHI.z0
  const beachZc = (BEACH.z0 + BEACH.z1) / 2
  const beachD = BEACH.z1 - BEACH.z0
  // 起伏と頂点色の地面（谷戸は平ら、三方に山が立ち、南は海底へ沈む）
  const groundGeo = useMemo(() => buildGroundGeometry(240, 210, hamaRelief, hamaGroundColor), [])
  // 泡の帯：ゆるくうねる芯＋両端へ幅を絞るリボン（2本、位相をずらす）
  const foamGeos = useMemo(() => [
    { z: SEA_Z + 0.8, w: 1.3, f: 0.31, p: 1.7, a: 0.3 },
    { z: SEA_Z + 3.0, w: 0.7, f: 0.22, p: 4.2, a: 0.5 },
  ].map(({ z, w, f, p, a }) => {
    const pts = Array.from({ length: 15 }, (_, i) => {
      const x = -27 + i * (54 / 14)
      return { x, z: z + Math.sin(x * f + p) * a }
    })
    return buildRibbonGeometry(pts, i =>
      w * Math.max(0.05, smoothstep(0, 2.2, i) * smoothstep(14, 11.8, i) * (0.8 + 0.25 * Math.sin(i * 2.1) ** 2)))
  }), [])

  return (
    <group>
      {/* 地面（土・山肌・渚から海の底まで） */}
      <mesh geometry={groundGeo} onClick={onGround}>
        <meshLambertMaterial vertexColors />
      </mesh>

      {/* 若宮大路（海から八幡宮へ） */}
      <mesh rotation-x={-Math.PI / 2} position={[OMICHI.x, 0.005, roadZc]} onClick={onGround}>
        <planeGeometry args={[OMICHI.w, roadD]} />
        <meshLambertMaterial color={P.sand} />
      </mesh>
      {/* 段葛の縁（大路の両側の土手） */}
      {[-OMICHI.w / 2 - 0.25, OMICHI.w / 2 + 0.25].map((dx, i) => (
        <mesh key={i} position={[OMICHI.x + dx, 0.12, roadZc]} raycast={() => null}>
          <boxGeometry args={[0.5, 0.24, roadD]} />
          <meshLambertMaterial color={P.hillDark} />
        </mesh>
      ))}

      {/* 浜（砂）。歩ける幅だけ——その外は地形の砂色がつづく */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, beachZc]} onClick={onGround}>
        <planeGeometry args={[44, beachD]} />
        <meshLambertMaterial color={P.sand} />
      </mesh>

      {/* 相模の海（波がうねる） */}
      <Sea />
      {/* 波がしら（水際線 z≈13.8 を覆って、寄せ返しに見せる）。
          まっすぐな長方形だと帯の両端がぷつりと切れて見えるので、
          リボンでかすかにうねらせ、端は幅を0へ絞って波が引くように消す */}
      {foamGeos.map((g, i) => (
        <mesh key={i} geometry={g} position-y={0.06} raycast={() => null}>
          <meshLambertMaterial color={P.seaFoam} />
        </mesh>
      ))}

      {/* 大鳥居（大路の上・二の鳥居のおもかげ） */}
      <Torii x={OMICHI.x} z={5} scale={1.15} />

      {/* 木々（松を主に） */}
      {TREES.map((t, i) => (
        <KTree key={i} x={t.x} z={t.z} kind={t.kind} s={t.s} />
      ))}

      {/* 谷戸の草・山の松原・磯の岩 */}
      <KamakuraVegetation />

      {/* 浜の笠懸：走る馬から的を射る、武士の日ごろの鍛錬（見て、わかる） */}
      <MountedArcher x0={-14} z0={10.7} x1={14} z1={10.7} round period={7}
        targets={[[-8, 11.9], [-1.5, 11.9], [6, 11.9]]} />

      {/* 若宮大路をゆく人かげ（都のにぎわい。夜はやすむ） */}
      <KWalker x={-1.6} mid={-1} amp={11} speed={0.021} phase={0.4} robe="#5a6a4a" kasa />
      <KWalker x={0.3} mid={0} amp={12} speed={0.016} phase={2.6} robe="#6a5a6e" />
      <KWalker x={1.7} mid={-2.5} amp={10} speed={0.025} phase={4.4} robe="#44566a" />

      {/* 市の日（ふつかに一度、浜に市がたつ——三斎市のおもかげ） */}
      <HamaIchi />

      {/* 西の切通し：山を切りひらいた、谷戸の館への口 */}
      <Kiridoshi />
    </group>
  )
}

// 浜の市。ふつかに一度（偶数日）だけ立つ——月に三度の定期市（三斎市）を五日に写す。
// 見た目だけ（触れて学ぶのは谷戸の田と的場）。夜はしまう。
function HamaIchi() {
  const day = useGame(s => s.day)
  const t = useGame(s => s.t)
  if (day % 2 !== 0 || t >= 0.72) return null
  const noRay = () => null
  return (
    <group raycast={noRay}>
      {[{ x: -7.6, c: '#b8a06a', ry: 0.14 }, { x: -4.9, c: '#8a9a78', ry: -0.1 }].map((s, i) => (
        <group key={i} position={[s.x, 0, 9.1]} rotation-y={s.ry}>
          {/* 四本柱と布屋根 */}
          {[[-0.85, -0.55], [0.85, -0.55], [-0.85, 0.55], [0.85, 0.55]].map(([dx, dz], k) => (
            <mesh key={k} raycast={noRay} position={[dx, 0.8, dz]}>
              <cylinderGeometry args={[0.045, 0.055, 1.6, 5]} /><meshLambertMaterial color="#7a6448" />
            </mesh>
          ))}
          <mesh raycast={noRay} position={[0, 1.64, 0]} rotation-z={0.08}>
            <boxGeometry args={[2.15, 0.06, 1.5]} /><meshLambertMaterial color={s.c} />
          </mesh>
          {/* 台 */}
          <mesh raycast={noRay} position={[0, 0.4, 0]}>
            <boxGeometry args={[1.7, 0.12, 1.0]} /><meshLambertMaterial color="#8a7458" />
          </mesh>
          {/* 品：米俵と壺 */}
          <mesh raycast={noRay} position={[-0.4, 0.58, 0]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.16, 0.16, 0.55, 8]} /><meshLambertMaterial color="#c8b070" />
          </mesh>
          <mesh raycast={noRay} position={[0.15, 0.58, 0.15]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.15, 0.15, 0.5, 8]} /><meshLambertMaterial color="#bfa562" />
          </mesh>
          <mesh raycast={noRay} position={[0.55, 0.6, -0.12]}>
            <sphereGeometry args={[0.16, 10, 8]} /><meshLambertMaterial color="#6a5a50" />
          </mesh>
          {/* あきんど（台のうしろに座す） */}
          <group position={[0, 0, -0.95]}>
            <mesh raycast={noRay} position={[0, 0.36, 0]}><coneGeometry args={[0.3, 0.72, 9]} /><meshLambertMaterial color={i ? '#5c5240' : '#4a5060'} /></mesh>
            <mesh raycast={noRay} position={[0, 0.82, 0]}><sphereGeometry args={[0.15, 12, 10]} /><meshLambertMaterial color="#e8c8a8" /></mesh>
          </group>
        </group>
      ))}
    </group>
  )
}

// 西の切通し。山を切りとおした細い口——鎌倉の出入りは、こうした切通しにかぎられた。
// 岩の壁の当たりは pack の extra 円（±z の二丘）。門そのものは Gates の札と光が立つ。
function Kiridoshi() {
  const noRay = () => null
  const rocks: { x: number; z: number; s: number; ry: number }[] = [
    { x: -21.2, z: -9.9, s: 1.9, ry: 0.7 }, { x: -20.4, z: -10.6, s: 1.3, ry: 2.2 },
    { x: -22.1, z: -9.2, s: 2.4, ry: 4.1 },
    { x: -21.2, z: -6.1, s: 1.9, ry: 1.6 }, { x: -20.4, z: -5.4, s: 1.3, ry: 3.4 },
    { x: -22.1, z: -6.8, s: 2.4, ry: 5.2 },
  ]
  return (
    <group raycast={noRay}>
      {/* 切りとおしの径（土がのぞく） */}
      <mesh rotation-x={-Math.PI / 2} position={[-21, 0.006, -8]} raycast={noRay}>
        <planeGeometry args={[4.6, 2.6]} />
        <meshLambertMaterial color="#a08e68" />
      </mesh>
      {/* 両脇に立つ切り岸の岩 */}
      {rocks.map((r, i) => (
        <mesh key={i} position={[r.x, r.s * 0.62, r.z]} rotation-y={r.ry} scale={[r.s, r.s * 1.25, r.s * 0.8]} raycast={noRay}>
          <icosahedronGeometry args={[1, 0]} />
          <meshLambertMaterial color={i % 2 ? '#767263' : '#7f7b6c'} flatShading />
        </mesh>
      ))}
    </group>
  )
}

// 相模の海。渚は静かに、沖ほど大きくうねる
function Sea() {
  const mesh = useRef<THREE.Mesh>(null!)
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(240, 92, 96, 36)
    g.rotateX(-Math.PI / 2)
    return g
  }, [])
  const base = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const pos = mesh.current.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3]
      const wz = base[i * 3 + 2] + SEA_Z + 45 // 世界座標の z
      // 渚では波をゼロに——砂と海の刺し違い（波打ち際の鋸歯）を出さない
      const amp = 0.26 * smoothstep(15, 32, wz)
      pos.setY(i, (
        Math.sin(x * 0.13 + t * 1.2) * 0.5 +
        Math.sin(wz * 0.15 + t * 0.8) * 0.35 +
        Math.sin((x + wz) * 0.05 + t * 0.45) * 0.3
      ) * amp)
    }
    pos.needsUpdate = true
  })
  return (
    // 海面はわずかに沈めて敷く。渚では砂の下に隠れ、地形が海底へ下る線（z≈13.8）が
    // そのまま水際線になる——重ね面どうしのちらつきをなくす
    <mesh ref={mesh} geometry={geometry} position={[0, -0.05, SEA_Z + 45]} raycast={() => null}>
      <meshLambertMaterial color={P.sea} transparent opacity={0.82} />
    </mesh>
  )
}

// 谷戸の草、山肌の松原、磯と岬の岩。種で決まる散布——おなじ鎌倉の五日。
// 見た目だけ（当たりなし・raycast なし）
function KamakuraVegetation() {
  const group = useMemo(() => {
    const g = new THREE.Group()
    const color = new THREE.Color()

    // --- 谷戸の草（大路・浜・宿・木のきわを避ける） ---
    const tufts = scatterPoints(85, 246, { x0: -21.4, x1: 21.4, z0: -19.4, z1: 7.8 },
      (x, z) => !blocked(x, z) && Math.abs(x - OMICHI.x) > OMICHI.w / 2 + 0.9
        && (x - BED.x) ** 2 + (z - BED.z) ** 2 > 3.2
        && (x - SPAWN[0]) ** 2 + (z - SPAWN[1]) ** 2 > 2.2
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

    // --- 山肌の松原（岬の松も） ---
    const wild = { x0: -110, x1: 110, z0: -95, z1: 30 }
    const pinesPts = scatterPoints(170, 359, wild, (_x, _z, h) => h > 0.7 && h < 7, hamaRelief)
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

    // --- 岩（山肌と、渚の磯） ---
    const rocks = scatterPoints(45, 771, wild,
      (_x, z, h) => (h > 0.25 && h < 8) || (z > 12 && h > -0.3 && h < 0.25), hamaRelief)
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

// 松と紅葉（鎌倉は日ごとの色替えはせず、静かに）。谷戸の場面でも使う。
export function KTree({ x, z, kind, s }: { x: number; z: number; kind: 'maple' | 'pine'; s: number }) {
  const blobs = kind === 'maple'
    ? [
        { dx: 0, dy: 2.4, dz: 0, r: 1.05, c: '#a8532a' },
        { dx: -0.75, dy: 2.05, dz: 0.2, r: 0.78, c: '#8f4420' },
        { dx: 0.72, dy: 2.15, dz: -0.15, r: 0.72, c: '#b56a2e' },
      ]
    : [
        { dx: 0, dy: 2.7, dz: 0, r: 1.0, c: P.matsu },
        { dx: -0.85, dy: 2.15, dz: 0.2, r: 0.72, c: P.hillDark },
        { dx: 0.82, dy: 2.3, dz: -0.15, r: 0.68, c: P.matsu },
      ]
  const noRay = () => null
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

// 朱の鳥居（scenery / landmark 共用）
function Torii({ x = 0, z = 0, scale = 1 }: { x?: number; z?: number; scale?: number }) {
  const noRay = () => null
  return (
    <group position={[x, 0, z]} scale={scale} raycast={noRay}>
      {[-2.4, 2.4].map((px, i) => (
        <mesh key={i} position={[px, 2.5, 0]} raycast={noRay}>
          <cylinderGeometry args={[0.24, 0.28, 5, 12]} />
          <meshLambertMaterial color={P.shu} />
        </mesh>
      ))}
      {/* 貫 */}
      <mesh position={[0, 3.6, 0]} raycast={noRay}><boxGeometry args={[5.6, 0.34, 0.34]} /><meshLambertMaterial color={P.shu} /></mesh>
      {/* 島木 */}
      <mesh position={[0, 4.55, 0]} raycast={noRay}><boxGeometry args={[6.4, 0.42, 0.6]} /><meshLambertMaterial color={P.shu} /></mesh>
      {/* 笠木（反り） */}
      <mesh position={[0, 4.95, 0]} rotation-z={0} raycast={noRay}><boxGeometry args={[7, 0.34, 0.72]} /><meshLambertMaterial color={P.sumi} /></mesh>
    </group>
  )
}

// 名所の立体：鶴岡八幡宮・鎌倉大仏・武家政庁・由比ヶ浜の一の鳥居
export function KamakuraLandmarkMesh({ kind }: { kind: string }) {
  if (kind === 'shrine') {
    // 鶴岡八幡宮：石段の上の朱の社殿（南向き＝+z）
    return (
      <group>
        {/* 石壇 */}
        <mesh position={[0, 0.25, 0]}><boxGeometry args={[8, 0.5, 6]} /><meshLambertMaterial color={P.ishi} /></mesh>
        {/* 大石段 */}
        {[0, 1, 2].map(i => (
          <mesh key={i} position={[0, 0.12 + i * 0.16, 3.2 + i * 0.5]}>
            <boxGeometry args={[4, 0.16, 0.5]} /><meshLambertMaterial color={P.ishi} />
          </mesh>
        ))}
        {/* 社殿の柱 */}
        {[-2.6, -1, 1, 2.6].map((px, i) => (
          <mesh key={i} position={[px, 1.5, -0.6]}><boxGeometry args={[0.34, 2.2, 0.34]} /><meshLambertMaterial color={P.shu} /></mesh>
        ))}
        {/* 白壁の身舎 */}
        <mesh position={[0, 1.55, -1.4]}><boxGeometry args={[5.4, 2, 1.6]} /><meshLambertMaterial color={P.gofun} /></mesh>
        {/* 縁と扉（朱） */}
        <mesh position={[0, 1.35, -0.55]}><boxGeometry args={[5.4, 1.5, 0.16]} /><meshLambertMaterial color={P.shu} /></mesh>
        {/* 檜皮ふうの屋根（寄棟＋反り） */}
        <mesh position={[0, 2.9, -1]}><boxGeometry args={[6.8, 0.5, 3.4]} /><meshLambertMaterial color={P.roof} /></mesh>
        <mesh position={[0, 3.3, -1]}><boxGeometry args={[4.6, 0.4, 2]} /><meshLambertMaterial color={P.roof} /></mesh>
        {/* 千木・鰹木のおもかげ */}
        <mesh position={[0, 3.7, -1]}><boxGeometry args={[3.4, 0.16, 0.2]} /><meshLambertMaterial color={P.kin} /></mesh>
        {[-1, 0, 1].map((dx, i) => (
          <mesh key={i} position={[dx * 0.9, 3.62, -1]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.12, 0.12, 0.7, 8]} /><meshLambertMaterial color={P.kin} /></mesh>
        ))}
      </group>
    )
  }
  if (kind === 'daibutsu') {
    // 鎌倉大仏：蓮座の上に坐す青銅の仏（南向き＝+z）
    return (
      <group>
        {/* 石の基壇 */}
        <mesh position={[0, 0.3, 0]}><boxGeometry args={[6, 0.6, 5]} /><meshLambertMaterial color={P.ishi} /></mesh>
        {/* 蓮座 */}
        <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[2.4, 2.7, 0.7, 24]} /><meshLambertMaterial color={P.bronzeDark} /></mesh>
        {/* 結跏趺坐の脚 */}
        <mesh position={[0, 1.5, 0.5]}><boxGeometry args={[4, 0.9, 2.4]} /><meshLambertMaterial color={P.bronze} /></mesh>
        {/* 膝の上で組む手（定印） */}
        <mesh position={[0, 2.0, 1.3]}><boxGeometry args={[1.6, 0.4, 0.6]} /><meshLambertMaterial color={P.bronzeDark} /></mesh>
        {/* 胴 */}
        <mesh position={[0, 3.0, -0.1]}><cylinderGeometry args={[1.5, 2.1, 2.2, 20]} /><meshLambertMaterial color={P.bronze} /></mesh>
        {/* 肩・衣 */}
        <mesh position={[0, 3.6, -0.1]} scale={[1, 0.6, 0.8]}><sphereGeometry args={[1.9, 20, 16]} /><meshLambertMaterial color={P.bronze} /></mesh>
        {/* 頭 */}
        <mesh position={[0, 4.7, 0.05]}><sphereGeometry args={[1.05, 24, 20]} /><meshLambertMaterial color={P.bronze} /></mesh>
        {/* 肉髻 */}
        <mesh position={[0, 5.6, 0.05]}><sphereGeometry args={[0.5, 16, 14]} /><meshLambertMaterial color={P.bronzeDark} /></mesh>
        {/* 白毫 */}
        <mesh position={[0, 4.75, 1.05]} raycast={() => null}><sphereGeometry args={[0.1, 10, 8]} /><meshLambertMaterial color={P.gofun} /></mesh>
      </group>
    )
  }
  if (kind === 'seat') {
    // 武家政庁：質実な板葺の館、堀と塀のおもかげ
    return (
      <group>
        {/* 土壇 */}
        <mesh position={[0, 0.2, 0]}><boxGeometry args={[8, 0.4, 6]} /><meshLambertMaterial color={P.earth} /></mesh>
        {/* 母屋の柱 */}
        {[-3, -1, 1, 3].map((px, i) => (
          <mesh key={i} position={[px, 1.3, 0.4]}><boxGeometry args={[0.3, 1.8, 0.3]} /><meshLambertMaterial color={P.woodDark} /></mesh>
        ))}
        {/* 板壁の身舎 */}
        <mesh position={[0, 1.4, -0.6]}><boxGeometry args={[6.4, 1.9, 2.4]} /><meshLambertMaterial color={P.wood} /></mesh>
        {/* 板葺の大屋根（切妻） */}
        <mesh position={[0, 2.7, -0.2]}><boxGeometry args={[7.6, 0.4, 4]} /><meshLambertMaterial color={P.roof} /></mesh>
        <mesh position={[0, 3.05, -0.2]}><boxGeometry args={[5, 0.34, 2.6]} /><meshLambertMaterial color={P.roof} /></mesh>
        <mesh position={[0, 3.35, -0.2]}><boxGeometry args={[2.4, 0.28, 1.4]} /><meshLambertMaterial color={P.woodDark} /></mesh>
        {/* 前の板塀 */}
        {[-3.4, 3.4].map((px, i) => (
          <mesh key={i} position={[px, 0.9, 2.6]}><boxGeometry args={[1.2, 1.2, 0.2]} /><meshLambertMaterial color={P.woodDark} /></mesh>
        ))}
        {/* 幔幕の朱（武家の印） */}
        <mesh position={[0, 1.7, 0.65]} raycast={() => null}><boxGeometry args={[6.4, 0.5, 0.06]} /><meshLambertMaterial color={P.shu} /></mesh>
      </group>
    )
  }
  // sea：由比ヶ浜の一の鳥居（渚に立つ朱の鳥居）
  return <Torii scale={1.25} />
}

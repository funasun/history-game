// 平安の庭（寝殿造）の3D。時代パックの World / LandmarkMesh として供する。
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { useGame } from '../game/store'
import { P } from './palette'
import { FLOORS, PILLARS, MISU, POND, ISLAND, STREAM, TREES, BOUNDS, SAND, KICHO, LANTERNS, BRIDGE, bridgeY, blocked, groundY } from './layout'
import { toTexture, misuCanvas, kichoCanvas, groundCanvas, ringCanvas } from '../engine/textures'
import { playerWorld, clampDt, koiCall } from '../game/live'
import { resolveMove } from '../game/collide'
import { buildGroundGeometry, scatterPoints, applyInstances, mulberry32 } from '../engine/procedural'
import { teiRelief, teiGroundColor } from './terrain'

const HIWADA = '#4f3d2f'   // 桧皮葺
const RIDGE = '#3a2d22'
const LROOF = '#4f3d2f'
const LRIDGE = '#3a2d22'

// 地面のまだら土テクスチャ（タイル）。key ごとに一度だけ作る
export function useGroundTex(key: string, base: string, speck: string, speck2: string, repeat: number) {
  return useMemo(() => {
    const t = toTexture(key, () => groundCanvas(base, speck, speck2))
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(repeat, repeat)
    return t
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}

export function HeianWorld() {
  const walkTo = useGame(s => s.walkTo)
  const misuTex = useMemo(() => toTexture('misu', misuCanvas), [])
  const kichoTex = useMemo(() => toTexture('kicho', kichoCanvas), [])
  const sandTex = useGroundTex('ground-sand', P.sand, '#d8cba6', '#f0e8d2', 7)
  // 起伏と頂点色の地面（庭は平ら、塀のむこうに野と山が起きる）
  const groundGeo = useMemo(() => buildGroundGeometry(170, 150, teiRelief, teiGroundColor), [])

  const onGround = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const x = e.point.x, z = e.point.z
    if (!blocked(x, z)) walkTo(x, z)
  }

  const wallH = 1.3
  const W = BOUNDS

  return (
    <group>
      {/* 地面（外周まで。低ポリの面ごとに色がゆらぐ） */}
      <mesh geometry={groundGeo} onClick={onGround}>
        <meshLambertMaterial vertexColors />
      </mesh>
      {/* 南庭の白砂（寝殿と池のあいだ） */}
      <mesh rotation-x={-Math.PI / 2} position={[SAND.x, 0.001, SAND.z]} onClick={onGround}>
        <planeGeometry args={[SAND.w, SAND.d]} />
        <meshLambertMaterial map={sandTex} />
      </mesh>

      {/* 池 */}
      <mesh rotation-x={-Math.PI / 2} position={[POND.x, 0.02, POND.z]} scale={[POND.rx, POND.rz, 1]}>
        <circleGeometry args={[1, 48]} />
        <meshLambertMaterial color={P.water} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[POND.x - 1, 0.028, POND.z + 0.4]} scale={[POND.rx * 0.55, POND.rz * 0.5, 1]}>
        <circleGeometry args={[1, 40]} />
        <meshLambertMaterial color="#7f9fbd" />
      </mesh>
      {/* 中島 */}
      <mesh rotation-x={-Math.PI / 2} position={[ISLAND.x, 0.035, ISLAND.z]} onClick={onGround}>
        <circleGeometry args={[ISLAND.r, 28]} />
        <meshLambertMaterial color={P.sand} />
      </mesh>
      <Tree3D x={ISLAND.x} z={ISLAND.z} kind="pine" s={0.75} />

      {/* 反橋（北の岸から中島へ。渡れる） */}
      <TaikoBridge onGround={onGround} />
      {/* 池の鯉（餌を撒くと寄ってくる） */}
      <Koi />
      {/* 石灯籠（夜はほのかに灯る） */}
      {LANTERNS.map(([x, z], i) => <Lantern key={i} x={x} z={z} />)}
      {/* 母屋の琴（遊びの場） */}
      <KotoMesh />
      {/* 南庭の鞠（蹴ると転がる） */}
      <KemariBall />
      {/* 南の棟門（都大路への出入口） */}
      <Munamon />

      {/* 遣水 */}
      {STREAM.map((s, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} rotation-z={s.rot} position={[s.x, 0.015, s.z]}>
          <planeGeometry args={[s.len, s.w]} />
          <meshLambertMaterial color={P.water} />
        </mesh>
      ))}

      {/* 床（寝殿・対屋・渡殿） */}
      {FLOORS.map((f, i) => (
        <mesh key={i} position={[f.x, f.h / 2, f.z]} onClick={onGround}>
          <boxGeometry args={[f.w, f.h, f.d]} />
          <meshLambertMaterial color={f.color} />
        </mesh>
      ))}

      {/* 柱 */}
      {PILLARS.map(([x, z], i) => (
        <mesh key={i} position={[x, 1.35, z]}>
          <boxGeometry args={[0.24, 2.7, 0.24]} />
          <meshLambertMaterial color="#7a3c2e" />
        </mesh>
      ))}

      {/* 屋根（吹抜屋台：中へ入ると薄くなる） */}
      <Roof x={-2} z={-8} w={13.6} d={9.6} y={2.9} />
      <Roof x={11} z={-8} w={8.4} d={8.4} y={2.9} />
      <Roof x={6} z={-8} w={3.4} d={3} y={2.45} thin />

      {/* 御簾 */}
      {MISU.map((m, i) => (
        <mesh key={i} position={[m.x, 1.65, m.z]}>
          <planeGeometry args={[m.w, 2.1]} />
          <meshBasicMaterial map={misuTex} side={2} alphaTest={0.1} />
        </mesh>
      ))}

      {/* 几帳 */}
      {KICHO.map((k, i) => (
        <mesh key={i} position={[k.x, 0.42 + 0.8, k.z]} rotation-y={k.rot}>
          <planeGeometry args={[1.8, 1.6]} />
          <meshBasicMaterial map={kichoTex} side={2} alphaTest={0.1} />
        </mesh>
      ))}

      {/* 築地塀 */}
      <mesh position={[0, wallH / 2, W.minZ - 0.4]}><boxGeometry args={[W.maxX - W.minX + 1.6, wallH, 0.6]} /><meshLambertMaterial color="#c4b394" /></mesh>
      <mesh position={[0, wallH / 2, W.maxZ + 0.4]}><boxGeometry args={[W.maxX - W.minX + 1.6, wallH, 0.6]} /><meshLambertMaterial color="#c4b394" /></mesh>
      <mesh position={[W.minX - 0.4, wallH / 2, 0.25]}><boxGeometry args={[0.6, wallH, W.maxZ - W.minZ + 1]} /><meshLambertMaterial color="#c4b394" /></mesh>
      <mesh position={[W.maxX + 0.4, wallH / 2, 0.25]}><boxGeometry args={[0.6, wallH, W.maxZ - W.minZ + 1]} /><meshLambertMaterial color="#c4b394" /></mesh>
      {/* 塀の屋根 */}
      {([[0, W.minZ - 0.4, W.maxX - W.minX + 2, 1.2], [0, W.maxZ + 0.4, W.maxX - W.minX + 2, 1.2],
         [W.minX - 0.4, 0.25, 1.2, W.maxZ - W.minZ + 1.6], [W.maxX + 0.4, 0.25, 1.2, W.maxZ - W.minZ + 1.6]] as const).map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, wallH + 0.08, z]}>
          <boxGeometry args={[w, 0.16, d]} />
          <meshLambertMaterial color="#6e5138" />
        </mesh>
      ))}

      {/* 木々 */}
      {TREES.map((t, i) => (
        <Tree3D key={i} x={t.x} z={t.z} kind={t.kind} s={t.s} />
      ))}

      {/* 庭の草株・塀のむこうの錦の山・都のつづきの家並み */}
      <TeiVegetation />
    </group>
  )
}

// 庭と外の世界のにぎわい。種（seed）で決まる散布——毎朝、おなじ庭。
// 遊びに関わる当たりは持たない（見た目だけ。raycast も外す）
function TeiVegetation() {
  const group = useMemo(() => {
    const g = new THREE.Group()
    const color = new THREE.Color()

    // --- 庭の草株（白砂・池・床・流れ・灯籠・門前を避ける） ---
    const inSand = (x: number, z: number) =>
      Math.abs(x - SAND.x) < SAND.w / 2 + 0.6 && Math.abs(z - SAND.z) < SAND.d / 2 + 0.6
    const nearStream = (x: number, z: number) => {
      for (const s of STREAM) {
        const dx = x - s.x, dz = z - s.z
        const c = Math.cos(s.rot), sn = Math.sin(s.rot)
        const u = dx * c - dz * sn
        const v = -dx * sn - dz * c
        if (Math.abs(u) < s.len / 2 + 0.5 && Math.abs(v) < s.w / 2 + 0.5) return true
      }
      return false
    }
    const tufts = scatterPoints(150, 71, { x0: BOUNDS.minX + 0.8, x1: BOUNDS.maxX - 0.8, z0: BOUNDS.minZ + 0.8, z1: BOUNDS.maxZ - 0.8 },
      (x, z) => !blocked(x, z) && groundY(x, z) === 0 && !inSand(x, z) && !nearStream(x, z)
        && LANTERNS.every(([lx, lz]) => (x - lx) ** 2 + (z - lz) ** 2 > 1.2)
        && (x - ISLAND.x) ** 2 + (z - ISLAND.z) ** 2 > (ISLAND.r + 0.5) ** 2
        && (x - 3) ** 2 + (z - 19) ** 2 > 9)
    const tuftGeo = new THREE.ConeGeometry(0.22, 0.42, 4)
    const tuftMat = new THREE.MeshLambertMaterial({ flatShading: true })
    const tuftMesh = new THREE.InstancedMesh(tuftGeo, tuftMat, tufts.length)
    applyInstances(tuftMesh, tufts, (p, d, i) => {
      const s = 0.7 + p.rand * 0.9
      d.position.set(p.x, 0.18 * s, p.z)
      d.rotation.y = p.rand * Math.PI
      d.scale.setScalar(s)
      // 秋の野の色（黄緑〜枯れ色）
      color.setHSL(0.13 + p.rand * 0.09, 0.32, 0.4 + ((p.rand * 7) % 1) * 0.1)
      tuftMesh.setColorAt(i, color)
    })

    // --- 塀のむこうの木立（北山・東山の紅葉と松） ---
    const wild = { x0: -78, x1: 78, z0: -78, z1: 78 }
    const trees = scatterPoints(180, 415, wild, (_x, _z, h) => h > 0.5 && h < 5.6, teiRelief)
    const trunkGeo = new THREE.CylinderGeometry(0.09, 0.16, 1.2, 5)
    const trunkMat = new THREE.MeshLambertMaterial({ color: '#6e553c', flatShading: true })
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, trees.length)
    applyInstances(trunks, trees, (p, d) => {
      const s = 0.9 + p.rand * 0.9
      d.position.set(p.x, p.h + 0.55 * s, p.z)
      d.rotation.y = p.rand * Math.PI * 2
      d.scale.setScalar(s)
    })
    const pines = trees.filter(p => p.rand < 0.45)
    const maples = trees.filter(p => p.rand >= 0.45)
    const pineGeo = new THREE.ConeGeometry(0.9, 1.7, 6)
    const pineMat = new THREE.MeshLambertMaterial({ flatShading: true })
    const pineMesh = new THREE.InstancedMesh(pineGeo, pineMat, pines.length)
    applyInstances(pineMesh, pines, (p, d, i) => {
      const s = 0.9 + p.rand * 0.9
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
      const s = 0.9 + p.rand * 0.9
      d.position.set(p.x, p.h + 1.5 * s, p.z)
      d.rotation.set(p.rand * 3, p.rand * 6, p.rand * 2)
      d.scale.setScalar(s)
      // 紅葉の錦（朽葉〜紅）
      color.setHSL(0.03 + p.rand * 0.07, 0.55, 0.32 + ((p.rand * 13) % 1) * 0.1)
      mapleMesh.setColorAt(i, color)
    })

    // --- 山肌の岩 ---
    const rocks = scatterPoints(26, 928, wild, (_x, _z, h) => h > 0.3 && h < 6, teiRelief)
    const rockGeo = new THREE.IcosahedronGeometry(0.5, 0)
    const rockMat = new THREE.MeshLambertMaterial({ flatShading: true })
    const rockMesh = new THREE.InstancedMesh(rockGeo, rockMat, rocks.length)
    applyInstances(rockMesh, rocks, (p, d, i) => {
      const s = 0.6 + p.rand * 1.4
      d.position.set(p.x, p.h + 0.12 * s, p.z)
      d.rotation.set(p.rand * 4, p.rand * 8, p.rand * 5)
      d.scale.set(s, s * (0.6 + p.rand * 0.5), s)
      color.setHSL(0.1, 0.08, 0.46 + ((p.rand * 11) % 1) * 0.12)
      rockMesh.setColorAt(i, color)
    })

    // --- 南と西につづく都の家並み（条坊にそろう板屋根） ---
    const rnd = mulberry32(603)
    const homes: { x: number; z: number; h: number; r: number }[] = []
    const tryHome = (gx: number, gz: number) => {
      if (rnd() < 0.42) return
      const px = gx + (rnd() - 0.5) * 2.4
      const pz = gz + (rnd() - 0.5) * 2.2
      if (Math.abs(px - 3) < 5.5) return // 棟門から南へのびる道すじ
      const h = teiRelief(px, pz)
      if (h > 1.7) return // 山には家を建てない
      homes.push({ x: px, z: pz, h, r: rnd() })
    }
    for (let gx = -72; gx <= 72; gx += 7.4) for (let gz = 27; gz <= 66; gz += 6.6) tryHome(gx, gz)
    for (let gx = -70; gx <= -33; gx += 7.4) for (let gz = -10; gz <= 20; gz += 6.6) tryHome(gx, gz)
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

    for (const m of [tuftMesh, pineMesh, mapleMesh, rockMesh, roofs]) {
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
    for (const m of [tuftMesh, trunks, pineMesh, mapleMesh, rockMesh, bodies, roofs]) {
      m.raycast = () => {} // 見た目だけ：歩き先のタップを妨げない
      g.add(m)
    }
    return g
  }, [])
  return <primitive object={group} />
}

// 中に入ると透ける屋根（吹抜屋台のならわし）
function Roof({ x, z, w, d, y, thin }: { x: number; z: number; w: number; d: number; y: number; thin?: boolean }) {
  const mats = useRef<THREE.MeshLambertMaterial[]>([])
  useFrame((_, dt) => {
    const inside = Math.abs(playerWorld.x - x) < w / 2 + 0.6 && Math.abs(playerWorld.z - z) < d / 2 + 0.6
    const goal = inside ? 0.12 : 1
    for (const m of mats.current) {
      m.opacity += (goal - m.opacity) * Math.min(1, 8 * dt)
    }
  })
  const setMat = (m: THREE.MeshLambertMaterial | null) => { if (m && !mats.current.includes(m)) mats.current.push(m) }
  const noRay = () => null
  return (
    <group>
      {/* 段状の寄棟ふう：軒・胴・棟 */}
      <mesh position={[x, y, z]} raycast={noRay}>
        <boxGeometry args={[w, 0.18, d]} />
        <meshLambertMaterial ref={setMat} color={HIWADA} transparent />
      </mesh>
      {!thin && (
        <>
          <mesh position={[x, y + 0.34, z]} raycast={noRay}>
            <boxGeometry args={[w * 0.72, 0.5, d * 0.66]} />
            <meshLambertMaterial ref={setMat} color={HIWADA} transparent />
          </mesh>
          <mesh position={[x, y + 0.66, z]} raycast={noRay}>
            <boxGeometry args={[w * 0.46, 0.14, d * 0.2]} />
            <meshLambertMaterial ref={setMat} color={RIDGE} transparent />
          </mesh>
        </>
      )}
    </group>
  )
}

// 反橋：朱塗りの板をふくらみに沿って並べる。板は歩く先としてクリックできる
function TaikoBridge({ onGround }: { onGround: (e: ThreeEvent<MouseEvent>) => void }) {
  const cx = (BRIDGE.x0 + BRIDGE.x1) / 2
  const w = BRIDGE.x1 - BRIDGE.x0 + 0.24
  const N = 8
  const step = (BRIDGE.z1 - BRIDGE.z0) / N
  return (
    <group>
      {Array.from({ length: N }, (_, i) => {
        const z = BRIDGE.z0 + (i + 0.5) * step
        const y = bridgeY(z)
        const tilt = Math.atan2(bridgeY(z + step / 2) - bridgeY(z - step / 2), step)
        return (
          <mesh key={i} position={[cx, y + 0.03, z]} rotation-x={-tilt} onClick={onGround}>
            <boxGeometry args={[w, 0.08, step + 0.08]} />
            <meshLambertMaterial color={P.shu} />
          </mesh>
        )
      })}
      {/* 欄干の親柱 */}
      {([[BRIDGE.x0 - 0.08, BRIDGE.z0 + 0.1], [BRIDGE.x1 + 0.08, BRIDGE.z0 + 0.1],
         [BRIDGE.x0 - 0.08, BRIDGE.z1 - 0.1], [BRIDGE.x1 + 0.08, BRIDGE.z1 - 0.1],
         [BRIDGE.x0 - 0.08, (BRIDGE.z0 + BRIDGE.z1) / 2], [BRIDGE.x1 + 0.08, (BRIDGE.z0 + BRIDGE.z1) / 2]] as const)
        .map(([x, z], i) => (
          <mesh key={i} position={[x, bridgeY(z) + 0.32, z]} raycast={noRaycastFn}>
            <boxGeometry args={[0.09, 0.56, 0.09]} />
            <meshLambertMaterial color="#8a3c2e" />
          </mesh>
        ))}
    </group>
  )
}

const noRaycastFn = () => null

// 石灯籠。日が落ちると火袋にほのかな灯がともる
function Lantern({ x, z }: { x: number; z: number }) {
  const glow = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(({ clock }) => {
    const t = useGame.getState().t
    const night = Math.min(1, Math.max(0, (t - 0.58) / 0.14))
    if (glow.current) glow.current.opacity = night * (0.78 + 0.18 * Math.sin(clock.elapsedTime * 5 + x))
  })
  const stone = '#8f8a7c'
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.3, 0.38, 0.24, 10]} /><meshLambertMaterial color={stone} /></mesh>
      <mesh position={[0, 0.52, 0]}><cylinderGeometry args={[0.09, 0.12, 0.6, 8]} /><meshLambertMaterial color={stone} /></mesh>
      <mesh position={[0, 0.96, 0]}><boxGeometry args={[0.4, 0.3, 0.4]} /><meshLambertMaterial color="#9a958a" /></mesh>
      <mesh position={[0, 1.2, 0]}><coneGeometry args={[0.42, 0.28, 6]} /><meshLambertMaterial color={stone} /></mesh>
      {/* 火袋の火。箱（0.4角）より大きい球で、外へ滲む灯にする */}
      <mesh position={[0, 0.96, 0]} raycast={noRaycastFn}>
        <sphereGeometry args={[0.27, 10, 8]} />
        <meshBasicMaterial ref={glow} color="#ffd27a" transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

// 池の鯉。ふだんは池をゆるく回り、餌が撒かれると岸へ集まる
const KOI_COLORS = ['#e8e4d2', '#d97b2e', '#c73e3a', '#4a4440']
const FEED = { x: 0.3, z: 4.6 }
function Koi() {
  const refs = useRef<(THREE.Group | null)[]>([])
  const ripple = useRef<THREE.Mesh>(null)
  const rippleMat = useRef<THREE.MeshBasicMaterial>(null)
  const ringTex = useMemo(() => toTexture('ring', ringCanvas), [])
  const fish = useRef(
    Array.from({ length: 4 }, (_, i) => ({
      u: (i / 4) * Math.PI * 2, rf: 0.35 + 0.09 * i, sp: (0.22 + 0.06 * i) * (i % 2 ? 1 : -1),
      x: POND.x, z: POND.z, h: 0,
    })),
  )
  useFrame((state, rawDt) => {
    const dt = clampDt(rawDt)
    if (koiCall.t > 0) koiCall.t = Math.max(0, koiCall.t - dt)
    const call = koiCall.t > 0
    const et = state.clock.elapsedTime
    fish.current.forEach((f, i) => {
      const g = refs.current[i]
      if (!g) return
      let tx: number, tz: number
      if (call) {
        const a = (i / 4) * Math.PI * 2 + et * 0.9
        tx = FEED.x + Math.cos(a) * 0.55
        tz = FEED.z + Math.sin(a) * 0.4
      } else {
        f.u += f.sp * dt
        tx = POND.x + Math.cos(f.u) * POND.rx * f.rf
        tz = POND.z + Math.sin(f.u) * POND.rz * f.rf
        // 中島は避ける
        const ix = tx - ISLAND.x, iz = tz - ISLAND.z
        const d = Math.hypot(ix, iz)
        if (d < ISLAND.r + 0.5) {
          tx = ISLAND.x + (ix / (d || 1e-4)) * (ISLAND.r + 0.5)
          tz = ISLAND.z + (iz / (d || 1e-4)) * (ISLAND.r + 0.5)
        }
      }
      const k = Math.min(1, (call ? 2.0 : 1.1) * dt)
      const px = f.x, pz = f.z
      f.x += (tx - f.x) * k
      f.z += (tz - f.z) * k
      const mv = Math.hypot(f.x - px, f.z - pz)
      if (mv > 0.0005) {
        const goal = Math.atan2(f.x - px, f.z - pz)
        let dh = goal - f.h
        while (dh > Math.PI) dh -= Math.PI * 2
        while (dh < -Math.PI) dh += Math.PI * 2
        f.h += dh * Math.min(1, 6 * dt)
      }
      g.position.set(f.x, 0.045, f.z)
      g.rotation.y = f.h + Math.sin(et * 5 + i * 1.7) * 0.12
    })
    // 餌の波紋
    if (ripple.current && rippleMat.current) {
      if (call) {
        const k = (et % 1.1) / 1.1
        ripple.current.visible = true
        ripple.current.position.set(FEED.x, 0.06, FEED.z)
        const sc = 0.5 + k * 1.7
        ripple.current.scale.set(sc, sc, sc)
        rippleMat.current.opacity = 0.45 * (1 - k)
      } else if (ripple.current.visible) {
        ripple.current.visible = false
      }
    }
  })
  return (
    <group>
      {KOI_COLORS.map((c, i) => (
        <group key={i} ref={el => (refs.current[i] = el)} raycast={noRaycastFn}>
          <mesh raycast={noRaycastFn}>
            <boxGeometry args={[0.14, 0.06, 0.52]} />
            <meshLambertMaterial color={c} />
          </mesh>
          <mesh position={[0, 0, -0.32]} rotation-x={-Math.PI / 2} raycast={noRaycastFn}>
            <planeGeometry args={[0.16, 0.18]} />
            <meshLambertMaterial color={c} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      <mesh ref={ripple} rotation-x={-Math.PI / 2} visible={false} raycast={noRaycastFn}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial ref={rippleMat} map={ringTex} color="#dfe8ee" transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

// 母屋の琴（spot: koto の見た目）
function KotoMesh() {
  return (
    <group position={[-0.5, 0.42, -8.8]} rotation-y={0.5}>
      <mesh position={[0, 0.12, 0]}><boxGeometry args={[1.7, 0.09, 0.42]} /><meshLambertMaterial color="#a8763e" /></mesh>
      <mesh position={[-0.6, 0.19, 0]}><boxGeometry args={[0.05, 0.06, 0.36]} /><meshLambertMaterial color={P.woodDark} /></mesh>
      <mesh position={[0.55, 0.19, 0]}><boxGeometry args={[0.05, 0.06, 0.36]} /><meshLambertMaterial color={P.woodDark} /></mesh>
      <mesh position={[0, 0.185, 0]}><boxGeometry args={[1.1, 0.012, 0.3]} /><meshLambertMaterial color="#e8e0c8" /></mesh>
    </group>
  )
}

// 南庭の鞠。近づくとぽんと転がり、蹴って遊べる（当たりに沿って跳ね返る）
function KemariBall() {
  const grp = useRef<THREE.Group>(null)
  const b = useRef({ x: 8, z: -1, vx: 0, vz: 0 })
  useFrame((_, rawDt) => {
    const dt = clampDt(rawDt)
    const s = useGame.getState()
    const p = b.current
    if (s.mode === 'roam') {
      const dx = p.x - playerWorld.x, dz = p.z - playerWorld.z
      const d = Math.hypot(dx, dz)
      const sp0 = Math.hypot(p.vx, p.vz)
      if (d < 0.8 && sp0 < 2.4) {
        const inv = 1 / (d || 1e-4)
        p.vx = dx * inv * 3.4 + (Math.random() - 0.5) * 0.9
        p.vz = dz * inv * 3.4 + (Math.random() - 0.5) * 0.9
      }
    }
    const sp = Math.hypot(p.vx, p.vz)
    if (sp > 0.02) {
      const [nx, nz] = resolveMove(p.x, p.z, p.x + p.vx * dt, p.z + p.vz * dt, s.t)
      if (Math.hypot(nx - p.x, nz - p.z) < sp * dt * 0.4) { p.vx *= -0.45; p.vz *= -0.45 }
      p.x = nx; p.z = nz
      const f = Math.max(0, 1 - 1.3 * dt)
      p.vx *= f; p.vz *= f
      if (grp.current) grp.current.rotation.x -= (sp * dt) / 0.22
    }
    grp.current?.position.set(p.x, groundY(p.x, p.z) + 0.22, p.z)
  })
  return (
    <group ref={grp} position={[8, 0.22, -1]}>
      <mesh raycast={noRaycastFn}>
        <sphereGeometry args={[0.22, 14, 12]} />
        <meshLambertMaterial color="#efe8d5" />
      </mesh>
      <mesh raycast={noRaycastFn}>
        <torusGeometry args={[0.215, 0.035, 8, 20]} />
        <meshLambertMaterial color={P.shu} />
      </mesh>
    </group>
  )
}

// 邸の南門（棟門）。都大路への出入口のしるし
function Munamon() {
  return (
    <group position={[3, 0, 19]}>
      {[-1.1, 1.1].map((x, i) => (
        <mesh key={i} position={[x, 1.15, 0]}><boxGeometry args={[0.32, 2.3, 0.32]} /><meshLambertMaterial color="#7a5a3e" /></mesh>
      ))}
      <mesh position={[0, 2.4, 0]}><boxGeometry args={[3.4, 0.22, 0.5]} /><meshLambertMaterial color={P.woodDark} /></mesh>
      <mesh position={[0, 2.72, 0]}><boxGeometry args={[3.9, 0.3, 1.5]} /><meshLambertMaterial color={HIWADA} /></mesh>
      <mesh position={[0, 2.95, 0]}><boxGeometry args={[4.1, 0.14, 0.5]} /><meshLambertMaterial color={RIDGE} /></mesh>
    </group>
  )
}

// 立体の木：幹＋岩絵具の葉むら（日を追うごとに紅葉が深まる）
const DEEP_MAPLE: Record<string, string> = {
  [P.shu]: '#8f2015',
  [P.kuchiba]: '#9c4318',
  [P.yamabuki]: '#c05a1e',
}

export function Tree3D({ x, z, kind, s }: { x: number; z: number; kind: 'maple' | 'pine'; s: number }) {
  const day = useGame(st => st.day)
  const autumn = useMemo(() => {
    const k = Math.min((day - 1) / 6, 1)
    return (c: string) => kind === 'maple'
      ? '#' + new THREE.Color(c).lerp(new THREE.Color(DEEP_MAPLE[c] ?? c), k).getHexString()
      : c
  }, [day, kind])
  const blobs = kind === 'maple'
    ? [
        { dx: 0, dy: 2.4, dz: 0, r: 1.15, c: autumn(P.shu) },
        { dx: -0.85, dy: 2.0, dz: 0.25, r: 0.85, c: autumn(P.kuchiba) },
        { dx: 0.8, dy: 2.1, dz: -0.15, r: 0.8, c: autumn(P.yamabuki) },
        { dx: 0.25, dy: 2.9, dz: 0.15, r: 0.7, c: autumn(P.shu) },
      ]
    : [
        { dx: 0, dy: 2.6, dz: 0, r: 1.05, c: P.rokusho },
        { dx: -0.9, dy: 2.1, dz: 0.2, r: 0.75, c: '#4c6e52' },
        { dx: 0.85, dy: 2.25, dz: -0.15, r: 0.7, c: P.rokusho },
      ]
  const noRay = () => null
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 1.1, 0]} raycast={noRay}>
        <cylinderGeometry args={[0.13, 0.2, 2.2, 10]} />
        <meshLambertMaterial color="#5a4632" />
      </mesh>
      {blobs.map((b, i) => (
        <mesh key={i} position={[b.dx, b.dy, b.dz]} scale={[1, kind === 'pine' ? 0.55 : 0.8, 1]} raycast={noRay}>
          <sphereGeometry args={[b.r, 16, 12]} />
          <meshLambertMaterial color={b.c} />
        </mesh>
      ))}
    </group>
  )
}

// 名所の立体：朱雀門・五重塔・阿弥陀堂・舟着き
export function HeianLandmarkMesh({ kind }: { kind: string }) {
  if (kind === 'gate') {
    return (
      <group>
        {[-2.2, 2.2].map((x, i) => (
          <mesh key={i} position={[x, 2.4, 0]}>
            <boxGeometry args={[0.5, 4.8, 0.5]} />
            <meshLambertMaterial color={P.shu} />
          </mesh>
        ))}
        <mesh position={[0, 3.5, 0]}><boxGeometry args={[5.6, 0.42, 0.6]} /><meshLambertMaterial color={P.shu} /></mesh>
        <mesh position={[0, 4.3, 0]}><boxGeometry args={[6.2, 0.4, 0.7]} /><meshLambertMaterial color={P.woodDark} /></mesh>
        <mesh position={[0, 4.75, 0]}><boxGeometry args={[7, 0.4, 2]} /><meshLambertMaterial color={LROOF} /></mesh>
        <mesh position={[0, 5.05, 0]}><boxGeometry args={[7.2, 0.18, 0.5]} /><meshLambertMaterial color={LRIDGE} /></mesh>
      </group>
    )
  }
  if (kind === 'pagoda') {
    let y = 0.3
    return (
      <group>
        <mesh position={[0, 0.15, 0]}><boxGeometry args={[3, 0.3, 3]} /><meshLambertMaterial color={P.sand} /></mesh>
        {[0, 1, 2, 3, 4].map(i => {
          const bw = 2.3 - i * 0.32
          const bh = 1.05
          const by = y + bh / 2
          const ry = y + bh + 0.05
          y += bh + 0.35
          return (
            <group key={i}>
              <mesh position={[0, by, 0]}><boxGeometry args={[bw, bh, bw]} /><meshLambertMaterial color={i % 2 ? P.woodDark : '#8a3c2e'} /></mesh>
              <mesh position={[0, ry, 0]}><boxGeometry args={[bw + 1, 0.3, bw + 1]} /><meshLambertMaterial color={LROOF} /></mesh>
            </group>
          )
        })}
        <mesh position={[0, y + 0.6, 0]}><cylinderGeometry args={[0.08, 0.08, 1.4, 8]} /><meshLambertMaterial color={P.kin} /></mesh>
      </group>
    )
  }
  if (kind === 'hall') {
    return (
      <group>
        <mesh position={[0, 0.2, 0]}><boxGeometry args={[6.4, 0.4, 3.2]} /><meshLambertMaterial color={P.sand} /></mesh>
        <mesh position={[0, 1.2, 0]}><boxGeometry args={[3, 1.6, 2.4]} /><meshLambertMaterial color={P.shu} /></mesh>
        {[-2.4, 2.4].map((x, i) => (
          <mesh key={i} position={[x, 0.9, 0]}><boxGeometry args={[1.8, 1, 1.4]} /><meshLambertMaterial color={P.shu} /></mesh>
        ))}
        <mesh position={[0, 2.3, 0]}><boxGeometry args={[3.6, 0.4, 3]} /><meshLambertMaterial color={LROOF} /></mesh>
        <mesh position={[0, 2.62, 0]}><boxGeometry args={[3.8, 0.18, 0.5]} /><meshLambertMaterial color={P.kin} /></mesh>
        <mesh position={[0, 1.2, -1.3]} rotation-y={Math.PI} raycast={() => null}>
          <circleGeometry args={[0.5, 20]} />
          <meshBasicMaterial color={P.kin} />
        </mesh>
      </group>
    )
  }
  if (kind === 'rajomon') {
    // 羅城門：都の南の正門。二重の甍と鴟尾
    return (
      <group>
        <mesh position={[0, 0.25, 0]}><boxGeometry args={[11, 0.5, 3.4]} /><meshLambertMaterial color={P.sand} /></mesh>
        {[-4.2, -1.5, 1.5, 4.2].map((x, i) => (
          <mesh key={i} position={[x, 2.85, 0]}>
            <boxGeometry args={[0.55, 4.7, 0.55]} />
            <meshLambertMaterial color={P.shu} />
          </mesh>
        ))}
        <mesh position={[0, 4.95, 0]}><boxGeometry args={[12.2, 0.34, 4.6]} /><meshLambertMaterial color={LROOF} /></mesh>
        <mesh position={[0, 5.35, 0]}><boxGeometry args={[10.6, 0.5, 3.0]} /><meshLambertMaterial color={P.woodDark} /></mesh>
        <mesh position={[0, 6.35, 0]}><boxGeometry args={[8.6, 1.5, 2.2]} /><meshLambertMaterial color="#e8e0c8" /></mesh>
        {[-3.4, 0, 3.4].map((x, i) => (
          <mesh key={i} position={[x, 6.35, 0]}>
            <boxGeometry args={[0.4, 1.5, 2.3]} />
            <meshLambertMaterial color={P.shu} />
          </mesh>
        ))}
        <mesh position={[0, 7.35, 0]}><boxGeometry args={[11.4, 0.5, 4.2]} /><meshLambertMaterial color={LROOF} /></mesh>
        <mesh position={[0, 7.72, 0]}><boxGeometry args={[11.8, 0.28, 1.0]} /><meshLambertMaterial color={LRIDGE} /></mesh>
        {[-5.4, 5.4].map((x, i) => (
          <mesh key={i} position={[x, 7.5, 0]}>
            <boxGeometry args={[0.5, 0.7, 0.5]} />
            <meshLambertMaterial color={P.kin} />
          </mesh>
        ))}
      </group>
    )
  }
  if (kind === 'market') {
    // 東の市の中店：布と唐物をならべた掛け台
    return (
      <group rotation-y={-Math.PI / 2}>
        {[[-1.3, 0.7], [1.3, 0.7]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.6, z]}><boxGeometry args={[0.16, 1.2, 0.16]} /><meshLambertMaterial color="#7a5a3e" /></mesh>
        ))}
        {[[-1.3, -0.7], [1.3, -0.7]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.85, z]}><boxGeometry args={[0.16, 1.7, 0.16]} /><meshLambertMaterial color="#7a5a3e" /></mesh>
        ))}
        <mesh position={[0, 1.5, 0]} rotation-x={-0.28}><boxGeometry args={[3.0, 0.1, 1.7]} /><meshLambertMaterial color="#8a6a46" /></mesh>
        <mesh position={[0, 0.55, 0]}><boxGeometry args={[2.6, 0.5, 1.0]} /><meshLambertMaterial color={P.wood} /></mesh>
        <mesh position={[-0.7, 0.92, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.13, 0.13, 0.9, 10]} /><meshLambertMaterial color={P.kikyo} /></mesh>
        <mesh position={[-0.7, 1.14, 0.1]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.12, 0.12, 0.85, 10]} /><meshLambertMaterial color={P.rokusho} /></mesh>
        <mesh position={[0.6, 1.0, 0]}><cylinderGeometry args={[0.16, 0.22, 0.42, 10]} /><meshLambertMaterial color="#b8a888" /></mesh>
      </group>
    )
  }
  // boat：舟着き（西の岸から池へ）
  return (
    <group>
      <mesh position={[1.2, 0.2, 0]}><boxGeometry args={[3, 0.16, 1.1]} /><meshLambertMaterial color={P.wood} /></mesh>
      <mesh position={[0.2, 0.5, 0.6]}><cylinderGeometry args={[0.1, 0.1, 1.2, 8]} /><meshLambertMaterial color={P.woodDark} /></mesh>
      <group position={[2.8, 0.12, -0.2]} rotation-y={0.3}>
        <mesh><boxGeometry args={[0.85, 0.3, 2.4]} /><meshLambertMaterial color={P.woodDark} /></mesh>
        <mesh position={[0, 0.04, 0]} scale={[0.72, 1, 0.9]}><boxGeometry args={[0.85, 0.26, 2.4]} /><meshLambertMaterial color={P.wood} /></mesh>
      </group>
    </group>
  )
}

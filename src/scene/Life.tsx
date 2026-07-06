// 生きている庭。歩けば足もとに土ぼこりの輪が立ち、紅葉が舞い落ち、
// 赤とんぼがこちらの気配に気づいて、さっと逃げる。
// ゲージも文字もない——ただ世界が応えることで、歩くことじたいを手ざわりにする。
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame } from '../game/store'
import { getPack } from '../game/pack'
import { playerWorld } from '../game/live'
import { toTexture, leafCanvas, ringCanvas } from '../engine/textures'

const noRaycast = () => null
const LEAF_COLORS = ['#c7462e', '#d1602e', '#c8a24b', '#a83420', '#d98a3e']

// ---------- 舞い落ちる紅葉 ----------

interface Leaf {
  x: number; y: number; z: number
  vy: number; sway: number; swayF: number; phase: number
  rot: number; spin: number; tilt: number; roll: number
  color: string
}

function reseat(l: Leaf, high: boolean) {
  const a = Math.random() * Math.PI * 2
  const r = 5 + Math.random() * 20
  l.x = playerWorld.x + Math.cos(a) * r
  l.z = playerWorld.z + Math.sin(a) * r
  l.y = high ? 8 + Math.random() * 3.5 : Math.random() * 11
  l.vy = 0.5 + Math.random() * 0.6
  l.sway = 0.5 + Math.random() * 0.9
  l.swayF = 0.7 + Math.random() * 0.8
  l.phase = Math.random() * 10
  l.spin = (Math.random() - 0.5) * 2.4
  l.tilt = Math.random() * Math.PI
  l.roll = Math.random() * Math.PI
}

function FallingLeaves() {
  const tex = useMemo(() => toTexture('leaf', leafCanvas), [])
  const N = 16
  const meshes = useRef<(THREE.Mesh | null)[]>([])
  const leaves = useRef<Leaf[]>(
    Array.from({ length: N }, (_, i) => {
      const l: Leaf = {
        x: 0, y: 0, z: 0, vy: 0, sway: 0, swayF: 1, phase: 0,
        rot: Math.random() * Math.PI * 2, spin: 0, tilt: 0, roll: 0,
        color: LEAF_COLORS[i % LEAF_COLORS.length],
      }
      reseat(l, false)
      return l
    }),
  )

  useFrame((_, dt) => {
    const arr = leaves.current
    for (let i = 0; i < N; i++) {
      const l = arr[i]
      l.y -= l.vy * dt
      l.phase += dt
      l.rot += l.spin * dt
      const m = meshes.current[i]
      if (m) {
        m.position.set(
          l.x + Math.sin(l.phase * l.swayF) * l.sway,
          l.y,
          l.z + Math.cos(l.phase * l.swayF * 0.8) * l.sway * 0.6,
        )
        m.rotation.set(l.tilt, l.rot, l.roll)
      }
      if (l.y < 0.15) reseat(l, true)
    }
  })

  return (
    <group>
      {leaves.current.map((l, i) => (
        <mesh key={i} ref={el => (meshes.current[i] = el)} raycast={noRaycast}>
          <planeGeometry args={[0.5, 0.5]} />
          <meshBasicMaterial
            map={tex} color={l.color} transparent alphaTest={0.2}
            side={THREE.DoubleSide} depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

// ---------- 足もとに立つ土ぼこりの輪 ----------

function Footfalls() {
  const tex = useMemo(() => toTexture('ring', ringCanvas), [])
  const N = 8
  const LIFE = 0.75
  const meshes = useRef<(THREE.Mesh | null)[]>([])
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  const age = useRef<number[]>(Array.from({ length: N }, () => 1e9))
  const spot = useRef<[number, number][]>(Array.from({ length: N }, () => [0, 0]))
  const last = useRef(new THREE.Vector2(playerWorld.x, playerWorld.z))
  const acc = useRef(0)
  const cursor = useRef(0)

  useFrame((_, dt) => {
    const groundY = getPack().groundY
    const dx = playerWorld.x - last.current.x
    const dz = playerWorld.z - last.current.y
    const moved = Math.hypot(dx, dz)
    last.current.set(playerWorld.x, playerWorld.z)
    // 歩いた分をためて、一定ごとに一枚落とす
    if (useGame.getState().mode === 'roam' && moved > 0.0005) {
      acc.current += moved
      if (acc.current > 0.62) {
        acc.current = 0
        const k = cursor.current % N
        age.current[k] = 0
        spot.current[k] = [playerWorld.x, playerWorld.z]
        cursor.current++
      }
    }
    for (let i = 0; i < N; i++) {
      const m = meshes.current[i]
      const mat = mats.current[i]
      if (!m || !mat) continue
      const a = age.current[i]
      if (a > LIFE) { if (m.visible) m.visible = false; continue }
      const na = a + dt
      age.current[i] = na
      const k = Math.min(1, na / LIFE)
      const [x, z] = spot.current[i]
      const sc = 0.4 + k * 1.5
      m.visible = true
      m.position.set(x, groundY(x, z) + 0.04, z)
      m.scale.set(sc, sc, sc)
      mat.opacity = 0.5 * (1 - k)
    }
  })

  return (
    <group>
      {Array.from({ length: N }, (_, i) => (
        <mesh
          key={i} ref={el => (meshes.current[i] = el)}
          rotation-x={-Math.PI / 2} visible={false} raycast={noRaycast}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            ref={el => (mats.current[i] = el)}
            map={tex} color="#d8c6a2" transparent opacity={0} depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

// ---------- 赤とんぼ（こちらの気配に気づいて逃げる） ----------

function Dragonfly() {
  const grp = useRef<THREE.Group>(null)
  const wingL = useRef<THREE.Mesh>(null)
  const wingR = useRef<THREE.Mesh>(null)
  const home = useRef(new THREE.Vector3(playerWorld.x + 3, 1.4, playerWorld.z + 2))
  const pos = useRef(new THREE.Vector3(playerWorld.x + 3, 1.4, playerWorld.z + 2))
  const wander = useRef(0)

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const p = pos.current
    const dpx = p.x - playerWorld.x
    const dpz = p.z - playerWorld.z
    const near = Math.hypot(dpx, dpz) < 2.2
    let lerp = 0.02
    if (near) {
      // 近づかれたら、離れる向きへ一気に飛ぶ
      const a = Math.atan2(dpz, dpx)
      home.current.set(
        playerWorld.x + Math.cos(a) * 4.4,
        1.2 + Math.random() * 0.5,
        playerWorld.z + Math.sin(a) * 4.4,
      )
      lerp = 0.09
    } else {
      wander.current -= dt
      if (wander.current <= 0) {
        wander.current = 1.4 + Math.random() * 2.6
        const a = Math.random() * Math.PI * 2
        const r = 2 + Math.random() * 3
        home.current.set(
          playerWorld.x + Math.cos(a) * r,
          1.1 + Math.random() * 0.7,
          playerWorld.z + Math.sin(a) * r,
        )
      }
    }
    p.lerp(home.current, lerp)
    const bob = Math.sin(t * 3) * 0.08
    if (grp.current) {
      grp.current.position.set(p.x, p.y + bob, p.z)
      const vx = home.current.x - p.x
      const vz = home.current.z - p.z
      if (Math.hypot(vx, vz) > 0.001) grp.current.rotation.y = Math.atan2(vx, vz)
    }
    const flap = Math.sin(t * 38) * 0.6
    if (wingL.current) wingL.current.rotation.set(-Math.PI / 2, 0, 0.4 + flap)
    if (wingR.current) wingR.current.rotation.set(-Math.PI / 2, 0, -0.4 - flap)
  })

  return (
    <group ref={grp}>
      {/* 胴 */}
      <mesh raycast={noRaycast}>
        <boxGeometry args={[0.07, 0.07, 0.5]} />
        <meshBasicMaterial color="#c0392b" />
      </mesh>
      {/* 頭 */}
      <mesh position={[0, 0, 0.3]} raycast={noRaycast}>
        <sphereGeometry args={[0.08, 10, 8]} />
        <meshBasicMaterial color="#7a1f14" />
      </mesh>
      {/* 羽（薄い白・速く震える） */}
      <mesh ref={wingL} position={[-0.15, 0.03, 0.03]} raycast={noRaycast}>
        <planeGeometry args={[0.42, 0.13]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={wingR} position={[0.15, 0.03, 0.03]} raycast={noRaycast}>
        <planeGeometry args={[0.42, 0.13]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  )
}

export function Life() {
  return (
    <group>
      <FallingLeaves />
      <Footfalls />
      <Dragonfly />
    </group>
  )
}

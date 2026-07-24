// 室町の「動く役者」。文字でなく、人の動きで時代を見せるための共通部品。
// 大路をゆく町衆、荷を運ぶ馬借、風になびく幟。いずれも見た目だけ（当たりなし）。
// 働く者は日が暮れると姿を消す（nightOf）。
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame } from '../game/store'
import { clampDt } from '../game/live'

const noRay = () => null
const SKIN = '#e8c8a8'

function nightOf(): number {
  const t = useGame.getState().t
  return Math.min(1, Math.max(0, (t - 0.58) / 0.14))
}

// ---------- 道ゆく人（大路・湊の町） ----------
// mid を中心に amp だけ z 方向へ往き来する（大路は南北にはしる）。
export function KWalker({ x, mid, amp, speed, phase, robe, kasa }: {
  x: number; mid: number; amp: number; speed: number; phase: number; robe: string; kasa?: boolean
}) {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!g.current) return
    const night = nightOf()
    g.current.visible = night < 0.55
    if (!g.current.visible) return
    const et = clock.elapsedTime
    const k = et * speed * Math.PI * 2 + phase
    const z = mid + amp * Math.sin(k)
    g.current.position.set(x, 0.045 * Math.abs(Math.sin(et * 5.2 + phase)), z)
    g.current.rotation.y = Math.cos(k) > 0 ? 0 : Math.PI
  })
  return (
    <group ref={g} raycast={noRay}>
      <mesh raycast={noRay} position={[0, 0.55, 0]}><coneGeometry args={[0.34, 1.1, 10]} /><meshLambertMaterial color={robe} /></mesh>
      <mesh raycast={noRay} position={[0, 1.22, 0]}><sphereGeometry args={[0.17, 12, 10]} /><meshLambertMaterial color={SKIN} /></mesh>
      {kasa
        ? <mesh raycast={noRay} position={[0, 1.42, 0]}><coneGeometry args={[0.48, 0.22, 12]} /><meshLambertMaterial color="#c8b888" /></mesh>
        : <mesh raycast={noRay} position={[0, 1.46, -0.02]} rotation-x={-0.15}><coneGeometry args={[0.09, 0.26, 8]} /><meshLambertMaterial color="#2a2018" /></mesh>}
    </group>
  )
}

// ---------- 馬借（ばしゃく）：荷を積んだ馬を、人がひいてゆく ----------
// 京と湊をむすんだ運送業者。俵をのせた馬が、道を往き来する。
export function Bashaku({ x0, z0, x1, z1, period = 9, phase = 0 }: {
  x0: number; z0: number; x1: number; z1: number; period?: number; phase?: number
}) {
  const g = useRef<THREE.Group>(null)
  const legs = useRef<(THREE.Mesh | null)[]>([])
  const leader = useRef<THREE.Group>(null)
  const st = useRef({ u: (phase % 1), dir: 1 })
  const path = useMemo(() => {
    const dx = x1 - x0, dz = z1 - z0
    return { dx, dz, heading: Math.atan2(dx, dz) }
  }, [x0, z0, x1, z1])
  useFrame(({ clock }, rawDt) => {
    const dt = clampDt(rawDt)
    if (!g.current) return
    const night = nightOf()
    g.current.visible = night < 0.55
    if (!g.current.visible) return
    const s = st.current
    s.u += (s.dir * dt) / period
    if (s.u >= 1) { s.u = 1; s.dir = -1 }
    if (s.u <= 0) { s.u = 0; s.dir = 1 }
    const px = x0 + path.dx * s.u
    const pz = z0 + path.dz * s.u
    const et = clock.elapsedTime
    const beat = et * 6
    g.current.position.set(px, Math.abs(Math.sin(beat)) * 0.04, pz)
    g.current.rotation.y = s.dir > 0 ? path.heading : path.heading + Math.PI
    legs.current.forEach((leg, i) => {
      if (leg) leg.rotation.x = Math.sin(beat + (i % 2 === 0 ? 0 : Math.PI)) * 0.5
    })
    if (leader.current) leader.current.position.y = Math.abs(Math.sin(et * 5 + 1)) * 0.05
  })
  return (
    <group ref={g} raycast={noRay}>
      {/* 馬体 */}
      <mesh raycast={noRay} position={[0, 0.72, 0]}><boxGeometry args={[0.4, 0.44, 1.15]} /><meshLambertMaterial color="#6a4a30" /></mesh>
      <mesh raycast={noRay} position={[0, 1.0, 0.6]} rotation-x={-0.6}><boxGeometry args={[0.19, 0.52, 0.22]} /><meshLambertMaterial color="#5f4228" /></mesh>
      <mesh raycast={noRay} position={[0, 1.25, 0.82]} rotation-x={0.35}><boxGeometry args={[0.16, 0.2, 0.4]} /><meshLambertMaterial color="#6a4a30" /></mesh>
      <mesh raycast={noRay} position={[0, 0.7, -0.66]} rotation-x={0.5}><boxGeometry args={[0.07, 0.46, 0.07]} /><meshLambertMaterial color="#2a2018" /></mesh>
      {[[-0.13, 0.4], [0.13, 0.4], [-0.13, -0.42], [0.13, -0.42]].map(([lx, lz], i) => (
        <mesh key={i} ref={el => { legs.current[i] = el }} raycast={noRay} position={[lx, 0.48, lz]}>
          <cylinderGeometry args={[0.042, 0.032, 0.5, 6]} /><meshLambertMaterial color="#5f4228" />
        </mesh>
      ))}
      {/* 荷（俵の山を左右に振りわけて積む） */}
      {[-0.24, 0.24].map((dx, i) => (
        <mesh key={i} raycast={noRay} position={[dx, 1.02, 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.17, 0.17, 0.5, 8]} /><meshLambertMaterial color="#c8b070" />
        </mesh>
      ))}
      <mesh raycast={noRay} position={[0, 1.16, 0]}><boxGeometry args={[0.44, 0.14, 0.7]} /><meshLambertMaterial color="#b09a5e" /></mesh>
      {/* ひく人（馬の前を歩く） */}
      <group ref={leader} position={[0, 0, 1.25]} raycast={noRay}>
        <mesh raycast={noRay} position={[0, 0.5, 0]}><coneGeometry args={[0.3, 1.0, 10]} /><meshLambertMaterial color="#5a5040" /></mesh>
        <mesh raycast={noRay} position={[0, 1.1, 0]}><sphereGeometry args={[0.15, 12, 10]} /><meshLambertMaterial color={SKIN} /></mesh>
        <mesh raycast={noRay} position={[0, 1.28, 0]}><coneGeometry args={[0.4, 0.18, 12]} /><meshLambertMaterial color="#c8b888" /></mesh>
      </group>
    </group>
  )
}

// ---------- 幟（のぼり）・旗（風にたなびく布） ----------
export function Banner({ x, z, h = 2.8, c = '#d8cdb2', phase = 0 }: {
  x: number; z: number; h?: number; c?: string; phase?: number
}) {
  const mesh = useRef<THREE.Mesh>(null)
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.6, 1.25, 6, 4)
    g.translate(0.3, 0, 0) // 左端（旗ざお）を原点に
    return g
  }, [])
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array), [geo])
  useFrame(({ clock }) => {
    if (!mesh.current) return
    const et = clock.elapsedTime
    const pos = mesh.current.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const bx = base[i * 3]
      pos.setZ(i, Math.sin(bx * 5 + et * 2.6 + phase) * 0.12 * (bx / 0.6))
    }
    pos.needsUpdate = true
  })
  return (
    <group position={[x, 0, z]} raycast={noRay}>
      <mesh raycast={noRay} position={[0, h / 2, 0]}><cylinderGeometry args={[0.035, 0.045, h, 6]} /><meshLambertMaterial color="#5a4632" /></mesh>
      <mesh ref={mesh} geometry={geo} position={[0.02, h - 0.75, 0]} raycast={noRay}>
        <meshLambertMaterial color={c} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ---------- 厩・湊の馬（草を食み、尾をふる） ----------
export function IdleHorse({ x, z, ry = 0 }: { x: number; z: number; ry?: number }) {
  const neck = useRef<THREE.Group>(null)
  const tail = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const et = clock.elapsedTime
    if (neck.current) neck.current.rotation.x = 0.45 + 0.4 * Math.sin(et * 0.5)
    if (tail.current) tail.current.rotation.z = 0.3 * Math.sin(et * 2.3)
  })
  return (
    <group position={[x, 0, z]} rotation-y={ry} raycast={noRay}>
      <mesh raycast={noRay} position={[0, 0.74, 0]}><boxGeometry args={[0.42, 0.46, 1.2]} /><meshLambertMaterial color="#7a5a3a" /></mesh>
      {[[-0.14, 0.42], [0.14, 0.42], [-0.14, -0.44], [0.14, -0.44]].map(([lx, lz], i) => (
        <mesh key={i} raycast={noRay} position={[lx, 0.26, lz]}><cylinderGeometry args={[0.045, 0.035, 0.52, 6]} /><meshLambertMaterial color="#6a4a30" /></mesh>
      ))}
      <group ref={neck} position={[0, 0.95, 0.5]}>
        <mesh raycast={noRay} position={[0, 0.18, 0.12]} rotation-x={-0.5}><boxGeometry args={[0.2, 0.55, 0.24]} /><meshLambertMaterial color="#6f4f30" /></mesh>
        <mesh raycast={noRay} position={[0, 0.42, 0.32]} rotation-x={0.3}><boxGeometry args={[0.17, 0.2, 0.42]} /><meshLambertMaterial color="#7a5a3a" /></mesh>
      </group>
      <mesh ref={tail} raycast={noRay} position={[0, 0.78, -0.68]} rotation-x={0.5}><boxGeometry args={[0.08, 0.5, 0.08]} /><meshLambertMaterial color="#2a2018" /></mesh>
    </group>
  )
}

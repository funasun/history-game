// 室町の幻視：名所の頁がひらくあいだ、その場で出来事が演じられる。
// 語り（行 i）のすすみに合わせて人が動き、旗がなびき、船が寄せ、民が立ちあがる。
// 文字だけの学びにしない——見て、わかる（北極星「読ませない」の立体版）。
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Figure3D } from '../scene/actors'
import { Banner } from './liveActors'
import { clampDt } from '../game/live'
import type { FigureKind } from '../engine/textures'

const noRay = () => null
const SKIN = '#e8c8a8'

export function MuromachiVision({ id, i }: { id: string; i: number }) {
  if (id === 'bakufu') return <BakufuVision i={i} />
  if (id === 'kinkaku') return <KinkakuVision i={i} />
  if (id === 'noh') return <NohVision i={i} />
  if (id === 'ginkaku') return <GinkakuVision i={i} />
  if (id === 'minato') return <MinatoVision i={i} />
  return null
}

// ---------- 幻視の気配：金の光の粒が立ちのぼる ----------
function Motes({ x, z, r = 2.4, n = 9, h = 2.8, color = '#ffe6a8' }: {
  x: number; z: number; r?: number; n?: number; h?: number; color?: string
}) {
  const refs = useRef<(THREE.Mesh | null)[]>([])
  const seeds = useMemo(() => Array.from({ length: n }, (_, i) => ({
    a: (i / n) * Math.PI * 2,
    rr: 0.25 + ((i * 29) % 10) / 10 * 0.75,
    sp: 0.16 + ((i * 13) % 7) / 7 * 0.18,
    ph: ((i * 17) % 11) / 11,
  })), [n])
  useFrame(({ clock }) => {
    const et = clock.elapsedTime
    seeds.forEach((s, k) => {
      const m = refs.current[k]
      if (!m) return
      const c = (et * s.sp + s.ph) % 1
      m.position.set(
        x + Math.cos(s.a + et * 0.18) * r * s.rr,
        0.25 + c * h,
        z + Math.sin(s.a + et * 0.18) * r * s.rr,
      )
      ;(m.material as THREE.MeshBasicMaterial).opacity = 0.5 * Math.sin(c * Math.PI)
    })
  })
  return (
    <group raycast={noRay}>
      {seeds.map((_, k) => (
        <mesh key={k} ref={el => { refs.current[k] = el }} raycast={noRay}>
          <sphereGeometry args={[0.05, 6, 5]} />
          <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} fog={false} />
        </mesh>
      ))}
    </group>
  )
}

// ---------- 立つ人かげ（かすかに揺れる） ----------
function Standing({ x, y = 0, z, ry = 0, kind, robes, h, sway = 0.022, phase = 0 }: {
  x: number; y?: number; z: number; ry?: number
  kind: FigureKind; robes: string[]; h: number; sway?: number; phase?: number
}) {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (g.current) g.current.rotation.z = sway * Math.sin(clock.elapsedTime * 0.9 + phase)
  })
  return (
    <group position={[x, y, z]} rotation-y={ry} raycast={noRay}>
      <group ref={g}><Figure3D kind={kind} robes={robes} h={h} /></group>
    </group>
  )
}

// ---------- ひざまずく者（up で立ちあがり、hop で歓ぶ、pole は幟をかかげる） ----------
function Kneeler({ x, z, ry = Math.PI, robes, up = false, hop = false, pole = false, show = true, phase = 0 }: {
  x: number; z: number; ry?: number; robes: string[]
  up?: boolean; hop?: boolean; pole?: boolean; show?: boolean; phase?: number
}) {
  const g = useRef<THREE.Group>(null)
  const shaft = useRef<THREE.Group>(null)
  const cur = useRef(0.45)
  useFrame(({ clock }, rawDt) => {
    const dt = clampDt(rawDt)
    const target = up ? 0.05 : 0.42
    cur.current += (target - cur.current) * Math.min(1, dt * 2.6)
    const et = clock.elapsedTime
    if (g.current) {
      g.current.visible = show
      g.current.rotation.x = cur.current + 0.05 * Math.sin(et * 1.3 + phase)
      g.current.position.y = hop && up ? Math.abs(Math.sin(et * 3.6 + phase)) * 0.07 : 0
    }
    if (shaft.current) shaft.current.rotation.z = 0.12 + (1 - cur.current) * 0.5
  })
  return (
    <group position={[x, 0, z]} rotation-y={ry} raycast={noRay}>
      <group ref={g}>
        <Figure3D kind="aruji" robes={robes} h={1.55} />
        {pole && (
          <group ref={shaft} position={[0.34, 0.6, 0]}>
            <mesh raycast={noRay} position={[0, 1.0, 0]}><cylinderGeometry args={[0.022, 0.022, 2.6, 5]} /><meshLambertMaterial color="#5a4632" /></mesh>
            <mesh raycast={noRay} position={[0.28, 1.7, 0]}><boxGeometry args={[0.5, 0.7, 0.02]} /><meshLambertMaterial color="#d8cdb2" side={THREE.DoubleSide} /></mesh>
          </group>
        )}
      </group>
    </group>
  )
}

// ---------- 一、花の御所：足利尊氏と、平伏する守護大名 ----------
// 語りがすすむと（管領・守護の補佐）、大名が立ちあがって将軍に仕える
function BakufuVision({ i }: { i: number }) {
  const up = i >= 4
  return (
    <group raycast={noRay}>
      <Standing x={0} y={0.4} z={-13.9} kind="aruji" robes={['#2f3a52', '#b0902f']} h={1.9} />
      <Kneeler x={-1.7} z={-11.9} robes={['#4a3f36', '#e7dcc0']} up={up} phase={0.6} />
      <Kneeler x={1.7} z={-11.9} robes={['#3a4a5c', '#e7dcc0']} up={up} phase={2.1} />
      {/* 南朝と北朝、ふたつの旗 */}
      <Banner x={-3.0} z={-12.7} phase={0} c="#c05a52" />
      <Banner x={3.0} z={-12.7} phase={2} c="#d8cdb2" />
      <Motes x={0} z={-12.6} r={2.6} />
    </group>
  )
}

// ---------- 二、金閣：義満の栄華と、明との勘合貿易 ----------
function KinkakuVision({ i }: { i: number }) {
  const envoy = i >= 3
  return (
    <group raycast={noRay}>
      {/* 金色の直衣に立つ義満 */}
      <Standing x={-13} y={0.5} z={-9.9} kind="aruji" robes={['#e9e2cf', '#c9a02c']} h={1.95} sway={0.02} />
      {/* 南北朝の統一を示す二旗（やがて一つの世に） */}
      <Banner x={-14.8} z={-10.6} phase={0.4} c="#b58a3a" />
      <Banner x={-11.2} z={-10.6} phase={1.9} c="#b58a3a" />
      {/* 明の使者：勘合の札をささげて拝する（i>=3） */}
      <Kneeler x={-13} z={-8.4} ry={0} robes={['#3a5040', '#d8cdb2']} show={envoy} phase={1.1} />
      <Motes x={-13} z={-10.4} r={2.6} n={11} />
    </group>
  )
}

// ---------- 三、能舞台：世阿弥の舞（幽玄） ----------
function NohVision({ i }: { i: number }) {
  const dancing = i >= 2
  return (
    <group raycast={noRay}>
      <Mai x={14} y={0.62} z={-5.9} dancing={dancing} />
      {/* 見所（けんしょ）で見まもる世阿弥 */}
      <Standing x={11.6} y={0.1} z={-4.0} kind="aruji" robes={['#33322c', '#8a8474']} h={1.8} ry={0.5} />
      {/* 地謡（じうたい）ふたり——舞台の脇 */}
      <Standing x={16.2} y={0.1} z={-6.6} kind="aruji" robes={['#3a3630', '#6a6258']} h={1.7} ry={-0.7} sway={0.01} />
      <Motes x={14} z={-5.4} r={2.4} color="#f0e8d0" />
    </group>
  )
}

// 舞う人：面をつけ、扇をかざしてしずかに回る（幽玄）
function Mai({ x, y, z, dancing }: { x: number; y: number; z: number; dancing: boolean }) {
  const g = useRef<THREE.Group>(null)
  const arm = useRef<THREE.Group>(null)
  useFrame(({ clock }, rawDt) => {
    const dt = clampDt(rawDt)
    const et = clock.elapsedTime
    if (g.current) {
      if (dancing) g.current.rotation.y += dt * 0.5
      g.current.position.y = y + (dancing ? Math.abs(Math.sin(et * 1.4)) * 0.04 : 0)
    }
    if (arm.current) arm.current.rotation.z = dancing ? -0.5 - 0.3 * Math.sin(et * 1.2) : -0.2
  })
  return (
    <group ref={g} position={[x, y, z]} raycast={noRay}>
      <Figure3D kind="hime" robes={['#c9a02c', '#e2d8bc', '#b04a44']} h={1.75} />
      {/* 能面（白い面） */}
      <mesh raycast={noRay} position={[0, 1.5, 0.14]}><boxGeometry args={[0.2, 0.28, 0.06]} /><meshLambertMaterial color="#efe8d6" /></mesh>
      {/* かざす扇 */}
      <group ref={arm} position={[0.2, 1.1, 0.1]}>
        <mesh raycast={noRay} position={[0.28, 0.1, 0]} rotation-z={0.4}><boxGeometry args={[0.5, 0.34, 0.02]} /><meshLambertMaterial color="#d8b43a" side={THREE.DoubleSide} /></mesh>
      </group>
    </group>
  )
}

// ---------- 四、銀閣：応仁の乱の焔から、東山の静けさへ ----------
function GinkakuVision({ i }: { i: number }) {
  const war = i < 3
  return (
    <group raycast={noRay}>
      {/* 戦火（応仁の乱）——i<3 のあいだ焔がはぜ、人が逃げまどう */}
      <Embers active={war} />
      <Fleeing x={10.6} z={11.6} active={war} phase={0} />
      <Fleeing x={15.2} z={11.0} active={war} phase={1.4} />
      {/* 政にやぶれ、東山にしりぞいた義政（i>=3、しずかに立つ） */}
      <Standing x={13} y={0.3} z={12.2} kind="aruji" robes={['#3a4038', '#6b6a5a']} h={1.85} sway={0.014} />
      {!war && <Motes x={13} z={11.6} r={2.4} color="#cdd2d6" />}
    </group>
  )
}

// 焔：橙の火がはぜる（応仁の乱の京の炎上）
function Embers({ active }: { active: boolean }) {
  const pts = useMemo(() => [
    { x: 11, z: 9.5, ph: 0 }, { x: 14.5, z: 8.5, ph: 0.4 }, { x: 12.5, z: 6.6, ph: 0.75 },
    { x: 15.5, z: 10.5, ph: 0.2 }, { x: 10.4, z: 7.4, ph: 0.9 },
  ], [])
  const refs = useRef<(THREE.Mesh | null)[]>([])
  useFrame(({ clock }) => {
    const et = clock.elapsedTime
    pts.forEach((p, k) => {
      const m = refs.current[k]
      if (!m) return
      const c = (et * 0.6 + p.ph) % 1
      const on = active && c < 0.5
      m.visible = on
      if (!on) return
      const kk = c / 0.5
      const sc = 0.3 + kk * 1.2
      m.scale.set(sc, sc * 1.4, sc)
      m.position.set(p.x, 0.6 + kk * 0.9, p.z)
      ;(m.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - kk)
    })
  })
  return (
    <group raycast={noRay}>
      {pts.map((_, k) => (
        <mesh key={k} ref={el => { refs.current[k] = el }} visible={false} raycast={noRay}>
          <sphereGeometry args={[0.5, 10, 8]} />
          <meshBasicMaterial color="#ff9440" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
        </mesh>
      ))}
    </group>
  )
}

// 逃げまどう人（戦火から南へ）
function Fleeing({ x, z, active, phase }: { x: number; z: number; active: boolean; phase: number }) {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!g.current) return
    g.current.visible = active
    if (!active) return
    const et = clock.elapsedTime
    const c = ((et * 0.4 + phase) % 1)
    g.current.position.set(x, 0.06 * Math.abs(Math.sin(et * 7 + phase)), z + c * 3.0)
    g.current.rotation.y = Math.PI
  })
  return (
    <group ref={g} raycast={noRay}>
      <mesh raycast={noRay} position={[0, 0.5, 0]}><coneGeometry args={[0.3, 1.0, 10]} /><meshLambertMaterial color="#5a5040" /></mesh>
      <mesh raycast={noRay} position={[0, 1.1, 0]}><sphereGeometry args={[0.15, 12, 10]} /><meshLambertMaterial color={SKIN} /></mesh>
    </group>
  )
}

// ---------- 五、湊：勘合船・琉球の交易と、立ちあがる土一揆 ----------
function MinatoVision({ i }: { i: number }) {
  const gather = i >= 4
  const rise = i >= 5
  return (
    <group raycast={noRay}>
      <TradeShips i={i} />
      {/* 桟橋に立つ会合衆 */}
      <Standing x={0} y={0.2} z={-8.4} kind="aruji" robes={['#2f3a3a', '#4a5a52', '#c8b888']} h={1.85} />
      {/* 土一揆：民が寄りあい（i>=4）、徳政をもとめて幟をかかげ立つ（i>=5） */}
      <Kneeler x={-3.0} z={-6.2} ry={0.2} robes={['#57503f', '#e7dcc0']} up={rise} hop pole show={gather} phase={0.3} />
      <Kneeler x={-1.0} z={-5.6} ry={0} robes={['#454b3f', '#e7dcc0']} up={rise} hop show={gather} phase={1.1} />
      <Kneeler x={1.2} z={-5.8} ry={-0.1} robes={['#5c4a38', '#e7dcc0']} up={rise} hop pole show={gather} phase={2.0} />
      <Kneeler x={3.0} z={-6.3} ry={-0.2} robes={['#4a4632', '#e7dcc0']} up={rise} hop show={gather} phase={2.8} />
      <Motes x={0} z={-8.8} r={2.8} color="#dfe6ea" />
    </group>
  )
}

// 交易の船：勘合船と琉球船が沖にうかぶ。語りにつれ、岸へ寄ってくる。
function TradeShips({ i }: { i: number }) {
  const ships = useMemo(() => [
    { x: -6, z: -16, ph: 0.5, s: 1.05, sail: '#c7b58c' },
    { x: 6.5, z: -18, ph: 2.1, s: 1.2, sail: '#c7b58c' },
    { x: 0, z: -21, ph: 4.0, s: 1.15, sail: '#cf8a5a' }, // 琉球船（帆の色をかえる）
  ], [])
  const grp = useRef<(THREE.Group | null)[]>([])
  const off = useRef(ships.map(() => 0))
  const near = i >= 1
  useFrame(({ clock }, rawDt) => {
    const dt = clampDt(rawDt)
    const et = clock.elapsedTime
    ships.forEach((sh, k) => {
      const g = grp.current[k]
      if (!g) return
      const target = near ? 4.5 : 0
      off.current[k] += (target - off.current[k]) * Math.min(1, dt * 0.5)
      g.position.set(
        sh.x + Math.sin(et * 0.4 + sh.ph) * 0.35,
        Math.sin(et * 0.8 + sh.ph) * 0.14,
        sh.z + off.current[k],
      )
      g.rotation.z = Math.sin(et * 0.7 + sh.ph) * 0.05
    })
  })
  return (
    <group raycast={noRay}>
      {ships.map((sh, k) => (
        <group key={k} ref={el => { grp.current[k] = el }} position={[sh.x, 0, sh.z]} scale={sh.s}>
          <mesh raycast={noRay} position={[0, 0.34, 0]}><boxGeometry args={[2.9, 0.62, 1.1]} /><meshLambertMaterial color="#43331f" /></mesh>
          <mesh raycast={noRay} position={[-1.45, 0.64, 0]} rotation-z={0.5}><boxGeometry args={[0.7, 0.5, 1.0]} /><meshLambertMaterial color="#3a2c1c" /></mesh>
          <mesh raycast={noRay} position={[1.45, 0.64, 0]} rotation-z={-0.5}><boxGeometry args={[0.7, 0.5, 1.0]} /><meshLambertMaterial color="#3a2c1c" /></mesh>
          <mesh raycast={noRay} position={[0, 1.7, 0]}><cylinderGeometry args={[0.06, 0.08, 2.4, 6]} /><meshLambertMaterial color="#4a4038" /></mesh>
          <mesh raycast={noRay} position={[0, 1.95, 0]}><planeGeometry args={[1.9, 1.5]} /><meshLambertMaterial color={sh.sail} side={THREE.DoubleSide} /></mesh>
        </group>
      ))}
    </group>
  )
}

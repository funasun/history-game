// 鎌倉の幻視：名所の頁がひらくあいだ、その場で出来事が演じられる。
// 語り（行 i）のすすみに合わせて人が動き、旗がなびき、船が寄せては退く。
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

export function KamakuraVision({ id, i }: { id: string; i: number }) {
  if (id === 'hachiman') return <HachimanVision i={i} />
  if (id === 'daibutsu') return <DaibutsuVision i={i} />
  if (id === 'seat') return <SeatVision i={i} />
  if (id === 'sea') return <SeaVision i={i} />
  return null
}

// ---------- 幻視の気配：金の光の粒が立ちのぼる ----------
function Motes({ x, z, r = 2.4, n = 9, h = 2.8 }: { x: number; z: number; r?: number; n?: number; h?: number }) {
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
          <meshBasicMaterial color="#ffe6a8" transparent opacity={0} depthWrite={false} fog={false} />
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
      {/* kind が髪と烏帽子を描き分ける（nyobo は長髪、aruji は烏帽子） */}
      <group ref={g}><Figure3D kind={kind} robes={robes} h={h} /></group>
    </group>
  )
}

// ---------- 平伏する御家人（up で立ちあがり、spear は薙刀がそろって天を指す） ----------
function Kneeler({ x, z, ry = Math.PI, robes, up = false, hop = false, spear = false, phase = 0 }: {
  x: number; z: number; ry?: number; robes: string[]
  up?: boolean; hop?: boolean; spear?: boolean; phase?: number
}) {
  const g = useRef<THREE.Group>(null)
  const pole = useRef<THREE.Group>(null)
  const cur = useRef(0.45)
  useFrame(({ clock }, rawDt) => {
    const dt = clampDt(rawDt)
    const target = up ? 0.05 : 0.42
    cur.current += (target - cur.current) * Math.min(1, dt * 2.6)
    const et = clock.elapsedTime
    if (g.current) {
      g.current.rotation.x = cur.current + 0.05 * Math.sin(et * 1.3 + phase)
      g.current.position.y = hop && up ? Math.abs(Math.sin(et * 3.6 + phase)) * 0.07 : 0
    }
    if (pole.current) pole.current.rotation.z = 0.15 + cur.current * 1.6
  })
  return (
    <group position={[x, 0, z]} rotation-y={ry} raycast={noRay}>
      <group ref={g}>
        <Figure3D kind="aruji" robes={robes} h={1.55} />
        {spear && (
          <group ref={pole} position={[0.34, 0.6, 0]}>
            <mesh raycast={noRay} position={[0, 0.75, 0]}><cylinderGeometry args={[0.022, 0.022, 2.2, 5]} /><meshLambertMaterial color="#5a4632" /></mesh>
            <mesh raycast={noRay} position={[0, 1.95, 0]}><coneGeometry args={[0.05, 0.3, 6]} /><meshLambertMaterial color="#b9b4a4" /></mesh>
          </group>
        )}
      </group>
    </group>
  )
}

// ---------- 一、鶴岡八幡宮：頼朝、御家人を従える ----------
// 語りがすすむと（将軍任官）、御家人が立ちあがって仕える
function HachimanVision({ i }: { i: number }) {
  const up = i >= 4
  return (
    <group raycast={noRay}>
      <Standing x={0} y={0.5} z={-13.5} kind="aruji" robes={['#e9e2cf', '#b89440']} h={1.9} />
      <Kneeler x={-1.5} z={-11.3} robes={['#3a4a5c', '#e7dcc0']} up={up} phase={0.6} />
      <Kneeler x={1.5} z={-11.3} robes={['#4a3f36', '#e7dcc0']} up={up} phase={2.1} />
      <Banner x={-2.9} z={-12.4} phase={0} />
      <Banner x={2.9} z={-12.4} phase={2} />
      <Motes x={0} z={-12.2} r={2.6} />
    </group>
  )
}

// ---------- 二、政庁：尼御台の演説と、承久の勝ちどき ----------
function SeatVision({ i }: { i: number }) {
  const won = i >= 2
  return (
    <group raycast={noRay}>
      {/* 土壇のきわに立つ尼御台（頼朝どのの御恩を説く） */}
      <Standing x={13} y={0.4} z={-6.7} kind="nyobo" robes={['#3b352e', '#5a5148', '#8a8070', '#e7dcc0']} h={1.8} sway={0.035} />
      {/* 庭に集う御家人。勝ちどきで立ちあがり、薙刀がそろって天を指す */}
      <Kneeler x={11.3} z={-4.6} robes={['#3a4a5c', '#e7dcc0']} up={won} hop spear phase={0} />
      <Kneeler x={12.2} z={-3.7} robes={['#4a3f36', '#e7dcc0']} up={won} hop spear phase={1.2} />
      <Kneeler x={13.9} z={-4.4} robes={['#6a7f3f', '#e7dcc0']} up={won} hop spear phase={2.3} />
      <Kneeler x={14.8} z={-3.5} robes={['#3a4a5c', '#e7dcc0']} up={won} hop spear phase={3.1} />
      <Banner x={10.8} z={-5.7} phase={1} />
      <Banner x={15.2} z={-5.7} phase={2.6} />
      <Motes x={13} z={-5} r={2.6} />
    </group>
  )
}

// ---------- 三、鎌倉大仏：仏師の鑿と、念仏の行列 ----------
function DaibutsuVision({ i }: { i: number }) {
  const monks = i >= 3
  return (
    <group raycast={noRay}>
      <Scaffold x={-10.7} z={-3.6} />
      <Procession cx={-9.1} cz={0.7} r={1.7} visible={monks} />
      <Motes x={-10.8} z={-1.6} r={2.6} />
    </group>
  )
}

// 足場の上で、二人の仏師が鑿をふるう。木くずが散る
function Scaffold({ x, z }: { x: number; z: number }) {
  const arms = useRef<(THREE.Group | null)[]>([])
  const chips = useRef<(THREE.Mesh | null)[]>([])
  useFrame(({ clock }) => {
    const et = clock.elapsedTime
    arms.current.forEach((a, k) => {
      if (a) a.rotation.x = -0.5 - Math.abs(Math.sin(et * 3.1 + k * 1.9)) ** 3 * 0.9
    })
    chips.current.forEach((c, k) => {
      if (!c) return
      const cy = (et * (0.9 + k * 0.2) + k * 0.37) % 1
      c.position.set(x - 0.55 + Math.sin(k * 5.1) * 0.3, 2.0 - cy * 1.6, z + 0.3 + Math.cos(k * 3.3) * 0.35)
      ;(c.material as THREE.MeshLambertMaterial).opacity = 1 - cy
    })
  })
  return (
    <group raycast={noRay}>
      {/* 丸太の足場 */}
      {[[0.1, -0.7], [0.1, 0.7]].map(([dx, dz], k) => (
        <mesh key={k} raycast={noRay} position={[x + dx, 0.85, z + dz]}><cylinderGeometry args={[0.05, 0.06, 1.7, 6]} /><meshLambertMaterial color="#7a6448" /></mesh>
      ))}
      <mesh raycast={noRay} position={[x, 1.7, z]}><boxGeometry args={[0.6, 0.08, 1.9]} /><meshLambertMaterial color="#8a7458" /></mesh>
      {/* 仏師（鑿をふるう腕） */}
      {[-0.45, 0.5].map((dz, k) => (
        <group key={k} position={[x, 1.74, z + dz]} rotation-y={-Math.PI / 2} raycast={noRay}>
          <mesh raycast={noRay} position={[0, 0.38, 0]}><coneGeometry args={[0.24, 0.78, 9]} /><meshLambertMaterial color={k ? '#5c4a38' : '#4a4c42'} /></mesh>
          <mesh raycast={noRay} position={[0, 0.86, 0]}><sphereGeometry args={[0.13, 12, 10]} /><meshLambertMaterial color={SKIN} /></mesh>
          <group ref={el => { arms.current[k] = el }} position={[0.14, 0.66, 0.1]}>
            <mesh raycast={noRay} position={[0, 0.22, 0]}><boxGeometry args={[0.055, 0.42, 0.055]} /><meshLambertMaterial color="#8a6c4c" /></mesh>
          </group>
        </group>
      ))}
      {/* 散る木くず */}
      {[0, 1, 2].map(k => (
        <mesh key={k} ref={el => { chips.current[k] = el }} raycast={noRay}>
          <tetrahedronGeometry args={[0.05]} />
          <meshLambertMaterial color="#c9a878" transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  )
}

// 念仏の行列：僧がしずかに巡る（やさしい教えのひろまり）
function Procession({ cx, cz, r, visible }: { cx: number; cz: number; r: number; visible: boolean }) {
  const g = useRef<THREE.Group>(null)
  const monks = useRef<(THREE.Group | null)[]>([])
  useFrame(({ clock }) => {
    if (!g.current) return
    g.current.visible = visible
    if (!visible) return
    const et = clock.elapsedTime
    for (let k = 0; k < 3; k++) {
      const m = monks.current[k]
      if (!m) continue
      const a = et * 0.34 + k * 0.85
      m.position.set(cx + Math.cos(a) * r, 0.04 * Math.abs(Math.sin(et * 4 + k)), cz + Math.sin(a) * r)
      m.rotation.y = -a
    }
  })
  return (
    <group ref={g} visible={false} raycast={noRay}>
      {[0, 1, 2].map(k => (
        <group key={k} ref={el => { monks.current[k] = el }} raycast={noRay}>
          <mesh raycast={noRay} position={[0, 0.5, 0]}><coneGeometry args={[0.28, 1.0, 10]} /><meshLambertMaterial color="#4a4038" /></mesh>
          <mesh raycast={noRay} position={[0, 1.12, 0]}><sphereGeometry args={[0.15, 12, 10]} /><meshLambertMaterial color={SKIN} /></mesh>
          {k === 0 && (
            <mesh raycast={noRay} position={[0.24, 0.85, 0]}><cylinderGeometry args={[0.02, 0.02, 1.5, 5]} /><meshLambertMaterial color="#8a7458" /></mesh>
          )}
        </group>
      ))}
    </group>
  )
}

// ---------- 四、由比ヶ浜：元寇——寄せる船、てつはう、神風 ----------
function SeaVision({ i }: { i: number }) {
  return (
    <group raycast={noRay}>
      <MongolShips i={i} />
      <Teppo active={i >= 1 && i < 3} />
      <Kamikaze active={i >= 3 && i < 6} />
      <Motes x={0} z={12.2} r={3} />
    </group>
  )
}

// 沖に並ぶ元の船。語りがすすむと嵐にもまれ、沖の霞へ退いてゆく
function MongolShips({ i }: { i: number }) {
  const ships = useMemo(() => [
    { x: -11, z: 30, ph: 0.5, s: 1.05 },
    { x: -4.5, z: 27.5, ph: 2.1, s: 1.2 },
    { x: 3.5, z: 29, ph: 4.2, s: 1.0 },
    { x: 10, z: 26.5, ph: 1.3, s: 1.15 },
  ], [])
  const grp = useRef<(THREE.Group | null)[]>([])
  const off = useRef(ships.map(() => 0.5))
  const storm = i >= 3
  const gone = i >= 5
  useFrame(({ clock }, rawDt) => {
    const dt = clampDt(rawDt)
    const et = clock.elapsedTime
    ships.forEach((sh, k) => {
      const g = grp.current[k]
      if (!g) return
      // 寄せる（岸へ）→ 嵐で退く → 霞のむこうへ消える
      if (storm || gone) off.current[k] += dt * (gone ? 2.2 : 0.8 + 0.25 * Math.sin(k * 2.1))
      else off.current[k] = Math.max(off.current[k] - dt * 0.24, -1.8)
      const rock = storm ? 0.17 : 0.05
      g.position.set(
        sh.x + Math.sin(et * 0.4 + sh.ph) * 0.4,
        Math.sin(et * (storm ? 1.7 : 0.8) + sh.ph) * (storm ? 0.32 : 0.14) - (storm ? 0.15 : 0),
        sh.z + off.current[k],
      )
      g.rotation.z = Math.sin(et * (storm ? 2.0 : 0.7) + sh.ph) * rock
      g.rotation.x = Math.sin(et * 1.1 + sh.ph) * rock * 0.6
    })
  })
  return (
    <group raycast={noRay}>
      {ships.map((sh, k) => (
        <group key={k} ref={el => { grp.current[k] = el }} position={[sh.x, 0, sh.z]} scale={sh.s}>
          {/* 船体と艫（とも）・舳（へさき） */}
          <mesh raycast={noRay} position={[0, 0.32, 0]}><boxGeometry args={[2.7, 0.62, 1.05]} /><meshLambertMaterial color="#3a332c" /></mesh>
          <mesh raycast={noRay} position={[-1.35, 0.62, 0]} rotation-z={0.5}><boxGeometry args={[0.7, 0.5, 0.9]} /><meshLambertMaterial color="#332c26" /></mesh>
          <mesh raycast={noRay} position={[1.35, 0.62, 0]} rotation-z={-0.5}><boxGeometry args={[0.7, 0.5, 0.9]} /><meshLambertMaterial color="#332c26" /></mesh>
          {/* 帆柱と網代帆 */}
          <mesh raycast={noRay} position={[0, 1.7, 0]}><cylinderGeometry args={[0.06, 0.08, 2.4, 6]} /><meshLambertMaterial color="#4a4038" /></mesh>
          <mesh raycast={noRay} position={[0, 1.95, 0]}><planeGeometry args={[1.9, 1.5]} /><meshLambertMaterial color="#8a7a5c" side={THREE.DoubleSide} /></mesh>
        </group>
      ))}
    </group>
  )
}

// てつはう：船と岸のあいだで橙の火がはぜる
function Teppo({ active }: { active: boolean }) {
  const pts = useMemo(() => [
    { x: -7, z: 23, ph: 0 }, { x: 1, z: 24.5, ph: 0.45 }, { x: 7.5, z: 22.5, ph: 0.8 },
  ], [])
  const refs = useRef<(THREE.Mesh | null)[]>([])
  useFrame(({ clock }) => {
    const et = clock.elapsedTime
    pts.forEach((p, k) => {
      const m = refs.current[k]
      if (!m) return
      const c = (et * 0.5 + p.ph) % 1
      const on = active && c < 0.32
      m.visible = on
      if (!on) return
      const kk = c / 0.32
      const sc = 0.25 + kk * 1.5
      m.scale.set(sc, sc, sc)
      m.position.set(p.x, 0.9 + kk * 0.6, p.z)
      ;(m.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - kk)
    })
  })
  return (
    <group raycast={noRay}>
      {pts.map((_, k) => (
        <mesh key={k} ref={el => { refs.current[k] = el }} visible={false} raycast={noRay}>
          <sphereGeometry args={[0.5, 10, 8]} />
          <meshBasicMaterial color="#ffb060" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
        </mesh>
      ))}
    </group>
  )
}

// 神風：岸から沖へ、白い風のすじが走る
function Kamikaze({ active }: { active: boolean }) {
  const refs = useRef<(THREE.Mesh | null)[]>([])
  const lanes = useMemo(() => [-10, -6, -2, 2, 6, 10], [])
  useFrame(({ clock }) => {
    const et = clock.elapsedTime
    lanes.forEach((lx, k) => {
      const m = refs.current[k]
      if (!m) return
      m.visible = active
      if (!active) return
      const c = ((et * 0.55 + k * 0.21) % 1)
      m.position.set(lx + Math.sin(k * 3.1) * 1.5, 1.1 + Math.sin(et * 3 + k) * 0.3, 14 + c * 20)
      ;(m.material as THREE.MeshBasicMaterial).opacity = 0.5 * Math.sin(c * Math.PI)
    })
  })
  return (
    <group raycast={noRay}>
      {lanes.map((_, k) => (
        <mesh key={k} ref={el => { refs.current[k] = el }} rotation-x={-Math.PI / 2} visible={false} raycast={noRay}>
          <planeGeometry args={[0.14, 4.5]} />
          <meshBasicMaterial color="#eef2f0" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

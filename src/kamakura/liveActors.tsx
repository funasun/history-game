// 鎌倉の「動く役者」。文字でなく、人の動きで時代を見せるための共通部品。
// 弓馬の武者（笠懸・流鏑馬）、道ゆく人、田の農人、厩の馬、白旗。
// いずれも見た目だけ（当たりなし・raycastなし）。働く者は日が暮れると姿を消す。
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame } from '../game/store'
import { clampDt } from '../game/live'
import { toTexture, ringCanvas } from '../engine/textures'

const noRay = () => null
const SKIN = '#e8c8a8'

function nightOf(): number {
  const t = useGame.getState().t
  return Math.min(1, Math.max(0, (t - 0.58) / 0.14))
}

// ---------- 弓馬の武者 ----------
// (x0,z0)〜(x1,z1) の馬場を駆けもどり、脇に立つ的をつぎつぎ射る。
// 由比ヶ浜の笠懸（丸い的）と、谷戸の的場の流鏑馬（板の的）を一つの部品でまかなう。
export function MountedArcher({ x0, z0, x1, z1, targets, period = 6, round = false }: {
  x0: number; z0: number; x1: number; z1: number
  targets: [number, number][]
  period?: number
  round?: boolean
}) {
  const g = useRef<THREE.Group>(null)
  const bobG = useRef<THREE.Group>(null)
  const riderG = useRef<THREE.Group>(null)
  const legs = useRef<(THREE.Mesh | null)[]>([])
  const boards = useRef<(THREE.Group | null)[]>([])
  const bursts = useRef<(THREE.Mesh | null)[]>([])
  const arrowM = useRef<THREE.Mesh>(null)
  const ringTex = useMemo(() => toTexture('ring', ringCanvas), [])

  // 馬場の向きと、各的が道すじのどこ（u）にあるか・どちら側かを先に解いておく
  const path = useMemo(() => {
    const dx = x1 - x0, dz = z1 - z0
    const len = Math.hypot(dx, dz) || 1
    const ux = dx / len, uz = dz / len
    const marks = targets.map(([tx, tz]) => {
      const u = ((tx - x0) * dx + (tz - z0) * dz) / (len * len)
      const side = Math.sign(dx * (tz - z0) - dz * (tx - x0)) || 1
      // 的の面は馬場のほうを向く（垂線の向き）
      let nx = x0 + dx * u - tx, nz = z0 + dz * u - tz
      const nl = Math.hypot(nx, nz) || 1
      nx /= nl; nz /= nl
      return { u, side, tx, tz, faceY: Math.atan2(nx, nz) }
    })
    return { dx, dz, len, ux, uz, marks, heading: Math.atan2(dx, dz) }
  }, [x0, z0, x1, z1, targets])

  const st = useRef({
    u: 0, dir: 1, rest: 0,
    arrow: null as null | { t: number; fx: number; fz: number; tx: number; tz: number },
    hit: targets.map(() => 0),
  })

  useFrame(({ clock }, rawDt) => {
    const dt = clampDt(rawDt)
    const night = nightOf()
    const s = st.current
    if (g.current) g.current.visible = night < 0.55
    if (night >= 0.55) return
    const et = clock.elapsedTime

    // 端で息をととのえ、駆けもどる
    if (s.rest > 0) {
      s.rest -= dt
    } else {
      const pu = s.u
      s.u += (s.dir * dt) / period
      if (s.u >= 1) { s.u = 1; s.dir = -1; s.rest = 1.4 }
      if (s.u <= 0) { s.u = 0; s.dir = 1; s.rest = 1.4 }
      // 的のきわを駆けぬける瞬間、矢を放つ
      for (let k = 0; k < path.marks.length; k++) {
        const m = path.marks[k]
        const gate = m.u - s.dir * 0.03
        const crossed = s.dir > 0 ? pu < gate && s.u >= gate : pu > gate && s.u <= gate
        if (crossed && s.hit[k] <= 0 && !s.arrow) {
          s.arrow = { t: 0, fx: x0 + path.dx * s.u, fz: z0 + path.dz * s.u, tx: m.tx, tz: m.tz }
        }
      }
    }

    const px = x0 + path.dx * s.u
    const pz = z0 + path.dz * s.u
    const running = s.rest <= 0
    const beat = et * 11
    if (g.current) {
      g.current.position.set(px, 0, pz)
      g.current.rotation.y = s.dir > 0 ? path.heading : path.heading + Math.PI
    }
    if (bobG.current) bobG.current.position.y = running ? Math.abs(Math.sin(beat)) * 0.1 : 0.02 * Math.sin(et * 2)
    legs.current.forEach((leg, i) => {
      if (!leg) return
      leg.rotation.x = running ? Math.sin(beat + (i % 2 === 0 ? 0 : Math.PI) + (i < 2 ? 0.4 : 0)) * 0.75 : 0
    })
    // 騎手はつねに的の側へ半身をひらく（弓は横へ引くもの）
    if (riderG.current) {
      const side = (path.marks[0]?.side ?? 1) * (s.dir > 0 ? 1 : -1)
      riderG.current.rotation.y += (side * 1.15 - riderG.current.rotation.y) * 0.12
    }

    // 矢：ひと呼吸で的へ飛ぶ
    if (s.arrow) {
      s.arrow.t += dt / 0.13
      if (s.arrow.t >= 1) {
        // 中り。的がくるりと回る
        for (let k = 0; k < path.marks.length; k++) {
          const m = path.marks[k]
          if (m.tx === s.arrow.tx && m.tz === s.arrow.tz) s.hit[k] = 1
        }
        s.arrow = null
        if (arrowM.current) arrowM.current.visible = false
      } else if (arrowM.current) {
        const a = s.arrow
        const ax = a.fx + (a.tx - a.fx) * a.t
        const az = a.fz + (a.tz - a.fz) * a.t
        arrowM.current.visible = true
        arrowM.current.position.set(ax, 1.45, az)
        arrowM.current.rotation.y = Math.atan2(a.tx - a.fx, a.tz - a.fz)
      }
    }

    // 的の回転ともどり・砂ぼこりの環
    for (let k = 0; k < s.hit.length; k++) {
      if (s.hit[k] > 0) s.hit[k] = Math.max(0, s.hit[k] - dt / 0.9)
      const b = boards.current[k]
      if (b) b.rotation.x = (1 - s.hit[k]) > 0 && s.hit[k] > 0 ? (1 - s.hit[k]) * Math.PI * 4 : 0
      const burst = bursts.current[k]
      if (burst) {
        const kk = 1 - s.hit[k]
        burst.visible = s.hit[k] > 0
        const sc = 0.3 + kk * 1.3
        burst.scale.set(sc, sc, sc)
        ;(burst.material as THREE.MeshBasicMaterial).opacity = 0.7 * s.hit[k]
      }
    }
  })

  return (
    <group raycast={noRay}>
      {/* 武者と馬 */}
      <group ref={g} raycast={noRay}>
        <group ref={bobG}>
          {/* 馬体 */}
          <mesh position={[0, 0.74, 0]} raycast={noRay}><boxGeometry args={[0.42, 0.46, 1.2]} /><meshLambertMaterial color="#6a4a30" /></mesh>
          {/* 首と頭 */}
          <mesh position={[0, 1.02, 0.62]} rotation-x={-0.6} raycast={noRay}><boxGeometry args={[0.2, 0.55, 0.24]} /><meshLambertMaterial color="#5f4228" /></mesh>
          <mesh position={[0, 1.28, 0.86]} rotation-x={0.35} raycast={noRay}><boxGeometry args={[0.17, 0.2, 0.42]} /><meshLambertMaterial color="#6a4a30" /></mesh>
          {/* たてがみ・尾 */}
          <mesh position={[0, 1.18, 0.55]} raycast={noRay}><boxGeometry args={[0.06, 0.5, 0.2]} /><meshLambertMaterial color="#2a2018" /></mesh>
          <mesh position={[0, 0.72, -0.68]} rotation-x={0.5} raycast={noRay}><boxGeometry args={[0.08, 0.5, 0.08]} /><meshLambertMaterial color="#2a2018" /></mesh>
          {/* 脚（駆けると前後にふれる） */}
          {[[-0.14, 0.42], [0.14, 0.42], [-0.14, -0.44], [0.14, -0.44]].map(([lx, lz], i) => (
            <mesh key={i} ref={el => { legs.current[i] = el }} position={[lx, 0.5, lz]} raycast={noRay}>
              <cylinderGeometry args={[0.045, 0.035, 0.52, 6]} />
              <meshLambertMaterial color="#5f4228" />
            </mesh>
          ))}
          {/* 騎手（直垂に烏帽子、弓をかまえる） */}
          <group ref={riderG} position={[0, 0.97, -0.05]}>
            <mesh position={[0, 0.36, 0]} rotation-x={0.12} raycast={noRay}><coneGeometry args={[0.26, 0.78, 10]} /><meshLambertMaterial color="#31517a" /></mesh>
            <mesh position={[0, 0.84, 0]} raycast={noRay}><sphereGeometry args={[0.145, 12, 10]} /><meshLambertMaterial color={SKIN} /></mesh>
            <mesh position={[0, 1.02, -0.02]} rotation-x={-0.15} raycast={noRay}><coneGeometry args={[0.08, 0.22, 8]} /><meshLambertMaterial color="#2a2018" /></mesh>
            {/* 弓（かまえた弧のかわりの細い曲がり） */}
            <mesh position={[0.02, 0.62, 0.3]} rotation-z={0.12} raycast={noRay}><cylinderGeometry args={[0.018, 0.018, 1.05, 5]} /><meshLambertMaterial color="#4a3626" /></mesh>
          </group>
        </group>
      </group>
      {/* 飛ぶ矢 */}
      <mesh ref={arrowM} visible={false} rotation-x={Math.PI / 2} raycast={noRay}>
        <cylinderGeometry args={[0.015, 0.015, 0.55, 4]} />
        <meshLambertMaterial color="#e7dcc0" />
      </mesh>
      {/* 的（柱の上の板。中ればくるりと回り、砂ぼこりの環がたつ） */}
      {targets.map(([tx, tz], k) => (
        <group key={k} position={[tx, 0, tz]} rotation-y={path.marks[k].faceY} raycast={noRay}>
          <mesh position={[0, 0.7, 0]} raycast={noRay}><cylinderGeometry args={[0.04, 0.05, 1.4, 6]} /><meshLambertMaterial color="#7a6448" /></mesh>
          <group ref={el => { boards.current[k] = el }} position={[0, 1.42, 0]}>
            {round ? (
              <mesh raycast={noRay} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.3, 0.3, 0.05, 16]} /><meshLambertMaterial color="#e7dcc0" /></mesh>
            ) : (
              <mesh raycast={noRay}><boxGeometry args={[0.55, 0.55, 0.05]} /><meshLambertMaterial color="#e7dcc0" /></mesh>
            )}
            {/* 的の紋（黒い丸） */}
            <mesh raycast={noRay} position={[0, 0, 0.035]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.13, 0.13, 0.02, 12]} /><meshLambertMaterial color="#2a2018" /></mesh>
          </group>
          <mesh ref={el => { bursts.current[k] = el }} position={[0, 1.42, 0]} visible={false} raycast={noRay}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={ringTex} color="#e8d8a8" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ---------- 道ゆく人（若宮大路） ----------
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

// ---------- 田の農人（腰をかがめ、起きあがる） ----------
export function Farmer({ x, z, ry = 0, phase = 0 }: { x: number; z: number; ry?: number; phase?: number }) {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!g.current) return
    const night = nightOf()
    g.current.visible = night < 0.55
    if (!g.current.visible) return
    g.current.rotation.x = 0.16 + 0.36 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 1.1 + phase))
  })
  return (
    <group position={[x, 0, z]} rotation-y={ry} raycast={noRay}>
      <group ref={g}>
        <mesh raycast={noRay} position={[0, 0.5, 0]}><coneGeometry args={[0.3, 1.0, 10]} /><meshLambertMaterial color="#6a5a40" /></mesh>
        <mesh raycast={noRay} position={[0, 1.12, 0]}><sphereGeometry args={[0.16, 12, 10]} /><meshLambertMaterial color={SKIN} /></mesh>
        <mesh raycast={noRay} position={[0, 1.28, 0]}><coneGeometry args={[0.42, 0.2, 12]} /><meshLambertMaterial color="#c8b888" /></mesh>
        {/* 鍬 */}
        <mesh raycast={noRay} position={[0.28, 0.66, 0.3]} rotation-z={-0.5} rotation-x={0.6}><cylinderGeometry args={[0.02, 0.02, 0.9, 5]} /><meshLambertMaterial color="#7a6448" /></mesh>
      </group>
    </group>
  )
}

// ---------- 厩の馬（草を食み、尾をふる） ----------
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

// ---------- 白旗（源氏の印。風にたなびく） ----------
export function Banner({ x, z, h = 2.8, c = '#f2ead8', phase = 0 }: {
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

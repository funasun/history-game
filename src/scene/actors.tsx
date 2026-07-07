import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame, pendingFireCircle, findNearby } from '../game/store'
import { getPack } from '../game/pack'
import { P } from '../heian/palette'
import { toTexture, flowerCanvas, haloCanvas, faceCanvas, labelCanvas, labelHeightPx, LABEL_W, type FigureKind } from '../engine/textures'
import { playerWorld, keyDir } from '../game/live'
import { resolveMove } from '../game/collide'

const noRaycast = () => null
const SKIN = '#f0e2c8'
const HAIR = P.sumi

// ほのかな際立ち（触れられる印）
export function Halo({ x, z, y = 0.05, r = 0.7, strength = 0.5 }: { x: number; z: number; y?: number; r?: number; strength?: number }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  const tex = useMemo(() => toTexture('halo', haloCanvas), [])
  useFrame(({ clock }) => {
    if (mat.current) mat.current.opacity = strength * (0.65 + 0.35 * Math.sin(clock.elapsedTime * 2.2))
  })
  return (
    <mesh rotation-x={-Math.PI / 2} position={[x, y, z]} raycast={noRaycast}>
      <planeGeometry args={[r * 2, r * 2]} />
      <meshBasicMaterial ref={mat} map={tex} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  )
}

// 立体の大和絵人形：釣鐘形の袿を重ね、裾に重ね色目がのぞく
export function Figure3D({ kind, robes, h }: { kind: FigureKind; robes: string[]; h: number }) {
  const faceTex = useMemo(() => toTexture('face', faceCanvas), [])
  const longHair = kind === 'nyobo' || kind === 'hime'
  const headY = h * 0.86
  const headR = h * 0.13

  return (
    <group>
      {/* 袿の重ね：一枚の釣鐘面の裾を色帯で分け、重ね色目がのぞく */}
      {(() => {
        const apex = h * 0.8
        const hemR = h * 0.42
        const band = h * 0.055
        const n = robes.length
        const rAt = (y: number) => hemR * (apex - y) / apex
        return robes.map((color, i) => {
          if (i === 0) {
            const y0 = (n - 1) * band
            return (
              <mesh key={i} position={[0, y0 + (apex - y0) / 2, 0]}>
                <coneGeometry args={[rAt(y0), apex - y0, 24]} />
                <meshLambertMaterial color={color} />
              </mesh>
            )
          }
          const yb = (n - 1 - i) * band
          return (
            <mesh key={i} position={[0, yb + band / 2, 0]}>
              <cylinderGeometry args={[rAt(yb + band), rAt(yb), band, 24]} />
              <meshLambertMaterial color={color} />
            </mesh>
          )
        })
      })()}
      {/* 頭 */}
      <mesh position={[0, headY, 0]}>
        <sphereGeometry args={[headR, 20, 16]} />
        <meshLambertMaterial color={SKIN} />
      </mesh>
      {/* 髪 */}
      {longHair ? (
        <>
          <mesh position={[0, headY + headR * 0.25, -headR * 0.18]}>
            <sphereGeometry args={[headR * 1.08, 20, 16]} />
            <meshLambertMaterial color={HAIR} />
          </mesh>
          <mesh position={[0, h * 0.46, -h * 0.15]} rotation-x={0.12}>
            <boxGeometry args={[headR * 1.5, h * 0.62, headR * 0.5]} />
            <meshLambertMaterial color={HAIR} />
          </mesh>
        </>
      ) : (
        <mesh position={[0, headY + headR * 0.3, -headR * 0.12]} scale={[1, 0.82, 1]}>
          <sphereGeometry args={[headR * 1.06, 20, 16]} />
          <meshLambertMaterial color={HAIR} />
        </mesh>
      )}
      {/* 烏帽子 */}
      {(kind === 'aruji' || kind === 'suikan') && (
        <mesh position={[0, headY + headR * 1.15, -headR * 0.1]} rotation-x={-0.15}>
          <coneGeometry args={[headR * 0.55, headR * 1.5, 12]} />
          <meshLambertMaterial color={HAIR} />
        </mesh>
      )}
      {/* 引目鉤鼻 */}
      <mesh position={[0, headY, headR * 1.04]} raycast={noRaycast}>
        <planeGeometry args={[headR * 1.7, headR * 1.7]} />
        <meshBasicMaterial map={faceTex} transparent alphaTest={0.1} />
      </mesh>
    </group>
  )
}

// 現代の子（旅の姿）：シャツと半ズボン
function ModernKid({ h }: { h: number }) {
  const faceTex = useMemo(() => toTexture('face', faceCanvas), [])
  const headY = h * 0.84
  const headR = h * 0.14
  return (
    <group>
      <mesh position={[0, h * 0.5, 0]}>
        <cylinderGeometry args={[h * 0.15, h * 0.18, h * 0.42, 16]} />
        <meshLambertMaterial color="#eef0ee" />
      </mesh>
      <mesh position={[0, h * 0.2, 0]}>
        <cylinderGeometry args={[h * 0.17, h * 0.15, h * 0.22, 16]} />
        <meshLambertMaterial color={P.gunjo} />
      </mesh>
      <mesh position={[0, headY, 0]}>
        <sphereGeometry args={[headR, 20, 16]} />
        <meshLambertMaterial color={SKIN} />
      </mesh>
      <mesh position={[0, headY + headR * 0.3, -headR * 0.1]} scale={[1, 0.78, 1]}>
        <sphereGeometry args={[headR * 1.05, 20, 16]} />
        <meshLambertMaterial color={HAIR} />
      </mesh>
      <mesh position={[0, headY, headR * 1.04]} raycast={noRaycast}>
        <planeGeometry args={[headR * 1.6, headR * 1.6]} />
        <meshBasicMaterial map={faceTex} transparent alphaTest={0.1} />
      </mesh>
    </group>
  )
}

function turnToward(cur: number, target: number, k: number): number {
  let d = target - cur
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return cur + d * k
}

export function Player() {
  const group = useRef<THREE.Group>(null)
  const outfit = useGame(s => s.outfit)
  const [sx, sz] = useGame.getState().playerPos   // 篇ごとの出発地点
  const pos = useRef(new THREE.Vector3(sx, 0, sz))
  const rotY = useRef(0)

  const syncAcc = useRef(0)
  const stuck = useRef(0)
  const nearAcc = useRef(0)

  useFrame((_, dt) => {
    const s = useGame.getState()
    const { groundY } = getPack()
    const p = pos.current
    const t = s.t
    // 歩いていく先（pending）の触れ円に入ったら、到着を待たずその場でひらく＝反応を軽く
    let fired = false
    if (s.mode === 'roam' && s.pending) {
      const c = pendingFireCircle(s.pending, t)
      if (c && Math.hypot(c.x - p.x, c.z - p.z) <= c.r) {
        stuck.current = 0
        s.arrive(p.x, p.z)
        fired = true
      }
    }
    const dir = !fired && s.mode === 'roam' ? keyDir() : null
    if (dir) {
      // キー移動：タップ目的地は破棄
      if (s.target || s.pending) useGame.setState({ target: null, pending: null })
      const step = 3.4 * dt
      const [nx, nz] = resolveMove(p.x, p.z, p.x + dir[0] * step, p.z + dir[1] * step, t)
      if (Math.hypot(nx - p.x, nz - p.z) > 0.0001) {
        rotY.current = turnToward(rotY.current, Math.atan2(nx - p.x, nz - p.z), Math.min(1, 12 * dt))
        p.x = nx; p.z = nz
      }
      syncAcc.current += dt
      if (syncAcc.current > 0.15) {
        syncAcc.current = 0
        useGame.setState({ playerPos: [p.x, p.z] })
      }
    } else if (!fired && s.target) {
      const [tx, tz] = s.target
      const dx = tx - p.x, dz = tz - p.z
      const d = Math.hypot(dx, dz)
      if (d < 0.15) {
        stuck.current = 0
        s.arrive(p.x, p.z)
      } else {
        const step = Math.min(3.4 * dt, d)
        const [nx, nz] = resolveMove(p.x, p.z, p.x + (dx / d) * step, p.z + (dz / d) * step, t)
        const moved = Math.hypot(nx - p.x, nz - p.z)
        if (moved > 0.001) {
          rotY.current = turnToward(rotY.current, Math.atan2(nx - p.x, nz - p.z), Math.min(1, 12 * dt))
        }
        p.x = nx; p.z = nz
        // 物や人にはばまれて進めない時間が続いたら
        if (moved < step * 0.5) stuck.current += dt
        else stuck.current = 0
        if (stuck.current > 0.5) {
          stuck.current = 0
          // はばまれても、触れ円の少し外まで来ていれば「触れた」とみなす（でなければあきらめる）
          const c = s.pending ? pendingFireCircle(s.pending, t) : null
          if (c && Math.hypot(c.x - p.x, c.z - p.z) <= c.r + 0.8) s.arrive(p.x, p.z)
          else useGame.setState({ target: null, pending: null })
        }
      }
    } else if (!fired) {
      // 立ち止まったらこちら（南）を向く。重なりがあればそっと押し出す。
      rotY.current = turnToward(rotY.current, 0, Math.min(1, 4 * dt))
      const [ex, ez] = resolveMove(p.x, p.z, p.x, p.z, t)
      p.x = ex; p.z = ez
    }
    if (!dir && syncAcc.current > 0) {
      syncAcc.current = 0
      useGame.setState({ playerPos: [p.x, p.z] })
    }
    // 足もとの触れられるもの（下部の札）を、少し間引いて調べる
    nearAcc.current += dt
    if (nearAcc.current > 0.2) {
      nearAcc.current = 0
      const n = findNearby(p.x, p.z)
      const cur = useGame.getState().nearby
      if ((n?.id ?? null) !== (cur?.id ?? null)) useGame.setState({ nearby: n })
    }
    const gy = groundY(p.x, p.z)
    playerWorld.set(p.x, gy, p.z)
    if (group.current) {
      group.current.position.set(p.x, gy, p.z)
      group.current.rotation.y = rotY.current
    }
  })

  const h = 1.5
  return (
    <group ref={group}>
      {outfit ? <Figure3D kind="suikan" robes={[outfit, '#f2ecd9']} h={h} /> : <ModernKid h={h} />}
    </group>
  )
}

export function Characters() {
  const t = useGame(s => s.t)
  const interact = useGame(s => s.interact)
  const { CHARACTERS, charPos, groundY } = getPack()
  return (
    <group>
      {CHARACTERS.map(c => {
        const [x, z] = charPos(c, t)
        const gy = groundY(x, z)
        return (
          <group key={c.id}>
            <Halo x={x} z={z + 0.1} y={gy + 0.03} r={0.8} strength={0.35} />
            <group
              position={[x, gy, z]}
              onClick={e => { e.stopPropagation(); interact(`char:${c.id}`) }}
            >
              <Figure3D kind={c.figure} robes={c.robes} h={c.scale} />
            </group>
          </group>
        )
      })}
    </group>
  )
}

export function Flowers() {
  const collected = useGame(s => s.collected)
  const interact = useGame(s => s.interact)
  const { FLOWER_SPOTS, flowerById } = getPack()
  return (
    <group>
      {FLOWER_SPOTS.filter(f => !collected.includes(f.id)).map(f => {
        const spec = flowerById(f.species)
        const tex = toTexture(`flower-${f.species}`, () => flowerCanvas(spec))
        const w = 1.15, h = 1.44
        return (
          <group key={f.id}>
            <Halo x={f.x} z={f.z + 0.15} r={0.55} strength={0.42} />
            {/* 交差させた2枚板で立体感を出す */}
            <group position={[f.x, h / 2 - 0.06, f.z]} onClick={e => { e.stopPropagation(); interact(`flower:${f.id}`) }}>
              <mesh>
                <planeGeometry args={[w, h]} />
                <meshBasicMaterial map={tex} alphaTest={0.15} transparent side={2} />
              </mesh>
              <mesh rotation-y={Math.PI / 2}>
                <planeGeometry args={[w, h]} />
                <meshBasicMaterial map={tex} alphaTest={0.15} transparent side={2} />
              </mesh>
            </group>
          </group>
        )
      })}
    </group>
  )
}

export function Bed() {
  const t = useGame(s => s.t)
  const interact = useGame(s => s.interact)
  const { BED, groundY } = getPack()
  const gy = groundY(BED.x, BED.z)
  const sleepy = t >= 0.7
  return (
    <group>
      <Halo x={BED.x} z={BED.z} y={gy + 0.16} r={1.1} strength={sleepy ? 0.7 : 0.18} />
      <mesh
        position={[BED.x, gy + 0.07, BED.z]}
        onClick={e => { e.stopPropagation(); interact('bed') }}
      >
        <boxGeometry args={[1.7, 0.14, 1.1]} />
        <meshLambertMaterial color="#efe8d5" />
      </mesh>
      <mesh position={[BED.x - 0.55, gy + 0.18, BED.z]} raycast={noRaycast}>
        <boxGeometry args={[0.45, 0.1, 0.32]} />
        <meshLambertMaterial color="#c73e3a" />
      </mesh>
    </group>
  )
}

// 未踏の名所からのぼる光の柱。遠くからでも「まだ見ぬ頁」を見つけられる目印。
function Beacon({ x, z, y }: { x: number; z: number; y: number }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(({ clock }) => {
    if (mat.current) mat.current.opacity = 0.14 + 0.07 * Math.sin(clock.elapsedTime * 1.5)
  })
  const H = 12
  return (
    <mesh position={[x, y + H / 2, z]} raycast={noRaycast}>
      <cylinderGeometry args={[0.5, 0.34, H, 14, 1, true]} />
      <meshBasicMaterial ref={mat} color={P.kin} transparent depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
    </mesh>
  )
}

// 名所に立てる名前板（立て札）。縦書きの名を、いつも読める向き（横回転のみ）でかかげる。
// ふれると、その名所の頁がひらく（クリック対象を広げ、反応をよくする）。
function NamePlate({ id, x, y, z, label, seen }: { id: string; x: number; y: number; z: number; label: string; seen: boolean }) {
  const interact = useGame(s => s.interact)
  const group = useRef<THREE.Group>(null)
  const tex = useMemo(() => toTexture(`label-${label}`, () => labelCanvas(label)), [label])
  const W = 0.42
  const H = W * labelHeightPx(label) / LABEL_W
  useFrame(({ clock, camera }) => {
    const g = group.current
    if (!g) return
    g.position.y = y + 0.08 * Math.sin(clock.elapsedTime * 1.3)
    g.rotation.y = Math.atan2(camera.position.x - x, camera.position.z - z)
  })
  return (
    <group ref={group} position={[x, y, z]} onClick={e => { e.stopPropagation(); interact(id) }}>
      <mesh>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} opacity={seen ? 0.62 : 0.95} />
      </mesh>
    </group>
  )
}

// 名所（時代の頁がひらく場所）。立体は各篇の pack.LandmarkMesh が持つ。
export function Landmarks() {
  const interact = useGame(s => s.interact)
  const learned = useGame(s => s.learnedEvents)
  const { LANDMARKS, groundY, LandmarkMesh } = getPack()
  return (
    <group>
      {LANDMARKS.map(m => {
        const gy = groundY(m.pos[0], m.pos[1])
        const seen = m.events.every(e => learned.includes(e))
        return (
          <group key={m.id}>
            <Halo x={m.pos[0]} z={m.pos[1]} y={gy + 0.05} r={1.4} strength={seen ? 0.2 : 0.5} />
            {!seen && <Beacon x={m.pos[0]} z={m.pos[1]} y={gy} />}
            <group
              position={[m.pos[0], gy, m.pos[1]]}
              onClick={e => { e.stopPropagation(); interact(`mark:${m.id}`) }}
            >
              <LandmarkMesh kind={m.kind} />
              {/* 光の柱を掴めるように、見えない筒でクリックを受ける（反応をよくする芯） */}
              {!seen && (
                <mesh position={[0, 5, 0]} renderOrder={-1}>
                  <cylinderGeometry args={[1.0, 1.0, 10, 10]} />
                  <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
              )}
            </group>
            <NamePlate id={`mark:${m.id}`} x={m.pos[0]} y={gy + m.labelY} z={m.pos[1]} label={m.label} seen={seen} />
          </group>
        )
      })}
    </group>
  )
}

// 導きの霊火：いちばん近い未踏の名所へ、プレイヤーの前方でそっと向きを指す。
// （文字で教えず、光でいざなう——もののあはれの狐火のように）
export function GuideMote() {
  const learned = useGame(s => s.learnedEvents)
  const { LANDMARKS, groundY } = getPack()
  const group = useRef<THREE.Group>(null)
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  const tex = useMemo(() => toTexture('halo', haloCanvas), [])
  const pos = useRef(new THREE.Vector3())
  const ready = useRef(false)
  useFrame(({ clock, camera }) => {
    const g = group.current
    if (!g) return
    const s = useGame.getState()
    const targets = LANDMARKS.filter(m => !m.events.every(e => learned.includes(e)))
    if (targets.length === 0 || s.mode !== 'roam') { g.visible = false; return }
    // 最も近い未踏の名所を選ぶ
    let bx = targets[0].pos[0], bz = targets[0].pos[1], bestD = Infinity
    for (const m of targets) {
      const d = (m.pos[0] - playerWorld.x) ** 2 + (m.pos[1] - playerWorld.z) ** 2
      if (d < bestD) { bestD = d; bx = m.pos[0]; bz = m.pos[1] }
    }
    const dx = bx - playerWorld.x, dz = bz - playerWorld.z
    const len = Math.hypot(dx, dz) || 1
    const lead = Math.min(2.6, len - 0.3)
    const tx = playerWorld.x + (dx / len) * lead
    const tz = playerWorld.z + (dz / len) * lead
    if (!ready.current) { pos.current.set(tx, 0, tz); ready.current = true }
    else pos.current.lerp(new THREE.Vector3(tx, 0, tz), 0.1)
    const bob = 1.5 + 0.16 * Math.sin(clock.elapsedTime * 2.4)
    g.visible = true
    g.position.set(pos.current.x, groundY(pos.current.x, pos.current.z) + bob, pos.current.z)
    g.lookAt(camera.position)
    if (mat.current) mat.current.opacity = 0.42 + 0.22 * Math.sin(clock.elapsedTime * 3)
  })
  return (
    <group ref={group} visible={false}>
      <mesh raycast={noRaycast}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshBasicMaterial ref={mat} map={tex} color={P.kin} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  )
}

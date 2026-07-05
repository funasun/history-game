import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame } from '../game/store'
import { CHARACTERS, charPos } from '../heian/characters'
import { FLOWER_SPOTS, flowerById } from '../heian/flowers'
import { BED, blocked, groundY } from '../heian/layout'
import { P } from '../heian/palette'
import { toTexture, flowerCanvas, haloCanvas, faceCanvas, type FigureKind } from '../engine/textures'

export const playerWorld = new THREE.Vector3(-3, 0, -6)

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
  const pos = useRef(new THREE.Vector3(-3, 0, -6))
  const rotY = useRef(0)

  useFrame((_, dt) => {
    const s = useGame.getState()
    const p = pos.current
    if (s.target) {
      const [tx, tz] = s.target
      const dx = tx - p.x, dz = tz - p.z
      const d = Math.hypot(dx, dz)
      if (d < 0.15) {
        s.arrive(p.x, p.z)
      } else {
        const step = Math.min(3.4 * dt, d)
        let nx = p.x + (dx / d) * step
        let nz = p.z + (dz / d) * step
        if (blocked(nx, nz)) {
          if (!blocked(nx, p.z)) nz = p.z
          else if (!blocked(p.x, nz)) nx = p.x
          else { useGame.setState({ target: null, pending: null }); nx = p.x; nz = p.z }
        }
        if (Math.hypot(nx - p.x, nz - p.z) > 0.001) {
          rotY.current = turnToward(rotY.current, Math.atan2(nx - p.x, nz - p.z), Math.min(1, 12 * dt))
        }
        p.x = nx; p.z = nz
      }
    } else {
      // 立ち止まったらこちら（南）を向く
      rotY.current = turnToward(rotY.current, 0, Math.min(1, 4 * dt))
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

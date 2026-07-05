import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { useGame } from '../game/store'
import { P } from '../heian/palette'
import { FLOORS, PILLARS, MISU, POND, ISLAND, STREAM, TREES, BOUNDS, KICHO, blocked } from '../heian/layout'
import { toTexture, misuCanvas, kichoCanvas } from '../engine/textures'
import { playerWorld } from '../game/live'

const HIWADA = '#4f3d2f'   // 桧皮葺
const RIDGE = '#3a2d22'

export function World() {
  const walkTo = useGame(s => s.walkTo)
  const misuTex = useMemo(() => toTexture('misu', misuCanvas), [])
  const kichoTex = useMemo(() => toTexture('kicho', kichoCanvas), [])

  const onGround = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const x = e.point.x, z = e.point.z
    if (!blocked(x, z)) walkTo(x, z)
  }

  const wallH = 1.3
  const W = BOUNDS

  return (
    <group>
      {/* 地面（外周まで） */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} onClick={onGround}>
        <planeGeometry args={[160, 160]} />
        <meshLambertMaterial color="#b3ab8d" />
      </mesh>
      {/* 南庭の白砂 */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0.2]} onClick={onGround}>
        <planeGeometry args={[W.maxX - W.minX, W.maxZ - W.minZ]} />
        <meshLambertMaterial color={P.sand} />
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
      <mesh rotation-x={-Math.PI / 2} position={[ISLAND.x, 0.035, ISLAND.z]}>
        <circleGeometry args={[ISLAND.r, 28]} />
        <meshLambertMaterial color={P.sand} />
      </mesh>
      <Tree3D x={ISLAND.x} z={ISLAND.z} kind="pine" s={0.75} />

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
    </group>
  )
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

// 立体の木：幹＋岩絵具の葉むら
function Tree3D({ x, z, kind, s }: { x: number; z: number; kind: 'maple' | 'pine'; s: number }) {
  const blobs = kind === 'maple'
    ? [
        { dx: 0, dy: 2.4, dz: 0, r: 1.15, c: P.shu },
        { dx: -0.85, dy: 2.0, dz: 0.25, r: 0.85, c: P.kuchiba },
        { dx: 0.8, dy: 2.1, dz: -0.15, r: 0.8, c: P.yamabuki },
        { dx: 0.25, dy: 2.9, dz: 0.15, r: 0.7, c: P.shu },
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

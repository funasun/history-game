import { useEffect, useMemo, useRef } from 'react'
import { Canvas, events, useFrame, useThree } from '@react-three/fiber'
import type { RootState } from '@react-three/fiber'
import { PerspectiveCamera, Stars } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useGame } from '../game/store'
import { getPack } from '../game/pack'
import { World } from './World'
import { Player, Characters, Flowers, Bed, Landmarks, GuideMote, Gates, Spots, TapMark } from './actors'
import { Life } from './Life'
import { playerWorld, drive, clampDt, cam } from '../game/live'
import { toTexture, cloudCanvas } from '../engine/textures'

const noRaycast = () => null

// （旧「遠山」のコーン環は撤去——起伏の地形そのものが遠景を務める）

// 空をながれる雲。夜はうすくなる
function Clouds() {
  const tex = useMemo(() => toTexture('cloud', cloudCanvas), [])
  const N = 6
  const refs = useRef<(THREE.Mesh | null)[]>([])
  const data = useRef(Array.from({ length: N }, (_, i) => ({
    x: (i - 2.5) * 26 + ((i * 17) % 9),
    z: ((i * 31) % 60) - 30,
    y: 13 + ((i * 23) % 5),
    s: 9 + ((i * 13) % 6),
    v: 0.25 + ((i * 7) % 4) * 0.08,
    o: 0.4 + (i % 3) * 0.1,
  })))
  useFrame((_, rawDt) => {
    const dt = clampDt(rawDt)
    const t = useGame.getState().t
    const night = Math.min(1, Math.max(0, (t - 0.58) / 0.14))
    for (let i = 0; i < N; i++) {
      const c = data.current[i]
      c.x += c.v * dt
      if (c.x - playerWorld.x > 55) c.x -= 110
      if (c.x - playerWorld.x < -55) c.x += 110
      const m = refs.current[i]
      if (!m) continue
      m.position.set(c.x, c.y, c.z)
      ;(m.material as THREE.MeshBasicMaterial).opacity = c.o * (1 - 0.55 * night)
    }
  })
  return (
    <group>
      {data.current.map((c, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el }} rotation-x={-Math.PI / 2} raycast={noRaycast}>
          <planeGeometry args={[c.s, c.s * 0.5]} />
          <meshBasicMaterial map={tex} transparent opacity={c.o} depthWrite={false} side={THREE.DoubleSide} fog={false} />
        </mesh>
      ))}
    </group>
  )
}

// 星月夜。日が暮れきると、空に星がまたたく（点は霞（fog）に沈まない）
function NightStars() {
  const grp = useRef<THREE.Group>(null)
  useFrame(() => {
    const t = useGame.getState().t
    const night = Math.min(1, Math.max(0, (t - 0.62) / 0.16))
    if (grp.current) grp.current.visible = night > 0.25
  })
  return (
    <group ref={grp} visible={false}>
      <Stars radius={80} depth={40} count={1100} factor={2.6} saturation={0} fade speed={0.6} />
    </group>
  )
}

function Atmosphere() {
  const scene = useThree(s => s.scene)
  // 開発時だけ、検証用にシーンを覗けるようにする（window.game / __pw と同じ流儀）
  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __scene?: THREE.Scene }).__scene = scene
  }, [scene])
  useFrame((_, rawDt) => {
    const dt = clampDt(rawDt)
    useGame.getState().tick(dt)
    const t = useGame.getState().t
    const col = getPack().skyColor(t)
    if (!(scene.background instanceof THREE.Color)) scene.background = new THREE.Color(col)
    else scene.background.set(col)
    if (!scene.fog) scene.fog = new THREE.Fog(col, 34, 70)
    else (scene.fog as THREE.Fog).color.set(col)
  })
  return null
}

// 日の光。プレイヤーについてまわり、届く範囲に影を落とす。
function SunLight() {
  const light = useRef<THREE.DirectionalLight>(null)
  const scene = useThree(s => s.scene)
  useEffect(() => {
    const l = light.current
    if (!l) return
    scene.add(l.target)
    return () => { scene.remove(l.target) }
  }, [scene])
  useFrame(() => {
    const l = light.current
    if (!l) return
    l.position.set(playerWorld.x + 9, 15, playerWorld.z + 7)
    l.target.position.set(playerWorld.x, 0, playerWorld.z)
    l.target.updateMatrixWorld()
  })
  return (
    <directionalLight
      ref={light}
      castShadow
      intensity={1.7}
      position={[9, 15, 7]}
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-left={-26}
      shadow-camera-right={26}
      shadow-camera-top={26}
      shadow-camera-bottom={-26}
      shadow-camera-near={1}
      shadow-camera-far={64}
      shadow-bias={-0.0004}
    />
  )
}

// 影の付与を自動化：不透明な Lambert 面（建物・木・人・地面）だけに落とす。
// 透ける屋根や御簾・光の演出（transparent）は除外——吹抜屋台で影だけ残さない。
function AutoShadows() {
  const scene = useThree(s => s.scene)
  const acc = useRef(1)
  useFrame((_, dt) => {
    acc.current += dt
    if (acc.current < 0.5) return
    acc.current = 0
    scene.traverse(o => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      const mat = m.material as THREE.MeshLambertMaterial
      const solid = !!mat && mat.isMeshLambertMaterial === true && !mat.transparent
      if (m.castShadow !== solid) m.castShadow = solid
      if (m.receiveShadow !== solid) m.receiveShadow = solid
    })
  })
  return null
}

const look = new THREE.Vector3(playerWorld.x, 0, playerWorld.z)

// ドラッグ操舵：押し続けているあいだ、カーソル下の地面へ向かって歩き続ける。
// 素早い単クリック（drive.on=false）では働かないので、既存のタップ移動・触れるは温存。
const DRIVE_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const driveHit = new THREE.Vector3()
function MouseDrive() {
  useFrame(({ raycaster, camera, pointer }) => {
    if (!drive.on) return
    const g = useGame.getState()
    if (g.mode !== 'roam') { drive.on = false; return }
    raycaster.setFromCamera(pointer, camera)
    if (!raycaster.ray.intersectPlane(DRIVE_PLANE, driveHit)) return
    const dx = driveHit.x - playerWorld.x
    const dz = driveHit.z - playerWorld.z
    // カーソルが足もと近くなら止まる。少し離れていれば、そこへ向かい続ける。
    if (Math.hypot(dx, dz) < 0.6) { if (g.target) useGame.setState({ target: null }); return }
    useGame.setState({ target: [driveHit.x, driveHit.z], pending: null })
  })
  return null
}

function CameraRig() {
  const camera = useThree(s => s.camera)
  const size = useThree(s => s.size)
  useFrame(() => {
    // 見まわし（45°刻み）と引きへ、なめらかに寄る
    cam.yaw += (cam.yawGoal - cam.yaw) * 0.08
    cam.dist += (cam.distGoal - cam.dist) * 0.08
    // 場面替え（遠くへ跳んだ）なら追いかけず、すぐ切り替える
    if (look.distanceTo(playerWorld) > 18) look.copy(playerWorld)
    else look.lerp(playerWorld, 0.07)
    // 端末の縦横比に合わせてカメラを引く。横長（>=1.4）なら従来の画作りのまま、
    // 縦長・細身になるほど k を上げて引き、横方向の見切れを防ぐ。
    const aspect = size.width / Math.max(1, size.height)
    const k = Math.min(1.7, Math.max(1, 1.4 / aspect)) * cam.dist
    camera.position.set(
      look.x + Math.sin(cam.yaw) * 11.2 * k,
      look.y + 7.6 * k,
      look.z + Math.cos(cam.yaw) * 11.2 * k,
    )
    camera.lookAt(look.x, look.y + 1.0, look.z)
  })
  return null
}

// 強制横画面中はCSS transformが効くため、R3Fの自動計測（getBoundingClientRectベース）は
// 回転後のAABBを返してしまう。transform非依存の offsetWidth/Height へ毎フレーム補正する。
// 定常状態では一致するので setSize は呼ばれず、実質ゼロコスト。
function SizeFix() {
  const size = useThree(s => s.size)
  const setSize = useThree(s => s.setSize)
  const gl = useThree(s => s.gl)
  useFrame(() => {
    if (!document.documentElement.classList.contains('force-landscape')) return
    const el = gl.domElement.parentElement
    if (!el) return
    const w = el.offsetWidth
    const h = el.offsetHeight
    if (w > 1 && h > 1 && (Math.abs(size.width - w) > 0.5 || Math.abs(size.height - h) > 0.5)) {
      setSize(w, h)
    }
  })
  return null
}

// 強制横画面中はポインタもCSS回転する。ウィンドウ座標から回転を打ち消してNDCへ写す。
// （画面を90°時計回りに回しているので、縦端末の touch(clientX,clientY) を横レイアウトへ逆変換）
const computePointer = (event: { offsetX: number; offsetY: number; clientX: number; clientY: number }, state: RootState) => {
  if (document.documentElement.classList.contains('force-landscape')) {
    const lx = event.clientY                       // 横レイアウトの X（= size.width 方向）
    const ly = window.innerWidth - event.clientX   // 横レイアウトの Y（= size.height 方向）
    state.pointer.set((lx / state.size.width) * 2 - 1, -(ly / state.size.height) * 2 + 1)
  } else {
    state.pointer.set((event.offsetX / state.size.width) * 2 - 1, -(event.offsetY / state.size.height) * 2 + 1)
  }
  state.raycaster.setFromCamera(state.pointer, state.camera)
}

export function SceneRoot() {
  // 場面（エリア）が替わったら、世界を丸ごと組み替える
  const area = useGame(s => s.area)
  return (
    <Canvas
      flat
      shadows
      dpr={[1, 2]}
      style={{ position: 'absolute', inset: 0 }}
      events={store => ({ ...events(store), compute: computePointer })}>
      <PerspectiveCamera makeDefault fov={42} near={0.5} far={200} position={[-3, 6.2, 3.2]} />
      <ambientLight intensity={1.75} />
      <SunLight />
      <Atmosphere />
      <CameraRig />
      <SizeFix />
      <AutoShadows />
      <Clouds />
      <NightStars />
      <group key={area}>
        <World />
        <Landmarks />
        <Flowers />
        <Characters />
        <Bed />
        <Gates />
        <Spots />
        <Player />
        <GuideMote />
        <Life />
      </group>
      <TapMark />
      <MouseDrive />
      {/* 淡い光のにじみ（宵の灯・光の柱がやわらかく滲む）と、絵巻の四隅の翳り */}
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.4} luminanceThreshold={0.85} mipmapBlur />
        <Vignette eskil={false} offset={0.22} darkness={0.42} />
      </EffectComposer>
    </Canvas>
  )
}

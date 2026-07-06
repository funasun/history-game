import { Canvas, events, useFrame, useThree } from '@react-three/fiber'
import type { RootState } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { useGame } from '../game/store'
import { getPack } from '../game/pack'
import { World } from './World'
import { Player, Characters, Flowers, Bed, Landmarks, GuideMote } from './actors'
import { Life } from './Life'
import { playerWorld, drive } from '../game/live'

function Atmosphere() {
  const scene = useThree(s => s.scene)
  useFrame((_, dt) => {
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
    look.lerp(playerWorld, 0.07)
    // 端末の縦横比に合わせてカメラを引く。横長（>=1.4）なら従来の画作りのまま、
    // 縦長・細身になるほど k を上げて引き、横方向の見切れを防ぐ。
    const aspect = size.width / Math.max(1, size.height)
    const k = Math.min(1.7, Math.max(1, 1.4 / aspect))
    camera.position.set(look.x, look.y + 7.6 * k, look.z + 11.2 * k)
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
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      style={{ position: 'absolute', inset: 0 }}
      events={store => ({ ...events(store), compute: computePointer })}>
      <PerspectiveCamera makeDefault fov={42} near={0.5} far={200} position={[-3, 6.2, 3.2]} />
      <ambientLight intensity={2.1} />
      <directionalLight position={[8, 14, 6]} intensity={1.4} />
      <Atmosphere />
      <CameraRig />
      <SizeFix />
      <World />
      <Landmarks />
      <Flowers />
      <Characters />
      <Bed />
      <Player />
      <GuideMote />
      <MouseDrive />
      <Life />
    </Canvas>
  )
}

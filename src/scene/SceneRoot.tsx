import { Canvas, events, useFrame, useThree } from '@react-three/fiber'
import type { RootState } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { useGame } from '../game/store'
import { skyColor } from '../heian/palette'
import { World } from './World'
import { Player, Characters, Flowers, Bed } from './actors'
import { playerWorld } from '../game/live'

function Atmosphere() {
  const scene = useThree(s => s.scene)
  useFrame((_, dt) => {
    useGame.getState().tick(dt)
    const t = useGame.getState().t
    const col = skyColor(t)
    if (!(scene.background instanceof THREE.Color)) scene.background = new THREE.Color(col)
    else scene.background.set(col)
    if (!scene.fog) scene.fog = new THREE.Fog(col, 34, 70)
    else (scene.fog as THREE.Fog).color.set(col)
  })
  return null
}

const look = new THREE.Vector3(playerWorld.x, 0, playerWorld.z)

function CameraRig() {
  const camera = useThree(s => s.camera)
  useFrame(() => {
    look.lerp(playerWorld, 0.07)
    camera.position.set(look.x, look.y + 7.6, look.z + 11.2)
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
      <Flowers />
      <Characters />
      <Bed />
      <Player />
    </Canvas>
  )
}

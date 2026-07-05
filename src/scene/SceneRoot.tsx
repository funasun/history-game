import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { useGame } from '../game/store'
import { skyColor } from '../heian/palette'
import { World } from './World'
import { Player, playerWorld, Characters, Flowers, Bed } from './actors'

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

export function SceneRoot() {
  return (
    <Canvas flat dpr={[1, 2]} style={{ position: 'absolute', inset: 0 }}>
      <PerspectiveCamera makeDefault fov={42} near={0.5} far={200} position={[-3, 6.2, 3.2]} />
      <ambientLight intensity={2.1} />
      <directionalLight position={[8, 14, 6]} intensity={1.4} />
      <Atmosphere />
      <CameraRig />
      <World />
      <Flowers />
      <Characters />
      <Bed />
      <Player />
    </Canvas>
  )
}

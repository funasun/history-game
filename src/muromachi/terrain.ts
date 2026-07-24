// 京の起伏と地の色。遊び場は平らなまま、まわりに三方の山（北山・東山・西山）を立てる。
// 山の位置と高さは layout.ts の HILLS に忠実。南は淀へゆるやかにひらく。
import * as THREE from 'three'
import { fbm, valueNoise, smoothstep, rectDist, type Rect } from '../engine/procedural'
import { BOUNDS, HILLS } from './layout'

export const GROUND_Y = -0.02

// 実際に歩ける矩形。この外から山が立ちあがる
const PLAY: Rect = { x0: BOUNDS.minX, x1: BOUNDS.maxX, z0: BOUNDS.minZ, z1: BOUNDS.maxZ }

export function kyoRelief(x: number, z: number): number {
  const d = rectDist(x, z, PLAY)
  // 縁のノイズ二段——立ちあがりの人工的な鋸歯を消す（鎌倉とおなじ手当て）
  const edge = d
    + (fbm(x * 0.22 + 3.3, z * 0.22 + 7.7, 2) - 0.5) * 2.0
    + (valueNoise(x * 0.85 + 6.1, z * 0.85 + 2.4) - 0.5) * 1.1
  const pad = smoothstep(1.8, 6.5, edge)
  let h = 0
  if (pad > 0) {
    // 裾野のうねり
    h += smoothstep(2, 14, d) * 1.7 * (0.3 + fbm(x * 0.035 + 4.6, z * 0.035 + 9.1, 3) * 1.3)
    // 設計データの山なみ（尾根のゆらぎをかけて、球ではなく山肌に）
    const ridge = 0.78 + fbm(x * 0.07 + 2.1, z * 0.07 + 5.3, 3) * 0.5
    let hills = 0
    for (const hill of HILLS) {
      const dx = x - hill.x, dz = z - hill.z
      hills += hill.h * Math.exp(-(dx * dx + dz * dz) / (hill.r * hill.r * 0.5)) * ridge
    }
    h += hills
    h *= pad
  }
  // 南の口：淀へ下る峠をうがつ低い切れ込み（湊への舟路の谷）
  h *= 1 - 0.55 * Math.exp(-((x + 19) ** 2) / 60 - ((z - 8) ** 2) / 30)
  return GROUND_Y + h
}

const M_SOIL_A = new THREE.Color('#a89a76')
const M_SOIL_B = new THREE.Color('#9c8e6a')
const M_SAND_A = new THREE.Color('#d3c8a6')
const M_SAND_B = new THREE.Color('#c8bc98')
const M_GRASS_A = new THREE.Color('#7c8b57')
const M_GRASS_B = new THREE.Color('#6f8250')
const M_HILL = new THREE.Color('#4a6340')
const M_HILL_DK = new THREE.Color('#3a4f30')
const M_ROCK = new THREE.Color('#7b776a')
const scratch = new THREE.Color()

// どの色の境目も「なだらかな混合」で塗る（硬い if のしきい値は鋸歯を生む）
export function kyoGroundColor(x: number, z: number, y: number, _ny: number, out: THREE.Color): void {
  const d = rectDist(x, z, PLAY)
  // 都の土（大路の白砂の斑をところどころに）
  out.copy(M_SOIL_A).lerp(M_SOIL_B, valueNoise(x * 0.13 + 3.4, z * 0.13 + 6.6))
  const ss = smoothstep(0.55, 0.85, valueNoise(x * 0.09 + 8.2, z * 0.09 + 1.5)) * 0.4
  if (ss > 0) out.lerp(scratch.copy(M_SAND_A).lerp(M_SAND_B, valueNoise(x * 0.2 + 2.7, z * 0.2 + 5.1)), ss)
  // 山裾の草
  const g = smoothstep(1, 6, d)
  if (g > 0) out.lerp(scratch.copy(M_GRASS_A).lerp(M_GRASS_B, valueNoise(x * 0.1 + 1.7, z * 0.1 + 6.3)), g)
  // 高くなるほど山の緑、尾根は深く
  const h1 = smoothstep(0.8, 3.2, y)
  if (h1 > 0) out.lerp(M_HILL, h1)
  const h2 = smoothstep(3.6, 7, y)
  if (h2 > 0) out.lerp(M_HILL_DK, h2)
  // 険しい面は岩肌
  const rk = smoothstep(0.66, 0.5, _ny) * smoothstep(0.7, 1.6, y)
  if (rk > 0) out.lerp(M_ROCK, rk * 0.55)
}

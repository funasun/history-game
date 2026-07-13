// 平安の起伏と地の色。遊び場（BOUNDS の内側）は平らなまま、
// 塀のむこうに野と山を起こす。邸は北の住まいの区——北と東に山（北山・東山のおもかげ）、
// 南と西は都のつづき（ゆるい野に板屋根が散る）。
import * as THREE from 'three'
import { fbm, valueNoise, smoothstep, rectDist, type Rect } from '../engine/procedural'
import { BOUNDS } from './layout'
import { MIYAKO_BOUNDS } from './miyako'

// 地面はどの場面も y=-0.02 に敷く（白砂や路面の重ね描きの下）
export const GROUND_Y = -0.02

const TEI: Rect = { x0: BOUNDS.minX, x1: BOUNDS.maxX, z0: BOUNDS.minZ, z1: BOUNDS.maxZ }
const MIYAKO: Rect = { x0: MIYAKO_BOUNDS.minX, x1: MIYAKO_BOUNDS.maxX, z0: MIYAKO_BOUNDS.minZ, z1: MIYAKO_BOUNDS.maxZ }

// ---- 邸（tei）----

export function teiRelief(x: number, z: number): number {
  const d = rectDist(x, z, TEI)
  if (d <= 0) return GROUND_Y
  const ramp = smoothstep(4, 24, d)
  if (ramp <= 0) return GROUND_Y
  // 北（-z）と東（+x）は山なみ、南と西は都のつづきでひくく
  const bias = 0.45 + 0.75 * smoothstep(8, -22, z) + 0.55 * smoothstep(14, 44, x)
  const base = fbm(x * 0.028 + 7.3, z * 0.028 + 2.1, 4)
  const detail = fbm(x * 0.09 + 3.7, z * 0.09 + 9.2, 3)
  return GROUND_Y + ramp * bias * (base * 6.4 + detail * 1.4)
}

const T_SOIL_A = new THREE.Color('#b3ab8d')
const T_SOIL_B = new THREE.Color('#a59c7c')
const T_FIELD_A = new THREE.Color('#9aa26d')
const T_FIELD_B = new THREE.Color('#889560')
const T_MOUNT = new THREE.Color('#66755f')
const T_ROCK = new THREE.Color('#8d8578')
const scratch = new THREE.Color()

export function teiGroundColor(x: number, z: number, y: number, ny: number, out: THREE.Color): void {
  const d = rectDist(x, z, TEI)
  // 庭の土：二色のまだら
  out.copy(T_SOIL_A).lerp(T_SOIL_B, valueNoise(x * 0.13 + 5.2, z * 0.13 + 9.1))
  // 塀の外は野の草へ
  const g = smoothstep(2, 13, d)
  if (g > 0) out.lerp(scratch.copy(T_FIELD_A).lerp(T_FIELD_B, valueNoise(x * 0.09 + 2.2, z * 0.09 + 4.4)), g)
  // 高くなるほど山の緑（遠山の色と同族）
  const hi = smoothstep(1.4, 5.2, y)
  if (hi > 0) out.lerp(T_MOUNT, hi)
  // 険しい面は岩まじり——なだらかに混ぜる（硬いしきい値はジッパー帯のもと）
  const rk = smoothstep(0.78, 0.58, ny) * smoothstep(0.5, 1.4, y)
  if (rk > 0) out.lerp(T_ROCK, rk * 0.55)
}

// ---- 都大路（miyako）----

export function miyakoRelief(x: number, z: number): number {
  const d = rectDist(x, z, MIYAKO)
  if (d <= 0) return GROUND_Y
  const ramp = smoothstep(8, 30, d)
  // 大路の南北のはて：野がゆるくもりあがる峠。道はこの坂にのまれて消える
  // （平らな野に道面がすっと沈むと切り口が線に見える——見える傾斜で覆って絶つ）
  const crest = (0.9 * smoothstep(-42, -58, z) + 0.8 * smoothstep(26, 40, z))
    * smoothstep(16, 6, Math.abs(x))
  if (ramp <= 0) return GROUND_Y + crest
  // 東（+x）に東山、西はひくい野。南（羅城門の外）はひらけた田野のうねり
  const bias = 0.5 + 0.85 * smoothstep(20, 55, x) + 0.3 * smoothstep(-40, -70, z)
  const base = fbm(x * 0.03 + 1.9, z * 0.03 + 6.4, 4)
  const detail = fbm(x * 0.08 + 8.1, z * 0.08 + 3.3, 3)
  return GROUND_Y + ramp * bias * (base * 4.6 + detail * 1.1) + crest
}

const M_SOIL_A = new THREE.Color('#b0a684')
const M_SOIL_B = new THREE.Color('#a3997a')
const M_FIELD_A = new THREE.Color('#99a26c')
const M_FIELD_B = new THREE.Color('#8b9760')
const M_MOUNT = new THREE.Color('#66755f')

export function miyakoGroundColor(x: number, z: number, y: number, _ny: number, out: THREE.Color): void {
  const d = rectDist(x, z, MIYAKO)
  out.copy(M_SOIL_A).lerp(M_SOIL_B, valueNoise(x * 0.13 + 3.4, z * 0.13 + 7.7))
  const g = smoothstep(5, 20, d)
  if (g > 0) out.lerp(scratch.copy(M_FIELD_A).lerp(M_FIELD_B, valueNoise(x * 0.09 + 6.6, z * 0.09 + 1.2)), g)
  const hi = smoothstep(1.2, 4.2, y)
  if (hi > 0) out.lerp(M_MOUNT, hi)
}

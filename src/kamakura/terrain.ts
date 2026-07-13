// 鎌倉の起伏と地の色。遊び場は平らなまま、まわりに本物の山を立てる。
// 山の位置と高さは layout.ts の HILLS（設計データ）に忠実——いままで球で
// 描いていた「囲む山」を、起伏のある地形そのものに置きかえる。
// 南は相模の海：渚からゆるやかに海底へ沈み、岬（由比ヶ浜の両腕）だけが海へ突き出す。
import * as THREE from 'three'
import { fbm, valueNoise, smoothstep, rectDist, type Rect } from '../engine/procedural'
import { BOUNDS, SEA_Z, HILLS } from './layout'

export const GROUND_Y = -0.02

// 実際に歩ける矩形（南は渚まで）。この外から山が立ちあがる
const PLAY: Rect = { x0: BOUNDS.minX, x1: BOUNDS.maxX, z0: BOUNDS.minZ, z1: SEA_Z }

export function hamaRelief(x: number, z: number): number {
  const d = rectDist(x, z, PLAY)
  // 遊び場のきわで 0 になる立ちあがり（社殿や政庁の土壇は平地に据わる）。
  // 縁には低周波（線をうねらせる）と高周波（格子1マス周期の対角ジグザグを崩す）の
  // 二段のノイズを噛ませ、立ちあがりの人工的な鋸歯を消す。
  // ノイズの和（±1.55）は開始値 1.8 を超えない——超えると遊び場の内側で地形が
  // わずかに隆起し、平置きの砂浜（y=0.004）を突き破って水際に段々が出る
  const edge = d
    + (fbm(x * 0.22 + 4.4, z * 0.22 + 1.9, 2) - 0.5) * 2.0
    + (valueNoise(x * 0.85 + 8.8, z * 0.85 + 3.3) - 0.5) * 1.1
  const pad = smoothstep(1.8, 6.5, edge)
  let h = 0
  if (pad > 0) {
    // 裾野のうねり（海側にはつくらない）
    h += smoothstep(2, 14, d) * 1.8 * (0.3 + fbm(x * 0.035 + 3.1, z * 0.035 + 8.7, 3) * 1.3)
      * (1 - smoothstep(3, 14, z))
    // 設計データの山なみ（尾根のゆらぎをかけて、球ではなく山肌に）。
    // 渚へ向かって裾をひらく——浜の両脇に急な壁を立てない（間近の鋸歯を防ぐ）
    const ridge = 0.78 + fbm(x * 0.07 + 1.3, z * 0.07 + 4.9, 3) * 0.5
    const seaFade = 1 - smoothstep(6, 14, z)
    let hills = 0
    for (const hill of HILLS) {
      if (hill.z > 13) continue // 海側の旧岬は使わない（遠景の腕として沖へ立て直す）
      const dx = x - hill.x, dz = z - hill.z
      hills += hill.h * Math.exp(-(dx * dx + dz * dz) / (hill.r * hill.r * 0.5)) * ridge
    }
    h += hills * seaFade
    h *= pad
  }
  // 湾の両腕：霞のむこうの岬（ゆるやかに海から立つ。松と磯は散布が拾う）
  const armRidge = 0.85 + fbm(x * 0.04 + 2.2, z * 0.04 + 5.6, 2) * 0.3
  for (const s of [-1, 1] as const) {
    const dx = x - s * 44, dz = z - 26
    h += 5.5 * Math.exp(-(dx * dx + dz * dz) / 72) * armRidge
  }
  // 相模の海：渚から海底へ。汀線は定規の直線にしない——泡帯が覆う遊び場の幅の外
  // （|x|>25）では海岸線を fbm で蛇行させる。平坦な海面と緩斜面の交線が格子を
  // 一定角度で横切ると規則的な鋸歯になるので、線そのものをうねらせて崩す
  const coast = (fbm(x * 0.08 + 9.7, 3.3, 3) - 0.5) * 4.4 * smoothstep(25, 37, Math.abs(x))
  h -= 2.8 * smoothstep(13.3 + coast, 22 + coast, z)
  return GROUND_Y + h
}

const K_SOIL_A = new THREE.Color('#a89a76')
const K_SOIL_B = new THREE.Color('#9c8e6a')
const K_SAND_A = new THREE.Color('#d8cca8')
const K_SAND_B = new THREE.Color('#cec19c')
const K_GRASS_A = new THREE.Color('#7c8b57')
const K_GRASS_B = new THREE.Color('#6f8250')
const K_HILL = new THREE.Color('#47603f')
const K_HILL_DK = new THREE.Color('#39502f')
const K_ROCK = new THREE.Color('#7b776a')
const K_BED_SHALLOW = new THREE.Color('#a89f80')
const K_BED_DEEP = new THREE.Color('#55684f')
const scratch = new THREE.Color()

// どの色の境目も「なだらかな混合」で塗る。硬い if のしきい値は等高線ぞいに
// 三角形が交互に色替わりする規則的な鋸歯（ジッパー帯）を生む——岩・砂・海底みな同じ
export function hamaGroundColor(x: number, z: number, y: number, ny: number, out: THREE.Color): void {
  const d = rectDist(x, z, PLAY)
  // 谷戸の土
  out.copy(K_SOIL_A).lerp(K_SOIL_B, valueNoise(x * 0.13 + 7.2, z * 0.13 + 5.5))
  // 山裾の草
  const g = smoothstep(1, 6, d)
  if (g > 0) out.lerp(scratch.copy(K_GRASS_A).lerp(K_GRASS_B, valueNoise(x * 0.1 + 1.7, z * 0.1 + 6.3)), g)
  // 高くなるほど松の山、尾根は深く
  const h1 = smoothstep(0.8, 3.2, y)
  if (h1 > 0) out.lerp(K_HILL, h1)
  const h2 = smoothstep(3.6, 7, y)
  if (h2 > 0) out.lerp(K_HILL_DK, h2)
  // 険しい面は岩肌
  const rk = smoothstep(0.66, 0.5, ny) * smoothstep(0.7, 1.6, y)
  if (rk > 0) out.lerp(K_ROCK, rk * 0.55)
  // 渚と岬のつけ根は砂——南北（z）と高さ（y）の両方で溶かし込む。
  // どちらの帯も広く（格子2〜3マス超）、しきい値にノイズ。帯が1マス級だと
  // 面ごとの色決めでは実質硬い境界に戻り、大路の両脇（露出した地面の
  // 土→砂の移り目）に三角の鋸歯列が出る
  const sandLine = z + (valueNoise(x * 0.3 + 6.6, z * 0.3 + 0.9) - 0.5) * 2.4
  const sandEdge = y + (valueNoise(x * 0.55 + 1.1, z * 0.55 + 7.7) - 0.5) * 0.9
  const sand = smoothstep(5.2, 8.9, sandLine) * smoothstep(1.5, 0.12, sandEdge)
  if (sand > 0) out.lerp(scratch.copy(K_SAND_A).lerp(K_SAND_B, valueNoise(x * 0.2 + 4.1, z * 0.2 + 2.8)), sand)
  // 水の下：浅瀬の砂からゆっくり海底の色へ
  const uw = smoothstep(-0.12, -0.5, y)
  if (uw > 0) out.lerp(scratch.copy(K_BED_SHALLOW).lerp(K_BED_DEEP, smoothstep(-0.3, -2.6, y)), uw)
}

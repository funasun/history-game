// プロシージャル地形の道具箱。
// 遊び場（BOUNDS の内側）は平らなまま、目に映る世界だけを起伏と色で生かす。
// ・値ノイズ＋fbm：なだらかな丘
// ・buildGroundGeometry：起伏平面 → 面ごとの頂点色（低ポリの、絵地図のようなタイル感）
// ・scatterPoints / applyInstances：種（seed）で毎回同じに決まる散布と InstancedMesh 充填
import * as THREE from 'three'

// ---- 乱数とノイズ ----

// 種から決まる擬似乱数（同じ種なら、いつ開いても同じ世界）
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}

// なめらかな値ノイズ（0..1）
export function valueNoise(x: number, y: number): number {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash2(xi, yi)
  const b = hash2(xi + 1, yi)
  const c = hash2(xi, yi + 1)
  const d = hash2(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

// 重ねノイズ（0..1）。低い周波数の大きなうねりに、細かい起伏を足す
export function fbm(x: number, y: number, octaves = 4): number {
  let sum = 0, amp = 0.5, freq = 1, norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x * freq, y * freq) * amp
    norm += amp
    amp *= 0.5
    freq *= 2
  }
  return sum / norm
}

export function smoothstep(a: number, b: number, t: number): number {
  const k = Math.min(1, Math.max(0, (t - a) / (b - a)))
  return k * k * (3 - 2 * k)
}

// 矩形からの外側距離（内側なら 0）。遊び場の縁から、どれほど離れたか
export interface Rect { x0: number; x1: number; z0: number; z1: number }
export function rectDist(x: number, z: number, r: Rect): number {
  const dx = Math.max(r.x0 - x, 0, x - r.x1)
  const dz = Math.max(r.z0 - z, 0, z - r.z1)
  return Math.hypot(dx, dz)
}

// ---- 地形メッシュ ----

// 起伏 heightFn で持ち上げた平面を、面ごとに colorFn で塗る。
// colorFn は面の中心 (x, z)・高さ y・法線の傾き ny(1=水平) から色を out へ書き込む。
// 仕上げに面ごとの明暗ゆらぎをかけ、単色のっぺりを消す。
export function buildGroundGeometry(
  size: number,
  segments: number,
  heightFn: (x: number, z: number) => number,
  colorFn: (x: number, z: number, y: number, ny: number, out: THREE.Color) => void,
): THREE.BufferGeometry {
  const plane = new THREE.PlaneGeometry(size, size, segments, segments)
  plane.rotateX(-Math.PI / 2)
  const pos = plane.attributes.position
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, heightFn(pos.getX(i), pos.getZ(i)))
  }
  // 法線は「共有頂点のまま」平均化して滑らかに——面ごとの色は残しつつ、
  // 急斜面で三角形が明暗交互に光るジッパー縞（グリッドの鋸歯）を防ぐ
  plane.computeVertexNormals()
  const geo = plane.toNonIndexed()
  plane.dispose()

  const p = geo.attributes.position
  const colors = new Float32Array(p.count * 3)
  const col = new THREE.Color()
  const ab = new THREE.Vector3(), ac = new THREE.Vector3(), n = new THREE.Vector3()
  for (let i = 0; i < p.count; i += 3) {
    const ax = p.getX(i), ay = p.getY(i), az = p.getZ(i)
    const bx = p.getX(i + 1), by = p.getY(i + 1), bz = p.getZ(i + 1)
    const cx = p.getX(i + 2), cy = p.getY(i + 2), cz = p.getZ(i + 2)
    ab.set(bx - ax, by - ay, bz - az)
    ac.set(cx - ax, cy - ay, cz - az)
    n.crossVectors(ab, ac).normalize()
    const mx = (ax + bx + cx) / 3
    const my = (ay + by + cy) / 3
    const mz = (az + bz + cz) / 3
    colorFn(mx, mz, my, Math.abs(n.y), col)
    // 面ごとの明暗ゆらぎ（タイルのような手ざわり）
    const shade = 0.94 + valueNoise(mx * 0.5 + 13.1, mz * 0.5 + 7.7) * 0.12
    colors[i * 3] = col.r * shade
    colors[i * 3 + 1] = col.g * shade
    colors[i * 3 + 2] = col.b * shade
    colors[i * 3 + 3] = col.r * shade
    colors[i * 3 + 4] = col.g * shade
    colors[i * 3 + 5] = col.b * shade
    colors[i * 3 + 6] = col.r * shade
    colors[i * 3 + 7] = col.g * shade
    colors[i * 3 + 8] = col.b * shade
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geo
}

// 折れ線の芯にそって幅 width の帯を張る（遣水・小径など）。
// 別々の板を並べると角で切れ目が出る——各点で両どなりの向きを平均して
// 左右へ半幅ずらし、一本のつづいた帯にする。width は関数なら点ごとに変えられる
export function buildRibbonGeometry(
  pts: { x: number; z: number }[],
  width: number | ((i: number, n: number) => number),
  y = 0,
): THREE.BufferGeometry {
  const n = pts.length
  const positions = new Float32Array(n * 2 * 3)
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(n - 1, i + 1)]
    let dx = b.x - a.x, dz = b.z - a.z
    const len = Math.hypot(dx, dz) || 1
    dx /= len; dz /= len
    const w = (typeof width === 'function' ? width(i, n) : width) / 2
    positions[i * 6] = pts[i].x - dz * w
    positions[i * 6 + 1] = y
    positions[i * 6 + 2] = pts[i].z + dx * w
    positions[i * 6 + 3] = pts[i].x + dz * w
    positions[i * 6 + 4] = y
    positions[i * 6 + 5] = pts[i].z - dx * w
  }
  const indices: number[] = []
  for (let i = 0; i < n - 1; i++) {
    const l0 = i * 2, r0 = i * 2 + 1, l1 = i * 2 + 2, r1 = i * 2 + 3
    indices.push(l0, l1, r0, r0, l1, r1) // 上向き（+y）の巻き
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

// ---- 散布 ----

export interface ScatterPoint { x: number; z: number; h: number; rand: number }

// 矩形の中へ、種で決まる位置に count 個を目標に散布する。
// accept が退けた点は捨てる（当たり・水・道・舞台のきわを避ける）
export function scatterPoints(
  count: number,
  seed: number,
  area: Rect,
  accept: (x: number, z: number, h: number) => boolean,
  heightFn: (x: number, z: number) => number = () => 0,
): ScatterPoint[] {
  const rnd = mulberry32(seed)
  const pts: ScatterPoint[] = []
  let attempts = 0
  while (pts.length < count && attempts < count * 30) {
    attempts++
    const x = area.x0 + rnd() * (area.x1 - area.x0)
    const z = area.z0 + rnd() * (area.z1 - area.z0)
    const h = heightFn(x, z)
    if (!accept(x, z, h)) continue
    pts.push({ x, z, h, rand: rnd() })
  }
  return pts
}

// InstancedMesh に散布点を流し込む
export function applyInstances(
  mesh: THREE.InstancedMesh,
  points: ScatterPoint[],
  place: (p: ScatterPoint, dummy: THREE.Object3D, i: number) => void,
): void {
  const dummy = new THREE.Object3D()
  points.forEach((p, i) => {
    place(p, dummy, i)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  })
  mesh.instanceMatrix.needsUpdate = true
}

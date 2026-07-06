// 大和絵スプライトの手続き生成（AIアセット差し替えまでのプレースホルダー兼スタイル定義）
import * as THREE from 'three'
import { P } from '../heian/palette'

// 草花スプライトの仕様（時代をまたいで共有する型の元）
export interface FlowerSpec {
  id: string
  kana: string          // 図譜に載る名（かな）
  petal: string         // 花の色
  accent: string        // 芯・実の色
  stem: string
  form: 'kiku' | 'bell' | 'dots' | 'plume' | 'spray' | 'maple'
}

const SUMI = P.sumi

function mk(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')!
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'
  return [c, ctx]
}

const texCache = new Map<string, THREE.CanvasTexture>()
export function toTexture(key: string, make: () => HTMLCanvasElement): THREE.CanvasTexture {
  let t = texCache.get(key)
  if (!t) {
    t = new THREE.CanvasTexture(make())
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    texCache.set(key, t)
  }
  return t
}

// ---------- 人物 ----------

function bell(ctx: CanvasRenderingContext2D, cx: number, topY: number, shoulderW: number, hemW: number, hemY: number) {
  ctx.beginPath()
  ctx.moveTo(cx - shoulderW / 2, topY)
  ctx.bezierCurveTo(cx - shoulderW / 2 - 26, topY + 40, cx - hemW / 2, hemY - 50, cx - hemW / 2, hemY)
  ctx.quadraticCurveTo(cx, hemY + 8, cx + hemW / 2, hemY)
  ctx.bezierCurveTo(cx + hemW / 2, hemY - 50, cx + shoulderW / 2 + 26, topY + 40, cx + shoulderW / 2, topY)
  ctx.closePath()
}

function face(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.fillStyle = P.gofun
  ctx.beginPath()
  ctx.ellipse(cx, cy, r * 0.82, r, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = SUMI; ctx.lineWidth = 1.6; ctx.stroke()
  // 引目
  ctx.strokeStyle = SUMI; ctx.lineWidth = 2.2
  ctx.beginPath(); ctx.moveTo(cx - r * 0.45, cy - r * 0.05); ctx.lineTo(cx - r * 0.14, cy - r * 0.05); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx + r * 0.14, cy - r * 0.05); ctx.lineTo(cx + r * 0.45, cy - r * 0.05); ctx.stroke()
  // 鉤鼻
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(cx - r * 0.05, cy + r * 0.16); ctx.lineTo(cx + r * 0.08, cy + r * 0.3); ctx.stroke()
  // 唇
  ctx.fillStyle = P.shu
  ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.52, r * 0.12, r * 0.07, 0, 0, Math.PI * 2); ctx.fill()
}

function outline(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = SUMI; ctx.lineWidth = 2.4; ctx.stroke()
}

// 3D人形の頭に貼る引目鉤鼻（透過・線のみ）
export function faceCanvas(): HTMLCanvasElement {
  const [c, ctx] = mk(128, 128)
  const cx = 64, cy = 60, r = 44
  ctx.strokeStyle = SUMI; ctx.lineWidth = 5
  ctx.beginPath(); ctx.moveTo(cx - r * 0.5, cy); ctx.lineTo(cx - r * 0.16, cy); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx + r * 0.16, cy); ctx.lineTo(cx + r * 0.5, cy); ctx.stroke()
  ctx.lineWidth = 3.5
  ctx.beginPath(); ctx.moveTo(cx - r * 0.05, cy + r * 0.2); ctx.lineTo(cx + r * 0.09, cy + r * 0.36); ctx.stroke()
  ctx.fillStyle = P.shu
  ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.58, r * 0.13, r * 0.08, 0, 0, Math.PI * 2); ctx.fill()
  return c
}

export type FigureKind = 'aruji' | 'nyobo' | 'hime' | 'warawa' | 'modern' | 'suikan'

export function figureCanvas(kind: FigureKind, robes: string[]): HTMLCanvasElement {
  const [c, ctx] = mk(192, 256)
  const cx = 96, hemY = 246
  const female = kind === 'nyobo' || kind === 'hime'

  if (female) {
    // 後ろ髪（床まで）
    ctx.fillStyle = '#1c1814'
    ctx.beginPath()
    ctx.moveTo(cx - 24, 34)
    ctx.bezierCurveTo(cx - 46, 90, cx - 40, 180, cx - 34, hemY)
    ctx.lineTo(cx + 34, hemY)
    ctx.bezierCurveTo(cx + 40, 180, cx + 46, 90, cx + 24, 34)
    ctx.closePath(); ctx.fill()
  }

  // 重ねの色目（裾に内側の層がのぞく）
  const layers = robes.slice(1)
  layers.forEach((col, i) => {
    const y = hemY - 4 - i * 7
    const w = 118 - i * 10
    ctx.fillStyle = col
    ctx.beginPath()
    ctx.moveTo(cx - w / 2, y)
    ctx.quadraticCurveTo(cx, y + 12, cx + w / 2, y)
    ctx.lineTo(cx + w / 2, y + 10)
    ctx.quadraticCurveTo(cx, y + 20, cx - w / 2, y + 10)
    ctx.closePath(); ctx.fill()
    ctx.strokeStyle = SUMI; ctx.lineWidth = 1.2; ctx.stroke()
  })

  // 上衣
  const topY = kind === 'warawa' ? 96 : 76
  const hemTop = hemY - 4 - layers.length * 7
  ctx.fillStyle = robes[0]
  bell(ctx, cx, topY, kind === 'warawa' ? 34 : 44, kind === 'warawa' ? 96 : 128, hemTop)
  ctx.fill(); outline(ctx)

  // 衿あわせ
  ctx.strokeStyle = SUMI; ctx.lineWidth = 1.6
  ctx.beginPath(); ctx.moveTo(cx - 12, topY + 4); ctx.lineTo(cx + 4, topY + 36); ctx.stroke()
  if (robes[1]) {
    ctx.strokeStyle = robes[1]; ctx.lineWidth = 4
    ctx.beginPath(); ctx.moveTo(cx - 9, topY + 6); ctx.lineTo(cx + 6, topY + 34); ctx.stroke()
  }

  // 頭
  const headY = topY - 26
  const headR = kind === 'warawa' ? 20 : 22

  if (female) {
    ctx.fillStyle = '#1c1814'
    ctx.beginPath(); ctx.ellipse(cx, headY - 6, headR + 5, headR + 3, 0, Math.PI, 0); ctx.fill()
  }
  face(ctx, cx, headY, headR)
  // 前髪・鬢
  ctx.fillStyle = '#1c1814'
  if (female) {
    ctx.beginPath(); ctx.ellipse(cx, headY - headR * 0.66, headR * 0.86, headR * 0.5, 0, Math.PI, 0, false); ctx.fill()
    ctx.beginPath(); ctx.ellipse(cx - headR * 0.86, headY + 10, 4.5, 26, 0.1, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(cx + headR * 0.86, headY + 10, 4.5, 26, -0.1, 0, Math.PI * 2); ctx.fill()
  } else if (kind === 'aruji') {
    // 烏帽子
    ctx.beginPath()
    ctx.moveTo(cx - headR * 0.7, headY - headR * 0.55)
    ctx.quadraticCurveTo(cx - headR * 0.6, headY - headR * 2.4, cx + headR * 0.25, headY - headR * 2.3)
    ctx.quadraticCurveTo(cx + headR * 0.9, headY - headR * 1.6, cx + headR * 0.7, headY - headR * 0.55)
    ctx.closePath(); ctx.fill(); outline(ctx)
  } else if (kind === 'warawa') {
    // おかっぱ＋振分髪
    ctx.beginPath(); ctx.ellipse(cx, headY - headR * 0.5, headR * 0.95, headR * 0.62, 0, Math.PI, 0); ctx.fill()
    ctx.beginPath(); ctx.ellipse(cx - headR * 0.9, headY + 6, 5, 18, 0.15, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(cx + headR * 0.9, headY + 6, 5, 18, -0.15, 0, Math.PI * 2); ctx.fill()
  } else {
    // 現代の子・水干の子：短い髪
    ctx.beginPath(); ctx.ellipse(cx, headY - headR * 0.45, headR * 0.92, headR * 0.66, 0, Math.PI, 0); ctx.fill()
  }

  if (kind === 'modern') {
    // Tシャツ＋半ズボンに描き替え
    ctx.clearRect(0, topY - 2, 192, 256 - topY)
    ctx.fillStyle = '#eef0ee'
    ctx.beginPath()
    ctx.moveTo(cx - 26, topY); ctx.lineTo(cx - 34, topY + 26); ctx.lineTo(cx - 22, topY + 32)
    ctx.lineTo(cx - 22, topY + 64); ctx.lineTo(cx + 22, topY + 64); ctx.lineTo(cx + 22, topY + 32)
    ctx.lineTo(cx + 34, topY + 26); ctx.lineTo(cx + 26, topY)
    ctx.closePath(); ctx.fill(); outline(ctx)
    ctx.fillStyle = P.gunjo
    ctx.fillRect(cx - 20, topY + 64, 40, 26)
    ctx.strokeStyle = SUMI; ctx.lineWidth = 2; ctx.strokeRect(cx - 20, topY + 64, 40, 26)
    ctx.fillStyle = P.gofun
    ctx.fillRect(cx - 15, topY + 90, 10, 34); ctx.fillRect(cx + 5, topY + 90, 10, 34)
    ctx.fillStyle = '#d8d8d8'
    ctx.fillRect(cx - 18, topY + 122, 15, 8); ctx.fillRect(cx + 3, topY + 122, 15, 8)
  }

  return c
}

// ---------- 草花 ----------

export function flowerCanvas(f: FlowerSpec): HTMLCanvasElement {
  const [c, ctx] = mk(128, 160)
  const cx = 64, base = 152
  ctx.strokeStyle = f.stem; ctx.lineWidth = 3

  const stems: [number, number][] = [[-14, 60], [0, 84], [14, 64]]
  if (f.form !== 'maple') {
    for (const [dx, h] of stems) {
      ctx.beginPath()
      ctx.moveTo(cx + dx * 0.3, base)
      ctx.quadraticCurveTo(cx + dx, base - h * 0.6, cx + dx, base - h)
      ctx.stroke()
    }
  }

  const heads: [number, number][] = stems.map(([dx, h]) => [cx + dx, base - h])

  switch (f.form) {
    case 'kiku':
      for (const [hx, hy] of heads) {
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2
          ctx.fillStyle = f.petal
          ctx.beginPath()
          ctx.ellipse(hx + Math.cos(a) * 8, hy + Math.sin(a) * 8, 6.5, 3.4, a, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.fillStyle = f.accent
        ctx.beginPath(); ctx.arc(hx, hy, 5, 0, Math.PI * 2); ctx.fill()
      }
      break
    case 'bell':
      for (const [hx, hy] of heads) {
        ctx.fillStyle = f.petal
        ctx.beginPath()
        ctx.moveTo(hx - 7, hy + 14)
        ctx.quadraticCurveTo(hx - 8, hy - 10, hx, hy - 14)
        ctx.quadraticCurveTo(hx + 8, hy - 10, hx + 7, hy + 14)
        ctx.quadraticCurveTo(hx, hy + 9, hx - 7, hy + 14)
        ctx.closePath(); ctx.fill()
        ctx.strokeStyle = f.accent; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(hx, hy - 12); ctx.lineTo(hx, hy + 8); ctx.stroke()
        ctx.strokeStyle = f.stem; ctx.lineWidth = 3
      }
      break
    case 'dots':
      for (const [hx, hy] of heads) {
        for (let i = 0; i < 9; i++) {
          const a = Math.random() * Math.PI * 2, r = Math.random() * 11
          ctx.fillStyle = i % 3 ? f.petal : f.accent
          ctx.beginPath(); ctx.arc(hx + Math.cos(a) * r, hy + Math.sin(a) * r * 0.7, 3, 0, Math.PI * 2); ctx.fill()
        }
      }
      break
    case 'plume':
      for (const [hx, hy] of heads) {
        ctx.strokeStyle = f.petal; ctx.lineWidth = 2
        for (let i = -4; i <= 4; i++) {
          ctx.beginPath()
          ctx.moveTo(hx, hy + 12)
          ctx.quadraticCurveTo(hx + i * 2.4, hy - 4, hx + i * 4.2, hy - 20 + Math.abs(i) * 2)
          ctx.stroke()
        }
        ctx.strokeStyle = f.stem; ctx.lineWidth = 3
      }
      break
    case 'spray':
      for (const [hx, hy] of heads) {
        for (let i = 0; i < 8; i++) {
          const yy = hy + i * 6 - 4
          const xx = hx + Math.sin(i * 1.7) * 7
          ctx.fillStyle = i % 3 === 2 ? f.stem : f.petal
          ctx.beginPath(); ctx.ellipse(xx, yy, 3.6, 2.6, 0.4, 0, Math.PI * 2); ctx.fill()
        }
      }
      break
    case 'maple': {
      ctx.strokeStyle = f.stem; ctx.lineWidth = 4
      ctx.beginPath(); ctx.moveTo(cx - 30, base); ctx.quadraticCurveTo(cx, base - 60, cx + 26, base - 96); ctx.stroke()
      const leaves: [number, number, number][] = [[cx - 8, base - 52, 15], [cx + 14, base - 78, 17], [cx + 30, base - 100, 14], [cx - 22, base - 30, 13]]
      for (const [lx, ly, r] of leaves) {
        ctx.fillStyle = Math.random() > 0.5 ? f.petal : f.accent
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + (i - 2) * 0.55
          ctx.beginPath()
          ctx.moveTo(lx, ly)
          ctx.lineTo(lx + Math.cos(a - 0.16) * r, ly + Math.sin(a - 0.16) * r)
          ctx.lineTo(lx + Math.cos(a) * r * 1.25, ly + Math.sin(a) * r * 1.25)
          ctx.lineTo(lx + Math.cos(a + 0.16) * r, ly + Math.sin(a + 0.16) * r)
          ctx.closePath(); ctx.fill()
        }
      }
      break
    }
  }
  return c
}

const flowerUrlCache = new Map<string, string>()
export function flowerDataURL(f: FlowerSpec): string {
  let u = flowerUrlCache.get(f.id)
  if (!u) { u = flowerCanvas(f).toDataURL(); flowerUrlCache.set(f.id, u) }
  return u
}

// ---------- 木 ----------

export function treeCanvas(kind: 'maple' | 'pine'): HTMLCanvasElement {
  const [c, ctx] = mk(256, 288)
  const cx = 128, base = 282
  ctx.strokeStyle = '#5a4632'; ctx.lineWidth = 10
  ctx.beginPath(); ctx.moveTo(cx, base); ctx.quadraticCurveTo(cx - 8, base - 80, cx + 4, base - 140); ctx.stroke()

  if (kind === 'maple') {
    const blobs: [number, number, number, string][] = [
      [cx - 52, 140, 44, '#c7462e'], [cx + 40, 120, 50, '#d1602e'],
      [cx - 6, 84, 46, '#c8a24b'], [cx + 66, 168, 34, '#a83420'],
      [cx - 74, 182, 30, '#d1602e'],
    ]
    for (const [x, y, r, col] of blobs) {
      ctx.fillStyle = col
      ctx.beginPath()
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2
        const rr = r * (0.85 + 0.2 * Math.sin(i * 2.7))
        const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.82
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)
      }
      ctx.closePath(); ctx.fill()
      ctx.strokeStyle = 'rgba(42,36,30,0.5)'; ctx.lineWidth = 2; ctx.stroke()
    }
  } else {
    ctx.strokeStyle = '#5a4632'; ctx.lineWidth = 6
    ctx.beginPath(); ctx.moveTo(cx + 2, base - 130); ctx.lineTo(cx - 50, base - 170); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx, base - 100); ctx.lineTo(cx + 56, base - 150); ctx.stroke()
    const pads: [number, number, number][] = [[cx - 58, 108, 42], [cx + 60, 130, 46], [cx + 2, 70, 40]]
    for (const [x, y, r] of pads) {
      ctx.fillStyle = '#3e5c46'
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.42, 0, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = 'rgba(28,26,22,0.6)'; ctx.lineWidth = 2; ctx.stroke()
      ctx.fillStyle = '#4d7055'
      ctx.beginPath(); ctx.ellipse(x - r * 0.2, y - r * 0.15, r * 0.7, r * 0.3, 0, 0, Math.PI * 2); ctx.fill()
    }
  }
  return c
}

// ---------- 建具・小物 ----------

export function misuCanvas(): HTMLCanvasElement {
  const [c, ctx] = mk(128, 128)
  ctx.fillStyle = '#cbb27a'
  ctx.fillRect(4, 0, 120, 128)
  ctx.strokeStyle = 'rgba(90,70,40,0.55)'; ctx.lineWidth = 2
  for (let y = 6; y < 128; y += 7) {
    ctx.beginPath(); ctx.moveTo(4, y); ctx.lineTo(124, y); ctx.stroke()
  }
  ctx.strokeStyle = '#3e5c46'; ctx.lineWidth = 7
  ctx.strokeRect(6, 2, 116, 124)
  ctx.fillStyle = P.shu
  ctx.fillRect(58, 0, 12, 46)
  return c
}

export function kichoCanvas(): HTMLCanvasElement {
  const [c, ctx] = mk(128, 128)
  ctx.fillStyle = '#efe8d5'
  ctx.fillRect(8, 14, 112, 108)
  ctx.strokeStyle = SUMI; ctx.lineWidth = 2.5
  ctx.strokeRect(8, 14, 112, 108)
  ctx.strokeStyle = P.shu; ctx.lineWidth = 5
  for (const x of [30, 64, 98]) {
    ctx.beginPath(); ctx.moveTo(x, 14); ctx.lineTo(x, 122); ctx.stroke()
  }
  ctx.fillStyle = '#5a4632'
  ctx.fillRect(0, 8, 128, 7)
  return c
}

export function washiCanvas(w = 512, h = 640): HTMLCanvasElement {
  const [c, ctx] = mk(w, h)
  ctx.fillStyle = '#f4eeda'
  ctx.fillRect(0, 0, w, h)
  for (let i = 0; i < 260; i++) {
    const x = Math.random() * w, y = Math.random() * h
    const a = Math.random() * Math.PI
    ctx.strokeStyle = `rgba(150,130,95,${0.05 + Math.random() * 0.07})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 6)
    ctx.stroke()
  }
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(120,95,60,0.18)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  return c
}

let washiUrl: string | null = null
export function washiDataURL(): string {
  if (!washiUrl) washiUrl = washiCanvas().toDataURL()
  return washiUrl
}

export function letterCanvas(): HTMLCanvasElement {
  const [c, ctx] = mk(128, 160)
  ctx.save()
  ctx.translate(64, 80); ctx.rotate(-0.25)
  ctx.fillStyle = '#efe8d2'
  ctx.fillRect(-44, -16, 88, 30)
  ctx.strokeStyle = SUMI; ctx.lineWidth = 2
  ctx.strokeRect(-44, -16, 88, 30)
  ctx.strokeStyle = P.shu; ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(-6, -22); ctx.lineTo(4, 20); ctx.stroke()
  ctx.restore()
  // 紅葉
  const lx = 88, ly = 110, r = 14
  ctx.fillStyle = '#c7462e'
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.55
    ctx.beginPath()
    ctx.moveTo(lx, ly)
    ctx.lineTo(lx + Math.cos(a - 0.16) * r, ly + Math.sin(a - 0.16) * r)
    ctx.lineTo(lx + Math.cos(a) * r * 1.25, ly + Math.sin(a) * r * 1.25)
    ctx.lineTo(lx + Math.cos(a + 0.16) * r, ly + Math.sin(a + 0.16) * r)
    ctx.closePath(); ctx.fill()
  }
  return c
}

let letterUrl: string | null = null
export function letterDataURL(): string {
  if (!letterUrl) letterUrl = letterCanvas().toDataURL()
  return letterUrl
}

export function haloCanvas(): HTMLCanvasElement {
  const [c, ctx] = mk(128, 128)
  const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 60)
  g.addColorStop(0, 'rgba(255,240,190,0.85)')
  g.addColorStop(0.5, 'rgba(255,225,150,0.32)')
  g.addColorStop(1, 'rgba(255,220,140,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return c
}

// ---------- 生きている庭（舞う葉・足もとの輪） ----------

// 舞い落ちる一葉。白で描き、材質の color で秋の色に染める。
export function leafCanvas(): HTMLCanvasElement {
  const [c, ctx] = mk(64, 64)
  const cx = 32, cy = 32, r = 22
  ctx.fillStyle = '#ffffff'
  // 楓の五裂：中心から三角の葉先を放射状に
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.6
    ctx.beginPath()
    ctx.moveTo(cx, cy + 4)
    ctx.lineTo(cx + Math.cos(a - 0.18) * r, cy + Math.sin(a - 0.18) * r)
    ctx.lineTo(cx + Math.cos(a) * r * 1.3, cy + Math.sin(a) * r * 1.3)
    ctx.lineTo(cx + Math.cos(a + 0.18) * r, cy + Math.sin(a + 0.18) * r)
    ctx.closePath()
    ctx.fill()
  }
  // 茎
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5
  ctx.beginPath(); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy + 24); ctx.stroke()
  return c
}

// 足もとに立つ、やわらかな土ぼこりの輪。白で描き、材質の color で染める。
export function ringCanvas(): HTMLCanvasElement {
  const [c, ctx] = mk(128, 128)
  const g = ctx.createRadialGradient(64, 64, 20, 64, 64, 62)
  g.addColorStop(0, 'rgba(255,255,255,0)')
  g.addColorStop(0.55, 'rgba(255,255,255,0)')
  g.addColorStop(0.78, 'rgba(255,255,255,0.7)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return c
}

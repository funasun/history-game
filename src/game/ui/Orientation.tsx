import { useEffect, useState } from 'react'

const isTouch = () => navigator.maxTouchPoints > 0 || 'ontouchstart' in window
const isPortrait = () => window.innerHeight > window.innerWidth

// タップ時のみ有効なネイティブの横固定（Android Chrome向け・失敗は無視）
async function tryNativeLock() {
  try {
    await document.documentElement.requestFullscreen?.()
    await (screen.orientation as unknown as { lock?: (o: string) => Promise<void> }).lock?.('landscape')
  } catch {
    /* iOSなどは非対応 → CSS回転にフォールバック */
  }
}

// 横向きを推奨し、5秒待っても縦のままなら CSS で強制的に横へ回す。
export function OrientationGuard() {
  const [portrait, setPortrait] = useState(() => isTouch() && isPortrait())
  const [count, setCount] = useState(5)
  const forced = portrait && count <= 0

  // 向きの変化を監視（縦↔横）
  useEffect(() => {
    const check = () => setPortrait(isTouch() && isPortrait())
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])

  // 横に戻ったらカウントを振り出しに
  useEffect(() => {
    if (!portrait) setCount(5)
  }, [portrait])

  // 縦のあいだ1秒ずつ減らし、0で強制横に入る
  useEffect(() => {
    if (!portrait || count <= 0) return
    const id = setTimeout(() => setCount(c => c - 1), 1000)
    return () => clearTimeout(id)
  }, [portrait, count])

  // 強制横のCSSクラスを付け外し。回転の適用/解除どちらでも、
  // R3Fと3Dの座標系を追従させるため再計測を促す。
  useEffect(() => {
    document.documentElement.classList.toggle('force-landscape', forced)
    window.dispatchEvent(new Event('resize'))
    return () => document.documentElement.classList.remove('force-landscape')
  }, [forced])

  if (!portrait || forced) return null
  return (
    <div className="rotate-guard" onClick={tryNativeLock}>
      <div className="rotate-phone" />
      <div className="rotate-text">よこ向きが、見やすい</div>
      <div className="rotate-count">{count}秒後に、じどうで横向きに</div>
    </div>
  )
}

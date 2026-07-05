import { useEffect, useState } from 'react'

const isTouch = () => navigator.maxTouchPoints > 0 || 'ontouchstart' in window

// タップ時のみ有効なネイティブの横固定（Android Chrome向け・失敗は無視）
async function tryNativeLock() {
  try {
    await document.documentElement.requestFullscreen?.()
    await (screen.orientation as unknown as { lock?: (o: string) => Promise<void> }).lock?.('landscape')
  } catch {
    /* iOSなどは非対応 → CSS回転にフォールバック */
  }
}

export function OrientationGuard() {
  const [portrait, setPortrait] = useState(
    () => isTouch() && window.innerHeight > window.innerWidth,
  )
  const [count, setCount] = useState(5)
  const forced = portrait && count <= 0

  useEffect(() => {
    const check = () => setPortrait(isTouch() && window.innerHeight > window.innerWidth)
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])

  useEffect(() => {
    if (!portrait) setCount(5)
  }, [portrait])

  useEffect(() => {
    if (!portrait || count <= 0) return
    const id = setTimeout(() => setCount(c => c - 1), 1000)
    return () => clearTimeout(id)
  }, [portrait, count])

  useEffect(() => {
    document.documentElement.classList.toggle('force-landscape', forced)
    // 回転の適用/解除どちらでも、R3Fと3Dの座標系を追従させるため再計測を促す
    window.dispatchEvent(new Event('resize'))
    return () => document.documentElement.classList.remove('force-landscape')
  }, [forced])

  if (!portrait || forced) return null
  return (
    <div className="rotate-guard" onClick={tryNativeLock}>
      <div className="rotate-phone" />
      <div className="rotate-text">よこ向きにして遊んでね</div>
      <div className="rotate-count">{count}秒後に、じどうで横になるよ</div>
    </div>
  )
}

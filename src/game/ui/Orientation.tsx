import { useEffect, useState } from 'react'

const isTouch = () => navigator.maxTouchPoints > 0 || 'ontouchstart' in window

// 一度だけ、そっと横向きをすすめる。縦のままでも遊べるので強制はしない。
let hinted = false

export function OrientationGuard() {
  const [show, setShow] = useState(
    () => isTouch() && !hinted && window.innerHeight > window.innerWidth,
  )

  // 起動時が横でも、あとで縦にしたら一度だけ出す
  useEffect(() => {
    if (hinted) return
    const check = () => {
      if (!hinted && isTouch() && window.innerHeight > window.innerWidth) setShow(true)
    }
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])

  useEffect(() => {
    if (!show) return
    hinted = true
    const id = setTimeout(() => setShow(false), 4000)
    return () => clearTimeout(id)
  }, [show])

  if (!show) return null
  return (
    <div className="rotate-guard" onClick={() => setShow(false)}>
      <div className="rotate-phone" />
      <div className="rotate-text">よこ向きが、おすすめ</div>
      <div className="rotate-count">たてのままでも、遊べます</div>
    </div>
  )
}

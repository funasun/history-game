import { useEffect } from 'react'
import { useGame } from './game/store'
import { heldKeys, isMoveKey, drive, rotateCam, zoomCam } from './game/live'
import { SceneRoot } from './scene/SceneRoot'
import { Tint, DialogueBox, OutfitChoice, LetterView, Toast, PageToast, Hud, TouchPrompt, Home, Title, Prologue, Guide, Epilogue, HintRibbon, Fade } from './game/ui/Ui'
import { DiaryNight, DiaryBook } from './game/ui/Diary'
import { OrientationGuard } from './game/ui/Orientation'
import { initAmbience } from './engine/ambience'
import './game/ui/ui.css'

export default function App() {
  const mode = useGame(s => s.mode)
  const toast = useGame(s => s.toast)
  const pageToast = useGame(s => s.pageToast)
  const bookOpen = useGame(s => s.bookOpen)
  // 3Dの庭を映すのは世界の中にいる間だけ（ホーム・案内・令和の場面では出さない）
  const inWorld = mode === 'dialogue' || mode === 'outfit' || mode === 'roam' || mode === 'letter' || mode === 'diary'

  useEffect(() => {
    initAmbience(() => {
      const s = useGame.getState()
      const w = s.mode === 'roam' || s.mode === 'dialogue' || s.mode === 'outfit' || s.mode === 'letter' || s.mode === 'diary'
      return w && s.t >= 0.55
    })
  }, [])

  // マウス/指のドラッグ操舵：地面を押し続けると、カーソルの指す方へ歩き続ける。
  // 素早い単クリックはしきい値未満なので従来どおり（点への移動・触れる）。
  useEffect(() => {
    let onCanvas = false, x0 = 0, y0 = 0, t0 = 0, dragging = false
    const down = (e: PointerEvent) => {
      onCanvas = e.target instanceof HTMLCanvasElement && useGame.getState().mode === 'roam'
      if (!onCanvas) return
      x0 = e.clientX; y0 = e.clientY; t0 = performance.now(); dragging = false
    }
    const move = (e: PointerEvent) => {
      if (!onCanvas || dragging) return
      // 少し動いたか、少し長く押したら「ドラッグ操舵」に切り替える
      if (Math.hypot(e.clientX - x0, e.clientY - y0) > 6 || performance.now() - t0 > 160) {
        dragging = true
        drive.on = true
      }
    }
    const up = () => {
      onCanvas = false
      dragging = false
      drive.on = false
    }
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [])

  // キーボード：矢印/WASDで歩く、スペース/Enterで触れる・会話を送る、1〜3で選ぶ
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (isMoveKey(key)) {
        e.preventDefault()
        heldKeys.add(key)
        return
      }
      const s = useGame.getState()
      // q/e で見まわす（roam中のみ）
      if (s.mode === 'roam' && (key === 'q' || key === 'e')) {
        e.preventDefault()
        if (!e.repeat) rotateCam(key === 'q' ? 1 : -1)
        return
      }
      if (key === ' ' || key === 'Enter') {
        e.preventDefault()
        if (e.repeat) return
        if (s.mode === 'dialogue') {
          const line = s.dialogue?.lines[s.dialogue.i]
          if (line && !line.choices) s.next()
        } else if (s.mode === 'roam') {
          s.interactNearest()
        } else if (s.mode === 'letter') {
          s.closeLetter()
        }
        return
      }
      if (s.mode === 'dialogue' && ['1', '2', '3'].includes(key)) {
        const line = s.dialogue?.lines[s.dialogue.i]
        const idx = Number(key) - 1
        if (line?.choices && line.choices[idx]) s.next(idx)
      }
    }
    const up = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      heldKeys.delete(key)
    }
    const clear = () => heldKeys.clear()
    // ホイール/ピンチ相当で、カメラを寄せる・引く
    const wheel = (e: WheelEvent) => {
      if (useGame.getState().mode !== 'roam') return
      if (!(e.target instanceof HTMLCanvasElement)) return
      e.preventDefault()
      zoomCam(e.deltaY > 0 ? 0.08 : -0.08)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    window.addEventListener('wheel', wheel, { passive: false })
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
      window.removeEventListener('wheel', wheel)
    }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      {inWorld && <SceneRoot />}
      {inWorld && <Tint />}
      <div className="kasumi" />
      <div className="ui-layer">
        {mode === 'roam' && <Hud />}
        {mode === 'roam' && <TouchPrompt />}
        {mode === 'roam' && <HintRibbon />}
        {toast && <Toast />}
        {pageToast && <PageToast />}
        {mode === 'dialogue' && <DialogueBox />}
        {mode === 'outfit' && <OutfitChoice />}
        {mode === 'letter' && <LetterView />}
        {mode === 'diary' && <DiaryNight />}
        {bookOpen && <DiaryBook />}
        {mode === 'home' && <Home />}
        {mode === 'prologue' && <Prologue />}
        {mode === 'guide' && <Guide />}
        {mode === 'epilogue' && <Epilogue />}
        {mode === 'title' && <Title />}
      </div>
      {inWorld && <Fade />}
      <OrientationGuard />
    </div>
  )
}

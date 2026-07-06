import { useEffect } from 'react'
import { useGame } from './game/store'
import { heldKeys, isMoveKey } from './game/live'
import { SceneRoot } from './scene/SceneRoot'
import { Tint, DialogueBox, OutfitChoice, LetterView, Toast, Hud, Home, Title, Prologue, Guide, Epilogue } from './game/ui/Ui'
import { DiaryNight, DiaryBook } from './game/ui/Diary'
import { OrientationGuard } from './game/ui/Orientation'
import { initAmbience } from './engine/ambience'
import './game/ui/ui.css'

export default function App() {
  const mode = useGame(s => s.mode)
  const toast = useGame(s => s.toast)
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
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
    }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      {inWorld && <SceneRoot />}
      {inWorld && <Tint />}
      <div className="kasumi" />
      <div className="ui-layer">
        {mode === 'roam' && <Hud />}
        {toast && <Toast />}
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
      <OrientationGuard />
    </div>
  )
}

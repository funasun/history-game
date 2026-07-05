import { useEffect } from 'react'
import { useGame } from './game/store'
import { SceneRoot } from './scene/SceneRoot'
import { Tint, DialogueBox, OutfitChoice, LetterView, Toast, Hud, Title } from './game/ui/Ui'
import { DiaryNight, DiaryBook } from './game/ui/Diary'
import { initAmbience } from './engine/ambience'
import './game/ui/ui.css'

export default function App() {
  const mode = useGame(s => s.mode)
  const toast = useGame(s => s.toast)
  const bookOpen = useGame(s => s.bookOpen)

  useEffect(() => {
    initAmbience(() => {
      const s = useGame.getState()
      return s.mode !== 'title' && s.t >= 0.55
    })
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {mode !== 'title' && <SceneRoot />}
      {mode !== 'title' && <Tint />}
      <div className="kasumi" />
      <div className="ui-layer">
        {mode === 'roam' && <Hud />}
        {toast && <Toast />}
        {mode === 'dialogue' && <DialogueBox />}
        {mode === 'outfit' && <OutfitChoice />}
        {mode === 'letter' && <LetterView />}
        {mode === 'diary' && <DiaryNight />}
        {bookOpen && <DiaryBook />}
        {mode === 'title' && <Title />}
      </div>
    </div>
  )
}

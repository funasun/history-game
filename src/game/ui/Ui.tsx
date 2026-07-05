import { useEffect, useState } from 'react'
import { useGame } from '../store'
import { tintColor } from '../../heian/palette'
import { flowerById } from '../../heian/flowers'
import { washiDataURL, flowerDataURL, letterDataURL } from '../../engine/textures'
import { hasSave } from '../../engine/save'
import { dateLabel } from './date'

const washi = () => ({ backgroundImage: `url(${washiDataURL()})` })

export function Tint() {
  const t = useGame(s => s.t)
  return <div className="tint" style={{ backgroundColor: tintColor(t) }} />
}

export function DialogueBox() {
  const dialogue = useGame(s => s.dialogue)
  const next = useGame(s => s.next)
  if (!dialogue) return null
  const line = dialogue.lines[dialogue.i]
  const hasChoices = !!line.choices
  return (
    <>
      {!hasChoices && <div className="dialogue-tap" onClick={() => next()} />}
      <div className="dialogue" style={washi()} onClick={() => !hasChoices && next()}>
        {line.speaker && <div className="speaker">{line.speaker}</div>}
        <div className="line">{line.text}</div>
        {hasChoices ? (
          <div className="choices">
            {line.choices!.map((c, i) => (
              <button key={i} onClick={() => next(i)}>{c.label}</button>
            ))}
          </div>
        ) : (
          <div className="hint">▼</div>
        )}
      </div>
    </>
  )
}

const OUTFITS = [
  { name: '山吹', color: '#e0a63e', under: '#c98a2e' },
  { name: '朽葉', color: '#a8683a', under: '#8a5a30' },
  { name: '桔梗', color: '#7a6fae', under: '#5a5490' },
]

export function OutfitChoice() {
  const choose = useGame(s => s.chooseOutfit)
  return (
    <div className="panel-wrap">
      <div className="panel" style={washi()}>
        <div className="title">けふの色目</div>
        <div className="outfits">
          {OUTFITS.map(o => (
            <button key={o.name} className="outfit" onClick={() => choose(o.color)}>
              <div className="swatch" style={{ background: o.color, ['--under' as string]: o.under }} />
              <div className="name">{o.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function LetterView() {
  const close = useGame(s => s.closeLetter)
  return (
    <div className="panel-wrap" onClick={close}>
      <div className="panel letter" style={washi()}>
        <div>もみぢ、ひとえだ。君に。</div>
        <div>あしたも、庭で。</div>
        <div className="sign">——萩</div>
        <img src={letterDataURL()} alt="" />
      </div>
    </div>
  )
}

export function Toast() {
  const toast = useGame(s => s.toast)
  const clear = useGame(s => s.clearToast)
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(clear, 2400)
    return () => clearTimeout(id)
  }, [toast, clear])
  if (!toast) return null
  const f = flowerById(toast)
  return (
    <div className="toast" style={washi()} key={toast}>
      <img src={flowerDataURL(f)} alt="" />
      <div className="kana">{f.kana}</div>
    </div>
  )
}

export function Hud() {
  const t = useGame(s => s.t)
  const day = useGame(s => s.day)
  const setBookOpen = useGame(s => s.setBookOpen)
  const isNight = t >= 0.72
  const a = Math.PI * Math.min(t / 0.9, 1)
  const cx = 36 - 28 * Math.cos(a)
  const cy = 40 - 32 * Math.sin(a)
  return (
    <>
      <div className="hud-book" style={washi()} onClick={() => setBookOpen(true)}>絵日記</div>
      <div className="hud-time">
        <svg width="72" height="46" viewBox="0 0 72 46">
          <path d="M 8 40 A 28 32 0 0 1 64 40" fill="none" stroke="rgba(244,238,218,0.5)" strokeWidth="1.4" strokeDasharray="2 4" />
          {isNight ? (
            <circle cx={cx} cy={cy} r="6" fill="#e8e4d2" opacity="0.92" />
          ) : (
            <circle cx={cx} cy={cy} r="6.5" fill="#d99a2b" />
          )}
        </svg>
        <div className="date">{dateLabel(day)}</div>
      </div>
    </>
  )
}

// 令和の場面（プロローグ／エピローグ）：現代の書体で、一文ずつ
function StorySlides({ slides, onDone, lastHint }: { slides: string[]; onDone: () => void; lastHint?: string }) {
  const [i, setI] = useState(0)
  const isLast = i + 1 >= slides.length
  const next = () => { if (isLast) onDone(); else setI(i + 1) }
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (!e.repeat) next()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })
  return (
    <div className="story-screen" onClick={next}>
      <div className="story-line" key={i}>{slides[i]}</div>
      <div className="story-hint">{isLast && lastHint ? lastHint : '▼'}</div>
    </div>
  )
}

const PROLOGUE_SLIDES = [
  '令和八年、秋。おばあちゃんの家の、蔵のなか。',
  'ほこりをかぶった箱に、ふるい絵の本があった。',
  '表紙には、かすれた字で——『時渡り草子』。',
  '頁をひらいたとたん、金いろの光があふれて、',
  'わたしは、たおれるように、ねむってしまった。',
]

const EPILOGUE_SLIDES = [
  '——目をさますと、蔵のなかだった。',
  '手のなかに、あの草子。',
  '頁は、七日ぶんの絵日記でいっぱいになっていた。',
  'さいごの頁に、もみぢの押し葉が、ひとひら。',
  '「またね、萩の君。」',
  '千年まえの秋は、いまも、ここにある。',
]

export function Prologue() {
  const wake = useGame(s => s.wake)
  return <StorySlides slides={PROLOGUE_SLIDES} onDone={wake} />
}

export function Epilogue() {
  const toTitle = useGame(s => s.toTitle)
  return <StorySlides slides={EPILOGUE_SLIDES} onDone={toTitle} lastHint="おわり" />
}

export function Title() {
  const start = useGame(s => s.start)
  const saved = hasSave()
  return (
    <div className="title-screen">
      <div className="kasumi" />
      <div className="titlerow">
        <h1>時渡り草子</h1>
        <div className="sub">平安篇</div>
      </div>
      <div className="buttons">
        {saved && <button onClick={() => start(false)}>つづきから</button>}
        <button onClick={() => start(true)}>はじめから</button>
      </div>
    </div>
  )
}

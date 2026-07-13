import { useEffect, useRef } from 'react'
import { useGame } from '../store'
import { ERAS } from '../eras'
import { getPack } from '../pack'
import { rotateCam, zoomCam, toggleBird } from '../live'
import { washiDataURL, flowerDataURL, letterDataURL } from '../../engine/textures'
import { hasSave } from '../../engine/save'

const washi = () => ({ backgroundImage: `url(${washiDataURL()})` })

export function Tint() {
  const t = useGame(s => s.t)
  return <div className="tint" style={{ backgroundColor: getPack().tintColor(t) }} />
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

export function OutfitChoice() {
  const choose = useGame(s => s.chooseOutfit)
  const pack = getPack()
  return (
    <div className="panel-wrap">
      <div className="panel" style={washi()}>
        <div className="title">{pack.outfitTitle}</div>
        {pack.outfitNote && <div className="panel-note">{pack.outfitNote}</div>}
        <div className="outfits">
          {pack.outfits.map(o => (
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

// 初回だけの、ひとことヒント帯（上部・数秒で消える。読ませない＝一文だけ）
export function HintRibbon() {
  const hint = useGame(s => s.hint)
  const dismiss = useGame(s => s.dismissHint)
  useEffect(() => {
    if (!hint) return
    const id = setTimeout(dismiss, 6500)
    return () => clearTimeout(id)
  }, [hint, dismiss])
  if (!hint) return null
  return (
    <div className="hint-ribbon" key={hint.id} style={washi()} onClick={dismiss}>
      {hint.text}
    </div>
  )
}

// 場面替えの暗転（ふすまを閉じるような、短い墨色）
export function Fade() {
  const fade = useGame(s => s.fade)
  return <div className={`scene-fade${fade ? ' on' : ''}`} />
}

export function LetterView() {
  const close = useGame(s => s.closeLetter)
  const letter = getPack().letter
  if (!letter) return null
  return (
    <div className="panel-wrap" onClick={close}>
      <div className="panel letter" style={washi()}>
        {letter.lines.map((l, i) => <div key={i}>{l}</div>)}
        <div className="sign">{letter.sign}</div>
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
  const f = getPack().flowerById(toast)
  return (
    <div className="toast" style={washi()} key={toast}>
      <img src={flowerDataURL(f)} alt="" />
      <div className="kana">{f.kana}</div>
    </div>
  )
}

// 名所をひらいたら、その出来事の頁が年表に加わった合図（学びへ誘う）
export function PageToast() {
  const pageToast = useGame(s => s.pageToast)
  const mode = useGame(s => s.mode)
  const clear = useGame(s => s.clearPageToast)
  const show = mode === 'roam' && !!pageToast
  useEffect(() => {
    if (!show) return
    const id = setTimeout(clear, 4200)
    return () => clearTimeout(id)
  }, [show, clear])
  if (!show) return null
  return (
    <div className="page-toast" style={washi()} key={pageToast}>
      <div className="pt-head">年表に、頁がひらいた</div>
      <div className="pt-title">{pageToast}</div>
      <div className="pt-foot">絵日記でよめる</div>
    </div>
  )
}

// 足もとに触れられるものがあれば、下に札を出す（押せば触れる）。
// 「近くまで来たのに反応しない」を無くし、何に触れられるかを文字でも示す。
export function TouchPrompt() {
  const nearby = useGame(s => s.nearby)
  const interact = useGame(s => s.interact)
  const touch = isTouchDevice()
  if (!nearby) return null
  return (
    <div className="touch-prompt" key={nearby.id}>
      <button style={washi()} onClick={() => interact(nearby.id)}>
        <span className="tp-label">{nearby.label}</span>
        {!touch && <span className="tp-key">スペース</span>}
      </button>
    </div>
  )
}

export function Hud() {
  const t = useGame(s => s.t)
  const day = useGame(s => s.day)
  const learned = useGame(s => s.learnedEvents)
  const setBookOpen = useGame(s => s.setBookOpen)
  const pack = getPack()
  const isNight = t >= 0.72
  const a = Math.PI * Math.min(t / 0.9, 1)
  const cx = 36 - 28 * Math.cos(a)
  const cy = 40 - 32 * Math.sin(a)
  const marks = pack.LANDMARKS
  return (
    <>
      <div className="hud-book" style={washi()} onClick={() => setBookOpen(true)}>絵日記</div>
      <div className="hud-pages">
        {Array.from({ length: pack.LAST_DAY }, (_, i) => <span key={i} className={i < day ? 'on' : ''} />)}
      </div>
      <div className="hud-marks">
        {marks.map(m => (
          <span key={m.id} className={m.events.every(e => learned.includes(e)) ? 'on' : ''} />
        ))}
      </div>
      <div className="hud-time">
        <svg width="72" height="46" viewBox="0 0 72 46">
          <path d="M 8 40 A 28 32 0 0 1 64 40" fill="none" stroke="rgba(244,238,218,0.5)" strokeWidth="1.4" strokeDasharray="2 4" />
          {isNight ? (
            <circle cx={cx} cy={cy} r="6" fill="#e8e4d2" opacity="0.92" />
          ) : (
            <circle cx={cx} cy={cy} r="6.5" fill="#d99a2b" />
          )}
        </svg>
        <div className="date">{pack.dateLabel(day)}</div>
      </div>
      <div className="hud-cam">
        <button style={washi()} onClick={() => rotateCam(1)} aria-label="左へ見まわす">⟲</button>
        <button style={washi()} onClick={() => rotateCam(-1)} aria-label="右へ見まわす">⟳</button>
        <button style={washi()} onClick={() => zoomCam(-0.18)} aria-label="近くへ寄る">＋</button>
        <button style={washi()} onClick={() => zoomCam(0.18)} aria-label="遠くへ引く">－</button>
        <button style={washi()} onClick={toggleBird} aria-label="空から見わたす（もう一度で地上へ）">空</button>
      </div>
    </>
  )
}

// 令和の場面（プロローグ／エピローグ）＝教室の紙芝居（Classroom.tsx）
// 冒頭：試験→寝落ち→時渡り。終幕：目覚め→答案にこたえが埋まる。
export { ClassroomIntro as Prologue, WakeUp as Epilogue } from './Classroom'

// 端末で操作のいいまわしを変える（PCではキーボード／ドラッグも案内）
const isTouchDevice = () =>
  typeof navigator !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window)

export function Guide() {
  const wake = useGame(s => s.wake)
  const pack = getPack()
  const touch = isTouchDevice()
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) wake() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [wake])
  return (
    <div className="guide-screen">
      <div className="guide-head">あそびかた</div>
      <div className="guide-rows">
        {pack.guideRows.map(([verb, gloss]) => (
          <div className="guide-row" key={verb}>
            <span className="guide-verb">{verb}</span>
            <span className="guide-gloss">{gloss}</span>
          </div>
        ))}
      </div>
      <div className="guide-note">{pack.guideNote}</div>
      <div className="guide-controls">
        {touch
          ? 'ゆびでタップ、または画面をなぞって歩けます。⟲⟳で見まわせます。'
          : '矢印キー・WASD、または画面をドラッグで歩けます。触れるは スペース／Enter。q／e か ⟲⟳ で見まわし、ホイールで寄り引き。'}
      </div>
      <button className="guide-start" onClick={wake}>この世に入る</button>
    </div>
  )
}

// シリーズのホーム：日本史の時代を渡りあるく。篇はこれからも増えてゆく
export function Home() {
  const chooseEra = useGame(s => s.chooseEra)
  const shelfRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const shelf = shelfRef.current, active = activeRef.current
    if (shelf && active) shelf.scrollLeft = active.offsetLeft - (shelf.clientWidth - active.clientWidth) / 2
  }, [])
  return (
    <div className="home-screen">
      <div className="kasumi" />
      <div className="home-head">
        <h1 className="home-title">時渡り草子</h1>
        <div className="home-sub">テストのつづきは、夢のなかで</div>
      </div>
      <div className="shelf" ref={shelfRef}>
        {ERAS.map(e => e.available ? (
          <button key={e.id} ref={activeRef} className="spine on" onClick={() => chooseEra(e.id)}>
            <span className="top">{e.volume}</span>
            <span className="ename">{e.name}</span>
            <span className="eyear">{e.year}</span>
          </button>
        ) : (
          <div key={e.id} className="spine locked">
            <span className="top">次の試験</span>
            <span className="ename">{e.name}</span>
            <span className="eyear">{e.year}</span>
          </div>
        ))}
      </div>
      <div className="home-foot">試験範囲は、これからも増えてゆく</div>
    </div>
  )
}

export function Title() {
  const start = useGame(s => s.start)
  const toHome = useGame(s => s.toHome)
  const pack = getPack()
  const saved = hasSave()
  return (
    <div className="title-screen">
      <div className="kasumi" />
      <button className="title-back" onClick={toHome}>← 時代をえらぶ</button>
      <div className="title-main">
        <div className="titlerow">
          <h1>時渡り草子</h1>
          <div className="sub">{pack.volume}</div>
        </div>
        <div className="tagline">{pack.tagline}</div>
      </div>
      <div className="buttons">
        {saved && <button onClick={() => start(false)}>夢のつづきから</button>}
        <button onClick={() => start(true)}>はじめから</button>
      </div>
    </div>
  )
}

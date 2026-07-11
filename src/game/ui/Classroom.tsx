// 現実（令和の教室）の紙芝居。DOM＋CSSキーフレームのみ——動画ファイルは使わない。
//  ClassroomIntro：チャイム→答案→独白→まぶたが落ちる→机に伏す→金泥の時渡り
//  WakeUp       ：金の光→まぶたがひらく→答案にこたえが走り書きで埋まる→独白→締めの札
// 書体と紙が変わる（ゴシック・白 ⇄ 明朝・和紙）ことが、時渡りの視覚言語。
import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../store'
import { getPack, activeEraId } from '../pack'
import { ExamSheet, filledSet } from './Exam'
import { schoolChime, clockTickStart, clockTickStop, deskThunk, penScratch } from '../../engine/school'

// スペース／Enter で送る（クリックと同じ）
function useAdvanceKey(fn: () => void) {
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) ref.current() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])
}

// 壁時計（秒針は steps で刻む。遅れは寝落ちの主観時間）
function WallClock({ slow }: { slow: number }) {
  return (
    <div className="cls-clock">
      <div className="cls-clock-face">
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} className="cls-clock-dot" style={{ transform: `rotate(${i * 30}deg) translateY(-26px)` }} />
        ))}
        <div className="cls-hand-h" />
        <div className="cls-hand-m" />
        <div className="cls-hand-s" style={{ animationDuration: `${60 * slow}s` }} />
      </div>
    </div>
  )
}

// 冒頭：試験→寝落ち→時渡り。おわったら onDone（あそびかた案内へ）。
export function ClassroomIntro() {
  const toGuide = useGame(s => s.toGuide)
  const pack = getPack()
  const firstExam = activeEraId() === 'heian' // 平安＝試験のはじまり（チャイムから）。鎌倉＝再入眠
  const [stage, setStage] = useState<'board' | 'desk' | 'sleep' | 'slip'>(firstExam ? 'board' : 'desk')
  const [li, setLi] = useState(0) // 独白の行
  const lines = pack.prologue
  const tickRef = useRef<{ slow: (m: number) => void } | null>(null)
  const done = useRef(false)
  const finish = () => {
    if (done.current) return
    done.current = true
    clockTickStop()
    toGuide()
  }

  // 幕の進行（自動送り）
  useEffect(() => {
    if (stage === 'board') {
      schoolChime()
      const id = setTimeout(() => setStage('desk'), 3400)
      return () => clearTimeout(id)
    }
    if (stage === 'desk') {
      tickRef.current = clockTickStart()
      return () => clockTickStop()
    }
    if (stage === 'sleep') {
      clockTickStop()
      deskThunk()
      const id = setTimeout(() => setStage('slip'), 2000)
      return () => clearTimeout(id)
    }
    if (stage === 'slip') {
      const id = setTimeout(finish, 4800)
      return () => clearTimeout(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  // 独白は放っておいても進む（読ませない・待たせない）
  useEffect(() => {
    if (stage !== 'desk') return
    const id = setTimeout(() => advance(), 3800)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, li])

  const advance = () => {
    if (stage === 'board') { setStage('desk'); return }
    if (stage !== 'desk') return
    if (li + 1 < lines.length) {
      setLi(li + 1)
      tickRef.current?.slow(1 + (li + 1) * 0.22) // 秒針が、すこしずつ間遠に
    } else {
      setStage('sleep')
    }
  }
  useAdvanceKey(advance)

  // 時渡りで宙へ散る年号（この篇の試験に出る年）
  const years = useMemo(() => {
    const ys = pack.exam
      .map(q => pack.TIMELINE.find(e => e.id === q.eventId)?.year)
      .filter((y): y is number => !!y)
    return [...new Set(ys)].map((y, i) => ({
      y,
      left: 8 + ((i * 137) % 84),          // 決め打ちの散らし（乱数だと再描画で跳ねる）
      delay: (i % 5) * 0.55,
      dur: 3.4 + (i % 3) * 0.8,
    }))
  }, [pack])

  const eraName = pack.volume.replace('篇', '')
  const blur = stage === 'desk' ? Math.min(li * 0.55, 2.6) : 0

  return (
    <div className="cls-screen" onClick={advance}>
      {stage === 'board' && (
        <div className="cls-board">
          <div className="cls-board-date">令和八年十月十七日　二時間目</div>
          <div className="cls-board-subj">社会（歴史）　中間試験</div>
        </div>
      )}

      {(stage === 'desk' || stage === 'sleep') && (
        <div className="cls-room" style={{ filter: `blur(${blur}px) brightness(${1 - blur * 0.09})` }}>
          <WallClock slow={1 + li * 0.22} />
          <div className="cls-desk">
            <ExamSheet exam={pack.exam} title={pack.examTitle} filled={new Set()} />
          </div>
        </div>
      )}

      {stage === 'desk' && (
        <>
          <div className="cls-line" key={li}>{lines[li]}</div>
          {/* まぶた：行が進むごとに、ながく閉じる */}
          {li > 0 && (
            <div className="cls-lids" key={`b${li}`} style={{ ['--blink' as string]: `${0.45 + li * 0.3}s` }}>
              <div className="cls-lid top" /><div className="cls-lid bottom" />
            </div>
          )}
        </>
      )}

      {stage === 'sleep' && <div className="cls-black" />}

      {stage === 'slip' && (
        <div className="cls-slip">
          <div className="slip-glow" />
          {years.map((f, i) => (
            <span key={i} className="slip-year" style={{ left: `${f.left}%`, animationDelay: `${f.delay}s`, animationDuration: `${f.dur}s` }}>
              {f.y}
            </span>
          ))}
          <div className="slip-title">
            <span className="slip-title-sub">夢のなか——</span>
            <span className="slip-title-era">{eraName}</span>
          </div>
        </div>
      )}

      <button className="cls-skip" onClick={e => { e.stopPropagation(); finish() }}>とばす</button>
    </div>
  )
}

// 終幕：目覚め。夢で見た出来事のこたえが、答案にひとりでに埋まってゆく。
export function WakeUp() {
  const toTitle = useGame(s => s.toTitle)
  const learnedEvents = useGame(s => s.learnedEvents)
  const diary = useGame(s => s.diary)
  const pack = getPack()
  const filled = useMemo(() => filledSet(pack.exam, learnedEvents, diary), [pack, learnedEvents, diary])
  const blank = pack.exam.length - filled.size
  const [stage, setStage] = useState<'open' | 'fill' | 'lines' | 'card'>('open')
  const [li, setLi] = useState(0)
  const lines = pack.epilogue

  useEffect(() => {
    if (stage === 'open') {
      schoolChime()
      const id = setTimeout(() => setStage('fill'), 2100)
      return () => clearTimeout(id)
    }
    if (stage === 'fill') {
      // こたえが書きこまれる音（表示の時差に合わせて）
      const ids = Array.from({ length: filled.size }, (_, i) =>
        window.setTimeout(penScratch, 700 + i * 550))
      const id = setTimeout(() => setStage('lines'), 700 + filled.size * 550 + 900)
      return () => { clearTimeout(id); ids.forEach(clearTimeout) }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  const advance = () => {
    if (stage === 'fill') { setStage('lines'); return }
    if (stage === 'lines') {
      if (li + 1 < lines.length) setLi(li + 1)
      else setStage('card')
      return
    }
    if (stage === 'card') toTitle()
  }
  useAdvanceKey(advance)

  return (
    <div className="cls-screen" onClick={advance}>
      {stage !== 'card' && (
        <>
          <div className={`cls-room wake${stage === 'open' ? ' waking' : ''}`}>
            <WallClock slow={1} />
            <div className="cls-desk">
              <ExamSheet exam={pack.exam} title={pack.examTitle} filled={stage === 'open' ? new Set() : filled} animate name={stage !== 'open'} />
            </div>
            {stage !== 'open' && blank > 0 && (
              <div className="wake-blank-note">まだ白いところは——もういちど、おなじ夢を見れば。</div>
            )}
          </div>
          {stage === 'open' && (
            <div className="cls-lids opening">
              <div className="cls-lid top" /><div className="cls-lid bottom" />
            </div>
          )}
          <div className="wake-gold" />
          {stage === 'lines' && <div className="cls-line" key={li}>{lines[li]}</div>}
          {stage === 'fill' && <div className="cls-tap-hint">▼</div>}
        </>
      )}

      {stage === 'card' && (
        <div className="wake-card">
          <div className="wake-card-text">{pack.epilogueHint ?? 'おわり'}</div>
          <div className="wake-card-hint">▼</div>
        </div>
      )}
    </div>
  )
}

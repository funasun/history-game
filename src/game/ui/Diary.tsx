import { useState } from 'react'
import { useGame } from '../store'
import { getPack, activeEraId } from '../pack'
import type { TLEvent } from '../pack'
import { ERAS } from '../eras'
import { ExamSheet, filledSet } from './Exam'
import { washiDataURL, flowerDataURL, letterDataURL } from '../../engine/textures'

const washi = () => ({ backgroundImage: `url(${washiDataURL()})` })

function iconSrc(id: string): string {
  if (id === 'letter') return letterDataURL()
  return flowerDataURL(getPack().flowerById(id))
}

interface Quiz { q: string; choices: string[]; answer: number; note: string }

function shuffle<T>(a: T[]): T[] {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

// 宵の問い：見た出来事から、年号と人／出来事をむすぶ一問をつくる（採点せず、そっと答え合わせ）
function makeQuiz(pool: TLEvent[]): Quiz | null {
  if (pool.length < 3) return null
  const e = shuffle(pool)[0]
  const askFigure = Math.random() < 0.5
  const key: 'figure' | 'title' = askFigure ? 'figure' : 'title'
  const answerVal = e[key]
  const distract: string[] = []
  const seen = new Set<string>([answerVal])
  for (const x of shuffle(pool)) {
    if (!seen.has(x[key])) { seen.add(x[key]); distract.push(x[key]) }
    if (distract.length >= 2) break
  }
  if (distract.length < 2) return null
  const choices = shuffle([answerVal, ...distract])
  return {
    q: askFigure ? `${e.year}年『${e.title}』に ゆかりの人は？` : `${e.wa}（${e.year}年）に おきたことは？`,
    choices,
    answer: choices.indexOf(answerVal),
    note: askFigure ? `${e.figure}。${e.line}` : `『${e.title}』。${e.line}`,
  }
}

// 年表でまだ見ぬ頁に、ひらき方をそっと示す（何をすればよいか、迷わせない）
function lockedHint(ev: TLEvent): string {
  const pack = getPack()
  const m = pack.LANDMARKS.find(l => l.events.includes(ev.id))
  if (m) return `${m.label}にふれると、ひらく`
  if (ev.factId) return '宵のくらしの栞から、ひらくことがある'
  return 'この世をあるくうちに、めぐりあう'
}

// 宵：けふの一枚
export function DiaryNight() {
  const diary = useGame(s => s.diary)
  const learnedEvents = useGame(s => s.learnedEvents)
  const sleep = useGame(s => s.sleep)
  const pack = getPack()
  const entry = diary[diary.length - 1]
  const [openFact, setOpenFact] = useState<string | null>(null)
  const [deep, setDeep] = useState(false)
  const [sleeping, setSleeping] = useState(false)
  // 見た出来事（名所＋栞）から、宵の問いを一問。見た数が少ない日は出さない。
  const factSet = new Set(diary.flatMap(e => e.factIds))
  const pool = pack.TIMELINE.filter(e => learnedEvents.includes(e.id) || (!!e.factId && factSet.has(e.factId)))
  const [quiz] = useState(() => makeQuiz(pool))
  const [picked, setPicked] = useState<number | null>(null)

  if (!entry) return null

  const doSleep = () => {
    setSleeping(true)
    setTimeout(() => sleep(), 1100)
  }

  return (
    <div className="panel-wrap">
      <div className="panel diary" style={washi()}>
        <div className="diary-body">
          <div className="date">{pack.dateLabel(entry.day)}</div>
          <div className="picture">
            {entry.icons.length > 0
              ? entry.icons.map((ic, i) => <img key={i} src={iconSrc(ic)} alt="" style={{ transform: `rotate(${(i - 1) * 4}deg)` }} />)
              : <span style={{ opacity: 0.4, fontSize: 15, letterSpacing: '0.2em' }}>月ばかりの夜</span>}
          </div>
          {entry.lines.map((l, i) => <div key={i} className="dline">{l}</div>)}
        </div>

        {quiz && !openFact && (
          <div className="yoi-quiz">
            <div className="yq-head">宵の問い</div>
            <div className="yq-q">{quiz.q}</div>
            <div className="yq-choices">
              {quiz.choices.map((c, i) => {
                const cls = picked == null ? '' : i === quiz.answer ? ' right' : i === picked ? ' wrong' : ' dim'
                return (
                  <button key={i} className={`yq-choice${cls}`} disabled={picked != null} onClick={() => setPicked(i)}>{c}</button>
                )
              })}
            </div>
            {picked != null && <div className="yq-note">{quiz.note}</div>}
          </div>
        )}

        {!openFact && <button className="sleep-btn" onClick={doSleep}>ねむる</button>}

        <div className="shiori-row">
          {entry.factIds.map(fid => (
            <button key={fid} className="shiori" onClick={() => { setOpenFact(fid); setDeep(false) }}>
              {pack.factById(fid).tag}
            </button>
          ))}
        </div>

        {openFact && (
          <div className="factcard" style={washi()}>
            <button className="back" onClick={() => setOpenFact(null)}>✕</button>
            <div className="tag">{pack.factById(openFact).tag}</div>
            <div className="short">{pack.factById(openFact).short}</div>
            {deep
              ? <div className="deep">{pack.factById(openFact).deep}</div>
              : <button className="more" onClick={() => setDeep(true)}>……もっと</button>}
          </div>
        )}
      </div>
      {sleeping && (
        <div style={{
          position: 'absolute', inset: 0, background: '#0e0c14',
          animation: 'fadein 1s ease-out forwards',
        }} />
      )}
    </div>
  )
}

// 絵日記帳（いつでも開ける：これまでの頁と図譜と栞）
export function DiaryBook() {
  const diary = useGame(s => s.diary)
  const zufu = useGame(s => s.zufu)
  const learnedEvents = useGame(s => s.learnedEvents)
  const setBookOpen = useGame(s => s.setBookOpen)
  const pack = getPack()
  const TIMELINE = pack.TIMELINE
  const [tab, setTab] = useState<'shiken' | 'nenpyo' | 'nikki' | 'zufu' | 'shiori'>('shiken')
  const [openFact, setOpenFact] = useState<string | null>(null)
  const [openEvent, setOpenEvent] = useState<string | null>(null)
  const learned = [...new Set(diary.flatMap(e => e.factIds))]
  // 栞（文化）を得ていれば、その出来事も「見た」とみなす
  const factSet = new Set(learned)
  const witnessed = (ev: TLEvent) =>
    learnedEvents.includes(ev.id) || (!!ev.factId && factSet.has(ev.factId))
  const seenCount = TIMELINE.filter(witnessed).length
  // 持ちこんだ試験：見た出来事のこたえは、もう書ける
  const filled = filledSet(pack.exam, learnedEvents, diary)

  return (
    <div className="panel-wrap" onClick={() => setBookOpen(false)}>
      <div className="panel book" style={washi()} onClick={e => e.stopPropagation()}>
        <button className="close" onClick={() => setBookOpen(false)}>✕</button>
        <div className="tabs">
          <button className={tab === 'shiken' ? 'on' : ''} onClick={() => setTab('shiken')}>試験</button>
          <button className={tab === 'nenpyo' ? 'on' : ''} onClick={() => setTab('nenpyo')}>年表</button>
          {pack.hasFlowers && <button className={tab === 'zufu' ? 'on' : ''} onClick={() => setTab('zufu')}>草花の図譜</button>}
          <button className={tab === 'nikki' ? 'on' : ''} onClick={() => setTab('nikki')}>これまでの頁</button>
          <button className={tab === 'shiori' ? 'on' : ''} onClick={() => setTab('shiori')}>栞のたまり</button>
        </div>

        {tab === 'shiken' && (
          <div className="exam-tab">
            <div className="exam-tab-head">
              <span className="exam-tab-title">持ちこんだ試験の写し</span>
              <span className="nenpyo-count">こたえ　{filled.size} / {pack.exam.length}</span>
            </div>
            <ExamSheet exam={pack.exam} title={pack.examTitle} filled={filled} showHints name={filled.size > 0} />
            <div className="nenpyo-foot">夢のなかで見たことの、こたえは埋まってゆく。</div>
          </div>
        )}

        {tab === 'nenpyo' && (
          <div className="nenpyo">
            <div className="nenpyo-head">
              <span className="nenpyo-title">{pack.nenpyoTitle}</span>
              <span className="nenpyo-count">見た出来事　{seenCount} / {TIMELINE.length}</span>
            </div>
            {/* 時代のながれ：日本史のどこにいるか（参考資料の頭） */}
            <div className="era-strip">
              {ERAS.map(e => (
                <span key={e.id} className={`era-chip${e.id === activeEraId() ? ' now' : ''}`}>{e.name}</span>
              ))}
            </div>
            <div className="nenpyo-list">
              {TIMELINE.map(ev => {
                const w = witnessed(ev)
                const open = openEvent === ev.id
                return (
                  <div
                    key={ev.id}
                    className={`tl-item${w ? '' : ' unseen'}${open ? ' open' : ''}`}
                    onClick={() => setOpenEvent(open ? null : ev.id)}
                  >
                    <div className="tl-row">
                      <span className="tl-year">{ev.year}</span>
                      <span className="tl-body">
                        <span className="tl-title">{ev.title}</span>
                        <span className="tl-meta">{ev.wa}・{ev.figure}</span>
                      </span>
                      {w && <span className="tl-seal">見た</span>}
                    </div>
                    {!open && <div className="tl-line">{ev.line}</div>}
                    {open && <div className="tl-deep">{ev.deep}</div>}
                    {!w && <div className="tl-line tl-hint">{lockedHint(ev)}</div>}
                  </div>
                )
              })}
            </div>
            <div className="nenpyo-foot">{pack.nenpyoFoot}</div>
          </div>
        )}

        {tab === 'zufu' && (
          <div className="zufu-grid">
            {pack.FLOWERS.map(f => zufu.includes(f.id) ? (
              <div key={f.id} className="zufu-cell">
                <img src={flowerDataURL(f)} alt={f.kana} />
                <div className="kana">{f.kana}</div>
              </div>
            ) : (
              <div key={f.id} className="zufu-cell unknown">
                <span className="q">？</span>
                <div className="kana">まだ見ぬ花</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'nikki' && (
          diary.length === 0
            ? <div className="book-empty">まだ、なにも書かれていない。</div>
            : diary.map((e, i) => (
              <div key={i} className="book-page">
                <div className="date">{pack.dateLabel(e.day)}</div>
                <div>{e.icons.map((ic, j) => <img key={j} src={iconSrc(ic)} alt="" />)}</div>
                {e.lines.map((l, j) => <div key={j} className="dline">{l}</div>)}
              </div>
            ))
        )}

        {tab === 'shiori' && (
          learned.length === 0
            ? <div className="book-empty">栞は、まだ挟まっていない。</div>
            : <div className="shiori-list">
              {learned.map(fid => {
                const f = pack.factById(fid)
                const open = openFact === fid
                return (
                  <div key={fid} className={`shiori-item${open ? ' open' : ''}`} onClick={() => setOpenFact(open ? null : fid)}>
                    <div className="row">
                      <span className="tag">{f.tag}</span>
                      <span className="short">{f.short}</span>
                    </div>
                    {open && <div className="deep">{f.deep}</div>}
                  </div>
                )
              })}
            </div>
        )}
      </div>
    </div>
  )
}

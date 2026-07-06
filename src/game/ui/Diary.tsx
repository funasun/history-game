import { useState } from 'react'
import { useGame } from '../store'
import { FLOWERS, flowerById } from '../../heian/flowers'
import { factById } from '../../heian/facts'
import { TIMELINE } from '../../heian/timeline'
import { washiDataURL, flowerDataURL, letterDataURL } from '../../engine/textures'
import { dateLabel } from './date'

const washi = () => ({ backgroundImage: `url(${washiDataURL()})` })

function iconSrc(id: string): string {
  if (id === 'letter') return letterDataURL()
  return flowerDataURL(flowerById(id))
}

// 宵：けふの一枚
export function DiaryNight() {
  const diary = useGame(s => s.diary)
  const sleep = useGame(s => s.sleep)
  const entry = diary[diary.length - 1]
  const [openFact, setOpenFact] = useState<string | null>(null)
  const [deep, setDeep] = useState(false)
  const [sleeping, setSleeping] = useState(false)

  if (!entry) return null

  const doSleep = () => {
    setSleeping(true)
    setTimeout(() => sleep(), 1100)
  }

  return (
    <div className="panel-wrap">
      <div className="panel diary" style={washi()}>
        <div className="diary-body">
          <div className="date">{dateLabel(entry.day)}</div>
          <div className="picture">
            {entry.icons.length > 0
              ? entry.icons.map((ic, i) => <img key={i} src={iconSrc(ic)} alt="" style={{ transform: `rotate(${(i - 1) * 4}deg)` }} />)
              : <span style={{ opacity: 0.4, fontSize: 15, letterSpacing: '0.2em' }}>月ばかりの夜</span>}
          </div>
          {entry.lines.map((l, i) => <div key={i} className="dline">{l}</div>)}
        </div>

        {!openFact && <button className="sleep-btn" onClick={doSleep}>ねむる</button>}

        <div className="shiori-row">
          {entry.factIds.map(fid => (
            <button key={fid} className="shiori" onClick={() => { setOpenFact(fid); setDeep(false) }}>
              {factById(fid).tag}
            </button>
          ))}
        </div>

        {openFact && (
          <div className="factcard" style={washi()}>
            <button className="back" onClick={() => setOpenFact(null)}>✕</button>
            <div className="tag">{factById(openFact).tag}</div>
            <div className="short">{factById(openFact).short}</div>
            {deep
              ? <div className="deep">{factById(openFact).deep}</div>
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
  const [tab, setTab] = useState<'nenpyo' | 'nikki' | 'zufu' | 'shiori'>('nenpyo')
  const [openFact, setOpenFact] = useState<string | null>(null)
  const [openEvent, setOpenEvent] = useState<string | null>(null)
  const learned = [...new Set(diary.flatMap(e => e.factIds))]
  // 栞（文化）を得ていれば、その出来事も「見た」とみなす
  const factSet = new Set(learned)
  const witnessed = (ev: typeof TIMELINE[number]) =>
    learnedEvents.includes(ev.id) || (!!ev.factId && factSet.has(ev.factId))
  const seenCount = TIMELINE.filter(witnessed).length

  return (
    <div className="panel-wrap" onClick={() => setBookOpen(false)}>
      <div className="panel book" style={washi()} onClick={e => e.stopPropagation()}>
        <button className="close" onClick={() => setBookOpen(false)}>✕</button>
        <div className="tabs">
          <button className={tab === 'nenpyo' ? 'on' : ''} onClick={() => setTab('nenpyo')}>年表</button>
          <button className={tab === 'zufu' ? 'on' : ''} onClick={() => setTab('zufu')}>草花の図譜</button>
          <button className={tab === 'nikki' ? 'on' : ''} onClick={() => setTab('nikki')}>これまでの頁</button>
          <button className={tab === 'shiori' ? 'on' : ''} onClick={() => setTab('shiori')}>栞のたまり</button>
        </div>

        {tab === 'nenpyo' && (
          <div className="nenpyo">
            <div className="nenpyo-head">
              <span className="nenpyo-title">平安のあゆみ</span>
              <span className="nenpyo-count">見た出来事　{seenCount} / {TIMELINE.length}</span>
            </div>
            <div className="nenpyo-list">
              {TIMELINE.map(ev => {
                const w = witnessed(ev)
                const open = openEvent === ev.id
                return (
                  <div
                    key={ev.id}
                    className={`tl-item${w ? '' : ' locked'}${open ? ' open' : ''}`}
                    onClick={() => w && setOpenEvent(open ? null : ev.id)}
                  >
                    <div className="tl-row">
                      <span className="tl-year">{ev.year}</span>
                      <span className="tl-body">
                        <span className="tl-title">{w ? ev.title : 'まだ見ぬ出来事'}</span>
                        {w && <span className="tl-meta">{ev.wa}・{ev.figure}</span>}
                      </span>
                      <span className="tl-mark">{w ? '●' : '○'}</span>
                    </div>
                    {w && !open && <div className="tl-line">{ev.line}</div>}
                    {w && open && <div className="tl-deep">{ev.deep}</div>}
                  </div>
                )
              })}
            </div>
            <div className="nenpyo-foot">庭の名所にふれ、七日を生きて、頁をうめてゆく。</div>
          </div>
        )}

        {tab === 'zufu' && (
          <div className="zufu-grid">
            {FLOWERS.map(f => zufu.includes(f.id) ? (
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
                <div className="date">{dateLabel(e.day)}</div>
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
                const f = factById(fid)
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

import { useState } from 'react'
import { useGame } from '../store'
import { FLOWERS, flowerById } from '../../heian/flowers'
import { factById } from '../../heian/facts'
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
        <div className="date">{dateLabel(entry.day)}</div>
        <div className="picture">
          {entry.icons.length > 0
            ? entry.icons.map((ic, i) => <img key={i} src={iconSrc(ic)} alt="" style={{ transform: `rotate(${(i - 1) * 4}deg)` }} />)
            : <span style={{ opacity: 0.4, fontSize: 15, letterSpacing: '0.2em' }}>月ばかりの夜</span>}
        </div>
        {entry.lines.map((l, i) => <div key={i} className="dline">{l}</div>)}

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

        {!openFact && <button className="sleep-btn" onClick={doSleep}>ねむる</button>}
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

// 絵日記帳（いつでも開ける：これまでの頁と図譜）
export function DiaryBook() {
  const diary = useGame(s => s.diary)
  const zufu = useGame(s => s.zufu)
  const setBookOpen = useGame(s => s.setBookOpen)
  const [tab, setTab] = useState<'nikki' | 'zufu'>('zufu')

  return (
    <div className="panel-wrap" onClick={() => setBookOpen(false)}>
      <div className="panel book" style={washi()} onClick={e => e.stopPropagation()}>
        <button className="close" onClick={() => setBookOpen(false)}>✕</button>
        <div className="tabs">
          <button className={tab === 'zufu' ? 'on' : ''} onClick={() => setTab('zufu')}>草花の図譜</button>
          <button className={tab === 'nikki' ? 'on' : ''} onClick={() => setTab('nikki')}>これまでの頁</button>
        </div>

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
      </div>
    </div>
  )
}

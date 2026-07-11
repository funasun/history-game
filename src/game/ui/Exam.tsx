// 持ちこんだ試験の答案用紙。三つの場面で同じ紙を使う：
//  1) 冒頭の教室（まっさら） 2) 目覚め（こたえが走り書きで埋まる） 3) 草子の「試験」タブ
// 白い紙・ゴシック——夢の世界（和紙・明朝）との対比が時渡りの視覚言語。
import type { DiaryEntry } from '../store'
import type { ExamQ, Pack } from '../pack'
import { getPack } from '../pack'

// 充足＝witnessed(eventId)。learnedEvents に在るか、その出来事の factId の栞を得ている。
// （絵日記の年表と同じ判定。派生値なのでセーブ形式は変わらない）
export function filledSet(exam: ExamQ[], learnedEvents: string[], diary: DiaryEntry[]): Set<string> {
  const pack = getPack()
  const facts = new Set(diary.flatMap(e => e.factIds))
  const witnessed = (evId: string) => {
    if (learnedEvents.includes(evId)) return true
    const ev = pack.TIMELINE.find(t => t.id === evId)
    return !!ev?.factId && facts.has(ev.factId)
  }
  return new Set(exam.filter(q => witnessed(q.eventId)).map(q => q.id))
}

// 未回答の設問に、ゆかりの名所・栞への誘いをそっと添える（責めない）
export function examHint(q: ExamQ, pack: Pack): string {
  const m = pack.LANDMARKS.find(l => l.events.includes(q.eventId))
  if (m) return `${m.label}が、しっている`
  const ev = pack.TIMELINE.find(t => t.id === q.eventId)
  if (ev?.factId) return '暮らしの栞が、おしえてくれる'
  return 'この世のどこかで、めぐりあう'
}

export function ExamSheet({ exam, title, filled, animate, showHints, name }: {
  exam: ExamQ[]
  title: string
  filled: Set<string>
  animate?: boolean     // こたえを一問ずつ走り書きで（目覚めの場面）
  showHints?: boolean   // 未回答に誘い文を（草子の試験タブ）
  name?: boolean        // 名前欄まで書けている（目覚め・タブ側）
}) {
  const pack = getPack()
  let k = 0 // 埋まった問いの通し番号（時差表示用）
  return (
    <div className="exam-sheet">
      <div className="ex-head">
        <span className="ex-subject">社会（歴史）中間試験</span>
        <span className="ex-title">{title}</span>
      </div>
      <div className="ex-name">
        <span>二年Ｃ組</span>
        <span className={`ex-name-slot${name ? ' inked' : ''}`}>{name ? 'わたし' : ''}</span>
      </div>
      <div className="ex-qs">
        {exam.map((q, i) => {
          const ok = filled.has(q.id)
          const delay = ok ? k++ : 0
          const ev = pack.TIMELINE.find(t => t.id === q.eventId)
          return (
            <div key={q.id} className="ex-q">
              <div className="ex-qrow">
                <div className="ex-qtext"><span className="ex-no">問{i + 1}</span>{q.q}</div>
                <div className={`ex-a${ok ? ' inked' : ''}`}>
                  {ok
                    ? <span className="ex-ink" style={animate ? { animationDelay: `${0.7 + delay * 0.55}s` } : undefined}>{q.a}</span>
                    : (showHints ? <span className="ex-hint">{examHint(q, pack)}</span> : null)}
                </div>
              </div>
              {/* 埋まった問いには、年・出来事名を添えて年表へつなぐ（草子のタブ側のみ） */}
              {ok && showHints && ev && <div className="ex-src">{ev.year}年『{ev.title}』</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

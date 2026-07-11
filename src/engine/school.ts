// 現実（令和の教室）の音。すべて合成——アセット不要・容量ゼロ。
// 夢側の虫の音（ambience.ts）と対になる、現実側の音づくり。
// どれも try/catch で包み、音の出ない環境では黙って何もしない。
let ctx: AudioContext | null = null

function ensure(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch { return null }
}

// 学校のチャイム（キンコンカンコーン×2句）。ウェストミンスターの四音。
export function schoolChime() {
  const c = ensure()
  if (!c) return
  try {
    // ミ・ド・レ・ソ ／ ソ・レ・ミ・ド（4C=262Hz あたり）
    const seq = [330, 262, 294, 196, 196, 294, 330, 262]
    seq.forEach((f, i) => {
      const t0 = c.currentTime + i * 0.62
      for (const [mult, vol] of [[1, 0.05], [2, 0.018], [3, 0.008]] as const) {
        const osc = c.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = f * mult
        const env = c.createGain()
        env.gain.setValueAtTime(0, t0)
        env.gain.linearRampToValueAtTime(vol, t0 + 0.02)
        env.gain.exponentialRampToValueAtTime(0.0004, t0 + 1.7)
        osc.connect(env); env.connect(c.destination)
        osc.start(t0); osc.stop(t0 + 1.8)
      }
    })
  } catch { /* noop */ }
}

// 壁時計の秒針（1Hz の短いクリック）。slow を上げると間遠になる（寝落ちの主観時間）。
let tickTimer: number | null = null
export function clockTickStart() {
  clockTickStop()
  let interval = 1000
  const tick = () => {
    const c = ctx
    if (c && c.state === 'running') {
      try {
        const t0 = c.currentTime
        const osc = c.createOscillator()
        osc.type = 'square'
        osc.frequency.value = 2100
        const env = c.createGain()
        env.gain.setValueAtTime(0.011, t0)
        env.gain.exponentialRampToValueAtTime(0.0004, t0 + 0.03)
        osc.connect(env); env.connect(c.destination)
        osc.start(t0); osc.stop(t0 + 0.04)
      } catch { /* noop */ }
    }
    tickTimer = window.setTimeout(tick, interval)
  }
  ensure()
  tickTimer = window.setTimeout(tick, 400)
  return {
    slow(mult: number) { interval = 1000 * mult },
  }
}
export function clockTickStop() {
  if (tickTimer != null) { clearTimeout(tickTimer); tickTimer = null }
}

// 机に伏す音（低いサインの減衰、こつん）
export function deskThunk() {
  const c = ensure()
  if (!c) return
  try {
    const t0 = c.currentTime + 0.05
    const osc = c.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(130, t0)
    osc.frequency.exponentialRampToValueAtTime(52, t0 + 0.16)
    const env = c.createGain()
    env.gain.setValueAtTime(0.09, t0)
    env.gain.exponentialRampToValueAtTime(0.0006, t0 + 0.34)
    osc.connect(env); env.connect(c.destination)
    osc.start(t0); osc.stop(t0 + 0.4)
  } catch { /* noop */ }
}

// ペンの走り書き（答案が埋まる瞬間の、みじかい擦過音）
export function penScratch() {
  const c = ensure()
  if (!c) return
  try {
    const t0 = c.currentTime
    const len = 0.14
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * len), c.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
    const src = c.createBufferSource()
    src.buffer = buf
    const filt = c.createBiquadFilter()
    filt.type = 'bandpass'
    filt.frequency.value = 3600
    filt.Q.value = 1.2
    const env = c.createGain()
    env.gain.value = 0.05
    src.connect(filt); filt.connect(env); env.connect(c.destination)
    src.start(t0)
  } catch { /* noop */ }
}

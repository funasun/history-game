// 夕暮れからの虫の音（合成・極小音量）
let started = false
let ctx: AudioContext | null = null

export function initAmbience(isActive: () => boolean) {
  if (started) return
  started = true

  const ensure = () => {
    try {
      if (!ctx) ctx = new AudioContext()
      if (ctx.state === 'suspended') void ctx.resume()
    } catch { /* 音が出ない環境は無音でよい */ }
  }
  window.addEventListener('pointerdown', ensure)

  pluckCtx = () => { ensure(); return ctx }

  const chirp = () => {
    if (ctx && ctx.state === 'running' && isActive()) {
      try {
        const t0 = ctx.currentTime
        const osc = ctx.createOscillator()
        osc.type = 'triangle'
        osc.frequency.value = 4200 + Math.random() * 500

        const trem = ctx.createGain()
        trem.gain.value = 0.5
        const lfo = ctx.createOscillator()
        lfo.frequency.value = 22 + Math.random() * 6
        const lfoGain = ctx.createGain()
        lfoGain.gain.value = 0.5
        lfo.connect(lfoGain)
        lfoGain.connect(trem.gain)

        const env = ctx.createGain()
        env.gain.setValueAtTime(0, t0)
        env.gain.linearRampToValueAtTime(0.016, t0 + 0.06)
        env.gain.setValueAtTime(0.016, t0 + 0.32)
        env.gain.linearRampToValueAtTime(0, t0 + 0.5)

        osc.connect(trem); trem.connect(env); env.connect(ctx.destination)
        osc.start(t0); lfo.start(t0)
        osc.stop(t0 + 0.55); lfo.stop(t0 + 0.55)
      } catch { /* noop */ }
    }
    window.setTimeout(chirp, 450 + Math.random() * 1100)
  }
  window.setTimeout(chirp, 1200)
}

// 琴の爪弾き（平調の五音から三つ、ぽろん、と）。触れた時だけ鳴る小さな音。
let pluckCtx: (() => AudioContext | null) | null = null
const KOTO_SCALE = [220, 246.9, 293.7, 329.6, 392, 440]
export function pluck() {
  const c = pluckCtx?.()
  if (!c || c.state !== 'running') return
  try {
    const start = Math.floor(Math.random() * 3)
    for (let i = 0; i < 3; i++) {
      const t0 = c.currentTime + i * 0.22
      const osc = c.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = KOTO_SCALE[(start + i * 2) % KOTO_SCALE.length]
      const env = c.createGain()
      env.gain.setValueAtTime(0.001, t0)
      env.gain.exponentialRampToValueAtTime(0.05, t0 + 0.012)
      env.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.9)
      osc.connect(env); env.connect(c.destination)
      osc.start(t0); osc.stop(t0 + 1)
    }
  } catch { /* noop */ }
}

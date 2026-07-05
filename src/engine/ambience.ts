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

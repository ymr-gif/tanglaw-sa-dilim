/**
 * sfx.js — procedural sound effects. No assets, all Web Audio.
 *
 * The deck runs with no audio files anywhere; the one sound it needs (the
 * shot on `eff-01`) is synthesized here. Browsers gate AudioContext behind a
 * user gesture, and every beat advance is one, so the context is created
 * lazily on the first play() and resumed on every subsequent one.
 */

let audio = null;

/** Lazily create (or resume) the shared AudioContext. */
function ensure() {
  if (!audio) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audio = new AC();
  }
  if (audio.state === 'suspended') audio.resume();
  return audio;
}

/**
 * A gunshot: a sharp broadband report under a fast-decaying noise burst,
 * layered over a low-frequency thump that carries the weight.
 */
export function gunshot() {
  const ctx = ensure();
  if (!ctx) return;

  const t = ctx.currentTime;

  // The report — dense white noise, brutal attack, gone in ~0.9s.
  const duration = 0.9;
  const noise = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.playbackRate.setValueAtTime(0.7, t);

  // Shape the burst: instant attack, fast exponential decay.
  const burstGain = ctx.createGain();
  burstGain.gain.setValueAtTime(1.0, t);
  burstGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  const reportLow = ctx.createBiquadFilter();
  reportLow.type = 'lowpass';
  reportLow.frequency.setValueAtTime(1200, t);
  reportLow.frequency.exponentialRampToValueAtTime(200, t + duration);

  src.connect(reportLow).connect(burstGain).connect(ctx.destination);
  src.start(t);
  src.stop(t + duration);

  // The thump — a low sine that carries the physical weight, ~0.35s.
  const thump = ctx.createOscillator();
  thump.type = 'sine';
  thump.frequency.setValueAtTime(160, t);
  thump.frequency.exponentialRampToValueAtTime(45, t + 0.35);

  const thumpGain = ctx.createGain();
  thumpGain.gain.setValueAtTime(0.9, t);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

  thump.connect(thumpGain).connect(ctx.destination);
  thump.start(t);
  thump.stop(t + 0.35);
}

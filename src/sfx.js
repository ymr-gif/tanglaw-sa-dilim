/**
 * sfx.js — procedural sound effects. No assets, all Web Audio.
 *
 * The deck runs with no audio files anywhere; the one sound it needs (the
 * shot on `eff-01`) is synthesized here. Browsers gate AudioContext behind a
 * user gesture, so the context is created (and resumed) from the first
 * pointer/key interaction — see `arm()`, which deck.js and the scene deadlines
 * are guaranteed to sit inside a real gesture.
 */

let audio = null;

/**
 * Create the context on the first real user gesture. Called from the deck's
 * global pointer/key handlers, and again from every scene playback, so an
 * AudioContext exists long before the shot and is never created mid-frame.
 * Safe to call repeatedly.
 */
export function arm() {
  if (!audio) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audio = new AC();
  }
  if (audio.state === 'suspended') audio.resume();
}

/**
 * A gunshot: a sharp broadband report under a fast-decaying noise burst,
 * layered over a low-frequency thump that carries the weight. Created to be
 * unmistakable in a quiet, live room — this is the loudest moment in the deck.
 */
export function gunshot() {
  arm();
  if (!audio || audio.state !== 'running') return;

  const ctx = audio;
  const t = ctx.currentTime;

  const play = (source, out, stopAt) => {
    source.connect(out).connect(ctx.destination);
    source.start(t);
    source.stop(stopAt);
  };

  // The report — dense white noise, brutal attack, gone in under a second.
  const duration = 0.8;
  const noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.playbackRate.setValueAtTime(0.6, t);

  const burstGain = ctx.createGain();
  // Pushed above unity; the report is the crack of the shot.
  burstGain.gain.setValueAtTime(1.4, t);
  burstGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  const reportLow = ctx.createBiquadFilter();
  reportLow.type = 'lowpass';
  reportLow.frequency.setValueAtTime(1600, t);
  reportLow.frequency.exponentialRampToValueAtTime(180, t + duration);
  reportLow.Q.value = 1.2;

  reportLow.connect(burstGain);
  play(src, reportLow, t + duration);

  // The body — a low sine carrying the physical weight, ~0.4s.
  const thump = ctx.createOscillator();
  thump.type = 'sine';
  thump.frequency.setValueAtTime(150, t);
  thump.frequency.exponentialRampToValueAtTime(42, t + 0.4);

  const thumpGain = ctx.createGain();
  thumpGain.gain.setValueAtTime(1.1, t);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

  thump.connect(thumpGain);
  play(thump, thumpGain, t + 0.4);
}

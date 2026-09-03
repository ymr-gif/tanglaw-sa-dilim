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
let master = null;

/**
 * Everything runs through one master gain so the whole mix can be pushed past
 * normal room level in one place. Tuned for a live presentation room —
 * 2026-09-03. The gunshot is the loudest moment in the deck and the operator
 * and both speakers stand well back from any speakers, so the master sits
 * comfortably above unity; per-sound gains below still keep the balance
 * (shot > splat > wind).
 */
const MASTER = 2.2;

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
    master = audio.createGain();
    master.gain.value = MASTER;
    master.connect(audio.destination);
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
    source.connect(out).connect(master);
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
  burstGain.gain.setValueAtTime(1.55, t);
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

/**
 * A wet splat — the blood bursting against the frame on `eff-02`. Wet and
 * splashy (band-passed noise, a rising whistle on impact) where the gunshot
 * was dry and low. Shorter and faster than the shot; the impact is sudden.
 */
export function waterSplat() {
  arm();
  if (!audio || audio.state !== 'running') return;

  const ctx = audio;
  const t = ctx.currentTime;

  const play = (source, out, stopAt) => {
    source.connect(out).connect(master);
    source.start(t);
    source.stop(stopAt);
  };

  // The splash — dense noise with a band-pass that sweeps down, reading wet.
  const duration = 0.4;
  const noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.playbackRate.setValueAtTime(1.1, t);

  const splashGain = ctx.createGain();
  splashGain.gain.setValueAtTime(1.15, t);
  splashGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  const wet = ctx.createBiquadFilter();
  wet.type = 'bandpass';
  wet.frequency.setValueAtTime(2400, t);
  wet.frequency.exponentialRampToValueAtTime(400, t + duration);
  wet.Q.value = 1.6;

  wet.connect(splashGain);
  play(src, wet, t + duration);

  // The whistle — a short rising tone on impact, the squeeze of liquid out.
  const whine = ctx.createOscillator();
  whine.type = 'sine';
  whine.frequency.setValueAtTime(300, t);
  whine.frequency.exponentialRampToValueAtTime(1200, t + 0.15);

  const whineGain = ctx.createGain();
  whineGain.gain.setValueAtTime(0.12, t);
  whineGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

  whine.connect(whineGain);
  play(whine, whineGain, t + 0.2);
}

/**
 * A seamless, looping wind — the bullet tearing through the air on `eff-01`'s
 * tracking shot, which holds indefinitely. A broad band-passed noise with no
 * attack or release: it just is, then stops when the beat leaves.
 *
 * The loop is made click-free by crossfading the buffer's head into its tail,
 * so the last samples equal the first and the jump from the end back to the
 * start is continuous. Returns a handle for the caller to `stop()`.
 */
export function windWoosh() {
  arm();
  if (!audio || audio.state !== 'running') return null;

  const ctx = audio;

  const seconds = 2;
  const total = Math.ceil(ctx.sampleRate * seconds);
  const xf = Math.ceil(ctx.sampleRate * 0.25); // 250ms crossfade at the seam
  const noise = ctx.createBuffer(1, total, ctx.sampleRate);
  const data = noise.getChannelData(0);

  for (let i = 0; i < total; i++) data[i] = Math.random() * 2 - 1;

  // Equal-power head/tail crossfade so the loop never clicks.
  for (let i = 0; i < xf; i++) {
    const f = i / xf;
    data[i] = data[i] * f + data[total - xf + i] * (1 - f);
  }
  for (let i = 0; i < xf; i++) data[total - xf + i] = data[i];

  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  src.playbackRate.value = 1;

  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.gain.setValueAtTime(0.0, ctx.currentTime);

  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 900;
  band.Q.value = 0.8;

  const taper = ctx.createBiquadFilter();
  taper.type = 'lowpass';
  taper.frequency.value = 1400;

  band.connect(taper).connect(gain).connect(master);

  src.connect(band);
  src.start();

  // Reach full level smoothly after start so there is no initial pop. Raised
  // 2026-09-03 so the tracking-shot wind registers across a live room too.
  gain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 0.15);

  return {
    stop() {
      try {
        const t = ctx.currentTime;
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(gain.gain.value, t);
        gain.gain.linearRampToValueAtTime(0.0001, t + 0.15);
        src.stop(t + 0.2);
      } catch {
        src.stop();
      }
    },
  };
}

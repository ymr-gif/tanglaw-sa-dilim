/**
 * noise.js — the reason nothing in this deck is ever perfectly still.
 *
 * "Never let a scene sit perfectly still. Even at rest, run a slow noise
 *  offset. A frozen 3D scene reads as a crash to an audience." (CONTEXT.md §7)
 *
 * Two products:
 *   drift — a slow, stable, per-point wobble, applied at every beat forever.
 *   curl  — a stable per-point pseudo-random direction, so the shatter has
 *           structure instead of looking like a uniform expanding balloon.
 *
 * Both are precomputed once. Per frame we only read, never allocate.
 */

/** Mulberry32. Deterministic, so the mask looks identical on every machine. */
export function seededRandom(seed = 0x9e3779b9) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createNoise(count, seed = 20260901) {
  const rand = seededRandom(seed);

  // Drift: three phases and three speeds per point, so no two points share a
  // rhythm and the field never pulses in unison.
  const phase = new Float32Array(count * 3);
  const speed = new Float32Array(count * 3);
  const amp = new Float32Array(count * 3);

  // Curl: a stable unit-ish vector per point, biased outward-random.
  const curl = new Float32Array(count * 3);

  // A general-purpose stable random per point, for staggering and jitter.
  const rolls = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    for (let k = 0; k < 3; k++) {
      phase[i3 + k] = rand() * Math.PI * 2;
      // Slow. 0.08–0.34 rad/s reads as breathing, not vibration.
      speed[i3 + k] = 0.08 + rand() * 0.26;
      amp[i3 + k] = 0.5 + rand() * 0.5;
    }

    // Random direction on a sphere, flattened in z so the field stays readable
    // from a fixed camera.
    const theta = rand() * Math.PI * 2;
    const z = rand() * 2 - 1;
    const r = Math.sqrt(Math.max(0, 1 - z * z));
    curl[i3] = Math.cos(theta) * r;
    curl[i3 + 1] = Math.sin(theta) * r;
    curl[i3 + 2] = z * 0.35;

    rolls[i] = rand();
  }

  return {
    count,
    phase,
    speed,
    amp,
    curl,
    rolls,

    /**
     * Writes the drift offset for point `i` at `time` into out[0..2].
     * `scale` is the per-scene amplitude — cold open drifts far more than a
     * held mask does.
     */
    drift(i, time, scale, out) {
      const i3 = i * 3;
      out[0] = Math.sin(time * speed[i3] + phase[i3]) * amp[i3] * scale;
      out[1] = Math.sin(time * speed[i3 + 1] + phase[i3 + 1]) * amp[i3 + 1] * scale;
      out[2] = Math.sin(time * speed[i3 + 2] + phase[i3 + 2]) * amp[i3 + 2] * scale * 0.6;
    },

    /** Stable pseudo-random unit vector for point `i`. */
    curlAt(i, out) {
      const i3 = i * 3;
      out[0] = curl[i3];
      out[1] = curl[i3 + 1];
      out[2] = curl[i3 + 2];
      return out;
    },

    /** Stable 0..1 roll for point `i` — used for stagger and per-point jitter. */
    roll(i) {
      return rolls[i];
    },
  };
}

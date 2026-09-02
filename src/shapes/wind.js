/**
 * wind.js — the bullet, its vapour cone, and the wind field that sells flight.
 *
 * The camera is locked to the bullet, so the bullet sits near centre-frame and
 * the WORLD streaks past it. Nothing here moves the camera; `eff-01` is a
 * tracking shot in the sense that the subject is stationary and everything
 * else is not.
 *
 * STREAKS ARE MADE OF POINTS. `PointsMaterial` cannot stretch a point into a
 * line, so each streak is a short chain of points spaced along x that travel
 * together. At speed the chain reads as one streak. That is why the wind reuses
 * the existing 17000-point budget instead of adding a second object — the point
 * count is fixed for the life of the deck and every state is the same length.
 *
 * DEPTH PARALLAX IS WHAT SELLS SPEED. Uniform speed reads as a texture
 * scrolling; varied speed reads as flight. Streaks near the camera run several
 * times faster than distant ones.
 *
 *   NOTE, because it looks like a typo and is not: the plan's formula was
 *   `speed = 1.4 + (0.5 - z) * 1.9`, which gives DISTANT streaks the higher
 *   speed. With the camera at z ~ 2.9 looking down -z, that is parallax
 *   backwards — in screen space the far streaks would outrun the near ones by
 *   about 2:1. The sign is flipped here, which puts the ratio at about 7:1 the
 *   right way round.
 */

import { POINTS } from '../theme.js';
import { seededRandom } from '../noise.js';

/** Roles, so one buffer can carry three different things. */
export const BULLET = 0;
export const VAPOUR = 1;
export const WIND = 2;

const BULLET_POINTS = 1500;
const VAPOUR_POINTS = 600;

/** Points per streak. Six to eight: fewer breaks up, more reads as a bar. */
const CHAIN = 7;

/**
 * Spacing along the chain. This has to be under the rendered point size or the
 * chain reads as a row of dots rather than as one streak — which is exactly
 * what 0.035 did. At 0.016 the sprites overlap and the streak closes up.
 */
const CHAIN_GAP = 0.016;

/** The field the wind occupies, in world units. */
const SPAN_X = 2.4;
const SPAN_Y = 1.3;
const Z_NEAR = 0.5;
const Z_FAR = -1.6;

/** Past this a streak has left the frame and is re-seeded at the right edge. */
const RECYCLE_X = -2.6;

/** Where the bullet sits. Slightly left of centre — it is travelling into the
 *  frame, and dead centre reads as parked. */
const BULLET_AT = [-0.15, 0, 0];
const BULLET_LEN = 0.2;
const BULLET_R = 0.05;

/** How far the vapour trails behind the bullet, and how wide it opens. */
const VAPOUR_LEN = 0.9;
const VAPOUR_FLARE = 0.22;

function streakSpeed(z) {
  return 1.4 + (z - Z_FAR) * 1.9;
}

/**
 * @returns {{positions: Float32Array, role: Uint8Array, streakOf: Int16Array,
 *            slot: Uint8Array, head: Float32Array, speed: Float32Array,
 *            spin: Float32Array, streaks: number}}
 */
export function buildWind() {
  const rand = seededRandom(0x51ea);

  const positions = new Float32Array(POINTS * 3);
  const role = new Uint8Array(POINTS);
  const streakOf = new Int16Array(POINTS).fill(-1);
  const slot = new Uint8Array(POINTS);

  // Per bullet point: its offset from the bullet's axis, in polar form, so the
  // spin is a cheap angle add rather than a matrix per frame.
  const spin = new Float32Array(POINTS * 2);

  /* ── The bullet: a dense ogive, nose pointing right ───────────────────── */
  for (let i = 0; i < BULLET_POINTS; i++) {
    const i3 = i * 3;
    role[i] = BULLET;

    const t = rand(); // 0 tail, 1 tip
    // Cylindrical body, then an ogive nose over the last 45%.
    const profile = t < 0.55 ? 1 : Math.sqrt(Math.max(0, 1 - ((t - 0.55) / 0.45) ** 2));
    const r = BULLET_R * profile * Math.sqrt(rand());
    const a = rand() * Math.PI * 2;

    spin[i * 2] = r;
    spin[i * 2 + 1] = a;

    positions[i3] = BULLET_AT[0] + (t - 0.5) * BULLET_LEN;
    positions[i3 + 1] = BULLET_AT[1] + Math.cos(a) * r;
    positions[i3 + 2] = BULLET_AT[2] + Math.sin(a) * r;
  }

  /* ── The vapour cone: trailing the bullet, widening as it goes ────────── */
  for (let i = BULLET_POINTS; i < BULLET_POINTS + VAPOUR_POINTS; i++) {
    const i3 = i * 3;
    role[i] = VAPOUR;

    const s = rand(); // 0 at the bullet, 1 at the far end of the trail
    const r = (0.03 + s * VAPOUR_FLARE) * Math.sqrt(rand());
    const a = rand() * Math.PI * 2;

    spin[i * 2] = r;
    spin[i * 2 + 1] = a;

    positions[i3] = BULLET_AT[0] - BULLET_LEN * 0.5 - s * VAPOUR_LEN;
    positions[i3 + 1] = BULLET_AT[1] + Math.cos(a) * r;
    positions[i3 + 2] = BULLET_AT[2] + Math.sin(a) * r;
  }

  /* ── The wind: everything else, in chains ─────────────────────────────── */
  const first = BULLET_POINTS + VAPOUR_POINTS;
  const streaks = Math.floor((POINTS - first) / CHAIN);

  const head = new Float32Array(streaks * 3);
  // The seeded heads, kept so the field can be put back. The live `head` is
  // mutated every frame, and a second visit to the beat that started from
  // wherever the last visit stopped would fling every point off screen: the
  // morph target is the seeded layout, and the offset against it would be the
  // whole distance the streaks had travelled.
  const head0 = new Float32Array(streaks * 3);
  const speed = new Float32Array(streaks);

  for (let s = 0; s < streaks; s++) {
    const z = Z_FAR + rand() * (Z_NEAR - Z_FAR);
    head[s * 3] = (rand() * 2 - 1) * SPAN_X;
    head[s * 3 + 1] = (rand() * 2 - 1) * SPAN_Y;
    head[s * 3 + 2] = z;
    speed[s] = streakSpeed(z);
  }
  head0.set(head);

  for (let i = first; i < POINTS; i++) {
    const i3 = i * 3;
    role[i] = WIND;

    // The tail of the last chain, if the count did not divide evenly, joins the
    // final streak rather than being left at the origin as a bright dot.
    const k = i - first;
    const s = Math.min(streaks - 1, Math.floor(k / CHAIN));
    const n = k % CHAIN;

    streakOf[i] = s;
    slot[i] = n;

    // The chain trails BEHIND the head. The world moves -x, so behind is +x.
    positions[i3] = head[s * 3] + n * CHAIN_GAP;
    positions[i3 + 1] = head[s * 3 + 1];
    positions[i3 + 2] = head[s * 3 + 2];
  }

  return { positions, role, streakOf, slot, head, head0, speed, spin, streaks };
}

/** Put the wind back where `buildWind` seeded it. Every enter and apply. */
export function resetWind(wind) {
  wind.head.set(wind.head0);
  for (let s = 0; s < wind.streaks; s++) {
    wind.speed[s] = streakSpeed(wind.head[s * 3 + 2]);
  }
}

/**
 * One frame of flight.
 *
 * Integrated and looping, which is the same licence the lantern and ember
 * fields already run under: `eff-01` has to be safe to hold for as long as CH
 * is talking, and a state that ends cannot be.
 *
 * Everything is written into `sceneOffset` against the static base, so the
 * morph target stays exactly what `buildWind` produced and `bakeOffsets()`
 * hands the next beat the points where they visibly are.
 */
export function stepWind(field, wind, dt, time) {
  const { positions, role, streakOf, slot, head, speed, spin, streaks } = wind;
  const off = field.sceneOffset;

  const span = SPAN_X * 2;

  for (let s = 0; s < streaks; s++) {
    const s3 = s * 3;
    head[s3] -= speed[s] * dt;

    if (head[s3] < RECYCLE_X) {
      // Re-seed at the right edge with a fresh lane, so the field never repeats
      // a pattern the eye can lock on to across a 90-second hold.
      head[s3] += span + Math.random() * 0.6;
      head[s3 + 1] = (Math.random() * 2 - 1) * SPAN_Y;
      const z = Z_FAR + Math.random() * (Z_NEAR - Z_FAR);
      head[s3 + 2] = z;
      speed[s] = streakSpeed(z);
    }
  }

  // The bullet turns on its long axis and wanders a little. Both are pure
  // functions of absolute time, so a jump into this beat lands mid-flight
  // rather than at a start position that would be visible as a hitch.
  const roll = time * 0.9;
  const wobbleY = Math.sin(time * 1.7) * 0.012;
  const wobbleZ = Math.cos(time * 1.3) * 0.012;

  for (let i = 0; i < POINTS; i++) {
    const i3 = i * 3;

    if (role[i] === WIND) {
      const s3 = streakOf[i] * 3;
      off[i3] = head[s3] + slot[i] * CHAIN_GAP - positions[i3];
      off[i3 + 1] = head[s3 + 1] - positions[i3 + 1];
      off[i3 + 2] = head[s3 + 2] - positions[i3 + 2];
      continue;
    }

    const r = spin[i * 2];
    const a = spin[i * 2 + 1] + roll;

    off[i3] = 0;
    off[i3 + 1] = BULLET_AT[1] + Math.cos(a) * r + wobbleY - positions[i3 + 1];
    off[i3 + 2] = BULLET_AT[2] + Math.sin(a) * r + wobbleZ - positions[i3 + 2];
  }
}

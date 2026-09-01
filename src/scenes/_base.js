/**
 * _base.js — the scene contract, and the colour helpers every scene shares.
 *
 * THE CONTRACT (CONTEXT.md §5)
 *
 *   mount(ctx)           build/claim what the scene needs
 *   enter(state, ctx)    animate to this state
 *   apply(state, ctx)    snap to this state, no animation
 *   unmount(ctx)         release
 *
 * `apply()` is the half everyone skips. Write it at the same time as `enter()`
 * or it will never get written. It buys mis-click recovery, section jumping,
 * and interruption — the three things that decide whether a live deck survives
 * a mistake.
 *
 * A scene's `state` is always SELF-DESCRIBING. `{shard: 2}` means shards 0, 1
 * and 2 are lit — not "light one more". Nothing accumulates in scene-local
 * variables, which is exactly why apply() can be called out of order and still
 * be correct.
 *
 * Scenes never own the renderer, and never create geometry. There is one
 * THREE.Points for the whole presentation and they write target buffers for it.
 */

import { Color } from 'three';
import { POINTS } from '../theme.js';

const scratch = new Color();

/** Hex (sRGB) -> linear rgb triplet, optionally dimmed. */
export function rgbOf(hex, intensity = 1) {
  scratch.setHex(hex);
  return [scratch.r * intensity, scratch.g * intensity, scratch.b * intensity];
}

/** Every point one colour. */
export function solid(hex, intensity = 1) {
  const [r, g, b] = rgbOf(hex, intensity);
  const out = new Float32Array(POINTS * 3);
  for (let i = 0; i < POINTS; i++) {
    out[i * 3] = r;
    out[i * 3 + 1] = g;
    out[i * 3 + 2] = b;
  }
  return out;
}

/**
 * One colour per shard.
 *
 * @param {Uint8Array} shardOf   per-point shard index
 * @param {Array<[number, number]>} table  [hex, intensity] for shards 0..3
 */
export function byShard(shardOf, table) {
  const rgb = table.map(([hex, intensity = 1]) => rgbOf(hex, intensity));
  const out = new Float32Array(POINTS * 3);

  for (let i = 0; i < POINTS; i++) {
    const c = rgb[shardOf[i]];
    out[i * 3] = c[0];
    out[i * 3 + 1] = c[1];
    out[i * 3 + 2] = c[2];
  }
  return out;
}

/**
 * Stagger a colour transition by shard.
 *
 * "Never let multiple elements appear simultaneously. ~200ms apart reads as
 *  choreographed instead of clunky." (§7)
 *
 * @param {Float32Array} colDelay  the field's per-point colour delay buffer
 * @param {Uint8Array} shardOf
 * @param {number[]} perShard      delay in 0..1 for shards 0..3
 */
export function staggerByShard(colDelay, shardOf, perShard) {
  for (let i = 0; i < POINTS; i++) {
    colDelay[i] = perShard[shardOf[i]] ?? 0;
  }
}

/** Clear both delay buffers. Scenes that do not stagger must still reset. */
export function clearDelays(field) {
  field.posDelay.fill(0);
  field.colDelay.fill(0);
}

/**
 * Delay expressed as a fraction of a total duration, which is how the deck
 * thinks about stagger: "200ms into a 1400ms transition".
 */
export function delayFraction(ms, totalMs) {
  if (totalMs <= 0) return 0;
  return Math.min(0.92, Math.max(0, ms / totalMs));
}

/**
 * Bend a morph into an arc.
 *
 * Writes a tangential offset shaped like sin(pi*t), so it is zero at both ends
 * and largest in the middle: the points sweep around the mask's centre and
 * still arrive exactly where the morph was taking them. Nothing about the
 * destination changes, only the route.
 *
 * Call it from a per-frame hook while a morph is running.
 */
export function swirl(field, amount) {
  const t = field.posProgress;
  const arc = Math.sin(Math.PI * Math.min(1, Math.max(0, t))) * amount;

  if (arc < 0.0005) {
    field.sceneOffset.fill(0);
    return;
  }

  const cos = Math.cos(arc);
  const sin = Math.sin(arc);
  const { sceneOffset, points } = field;
  const pos = points.geometry.attributes.position.array;

  for (let i = 0; i < POINTS; i++) {
    const i3 = i * 3;
    // Rotate about the centre, and offset by the difference so the underlying
    // morph target is untouched.
    const x = pos[i3] - sceneOffset[i3];
    const y = pos[i3 + 1] - sceneOffset[i3 + 1];

    sceneOffset[i3] = x * cos - y * sin - x;
    sceneOffset[i3 + 1] = x * sin + y * cos - y;
  }
}

/**
 * A brief overshoot in brightness that decays back to rest.
 *
 * Light arriving instantly at its final value reads as a value change. Light
 * that overshoots and settles reads as something igniting — which is the whole
 * subject of this deck.
 *
 * Returns a per-frame step function; call it until it reports done.
 */
export function createFlare({ peak = 1.9, ms = 620 } = {}) {
  let t = 0;
  let mask = null;

  return {
    trigger(selector) {
      t = 1;
      mask = selector;
    },
    /** @returns {boolean} true while still flaring */
    step(field, dt) {
      if (t <= 0) return false;

      t = Math.max(0, t - (dt * 1000) / ms);
      const lift = 1 + (peak - 1) * t * t;

      for (let i = 0; i < POINTS; i++) {
        field.brightness[i] = mask && !mask(i) ? 1 : lift;
      }
      return t > 0;
    },
    reset(field) {
      t = 0;
      field.brightness.fill(1);
    },
  };
}

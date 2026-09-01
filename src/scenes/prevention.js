/**
 * prevention.js — beats 14-18. The turn. Festival colour enters the deck here.
 *
 * STRUCTURAL MIRROR OF roots.js. The same four shards, in the same four
 * positions, in the same order. The mouth that was "to be seen" is the mouth
 * that becomes REDESIGN. Never say this out loud; the geometry says it (§3).
 *
 * THIS FILE IS WHERE THE COLOUR RULE TURNS (§3). Everything before it is
 * near-monochrome. From prev-01 on, festival hues are allowed — as light,
 * never as flat fill, one per solution:
 *
 *   magenta  CAPACITATE  guidance counselors
 *   marigold TRAIN       teacher training
 *   cyan     REDESIGN    classroom redesign
 *   jade     EMPOWER     peer networks / CPCs
 *
 * LIGHTING IS NOT SEATING. Each shard's colour returns here and shards 0-2 sink
 * home, but shard 3 — the piece that was foreign — lights jade and stays out of
 * place. Its slot is the gap the refusal holds, and it seats only at close-01.
 * That is why close-01 is the first moment all four hues are lit at once.
 *
 * "Prevention convergence is staggered on purpose. Lights return one at a time.
 *  That *is* the 'early intervention' beat, visually." (§7)
 */

import { COLOR, TIME } from '../theme.js';
import { POINTS } from '../theme.js';
import { byShard, clearDelays } from './_base.js';

const UNLIT = [COLOR.ash, 5.0];

/** Partial, not full. The deck saves full brightness for the close. */
export const PARTIAL = 0.95;

/** The four festival hues, in shard order. Same order as roots.js. */
export const FESTIVAL = [
  [COLOR.magenta, PARTIAL], // 0 CAPACITATE — was bullying
  [COLOR.marigold, PARTIAL], // 1 TRAIN — was untreated
  [COLOR.cyan, PARTIAL], // 2 REDESIGN — was to be seen
  [COLOR.jade, PARTIAL], // 3 EMPOWER — was weaponized
];

const colorCache = new Map();
const geoCache = new Map();

/** Exported so refusal.js can hold *exactly* the state Prevention ended on. */
export function colorsFor(shardOf, lit) {
  if (colorCache.has(lit)) return colorCache.get(lit);

  const table = FESTIVAL.map((entry, s) => (s <= lit ? entry : UNLIT));
  const buf = byShard(shardOf, table);
  colorCache.set(lit, buf);
  return buf;
}

/**
 * Geometry for a given number of lit shards: a lit shard sinks home, an unlit
 * one stays adrift — and shard 3 stays adrift no matter what, because lighting
 * it is not the same as seating it.
 */
export function geometryFor(mask, lit) {
  if (geoCache.has(lit)) return geoCache.get(lit);

  const { converged, complete } = mask.states;
  const out = new Float32Array(POINTS * 3);

  for (let i = 0; i < POINTS; i++) {
    const i3 = i * 3;
    const s = mask.shardOf[i];
    const seated = s <= lit && s !== 3;
    const src = seated ? complete : converged;

    out[i3] = src[i3];
    out[i3 + 1] = src[i3 + 1];
    out[i3 + 2] = src[i3 + 2];
  }

  geoCache.set(lit, out);
  return out;
}

export default {
  mount(ctx) {
    clearDelays(ctx.field);
    ctx.field.setDrift(0.009);
  },

  enter(state, ctx) {
    const { field, mask } = ctx;
    const lit = state.shard ?? -1;

    field.morph(geometryFor(mask, lit), {
      duration: TIME.converge,
      ease: 'outExpo',
    });

    // The light returning one shard at a time IS the early-intervention beat.
    // The newest shard leads; the ones already lit are already at their target,
    // so the stagger only ever reads on the shard that is actually changing.
    for (let i = 0; i < field.colDelay.length; i++) {
      const s = mask.shardOf[i];
      field.colDelay[i] = s === lit ? 0 : 0.18;
    }

    field.morphColor(colorsFor(mask.shardOf, lit), {
      duration: TIME.shardLight,
      ease: 'outCubic',
    });
  },

  apply(state, ctx) {
    const { field, mask } = ctx;
    const lit = state.shard ?? -1;

    clearDelays(field);
    field.setDrift(0.009);
    field.snap(geometryFor(mask, lit), colorsFor(mask.shardOf, lit));
  },

  unmount(ctx) {
    ctx.field.resetSceneMods();
  },
};

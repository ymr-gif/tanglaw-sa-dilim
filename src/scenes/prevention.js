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
 * Each shard's colour returns here, and each shard sinks home as it lights —
 * shard 3 included. Until 2026-09-03, shard 3 lit jade at prev-04 but stayed
 * out of place regardless, seating only at close-01 ("lighting is not
 * seating"); EMPOWER now seats the same beat it lights. `ref-01` reuses
 * `geometryFor`/`colorsFor`, so Refusal now opens on the whole mask rather
 * than the near-whole mask with one gap it used to hold — see refusal.js.
 *
 * "Prevention convergence is staggered on purpose. Lights return one at a time.
 *  That *is* the 'early intervention' beat, visually." (§7)
 */

import { COLOR, TIME } from '../theme.js';
import { BROKEN } from '../mask.js';
import { byShard, clearDelays, createFlare } from './_base.js';

const UNLIT = [COLOR.ash, 5.0];

/**
 * Partial, not full — the deck still saves its brightest frame for the close.
 * But "partial" here is a long way above where the darkness sat: this is the
 * first light in the piece and it has to feel like it.
 */
export const PARTIAL = 1.5;

/** The four festival hues, in shard order. Same order as roots.js. */
export const FESTIVAL = [
  [COLOR.rose, PARTIAL], // 0 CAPACITATE — was bullying
  [COLOR.ember, PARTIAL], // 1 TRAIN — was untreated
  [COLOR.gold, PARTIAL], // 2 REDESIGN — was to be seen
  [COLOR.fuchsia, PARTIAL], // 3 EMPOWER — was weaponized
];

const colorCache = new Map();
const geoCache = new Map();

const flare = createFlare({ peak: 2.05, ms: 700 });

/** Exported so refusal.js can hold *exactly* the state Prevention ended on. */
export function colorsFor(shardOf, lit) {
  if (colorCache.has(lit)) return colorCache.get(lit);

  const table = FESTIVAL.map((entry, s) => (s <= lit ? entry : UNLIT));
  const buf = byShard(shardOf, table);
  colorCache.set(lit, buf);
  return buf;
}

/**
 * Geometry for a given number of lit shards.
 *
 * Each shard that has been reached flies HOME — from where it broke to, all the
 * way into place. The ones that have not stay exactly where the break left
 * them. That is the whole visual argument of the section: one repair at a time,
 * and you can see each piece arrive.
 *
 * Shard 3 used to be an exception here, staying out of place through all of
 * Prevention and seating only at close-01 ("lighting is not seating"). That
 * held from 2026-09-02 to 2026-09-03: EMPOWER now seats at prev-04 same as
 * the other three. `ref-01` reuses this function for its own hold state, so
 * Refusal now opens on the whole mask rather than the near-whole mask with
 * one gap — see the note on `ref-01` in refusal.js.
 */
export function geometryFor(mask, lit) {
  if (geoCache.has(lit)) return geoCache.get(lit);

  const k = [BROKEN, BROKEN, BROKEN, BROKEN];
  for (let s = 0; s <= lit; s++) k[s] = 0;

  const out = mask.shardState(k);
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

    // The shard that just lit overshoots before settling, so light arriving
    // reads as something igniting rather than as a value being assigned.
    //
    // There is deliberately NO global swirl here any more. Rotating the whole
    // field about its centre swung the entire mask as one object — the opposite
    // of the read this section needs, which is pieces returning to a face that
    // is standing still.
    if (lit >= 0) flare.trigger((i) => mask.shardOf[i] === lit);
    else flare.reset(field);

    field.setUpdate((dt) => flare.step(field, dt));

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
    field.setUpdate(null);
    flare.reset(field);
    field.sceneOffset.fill(0);
    field.snap(geometryFor(mask, lit), colorsFor(mask.shardOf, lit));
  },

  unmount(ctx) {
    flare.reset(ctx.field);
    ctx.field.resetSceneMods();
  },
};

/**
 * roots.js — beats 5-9. The mask breaks apart, one shard per beat.
 *
 * THE VICE VERSA OF PREVENTION. Four shards, the same four positions, the same
 * order. Prevention repairs the mask one shard at a time and lights it up;
 * Roots breaks it apart one shard at a time and dims each piece as it goes —
 * crimes before cures, and never stated aloud, because the geometry says it
 * (§3). If you change a shard's meaning here, you must change it there.
 *
 *   roots-00  a hairline crack opens across the whole face — the mask is still
 *             together, but it is coming apart.
 *   roots-01  shard 0 pulls out and dims (bullying).
 *   roots-02  shard 1 pulls out and dims (untreated).
 *   roots-03  shard 2 pulls out and dims (to be seen).
 *   roots-04  shard 3 pulls out and dims (weaponized) — the mask is fully in
 *             pieces, and Effects takes the broken shards from here.
 *
 * COLOUR: seated shards keep the mask's ash face; a shard that breaks dims
 * toward the void, the inverse of Prevention lighting up. Each broken shard
 * keeps a faint trace of its own hue so the four identities and the intruder
 * survive the fade — these are hues held back, not festival colour arriving
 * early (§3).
 */

import { COLOR, DIM, TIME } from '../theme.js';
import { byShard, clearDelays } from './_base.js';

/** The crack opened at roots-00 — pieces mostly together, but parting. */
const HAIRLINE = 0.3;
/** A shard the speaker has named pulls fully out of the face. */
const BROKEN = 1;

/** Still-whole shards keep the mask's ash face. */
const SEATED = [COLOR.ash, 7.2];
/** Broken shards, dimmed toward the void. Faint identity, big descent. */
const DARK = [
  [DIM.violet, 2.2], // 0 cracked cheek — bullying
  [DIM.blue, 2.4], // 1 hollow eye — untreated
  [DIM.gold, 2.0], // 2 mouth, too wide — to be seen
  [DIM.intruder, 1.3], // 3 foreign fragment — weaponized
];

const geoCache = new Map();
const colorCache = new Map();

/** `named` is the highest shard pulled out: 0..named broken, rest hairline. */
function breakState(mask, named) {
  if (geoCache.has(named)) return geoCache.get(named);
  const k = [HAIRLINE, HAIRLINE, HAIRLINE, HAIRLINE];
  for (let s = 0; s <= named; s++) k[s] = BROKEN;
  const out = mask.shardState(k);
  geoCache.set(named, out);
  return out;
}

/** Shards 0..named dimmed toward the void; the rest keep the ash face. */
function colorsFor(shardOf, named) {
  if (colorCache.has(named)) return colorCache.get(named);
  const table = DARK.map((entry, s) => (s <= named ? entry : SEATED));
  const out = byShard(shardOf, table);
  colorCache.set(named, out);
  return out;
}

export default {
  mount(ctx) {
    clearDelays(ctx.field);
    ctx.field.setDrift(0.009);
  },

  enter(state, ctx) {
    const { field, mask } = ctx;
    const named = state.shard ?? -1;

    // The named shard leaves first; the rest hold still. Shards still seated
    // barely move, so the eye always lands on the one coming away.
    for (let i = 0; i < field.posDelay.length; i++) {
      field.posDelay[i] = named >= 0 && mask.shardOf[i] === named ? 0 : 0.18;
    }

    field.morph(breakState(mask, named), { duration: TIME.fracture, ease: 'outExpo' });
    field.morphColor(colorsFor(mask.shardOf, named), {
      duration: TIME.shardLight,
      ease: 'outCubic',
    });
  },

  apply(state, ctx) {
    const { field, mask } = ctx;
    const named = state.shard ?? -1;

    clearDelays(field);
    field.setDrift(0.009);
    field.snap(breakState(mask, named), colorsFor(mask.shardOf, named));
  },

  unmount(ctx) {
    ctx.field.resetSceneMods();
  },
};

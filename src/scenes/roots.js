/**
 * roots.js — beats 5-9. The mask cracks, and one shard lights per click.
 *
 * "Mask cracks on entry, all four shards dim. One lights per click."
 * (CONTEXT.md §6)
 *
 * STRUCTURAL MIRROR OF prevention.js. Four shards, the same four positions, the
 * same order. What broke it is what fixes it — and this is never stated aloud,
 * because the geometry says it (§3). If you change a shard's meaning here, you
 * must change it there.
 *
 * COLOUR: near-monochrome, always. These are greys carrying just enough hue to
 * be told apart. The one exception is shard 3, which is `intruder` green —
 * off-palette on purpose, because it is the one external force in the section.
 * No festival hue may appear anywhere in this file.
 */

import { COLOR, DIM, TIME } from '../theme.js';
import { byShard, clearDelays } from './_base.js';

const UNLIT = [COLOR.ash, 5.0];

/** The four dim tints, in shard order. Same order as prevention.js. */
const LIT = [
  [DIM.violet, 9.5], // 0 cracked cheek — bullying / discrimination
  [DIM.blue, 9.5], // 1 hollow eye — untreated mental health
  [DIM.gold, 8.5], // 2 mouth, too wide — craving to be seen
  [DIM.intruder, 3.2], // 3 foreign fragment — NVE online
];

const cache = new Map();

/** `lit` is the highest lit shard: state is self-describing, never additive. */
function colorsFor(shardOf, lit) {
  if (cache.has(lit)) return cache.get(lit);

  const table = LIT.map((entry, s) => (s <= lit ? entry : UNLIT));
  const buf = byShard(shardOf, table);
  cache.set(lit, buf);
  return buf;
}

export default {
  mount(ctx) {
    clearDelays(ctx.field);
    ctx.field.setDrift(0.009);
  },

  enter(state, ctx) {
    const { field, mask } = ctx;
    const lit = state.shard ?? -1;

    if (state.fracture) {
      // The break itself. Shards leave together but not in lockstep.
      for (let i = 0; i < field.posDelay.length; i++) {
        field.posDelay[i] = mask.shardOf[i] * 0.09;
      }
      field.morph(mask.states.fractured, { duration: TIME.fracture, ease: 'outExpo' });
    }

    field.morphColor(colorsFor(mask.shardOf, lit), {
      duration: TIME.shardLight,
      ease: 'outCubic',
    });
  },

  apply(state, ctx) {
    const { field, mask } = ctx;
    clearDelays(field);
    field.setDrift(0.009);
    field.snap(mask.states.fractured, colorsFor(mask.shardOf, state.shard ?? -1));
  },

  unmount(ctx) {
    ctx.field.resetSceneMods();
  },
};

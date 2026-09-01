/**
 * refusal.js — beats 19-20. The only full sentence the audience reads all night.
 *
 * "Mask nearly whole, one gap remaining." (CONTEXT.md §6)
 *
 * This scene deliberately holds exactly the state Prevention ended on — it
 * imports Prevention's own geometry and colour rather than rebuilding them, so
 * the two can never drift apart. Shards 0-2 are seated and lit; shard 3, the
 * piece that was foreign, is lit jade but still out of place. Its empty slot is
 * the gap, and it is the thing close-01 finally fills.
 *
 * ref-01 is the one beat in the deck where screen and voice say the same words
 * at the same time. It earns the 5-word exception by being the only one.
 *
 * ref-02 clears the caption and holds. Nothing moves but the slow drift. All
 * attention on CH — so there is nothing here for the eye to do.
 */

import { geometryFor, colorsFor } from './prevention.js';
import { clearDelays } from './_base.js';

/** How far the light pulls back for ref-02. Not dark — attention, not absence. */
const DIM_TO = 0.72;

function setDim(field, on) {
  field.brightness.fill(on ? DIM_TO : 1);
}

export default {
  mount(ctx) {
    clearDelays(ctx.field);
    ctx.field.setDrift(0.007);
  },

  enter(state, ctx) {
    const { field, mask } = ctx;

    // All four lit, shard 3 still adrift. Identical to prev-04's end state.
    field.morph(geometryFor(mask, 3), { duration: 900, ease: 'outExpo' });
    field.morphColor(colorsFor(mask.shardOf, 3), { duration: 900 });

    setDim(field, Boolean(state.dim));
  },

  apply(state, ctx) {
    const { field, mask } = ctx;
    clearDelays(field);
    field.setDrift(0.007);
    field.snap(geometryFor(mask, 3), colorsFor(mask.shardOf, 3));
    setDim(field, Boolean(state.dim));
  },

  unmount(ctx) {
    ctx.field.resetSceneMods();
  },
};

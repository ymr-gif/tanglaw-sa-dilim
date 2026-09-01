/**
 * coldopen.js — beats 1-2. No structure, no face, no colour.
 *
 * "Drift never resolves, so it can hold for any length. Voice does
 *  everything." (CONTEXT.md §6)
 *
 * The first thing the room notices is the silence after "Are you afraid of the
 * darkness?" — three full beats before the second line. Nothing here may
 * resolve into a shape during that hold, or the pause stops being empty.
 */

import { COLOR } from '../theme.js';
import { solid, clearDelays } from './_base.js';

const ASH_FAINT = solid(COLOR.ash, 5.0);
const ASH_DRIFT = solid(COLOR.ash, 7.0);

export default {
  mount(ctx) {
    clearDelays(ctx.field);
  },

  enter(state, ctx) {
    const { field, mask } = ctx;

    if (state.mode === 'void') {
      // Wide, slow, barely there. The point field must not read as anything.
      field.setDrift(0.022);
      field.morph(mask.states.void, { duration: 2600, ease: 'outExpo' });
      field.morphColor(ASH_FAINT, { duration: 2200 });
    } else {
      // Still no face — just more life in the field, so a long hold stays alive.
      field.setDrift(0.05);
      field.morph(mask.states.drift, { duration: 3200, ease: 'inOutQuad' });
      field.morphColor(ASH_DRIFT, { duration: 2400 });
    }
  },

  apply(state, ctx) {
    const { field, mask } = ctx;
    if (state.mode === 'void') {
      field.setDrift(0.022);
      field.snap(mask.states.void, ASH_FAINT);
    } else {
      field.setDrift(0.05);
      field.snap(mask.states.drift, ASH_DRIFT);
    }
  },

  unmount(ctx) {
    ctx.field.resetSceneMods();
  },
};

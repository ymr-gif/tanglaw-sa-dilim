/**
 * title.js — beat 4. First sight of the mask.
 *
 * "Outline only, unlit, hollow eyes." (CONTEXT.md §6)
 *
 * The convergence is slow on purpose: BR says the title WITH it, not before it.
 * A fast assemble finishes while the speaker is still on the first word and
 * leaves them talking at a static image.
 *
 * No colour here beyond ash. The mask the audience meets first is the one they
 * will watch break — it has to arrive cold.
 */

import { COLOR, TIME } from '../theme.js';
import { solid, clearDelays } from './_base.js';

const ASH = solid(COLOR.ash, 8.5);

export default {
  mount(ctx) {
    clearDelays(ctx.field);
  },

  enter(state, ctx) {
    const { field, mask } = ctx;

    field.setDrift(0.008);

    // Points arrive slightly apart rather than as one wall — the mask gathers
    // itself instead of switching on.
    for (let i = 0; i < field.posDelay.length; i++) {
      field.posDelay[i] = field.noise.roll(i) * 0.34;
    }

    field.morph(mask.states.assembled, { duration: TIME.assemble, ease: 'outExpo' });
    field.morphColor(ASH, { duration: TIME.assemble * 0.8 });
  },

  apply(state, ctx) {
    const { field, mask } = ctx;
    clearDelays(field);
    field.setDrift(0.008);
    field.snap(mask.states.assembled, ASH);
  },

  unmount(ctx) {
    ctx.field.resetSceneMods();
  },
};

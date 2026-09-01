/**
 * threshold.js — beat 3. The childhood door against the school corridor.
 *
 * "Two point clouds, identical silhouette, one warm and one drained. Warm side
 *  dims across CH's paragraph." (CONTEXT.md §6)
 *
 * The two clouds are the same shape by construction — mask.js splits the points
 * by index parity, so each side is the full silhouette at half density rather
 * than half a mask each. The audience reads them as the same place, twice.
 *
 * The warm side dims over ~30s and is deliberately still dimming whenever the
 * operator clicks. Nothing here is a timer that advances anything; the beat
 * ends when CH lands "darkness has settled in", not when a clock says so.
 */

import { COLOR, LAMP, TIME } from '../theme.js';
import { rgbOf, clearDelays } from './_base.js';
import { POINTS } from '../theme.js';

/** Even points are the warm side, odd points the drained side. */
function splitColors() {
  const warm = rgbOf(LAMP, 4.6);
  const cold = rgbOf(COLOR.ash, 4.4);
  const out = new Float32Array(POINTS * 3);

  for (let i = 0; i < POINTS; i++) {
    const c = i % 2 === 0 ? warm : cold;
    out[i * 3] = c[0];
    out[i * 3 + 1] = c[1];
    out[i * 3 + 2] = c[2];
  }
  return out;
}

const SPLIT_COLORS = splitColors();

/** How dim the lamp side gets. Not zero — the shape must still be there. */
const FLOOR = 0.14;

function dimWarmSide(field, progress) {
  // Ease in: the light holds, then goes. A linear fade reads as a dimmer knob;
  // this reads as something being lost.
  const k = 1 - (1 - FLOOR) * (progress * progress);
  for (let i = 0; i < POINTS; i += 2) field.brightness[i] = k;
}

export default {
  mount(ctx) {
    clearDelays(ctx.field);
  },

  enter(state, ctx) {
    const { field, mask } = ctx;
    let elapsed = 0;

    field.setDrift(0.012);
    field.brightness.fill(1);
    field.morph(mask.states.split, { duration: 2400, ease: 'outExpo' });
    field.morphColor(SPLIT_COLORS, { duration: 1800 });

    field.setUpdate((dt) => {
      elapsed = Math.min(TIME.thresholdDim, elapsed + dt * 1000);
      dimWarmSide(field, elapsed / TIME.thresholdDim);
    });
  },

  apply(state, ctx) {
    const { field, mask } = ctx;

    field.setDrift(0.012);
    field.snap(mask.states.split, SPLIT_COLORS);

    // A jump lands at the end of the dim, which is the state the beat hands to
    // the title: the warm side already gone.
    field.setUpdate(null);
    dimWarmSide(field, 1);
  },

  unmount(ctx) {
    ctx.field.resetSceneMods();
  },
};

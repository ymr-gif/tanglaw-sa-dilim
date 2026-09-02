/**
 * coldopen.js — beats 1-2. No structure, no face, no colour, and then a child.
 *
 * "Drift never resolves, so it can hold for any length. Voice does
 *  everything." (CONTEXT.md §6)
 *
 * THAT RULE STILL GOVERNS `cold-01`, AND ONLY `cold-01`. The first thing the
 * room notices is the silence after "Are you afraid of the darkness?" — three
 * full beats before the second line — and nothing may resolve into a shape
 * during that hold, or the pause stops being empty.
 *
 * `cold-02` is a deliberate change to the second beat only, made 2026-09-02
 * with the Threshold storyboard: the drifting field gathers into a student
 * standing alone. The paragraph ends on "a far more dangerous darkness clouds
 * classrooms across the Philippines", and the deck should be showing the
 * classroom's occupant by the time it lands.
 *
 * THIS IS NOT THE EFFECTS SILHOUETTE. A figure was cut from the Effects
 * sequence for being a shooting victim rendered on screen. This one is a child
 * standing alone before anything has happened to them, and it does not reopen
 * that decision.
 *
 * The gather is slow — TIME.gather, ~2.4s, outExpo — because it is the first
 * shape the deck ever resolves into and it should read as something coming
 * into focus rather than switching on.
 */

import { COLOR, THRESHOLD, TIME } from '../theme.js';
import { solid, clearDelays, reshuffle } from './_base.js';
import { STUDENT_FIGURE } from './threshold.js';

const ASH_FAINT = solid(COLOR.ash, 5.0);

/**
 * The whole field on one small figure.
 *
 * Intensity is far below the ash values elsewhere in the deck and that is
 * arithmetic, not timidity: every point in the field lands inside about a
 * twentieth of the frame, so the same per-point brightness that reads as a
 * faint drift reads as a solid glowing blob here. Density does the work;
 * intensity only has to stop it clipping.
 */
const STUDENT_LIT = solid(THRESHOLD.student, 0.42);

/*
 * The figure itself is built in threshold.js and imported, not rebuilt here.
 * That file spends the same points three ways across slide 3, and it can only
 * keep the child's quarter of them exactly where cold-02 left it if both beats
 * are reading the same buffer. See the point-budget note at its top.
 */

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
      return;
    }

    // Scattered arrival rather than one wall of points converging: the child
    // assembles out of the dark instead of being pulled out of it.
    reshuffle(field, 0.45);
    // Low, but not zero. A figure holding perfectly still for a whole
    // paragraph reads as a graphic; a breathing one reads as a person.
    field.setDrift(0.011);
    field.morph(STUDENT_FIGURE, { duration: TIME.gather, ease: 'outExpo' });
    field.morphColor(STUDENT_LIT, { duration: TIME.gather * 0.9 });
  },

  apply(state, ctx) {
    const { field, mask } = ctx;
    clearDelays(field);

    if (state.mode === 'void') {
      field.setDrift(0.022);
      field.snap(mask.states.void, ASH_FAINT);
      return;
    }

    field.setDrift(0.011);
    field.snap(STUDENT_FIGURE, STUDENT_LIT);
  },

  unmount(ctx) {
    ctx.field.resetSceneMods();
  },
};

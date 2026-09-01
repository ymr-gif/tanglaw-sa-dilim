/**
 * qna.js — the ember field. A MODE, not a beat.
 *
 * "The lantern has dispersed. The same points, now loose warm embers in slow
 *  independent orbit, drifting upward and re-seeding at the bottom, brightness
 *  breathing gently out of phase with each other. All four festival hues
 *  present but low. No caption, no mask, no structure." (CONTEXT.md §9)
 *
 * Why it works: it is unmistakably *after* the piece rather than a screensaver,
 * it carries the ending's warmth without re-asserting the argument, and it
 * holds attention loosely enough that the room looks at the person answering
 * the question instead of the screen.
 *
 * KEEP IT SLOW. Anything energetic competes with the answer being given. The
 * target is something you could watch for ten minutes without noticing a loop,
 * which is why every rate below is per-point and irrational relative to its
 * neighbours — there is no shared period for the eye to lock onto.
 */

import { COLOR } from '../theme.js';
import { POINTS } from '../theme.js';
import { rgbOf, clearDelays } from './_base.js';

/** Present, but low. The room should be looking at the speaker. */
const LOW = 1.9;

/** Vertical extent a point travels before re-seeding at the bottom. */
const SPAN = 2.0;
const TOP = 1.0;

/**
 * An ember must be invisible at the moment it wraps, or the audience sees it
 * teleport from the top of the field to the bottom. Both ends of the travel get
 * a fade, so every re-seed happens in the dark.
 *
 * This is the difference between "drifting embers" and "a loop", and it is the
 * whole reason the field survives being stared at for ten minutes.
 */
const EDGE_FADE = 0.26;

function edgeFade(y) {
  const fromTop = (TOP - y) / EDGE_FADE;
  const fromBottom = (y - (TOP - SPAN)) / EDGE_FADE;
  return Math.min(1, Math.max(0, Math.min(fromTop, fromBottom)));
}

let emberColors = null;

/** All four hues, interleaved, so no region of the field belongs to one idea. */
function colors() {
  if (emberColors) return emberColors;

  const hues = [
    rgbOf(COLOR.rose, LOW),
    rgbOf(COLOR.ember, LOW),
    rgbOf(COLOR.gold, LOW),
    rgbOf(COLOR.fuchsia, LOW),
  ];

  emberColors = new Float32Array(POINTS * 3);
  for (let i = 0; i < POINTS; i++) {
    const c = hues[i % 4];
    emberColors[i * 3] = c[0];
    emberColors[i * 3 + 1] = c[1];
    emberColors[i * 3 + 2] = c[2];
  }
  return emberColors;
}

function orbit(field, mask, dt, time) {
  const { sceneOffset, brightness, noise } = field;
  const base = mask.states.embers;

  for (let i = 0; i < POINTS; i++) {
    const i3 = i * 3;
    const roll = noise.roll(i);

    // Slow rise. The fastest ember takes roughly half a minute to cross.
    let y = sceneOffset[i3 + 1] + (0.028 + roll * 0.045) * dt;
    if (base[i3 + 1] + y > TOP) y -= SPAN;
    sceneOffset[i3 + 1] = y;

    // Independent orbit — a small circle, at its own rate, from its own phase.
    const rate = 0.12 + roll * 0.22;
    const phase = roll * Math.PI * 2;
    sceneOffset[i3] = Math.sin(time * rate + phase) * (0.05 + roll * 0.07);
    sceneOffset[i3 + 2] = Math.cos(time * rate * 0.7 + phase) * 0.05;

    // Breathing, out of phase with every neighbour, and dark at both ends of
    // the climb so the re-seed is never seen.
    const breathe = 0.5 + 0.5 * Math.sin(time * (0.18 + roll * 0.3) + phase);
    brightness[i] = (0.3 + 0.7 * breathe) * edgeFade(base[i3 + 1] + y);
  }
}

export default {
  mount(ctx) {
    clearDelays(ctx.field);
  },

  enter(state, ctx) {
    const { field, mask } = ctx;

    field.setDrift(0.012);
    field.morph(mask.states.embers, { duration: 2600, ease: 'inOutQuad' });
    field.morphColor(colors(), { duration: 2200 });
    field.setUpdate((dt, time) => orbit(field, mask, dt, time));
  },

  apply(state, ctx) {
    const { field, mask } = ctx;

    field.setDrift(0.012);
    field.snap(mask.states.embers, colors());
    field.setUpdate((dt, time) => orbit(field, mask, dt, time));
  },

  unmount(ctx) {
    // Bake first: pressing Q again returns to close-02, and it should return
    // from where the embers actually are rather than snapping.
    ctx.field.bakeOffsets();
    ctx.field.resetSceneMods();
  },
};

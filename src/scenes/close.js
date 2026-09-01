/**
 * close.js — beats 21-22. The mask completes, then becomes a lantern.
 *
 * "Final shard seats, mask completes in full color, rises, dissolves upward
 *  into lantern glow. Loops indefinitely." (CONTEXT.md §6)
 *
 * close-01 is the first moment in the entire deck where all four festival hues
 * are lit at once, at full. Everything before this has been partial. The final
 * shard — the one that was foreign, the one that did not belong — arrives last
 * and seats into the face. Do not point this out. Let it work.
 *
 * close-02 must be safe to hold through applause, so it never ends: points
 * stream upward, fade, and re-seed at the mask, forever. There is no beat after
 * this one. The operator presses Q when Q&A begins.
 */

import { COLOR, TIME } from '../theme.js';
import { POINTS } from '../theme.js';
import { byShard, clearDelays } from './_base.js';

/** Full. The deck has been saving this since the cold open. */
const FULL = 1.75;

const FULL_FESTIVAL = [
  [COLOR.magenta, FULL],
  [COLOR.marigold, FULL],
  [COLOR.cyan, FULL],
  [COLOR.jade, FULL],
];

/** How far a point rises before it re-seeds at the mask. */
const RISE_SPAN = 1.5;

/**
 * The fade is by absolute height, not by distance travelled.
 *
 * Travelled-distance fading looks correct until you notice that a point which
 * starts at the chin and one that starts at the crown reach the top of the
 * frame at completely different points in their own climb — so the crown's
 * points cross the frame edge at full brightness and the dissolve gets a hard
 * horizontal cut. Fading on where a point actually *is* has no edge.
 */
const FADE_TOP = 1.34;
const FADE_LEN = 0.8;

let colorCache = null;

function fullColors(shardOf) {
  if (!colorCache) colorCache = byShard(shardOf, FULL_FESTIVAL);
  return colorCache;
}

/**
 * The upward dissolve. Each point climbs at its own rate, dims as it goes, and
 * re-seeds at the bottom of its climb — so the lantern is always dispersing and
 * always whole, and the loop has no seam to notice.
 */
function stream(field, mask, dt) {
  const { sceneOffset, brightness, noise } = field;
  const base = mask.states.lantern;

  for (let i = 0; i < POINTS; i++) {
    const i3 = i * 3;
    const roll = noise.roll(i);
    const speed = 0.055 + roll * 0.13;

    let y = sceneOffset[i3 + 1] + speed * dt;
    if (y > RISE_SPAN) y -= RISE_SPAN;

    sceneOffset[i3 + 1] = y;
    // A little outward wander as it climbs, so the column is not a pillar.
    sceneOffset[i3] = Math.sin(y * 2.1 + roll * 6.28) * 0.06 * (y / RISE_SPAN);

    // Gone before it reaches the top of the frame, wherever it started.
    const worldY = base[i3 + 1] + y;
    brightness[i] = Math.min(1, Math.max(0, (FADE_TOP - worldY) / FADE_LEN));
  }
}

export default {
  mount(ctx) {
    clearDelays(ctx.field);
  },

  enter(state, ctx) {
    const { field, mask } = ctx;
    clearDelays(field);
    field.brightness.fill(1);

    if (state.mode === 'complete') {
      field.setDrift(0.007);
      field.setUpdate(null);

      // The final shard arrives last — it seats on "bringing the light".
      for (let i = 0; i < field.posDelay.length; i++) {
        field.posDelay[i] = mask.shardOf[i] === 3 ? 0.34 : 0;
        field.colDelay[i] = mask.shardOf[i] === 3 ? 0.34 : 0;
      }

      field.morph(mask.states.complete, { duration: 1500, ease: 'outExpo' });
      field.morphColor(fullColors(mask.shardOf), { duration: 1500, ease: 'outCubic' });
      return;
    }

    // lantern
    field.setDrift(0.01);
    field.morph(mask.states.lantern, { duration: TIME.lantern, ease: 'inOutQuad' });
    field.morphColor(fullColors(mask.shardOf), { duration: TIME.lantern });
    field.setUpdate((dt) => stream(field, mask, dt));
  },

  apply(state, ctx) {
    const { field, mask } = ctx;
    clearDelays(field);
    field.brightness.fill(1);

    if (state.mode === 'complete') {
      field.setUpdate(null);
      field.setDrift(0.007);
      field.snap(mask.states.complete, fullColors(mask.shardOf));
    } else {
      field.setDrift(0.01);
      field.snap(mask.states.lantern, fullColors(mask.shardOf));
      field.setUpdate((dt) => stream(field, mask, dt));
    }
  },

  unmount(ctx) {
    // Fold the stream's offsets into the base first, so whatever comes next —
    // usually the Q&A embers — starts from where the points visibly are.
    ctx.field.bakeOffsets();
    ctx.field.resetSceneMods();
  },
};

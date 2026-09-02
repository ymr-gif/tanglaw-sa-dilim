/**
 * bars.js — prison bars. The classroom becomes the cage.
 *
 * Five uprights, as the storyboard draws, running well past the top and bottom
 * of frame so they read as continuous rather than as five floating rectangles,
 * plus a cross-rail top and bottom to make it a cage rather than a fence.
 *
 * The mask's own points become these. Nothing arrives from outside the piece.
 */

import { POINTS } from '../theme.js';
import { seededRandom } from '../noise.js';

const COUNT = 5; // storyboard draws five
/**
 * Wide enough that the cage crosses the frame rather than standing in the
 * middle of it. At 0.34 the five bars occupied the centre third and read as an
 * object in a room; a cage has to be the room.
 */
const SPACING = 0.66;
const WIDTH = 0.1;

/**
 * Deliberately past the frame edge, AT EVERY ASPECT RATIO THE DECK SUPPORTS.
 *
 * 1.5 covered 16:9 and stopped short in frame at 5:4 and portrait, where the
 * fit is height-bound and the visible world is much taller — and an upright
 * that ends on screen is a rectangle, not a bar. This reaches past all seven
 * profiles. It costs brightness at 16:9, where only about half of each
 * upright is now on screen; the cage was blowing out to solid white there
 * anyway, so the trade is in the right direction.
 */
const TOP = 2.3;
const BOTTOM = -2.3;

const RAIL_Y = [1.1, -1.1];
const RAIL_H = 0.07;

/**
 * The rails' share of the points. Below their share of the total area, because
 * the uprights run a long way off-screen and the rails do not — matching area
 * exactly would leave two bright bands across a dimmer cage.
 */
const RAIL_SHARE = 0.11;

let cache = null;

export function buildBars() {
  if (cache) return cache;

  const rand = seededRandom(0xba25);
  const out = new Float32Array(POINTS * 3);
  const x0 = -((COUNT - 1) * SPACING) / 2;
  const halfSpan = -x0 + WIDTH;

  for (let i = 0; i < POINTS; i++) {
    const i3 = i * 3;

    if (rand() < RAIL_SHARE) {
      const y = RAIL_Y[rand() < 0.5 ? 0 : 1];
      out[i3] = (rand() * 2 - 1) * halfSpan;
      out[i3 + 1] = y + (rand() - 0.5) * RAIL_H;
    } else {
      const bar = (rand() * COUNT) | 0;
      out[i3] = x0 + bar * SPACING + (rand() - 0.5) * WIDTH;
      out[i3 + 1] = BOTTOM + rand() * (TOP - BOTTOM);
    }

    out[i3 + 2] = (rand() - 0.5) * 0.06;
  }

  cache = out;
  return cache;
}

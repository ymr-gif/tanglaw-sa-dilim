/**
 * effects.js — beats 10-13. The emotional floor.
 *
 * "Least motion, least color, most silence." (CONTEXT.md §6)
 *
 * Four states, and the restraint is the point:
 *
 *   shatter    the mask breaks outward. Noise, not a uniform balloon (§7).
 *   seat       one empty seat. The quietest beat in the deck.
 *   grid-fail  a classroom of desks; one goes out and the failure spreads.
 *   grid-dark  all of it dark. "learning stops".
 *
 * MASS CASUALTY IS ABSTRACT ONLY. A grid of desk-points where one extinguishes
 * and the failure propagates. Never depict the act. There is no representation
 * of a weapon, a body, or an attacker anywhere in this file, and there must
 * never be one.
 *
 * The seat beat renders the absence rather than the chair: points fill a dim
 * field and are excluded from a chair silhouette, so what the audience reads is
 * the empty shape where someone should be.
 */

import { COLOR, TIME } from '../theme.js';
import { POINTS } from '../theme.js';
import { DESKS } from '../mask.js';
import { buildGun } from '../shapes/gun.js';
import { solid, clearDelays, swirl } from './_base.js';

const GRID_COLS = 6;

/** The desk that goes out first. Slightly off-centre — a specific child. */
const ORIGIN_DESK = 14;

const SHATTER_ASH = solid(COLOR.ash, 5.0);
const SEAT_ASH = solid(COLOR.ash, 7.0);
const GRID_LIT = solid(COLOR.ash, 8.0);
const GRID_FAILED = solid(COLOR.ash, 2.2);
const GRID_DARK = solid(COLOR.ash, 1.0);

/** The weapon is the same ash as the mask it was made of. It is not lit. */
const GUN_ASH = solid(COLOR.ash, 8.0);

/**
 * Built once. The gun is a pure function of the shard map, and rebuilding it
 * per entry would reseed the scatter and make the points jump on a re-entry.
 */
let gunBuf = null;
function gun(shardOf) {
  if (!gunBuf) gunBuf = buildGun(null, { shardOf });
  return gunBuf;
}

/** Per-point delay in 0..1, by how far that point's desk is from the origin. */
let deskDelay = null;

function buildDeskDelay(deskOf) {
  if (deskDelay) return deskDelay;

  const ox = ORIGIN_DESK % GRID_COLS;
  const oy = Math.floor(ORIGIN_DESK / GRID_COLS);

  const perDesk = new Float32Array(DESKS);
  let max = 0;
  for (let d = 0; d < DESKS; d++) {
    const dist = Math.hypot((d % GRID_COLS) - ox, Math.floor(d / GRID_COLS) - oy);
    perDesk[d] = dist;
    if (dist > max) max = dist;
  }

  deskDelay = new Float32Array(POINTS);
  for (let i = 0; i < POINTS; i++) {
    deskDelay[i] = max > 0 ? (perDesk[deskOf[i]] / max) * 0.82 : 0;
  }
  return deskDelay;
}

function spreadFailure(field, mask, duration) {
  field.colDelay.set(buildDeskDelay(mask.deskOf));
  field.morphColor(GRID_FAILED, { duration, ease: 'inOutQuad' });
}

export default {
  mount(ctx) {
    clearDelays(ctx.field);
  },

  enter(state, ctx) {
    const { field, mask } = ctx;
    clearDelays(field);

    switch (state.mode) {
      case 'gun': {
        field.setDrift(0.006);
        field.morph(gun(mask.shardOf), { duration: TIME.gunForm, ease: 'inOutQuad' });
        field.morphColor(GUN_ASH, { duration: TIME.gunForm });
        break;
      }

      case 'shatter': {
        field.setDrift(0.02);
        // Irregular in time as well as in space, so the break has grain.
        for (let i = 0; i < field.posDelay.length; i++) {
          field.posDelay[i] = field.noise.roll(i) * 0.26;
        }
        field.morph(mask.states.shattered, { duration: TIME.shatter, ease: 'outExpo' });
        field.morphColor(SHATTER_ASH, { duration: TIME.shatter });

        // The break twists as it goes. A purely radial burst reads as an
        // explosion diagram; a twisting one reads as something coming apart.
        field.setUpdate(() => swirl(field, 0.22));
        break;
      }

      case 'seat': {
        // The least motion in the deck. Slow down.
        field.setDrift(0.004);
        field.morph(mask.states.seat, { duration: TIME.seat, ease: 'inOutQuad' });
        field.morphColor(SEAT_ASH, { duration: TIME.seat });
        break;
      }

      case 'grid-fail': {
        field.setDrift(0.005);
        field.morph(mask.states.grid, { duration: 1600, ease: 'inOutQuad' });

        // The room is whole first. Only once it is established does one desk go
        // out — the spread has to be something the audience watches happen.
        field.morphColor(GRID_LIT, {
          duration: 900,
          onComplete: () => spreadFailure(field, mask, 3600),
        });
        break;
      }

      case 'grid-dark': {
        field.setDrift(0.004);
        field.colDelay.set(buildDeskDelay(mask.deskOf));
        field.morphColor(GRID_DARK, { duration: 1800, ease: 'inOutQuad' });
        break;
      }
    }
  },

  apply(state, ctx) {
    const { field, mask } = ctx;
    clearDelays(field);

    switch (state.mode) {
      case 'gun':
        field.setDrift(0.006);
        field.setUpdate(null);
        field.sceneOffset.fill(0);
        field.snap(gun(mask.shardOf), GUN_ASH);
        break;
      case 'shatter':
        field.setDrift(0.02);
        field.setUpdate(null);
        field.sceneOffset.fill(0);
        field.snap(mask.states.shattered, SHATTER_ASH);
        break;
      case 'seat':
        field.setDrift(0.004);
        field.snap(mask.states.seat, SEAT_ASH);
        break;
      case 'grid-fail':
        // A jump lands after the spread has run its course — that is the state
        // this beat hands to the next one.
        field.setDrift(0.005);
        field.snap(mask.states.grid, GRID_FAILED);
        break;
      case 'grid-dark':
        field.setDrift(0.004);
        field.snap(mask.states.grid, GRID_DARK);
        break;
    }
  },

  unmount(ctx) {
    ctx.field.resetSceneMods();
  },
};

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
import { createSequence } from '../sequence.js';
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

/** How far the muzzle kicks up, in radians about the grip. Storyboard frame 3. */
const RECOIL_TILT = 0.24;

/**
 * Built once each. The gun is a pure function of the shard map, and rebuilding
 * it per entry would reseed the scatter and make the points jump on a re-entry.
 *
 * The recoiled gun is the SAME buildGun call with a pivot rotation rather than
 * a second hand-authored shape, so it cannot drift out of agreement with the
 * gun the audience just watched form.
 */
const gunCache = new Map();
function gun(shardOf, tilt = 0) {
  if (!gunCache.has(tilt)) gunCache.set(tilt, buildGun(null, { shardOf, tilt }));
  return gunCache.get(tilt);
}

/* ── Beat 10: the gun forms, then it fires ──────────────────────────────── */

/**
 * The flash's own timers, held so an interrupted beat cannot light the screen
 * a quarter second into the next one.
 */
let flashTimers = [];

function darken(flash) {
  for (const t of flashTimers) clearTimeout(t);
  flashTimers = [];
  flash.classList.remove('is-lit');
  flash.hidden = true;
}

function formGun(ctx) {
  const { field, mask } = ctx;
  field.setDrift(0.006);
  field.morph(gun(mask.shardOf), { duration: TIME.gunForm, ease: 'inOutQuad' });
  field.morphColor(GUN_ASH, { duration: TIME.gunForm });
}

function fire(ctx) {
  const { field, mask, rig, flash } = ctx;

  flash.hidden = false;
  // A frame between unhiding and lighting, or the transition has nothing to
  // animate from and the flash simply appears at full and cuts out.
  requestAnimationFrame(() => flash.classList.add('is-lit'));
  flashTimers.push(
    setTimeout(() => {
      flash.classList.remove('is-lit');
      flashTimers.push(setTimeout(() => { flash.hidden = true; }, 120));
    }, TIME.fire)
  );

  rig.shake(0.06, 520);

  // The muzzle kicks UP and stays up, pivoting about the web of the grip.
  // A gun pivoting about its middle reads as a spinning object; one pivoting
  // about the hand reads as recoil.
  field.morph(gun(mask.shardOf, RECOIL_TILT), { duration: TIME.recoil, ease: 'outExpo' });
}

/**
 * Beat 10 has two stages, so it runs through the sequencer rather than a nested
 * onComplete: field.finish() runs pending completions, so an operator clicking
 * mid-chain would kick off the shot exactly as the next beat is entering.
 *
 * `settle` plays nothing and states the end result, which is what apply() needs
 * — and it lands AFTER the shot. A jump into eff-00 must never fire the gun:
 * the operator is recovering from a mistake, and re-firing would be worse than
 * the mistake.
 */
const beat10 = createSequence([
  {
    ms: TIME.gunForm,
    play: formGun,
    done: (ctx) => ctx.field.snap(gun(ctx.mask.shardOf), GUN_ASH),
  },
  {
    ms: TIME.recoil,
    play: fire,
    done: (ctx) => {
      darken(ctx.flash);
      ctx.field.snap(gun(ctx.mask.shardOf, RECOIL_TILT), GUN_ASH);
    },
  },
]);

/**
 * Every entry and every apply passes through here first. A beat the operator
 * clicked away from must not keep running its stages into the next one.
 */
function stopAll(ctx) {
  beat10.stop();
  darken(ctx.flash);
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
    stopAll(ctx);
    clearDelays(field);

    switch (state.mode) {
      case 'gun': {
        field.setUpdate(null);
        beat10.start(ctx);
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
    stopAll(ctx);
    clearDelays(field);

    switch (state.mode) {
      case 'gun':
        field.setDrift(0.006);
        field.setUpdate(null);
        field.sceneOffset.fill(0);
        beat10.settle(ctx);
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
    stopAll(ctx);
    ctx.field.resetSceneMods();
  },
};

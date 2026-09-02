/**
 * effects.js — beats 10-12. The literal sequence.
 *
 * The mask's four shards converge into a handgun, it fires, the camera tracks
 * the bullet, then pushes forward through an empty frame into a blood splat.
 * It ends there.
 *
 * FORMING IS ITS OWN CLICK; FIRING IS NOT. Until 2026-09-03 the gun fired
 * itself, ~1.8s after the click that formed it, with no further input. The
 * hold before the shot is now the operator's call — `eff-00` forms the gun
 * and holds. Firing briefly got its own beat too (`eff-04`), but a shot that
 * waits for a second click before it goes anywhere reads as dead air, not
 * suspense, so it was folded back into `eff-01`: one click on `eff-01` fires
 * the gun AND carries straight into the bullet pan. `eff-04` is retired, like
 * `eff-03` before it — the id does not come back.
 *
 * THIS SECTION USED TO BE THE OPPOSITE OF WHAT IT IS NOW. It was "least motion,
 * least color, most silence" — a shatter, an empty seat, and a grid of desks
 * where one went out and the failure propagated, with an explicit rule in
 * CONTEXT.md §6 that said "never depict the act". That rule was replaced by an
 * explicit decision of the author on 2026-09-02, recorded in
 * `docs/superpowers/plans/2026-09-02-effects-sequence.md` and in §6 itself. Do
 * not restore it by accident.
 *
 * THE CONSTRAINT THAT SURVIVED, and it is the most important thing in this
 * file: the gun is assembled out of the four broken shards of the child's mask.
 * Shard 0 becomes the grip, 1 the slide, 2 the barrel, 3 the trigger and the
 * muzzle. It is what the shattered child became. §1's thesis is that society
 * failed these children long before they picked up a weapon; a weapon arriving
 * from outside the piece would contradict that, and a weapon made of the child
 * does not.
 *
 * Effects is now the loudest passage in the deck, which it was never meant to
 * be. The contrast that used to live inside it is carried instead by the `B`
 * key: four full seconds of black after `eff-02`, before Prevention.
 *
 *   gun-form  the shards converge into the weapon and hold, unfired
 *   bullet    fires the gun, then locks onto the bullet. Loops indefinitely
 *   splat     the camera advances through nothing, then the blood, then the
 *             camera withdraws off it
 *
 * THE SPLAT IS THE END OF THE SECTION, AND OF THE DARK HALF OF THE DECK.
 * `grid-dark` — the stain dispersing into a darkened grid of desks — was a
 * fourth beat until 2026-09-03, and was cut for not connecting to what came
 * before it. The section hands straight to the mask now.
 *
 * The retired states are deliberately still here. `shatter`, `seat`,
 * `grid-fail` and `grid-dark` cost nothing to keep, and `mask.js` still builds
 * their geometry, so restoring any of them is a one-line change to a beat's
 * `state`. The empty seat in particular was the quietest and arguably the
 * strongest image in the deck.
 *
 * One thing to know before restoring `grid-dark` as a beat: `splat` now brings
 * the camera home itself, in its own third stage, because with nothing after it
 * the dolly would otherwise still be pushed in when Prevention mounts and
 * `rig.clearScene()` would snap it back at the single most important transition
 * in the piece. `returnCamera` would then be animating 0 -> 0. Harmless, but
 * drop one of the two rather than leaving both.
 */

import { animate } from 'animejs';

import { COLOR, TIME } from '../theme.js';
import { POINTS } from '../theme.js';
import { DESKS } from '../mask.js';
import { buildGun } from '../shapes/gun.js';
import { BULLET, VAPOUR, buildWind, resetWind, stepWind } from '../shapes/wind.js';
import { buildSplat } from '../shapes/splat.js';
import { createSequence } from '../sequence.js';
import { rgbOf, solid, clearDelays, swirl } from './_base.js';

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

/* ── Beat 10: the gun forms ─────────────────────────────────────────────── */

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

/* ── Beat 11: the shot, then the tracking shot ──────────────────────────── */

/**
 * The bang. Plays as stage one of `beat01` below — one click on `eff-01`
 * fires the gun AND carries on into the bullet pan, with no second click
 * in between. It briefly had its own beat (`eff-04`); that added a pause
 * the storyboard never asked for, so it was folded back in here.
 */
function fire(ctx) {
  const { field, mask, rig, flash } = ctx;

  // Belt-and-braces: settle on the formed, unfired gun first. A no-op if
  // `eff-00` already ran to completion, which is the only way to reach this
  // beat by clicking through — but apply() can also enter it directly.
  field.snap(gun(mask.shardOf), GUN_ASH);

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

let windCache = null;
function wind() {
  if (!windCache) windCache = buildWind();
  return windCache;
}

/**
 * The bullet is the brightest thing in frame; the wind is barely there.
 *
 * The vapour and the streaks fall off along their own length rather than being
 * flat, so the trail reads as dispersing and each streak reads as having a
 * leading edge. That falloff is baked into the colour buffer instead of driven
 * from `brightness` because it never changes — only the positions do.
 */
let windColorCache = null;
function windColors() {
  if (windColorCache) return windColorCache;

  const w = wind();
  const out = new Float32Array(POINTS * 3);

  for (let i = 0; i < POINTS; i++) {
    let intensity;
    if (w.role[i] === BULLET) {
      intensity = 9.0;
    } else if (w.role[i] === VAPOUR) {
      // Distance behind the bullet, recovered from the seeded layout.
      const behind = Math.min(1, Math.max(0, (-0.25 - w.positions[i * 3]) / 0.9));
      intensity = 4.2 * (1 - behind) ** 1.6;
    } else {
      // Head of the chain brightest, tail faintest.
      intensity = 4.0 * (1 - w.slot[i] / 7) + 0.7;
    }

    const [r, g, b] = rgbOf(COLOR.ash, intensity);
    out[i * 3] = r;
    out[i * 3 + 1] = g;
    out[i * 3 + 2] = b;
  }

  windColorCache = out;
  return windColorCache;
}

function panToBullet(ctx) {
  const { field } = ctx;
  field.setDrift(0.003);
  resetWind(wind());
  field.morph(wind().positions, { duration: 900, ease: 'outExpo' });
  field.morphColor(windColors(), { duration: 900 });
  field.setUpdate((dt, time) => stepWind(field, wind(), dt, time));
}

function settleBullet(ctx) {
  const { field } = ctx;
  field.setDrift(0.003);
  resetWind(wind());
  field.snap(wind().positions, windColors());
  field.setUpdate((dt, time) => stepWind(field, wind(), dt, time));
}

/**
 * `eff-01` is one click, two stages: the bang, then the pan. `field.finish()`
 * runs pending completions, so an operator clicking mid-chain would kick off
 * the pan exactly as the next beat is entering — the same reason `beat12`
 * uses this instead of a nested `onComplete`.
 *
 * `settle` (what `apply()` calls) skips straight to the looping bullet shot —
 * a jump into `eff-01` must never replay the bang.
 */
const beat01 = createSequence([
  {
    ms: TIME.recoil,
    play: fire,
    done: (ctx) => darken(ctx.flash),
  },
  {
    ms: 900,
    play: panToBullet,
    done: settleBullet,
  },
]);

/* ── Beat 12: the camera advances, then the bullet bursts ───────────────── */

let splatBuf = null;
function splat() {
  if (!splatBuf) splatBuf = buildSplat();
  return splatBuf;
}

/**
 * The one non-ash colour in the section, and the only one.
 *
 * 2.4, not the 3.2 the plan suggested: these points are emissive under additive
 * blending, and where the core is densest the channels saturate and the red
 * washes out to pink. Lower keeps it red where it matters most.
 */
const BLOOD = solid(COLOR.blood, 2.4);

/** Half-width of the splat, for normalising the sweep delay. */
const SPLAT_HALF = 1.2;

/**
 * How far the camera pushes in. The rig computes `position.z = fitZ + offset.z`,
 * so forward is NEGATIVE; with fitZ around 2.9 this lands at about 1.3, well
 * clear of the 0.1 near plane.
 */
const ADVANCE_Z = -1.6;

/**
 * What the frame looks like while the camera is advancing: nothing.
 *
 * The wind goes out entirely and the bullet is left as a faint mote. THE FRAME
 * STAYS EMPTY AND THAT IS THE BEAT — it is the one moment of quiet left in a
 * section that is now the loudest in the deck, and it is what makes the splat
 * land. Do not fill it.
 *
 * The bullet is not taken all the way to nothing only because it is the thing
 * that becomes the blood; a stain arriving from an entirely empty frame would
 * be a stain from nowhere.
 */
let emptyColorCache = null;
function emptyColors() {
  if (emptyColorCache) return emptyColorCache;

  const w = wind();
  const out = new Float32Array(POINTS * 3);

  for (let i = 0; i < POINTS; i++) {
    const intensity = w.role[i] === BULLET ? 1.6 : w.role[i] === VAPOUR ? 0.25 : 0.1;
    const [r, g, b] = rgbOf(COLOR.ash, intensity);
    out[i * 3] = r;
    out[i * 3 + 1] = g;
    out[i * 3 + 2] = b;
  }

  emptyColorCache = out;
  return emptyColorCache;
}

/** The dolly, driven the same way every morph in the deck is: a scalar. */
const dolly = { z: 0 };
let dollyAnim = null;

function advanceCamera(ctx) {
  const { field, rig } = ctx;

  field.setDrift(0.003);
  field.morphColor(emptyColors(), { duration: TIME.advance, ease: 'inOutQuad' });

  dollyAnim?.pause();
  dolly.z = 0;
  dollyAnim = animate(dolly, { z: ADVANCE_Z, duration: TIME.advance, ease: 'inOutQuad' });

  // The wind keeps running under the fade rather than freezing, so the frame
  // empties out instead of stopping dead.
  field.setUpdate((dt, time) => {
    stepWind(field, wind(), dt, time);
    rig.setOffset(0, 0, dolly.z);
  });
}

function burst(ctx) {
  const { field, rig } = ctx;

  dollyAnim?.pause();
  dolly.z = ADVANCE_Z;
  rig.setOffset(0, 0, ADVANCE_Z);

  // The wind lives in sceneOffset; fold it in so the burst starts from where
  // the points visibly are rather than from the seeded layout.
  field.setUpdate(null);
  field.bakeOffsets();
  field.sceneOffset.fill(0);
  field.setDrift(0.004);

  // The sweep. The same per-point delay mechanism that lights shards 200ms
  // apart throws a splatter across the frame: a point's delay is its own
  // normalised x in the target, so the left edge lands first and the right
  // edge last. 450ms in total, because the storyboard says "dramatic, sudden"
  // and anything slower reads as the blood being drawn rather than thrown.
  const target = splat();
  for (let i = 0; i < POINTS; i++) {
    const d = ((target[i * 3] + SPLAT_HALF) / (SPLAT_HALF * 2)) * 0.75;
    field.posDelay[i] = Math.min(0.9, Math.max(0, d));
    field.colDelay[i] = field.posDelay[i];
  }

  field.morph(target, { duration: TIME.splatForm, ease: 'outExpo' });
  field.morphColor(BLOOD, { duration: TIME.splatForm });
}

function snapSplat(ctx) {
  const { field, rig } = ctx;

  dollyAnim?.pause();
  dolly.z = ADVANCE_Z;
  rig.setOffset(0, 0, ADVANCE_Z);

  field.setUpdate(null);
  field.sceneOffset.fill(0);
  field.setDrift(0.004);
  clearDelays(field);
  field.snap(splat(), BLOOD);
}

/** How long the stain takes to become the room. */
const DARK_MS = 2200;

/**
 * The camera comes back to neutral over the same duration the grid arrives in,
 * so the pull-back and the room settling are one movement rather than two.
 */
function returnCamera(ctx) {
  const { field, rig } = ctx;

  dollyAnim?.pause();
  dollyAnim = animate(dolly, {
    z: 0,
    duration: DARK_MS,
    ease: 'inOutQuad',
    onComplete: () => field.setUpdate(null),
  });

  field.setUpdate(() => rig.setOffset(0, 0, dolly.z));
}

/**
 * The camera withdraws off the stain.
 *
 * Structural, not decorative. `splat` is the last beat of the section now, so
 * if nothing brings the dolly home the camera is still pushed in when
 * Prevention mounts — and `rig.clearScene()` then snaps it back in a single
 * frame, at the exact transition the whole piece turns on.
 *
 * Making it a stage of this beat rather than a fix in `unmount` also earns its
 * keep dramatically: CH speaks the contagion sentence to a held image, and the
 * camera pulling slowly off the blood is the only movement left in the section.
 * It reads as withdrawal, which is what the sentence is about.
 */
const RECEDE_MS = 2600;

function recede(ctx) {
  const { field, rig } = ctx;

  dollyAnim?.pause();
  dollyAnim = animate(dolly, {
    z: 0,
    duration: RECEDE_MS,
    ease: 'inOutQuad',
    onComplete: () => field.setUpdate(null),
  });

  field.setUpdate(() => rig.setOffset(0, 0, dolly.z));
}

function restCamera(ctx) {
  dollyAnim?.pause();
  dolly.z = 0;
  ctx.rig.setOffset(0, 0, 0);
  ctx.field.setUpdate(null);
}

const beat12 = createSequence([
  {
    ms: TIME.advance,
    play: advanceCamera,
    done: (ctx) => {
      ctx.rig.setOffset(0, 0, ADVANCE_Z);
      dolly.z = ADVANCE_Z;
    },
  },
  {
    ms: TIME.splatForm,
    play: burst,
    done: snapSplat,
  },
  {
    ms: RECEDE_MS,
    play: recede,
    // `settle` runs every stage's `done` in order, so this is what a jump into
    // eff-02 lands on: the stain arrived, the camera already home.
    done: restCamera,
  },
]);

/**
 * Every entry and every apply passes through here first. A beat the operator
 * clicked away from must not keep running its stages into the next one.
 */
function stopAll(ctx) {
  beat01.stop();
  beat12.stop();
  dollyAnim?.pause();
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
      case 'gun-form': {
        field.setUpdate(null);
        formGun(ctx);
        break;
      }

      case 'bullet': {
        // Drift stays low: the wind is already carrying all the motion this
        // beat can take, and a wobbling bullet reads as a loose one. Set here
        // rather than inside `panToBullet` so it's already in effect for the
        // bang that precedes it.
        field.setDrift(0.003);
        field.setUpdate(null);
        beat01.start(ctx);
        break;
      }

      case 'splat': {
        beat12.start(ctx);
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
        // Beat 12 can be interrupted mid-advance, and at that moment the wind
        // is still live in sceneOffset. Without this the desks inherit the
        // streaks' displacement and the classroom arrives smeared across the
        // whole frame. Bake so the morph starts from where the points visibly
        // are, then clear, so nothing is left driving them.
        field.setUpdate(null);
        field.bakeOffsets();
        field.sceneOffset.fill(0);

        // The stain becoming the classroom is exactly what "a contagion of
        // hopelessness across the student body" says. One death, then every
        // desk. This used to arrive from a grid that was already on screen;
        // now it has to arrive from the blood.
        field.setDrift(0.004);
        field.morph(mask.states.grid, { duration: DARK_MS, ease: 'inOutQuad' });

        // The red must be GONE by the end. Effects returns to monochrome before
        // Prevention, or the one colour exception leaks into the section that
        // has spent the whole deck earning its own.
        field.colDelay.set(buildDeskDelay(mask.deskOf));
        field.morphColor(GRID_DARK, { duration: DARK_MS, ease: 'inOutQuad' });

        returnCamera(ctx);
        break;
      }
    }
  },

  apply(state, ctx) {
    const { field, mask } = ctx;
    stopAll(ctx);
    clearDelays(field);

    switch (state.mode) {
      case 'gun-form':
        field.setDrift(0.006);
        field.setUpdate(null);
        field.sceneOffset.fill(0);
        field.snap(gun(mask.shardOf), GUN_ASH);
        break;
      case 'bullet':
        field.setUpdate(null);
        field.sceneOffset.fill(0);
        beat01.settle(ctx);
        break;
      case 'splat':
        beat12.settle(ctx);
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
        field.setUpdate(null);
        field.sceneOffset.fill(0);
        dolly.z = 0;
        ctx.rig.setOffset(0, 0, 0);
        field.snap(mask.states.grid, GRID_DARK);
        break;
    }
  },

  unmount(ctx) {
    stopAll(ctx);
    // Bake first: the wind and the bullet live entirely in sceneOffset, so
    // without this the next scene morphs from where the last morph left the
    // points rather than from where they visibly are.
    ctx.field.bakeOffsets();
    ctx.field.resetSceneMods();
  },
};

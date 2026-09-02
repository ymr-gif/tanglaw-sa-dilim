/**
 * hands.js — many hands, emerging from the shadows.
 *
 * The storyboard's reference image is what makes this shape tractable:
 *
 *   "the hands fade in emerging from the shadows, fingertips vividly visible
 *    fading into the palms, thumbs facing up"
 *
 * ONLY THE FINGERTIPS HAVE TO READ. An anatomically convincing hand has five
 * similar sub-shapes and no strong silhouette, and would be the riskiest thing
 * in the section. Here the palms dissolve into black on purpose, so there is no
 * palm to get wrong — the brightness gradient along each finger does the work a
 * silhouette would otherwise have to do.
 *
 * `tipness` is the whole trick: 1 at the fingertip, 0 at the base. The scene
 * multiplies brightness by it.
 *
 * TWO THINGS THE FIRST VERSION GOT WRONG, both worth keeping written down:
 *
 *   Fingers radiated from a single point. Five fingers meeting at one place is
 *   five times the point density there, and under additive blending density
 *   beats brightness — so the palms came out as the BRIGHTEST part of the hand
 *   and the whole gradient read backwards. Fingers now start along a knuckle
 *   line, which is both anatomically right and flat in density.
 *
 *   Points were spread evenly along each finger. Even spacing plus a squared
 *   brightness curve still leaves the dim half of every finger carrying half
 *   the points. Sampling is now weighted toward the tip, so brightness and
 *   density agree instead of fighting.
 *
 * It is MANY hands, not two. Five ring each weapon, reaching inward from every
 * side, as the storyboard draws.
 */

import { POINTS } from '../theme.js';
import { seededRandom } from '../noise.js';

/** Hands per weapon. The storyboard shows roughly this many around each. */
const PER_WEAPON = 5;

/** Where the two weapons sit. The hands ring these. */
const WEAPON_X = [-0.74, 0.74];

/**
 * The ring is an ellipse, taller than it is wide. A circular ring puts a hand
 * from each side into the same patch of frame between the two weapons;
 * squeezing it horizontally keeps that crowd readable without losing the
 * "surrounded from every direction" read the storyboard is after.
 */
const OPEN_RX = 0.7;
const OPEN_RY = 0.88;

/**
 * Closing pulls the hands IN, and that convergence is the crush — but only so
 * far. Pulled all the way to the weapon, five fists per side overlap into one
 * yellow knot and none of them reads as a hand any more. This radius is the
 * point where they close on the weapon and still stand apart from each other.
 */
const CLOSED_RX = 0.42;
const CLOSED_RY = 0.48;

/** Offset so no hand sits dead above or dead below a weapon. */
const RING_PHASE = 0.55;

/** Four fingers, index to pinky. The middle is longest; the pinky is short. */
const FINGER_LEN = [0.3, 0.36, 0.34, 0.25];

/** How far apart the knuckles sit across the hand. */
const KNUCKLE_STEP = 0.075;

/** Fingers sit near-parallel. Any more splay and a hand reads as a starburst. */
const FINGER_SPLAY = 0.055;

const THUMB_LEN = 0.24;
const THUMB_OUT = 0.16;
const THUMB_ANGLE = 0.78;

/** Share of a hand's points that go to the palm rather than to a finger. */
const PALM_SHARE = 0.16;
const PALM_SIZE = 0.17;

/**
 * A CLOSED hand is drawn differently from an open one, and it has to be.
 *
 * Curling the same five fingers inward was tried first and it comes out as five
 * spirals with a spike beside them — a claw, not a fist. A fist has no fingers
 * to read; it is a mass with knuckle banding across it and a thumb on top,
 * which is exactly how the storyboard draws both of them.
 *
 * So: a filled block, three bright bands across its front, and a thumb stub
 * pointing straight up in WORLD space, which is what the storyboard labels.
 */
const FIST_DEPTH = 0.26;
const FIST_WIDTH = 0.24;
const FIST_BANDS = 3;
const FIST_BAND_STEP = 0.062;
const FIST_BAND_HALF = 0.014;
const FIST_MASS_TIP = 0.5;
const THUMB_UP_LEN = 0.2;

/**
 * @param {Float32Array|null} target   positions; allocated if null
 * @param {Float32Array|null} tipness  per-point 0..1, tip to base; allocated if null
 * @param {object} opts
 * @param {ArrayLike<number>} [opts.pick] point indices to place; default all
 * @param {boolean} [opts.closed] fists rather than open hands
 */
export function buildHands(target, tipness, { pick = null, closed = false } = {}) {
  // Same seed for open and closed, so the crush morphs THIS hand rather than
  // swapping in a different one. Reseeding would make every point jump.
  const rand = seededRandom(0x4a5d);
  const positions = target ?? new Float32Array(POINTS * 3);
  const tips = tipness ?? new Float32Array(POINTS);

  const rx = closed ? CLOSED_RX : OPEN_RX;
  const ry = closed ? CLOSED_RY : OPEN_RY;
  const hands = [];

  for (const cx of WEAPON_X) {
    for (let h = 0; h < PER_WEAPON; h++) {
      // A full ring, all reaching inward. The hands come out of the dark at
      // every edge and surround both weapons; a half-arc reads as a canopy.
      const a = RING_PHASE + (Math.PI * 2 * h) / PER_WEAPON;
      const aim = a + Math.PI; // fingers point back toward the weapon

      hands.push({
        ox: cx + Math.cos(a) * rx,
        oy: Math.sin(a) * ry - 0.1,
        aim,
        // Perpendicular to the aim — the knuckle line runs along this.
        px: Math.cos(aim + Math.PI / 2),
        py: Math.sin(aim + Math.PI / 2),
        // Storyboard: thumbs facing up. Splay the thumb to whichever side of
        // this hand's aim actually points higher, rather than to a fixed side.
        thumbSign: Math.sin(aim + THUMB_ANGLE) >= Math.sin(aim - THUMB_ANGLE) ? 1 : -1,
      });
    }
  }

  const n = pick ? pick.length : POINTS;

  for (let k = 0; k < n; k++) {
    const i = pick ? pick[k] : k;
    const i3 = i * 3;

    // SEVEN DRAWS PER POINT, ALWAYS, whichever branch is taken.
    //
    // The open and closed hands share one seed so that closing is THIS hand
    // closing rather than a different hand appearing. That only holds while
    // both consume the stream at the same rate: a branch that drew fewer
    // numbers would shift every later point onto a different hand, and the
    // crush would come out as a full reshuffle instead of a grip.
    const r0 = rand();
    const r1 = rand();
    const r2 = rand();
    const r3 = rand();
    const r4 = rand();
    const r5 = rand();
    const r6 = rand();

    const hand = hands[(r0 * hands.length) | 0];
    // Along the aim, and across it. Every shape below is built in these two.
    const ax = Math.cos(hand.aim);
    const ay = Math.sin(hand.aim);

    let along = 0;
    let across = 0;
    let x;
    let y;
    let tip;

    if (closed) {
      if (r1 < 0.52) {
        // The mass of the fist.
        along = (r2 - 0.5) * FIST_DEPTH;
        across = (r3 - 0.5) * FIST_WIDTH;
        tip = FIST_MASS_TIP;
      } else if (r1 < 0.84) {
        // Knuckle banding across the front face. These are the bright part.
        const band = (r2 * FIST_BANDS) | 0;
        along = FIST_DEPTH * 0.5 - band * FIST_BAND_STEP + (r3 - 0.5) * FIST_BAND_HALF * 2;
        across = (r4 - 0.5) * FIST_WIDTH * 0.94;
        tip = 1;
      } else {
        // The thumb, straight up. Not along the aim — the storyboard labels
        // "thumb" on both fists and both point up the frame.
        const up = r2 * THUMB_UP_LEN;
        x = hand.ox + hand.px * THUMB_OUT * 0.6 * hand.thumbSign + (r3 - 0.5) * 0.04;
        y = hand.oy + FIST_DEPTH * 0.4 + up;
        tip = 0.7 + r2 * 0.3;

        positions[i3] = x;
        positions[i3 + 1] = y + (r4 - 0.5) * 0.02;
        positions[i3 + 2] = (r6 - 0.5) * 0.06;
        tips[i] = tip;
        continue;
      }

      x = hand.ox + ax * along + hand.px * across + (r5 - 0.5) * 0.014;
      y = hand.oy + ay * along + hand.py * across + (r6 - 0.5) * 0.014;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = (r4 - 0.5) * 0.06;
      tips[i] = tip;
      continue;
    }

    if (r1 < PALM_SHARE) {
      // The palm. Almost never lit — it is here so the fingers read as attached
      // to something, not as floating claws.
      const back = -PALM_SIZE * (0.2 + r2 * 0.9);
      across = (r3 - 0.5) * PALM_SIZE * 2;
      x = hand.ox + ax * back + hand.px * across;
      y = hand.oy + ay * back + hand.py * across;
      tip = 0;
    } else {
      // 0 is the thumb; 1-4 are the fingers, in order across the knuckles.
      const finger = (r2 * 5) | 0;
      const isThumb = finger === 0;

      // Weighted toward the tip, so brightness and point density agree.
      const t = Math.sqrt(r3);

      let base;
      let dir;
      let len;

      if (isThumb) {
        base = THUMB_OUT * hand.thumbSign;
        len = THUMB_LEN;
        dir = hand.aim + THUMB_ANGLE * hand.thumbSign;
      } else {
        const f = finger - 1;
        base = (f - 1.5) * KNUCKLE_STEP;
        len = FINGER_LEN[f];
        dir = hand.aim + (f - 1.5) * FINGER_SPLAY;
      }

      const kx = hand.ox + hand.px * base;
      const ky = hand.oy + hand.py * base;
      const r = t * len;

      x = kx + Math.cos(dir) * r + (r4 - 0.5) * 0.018;
      y = ky + Math.sin(dir) * r + (r5 - 0.5) * 0.018;
      tip = t * t; // squared, so the falloff into the palm is steep
    }

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = (r6 - 0.5) * 0.06;
    tips[i] = tip;
  }

  return { positions, tipness: tips };
}

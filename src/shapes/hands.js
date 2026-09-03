/**
 * hands.js — TWO hands, ten fingers, emerging from the shadows.
 *
 * THE COUNT IS THE WHOLE POINT, and an earlier version of this file got it
 * wrong. The storyboard's reference image is one figure held between TWO hands
 * — five fingers reaching in from the left, five from the right. It is not ten
 * hands. A previous pass read it as five small hands per weapon, which is
 * twenty-five digits a side, and the result was a thicket rather than a grip.
 *
 * So, exactly:
 *
 *   the LEFT hand's five fingers close on the LEFT weapon  (the knife)
 *   the RIGHT hand's five fingers close on the RIGHT weapon (the gun)
 *
 * Ten fingers in the frame. Never more.
 *
 * The storyboard's written spec, which the geometry below answers line by line:
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
 * `tipness` is that gradient: 1 at the fingertip, 0 at the knuckle. The scene
 * multiplies brightness by it, so the far end of every finger goes to black
 * before it reaches the edge of the frame. That IS "emerging from the shadows"
 * — nothing fades the hands in but their own geometry.
 *
 * THERE IS NO PALM. The old version drew a dim one so the fingers would read as
 * attached to something; with five fingers per hand fanned on a knuckle arc
 * they already do, and the reference shows pure black where a palm would be.
 * Drawing one only put points where the image wants none.
 *
 * WHAT THE REFERENCE ACTUALLY SHOWS, and what each part of it costs here:
 *
 *   - The fingers are HUGE. Each one is about a third of the frame long and
 *     roughly 3.5 times longer than it is wide. The old fingers were 17:1 and
 *     read as wires. Only the last two joints of each finger are in frame; the
 *     rest is off in the dark, which is why they look stubby and why that is
 *     correct rather than a mistake.
 *   - They fan around the subject rather than lying parallel — an arc of about
 *     145 degrees a side, from above it, around, to below it.
 *   - Fingertips point INWARD, at the thing being held.
 *   - The nails are visible, and they are most of what says "finger" rather
 *     than "tube". They are drawn here as a bright plate with a dim outline,
 *     which is the only way a nail can exist in a field that has no lines.
 *
 * TWO THINGS THE FIRST VERSION GOT RIGHT, worth keeping written down:
 *
 *   Fingers must not radiate from a single point. Five fingers meeting in one
 *   place is five times the point density there, and under additive blending
 *   density beats brightness — so the palms came out as the BRIGHTEST part of
 *   the hand and the gradient read backwards. Fingers start along a knuckle
 *   ARC here, so their bases are spread and their tips land spread too.
 *
 *   Points are weighted toward the tip. Even spacing plus a squared brightness
 *   curve still leaves the dim half of every finger carrying half the points,
 *   so brightness and density fight. Weighted, they agree.
 */

import { POINTS } from '../theme.js';
import { seededRandom } from '../noise.js';

/**
 * The two hands. Index 0 takes the left weapon, index 1 the right.
 *
 * `facing` points from the weapon OUT toward the palm, so the left hand faces
 * left and reaches right. `spin` is which way round the arc the digits are
 * ordered, and it differs between a left and a right hand for the same reason
 * it does on a body: both thumbs have to end up at the TOP of their own arc,
 * which is the storyboard's "thumbs facing up".
 *
 * Where each hand actually sits is not written here — it comes from the `fit`
 * the caller measures off the weapons themselves.
 */
const HANDS = [
  { facing: Math.PI, spin: -1 },
  { facing: 0, spin: 1 },
];

/** How far round the weapon the five knuckles are spread. About 135 degrees:
 *  the reference reaches in from above the subject, round it, and below. */
const ARC_SPAN = 2.35;

/**
 * The hands FIT THE WEAPONS AT RUNTIME rather than assuming their shape.
 *
 * The caller passes each weapon's actual half-extents (see `fit` below) and the
 * two ellipses are built out from those: the fingertips stop `GRIP_GAP` clear
 * of the weapon's own box, and the knuckles sit `REACH` further out again.
 *
 * That indirection is load-bearing. Lengths derived this way give an even gap
 * all the way round something that is NOT round — on a pair of circles the
 * fingers coming from straight above would bury themselves in a long flat
 * weapon while the ones from the side were still half a frame short. It also
 * means the grip follows the weapons wherever the staging puts them: refusal.js
 * has already re-tilted the knife once since this file was written, and hands
 * pinned to a hardcoded horizontal ellipse would have quietly stopped cupping
 * it. Nothing here needs touching when a weapon is rescaled or rotated.
 *
 * The knuckle ellipse can and does run past the edge of the frame. That is
 * fine: a knuckle is at `tipness` 0, which the scene renders at PALM_FLOOR —
 * near black. The hand runs out of light before it runs out of frame, and that
 * is the whole of "emerging from the shadows".
 */
const GRIP_GAP = 0.09;
const REACH = 0.6;

/**
 * Closing pulls the fingertips in to about the radius the crushed weapon
 * occupies (CRUSH_R in refusal.js) and shortens the reach behind them. The same
 * five digits, moved — NOT a different shape. An earlier version swapped in a
 * drawn fist here, which meant the crush was one hand disappearing and another
 * appearing in its place.
 */
const CLOSED_GRIP = 0.26;
const CLOSED_REACH = 0.46;

/**
 * How far a hand retracts when PULLING the weapon apart (ref-06).
 *
 * The pull pose is the open hand translated out along its own `facing` — the
 * direction that points away from the weapon. The fingers stay splayed and
 * reaching, so the read is a hand gripping and then drawing back, which is what
 * tears the weapon into wedges (see refusal.js's `pulledApart`). It deliberately
 * does NOT curl into a fist: closing is the old crush, and the pull is meant to
 * read as the opposite of a crush.
 */
const PULL_BACK = 0.55;

/**
 * Used when the caller passes no `fit`. Only a fallback — refusal.js measures
 * the weapons it actually built and passes those, so these numbers are not the
 * ones on screen.
 */
const DEFAULT_FIT = [
  { cx: -0.71, cy: 0, halfW: 0.67, halfH: 0.14 },
  { cx: 0.71, cy: 0, halfW: 0.5, halfH: 0.33 },
];

/** Radius of an ellipse at a given angle. */
function ellipseR(rx, ry, a) {
  const c = Math.cos(a) / rx;
  const s = Math.sin(a) / ry;
  return 1 / Math.sqrt(c * c + s * s);
}

/**
 * How far each digit hooks off dead-radial as the hand closes, in radians, all
 * the same way round. Fingers that close straight in are a press; fingers that
 * close with a hook are a grip.
 */
const CLOSED_CURL = 0.5;

/**
 * The five digits, thumb first, in order around the arc from the top.
 *
 * `reach` scales the derived length so the middle finger is longest and the
 * thumb and pinky fall short of it, as they do on a hand. `halfW` is in world
 * units and is the measured proportion of the reference: the visible part of
 * each finger runs about three times longer than it is wide, and it is THICK —
 * an earlier pass had these at 17:1 and they read as wires. Only the last two
 * joints are in frame; the rest is off in the dark, which is why they look
 * stubby and why that is correct rather than a mistake.
 */
const DIGITS = [
  { reach: 0.88, halfW: 0.125 }, // thumb
  { reach: 1.0, halfW: 0.108 }, // index
  { reach: 1.05, halfW: 0.112 }, // middle
  { reach: 1.0, halfW: 0.104 }, // ring
  { reach: 0.88, halfW: 0.088 }, // pinky
];

/**
 * Per-digit angular offset from dead-radial, in radians.
 *
 * Fixed, and deliberately not monotonic. Five digits all aimed exactly at the
 * weapon's centre is a starburst; a wider even fan is a bigger starburst. The
 * irregularity is what makes it read as a hand reaching rather than as a
 * diagram of a hand reaching.
 */
const DIGIT_SKEW = [0.14, -0.06, 0.03, -0.09, 0.13];

/**
 * Per-digit nudge round the arc, on top of the even fifths.
 *
 * Evenly spaced digits read as a diagram — five spokes at exactly the same
 * pitch. Real fingers cluster: index and middle sit close, the pinky drifts
 * off. This is small enough not to cross any two of them over.
 */
const DIGIT_ARC_JITTER = [0.1, -0.05, 0.02, 0.06, -0.09];

/** Fingers narrow slightly toward the tip. Flat sides read as dowels. */
const TAPER = 0.18;

/**
 * Share of a digit's points spent on its rounded tip cap rather than the
 * straight shaft. Deliberately above the cap's true share of a capsule's area —
 * at this point density a true area share is a handful of points and
 * disappears, the same "fine detail vanishes" lesson knife.js states for slim
 * blades. Over-weighting the cap agrees with the tip-brightness bias rather
 * than fighting it: the tip is already meant to be the brightest part.
 */
const CAP_SHARE = 0.1;

/* ── The nail ───────────────────────────────────────────────────────────── */

/**
 * A nail cannot be drawn as an outline in a field with no lines, so it is drawn
 * as a brightness step: the plate reads at full `tipness`, the shaft around it
 * a little under, and a thin band between them well under. That band is the
 * outline, and it is the reason the plate reads as sitting ON the finger rather
 * than as a hot spot in it.
 *
 * This is also why the shaft peaks at NAIL_PAD rather than at 1. If the whole
 * fingertip were already as bright as it can get, a nail would have nowhere
 * brighter to go.
 */
const NAIL_FROM = 0.68; // fraction along the digit where the plate starts
const NAIL_TO = 0.96; // and where it stops, short of the very tip
const NAIL_HALF = 0.62; // share of the local half-width the plate spans
const NAIL_EDGE = 0.22; // outline thickness, as a share of the plate's radius
const NAIL_PLATE = 1;
const NAIL_OUTLINE = 0.34;
const NAIL_PAD = 0.84; // the brightest the shaft itself gets

/** Falloff of the shaft's own gradient, base to tip. Squared-ish, so the fade
 *  into the dark end is steep and most of the finger is genuinely dim. */
const TIP_POW = 1.8;

/** Per-digit share of the points, by area, so a thick digit gets more points
 *  than a thin one instead of an equal fifth. */
const DIGIT_CDF = (() => {
  const cdf = new Float32Array(DIGITS.length);
  let total = 0;
  for (let d = 0; d < DIGITS.length; d++) {
    total += DIGITS[d].reach * DIGITS[d].halfW * 2;
    cdf[d] = total;
  }
  for (let d = 0; d < cdf.length; d++) cdf[d] /= total;
  return cdf;
})();

/**
 * @param {Float32Array|null} target   positions; allocated if null
 * @param {Float32Array|null} tipness  per-point 0..1, base to tip; allocated if null
 * @param {object} opts
 * @param {ArrayLike<number>} [opts.pick] point indices to place; default all
 * @param {boolean} [opts.closed] the hands closed on the weapons
 * @param {boolean} [opts.pull] the hands retracting outward, pulling the weapons
 *        apart — the open hand translated along its own `facing`. Mutually
 *        exclusive with `closed` (pulling wins if both are set, by design: the
 *        two are never both wanted).
 * @param {Array<{cx:number,cy:number,halfW:number,halfH:number}>} [opts.fit]
 *        each weapon's measured centre and half-extents, left first. The hands
 *        are built around these, so a rescaled or re-tilted weapon is still
 *        cupped without touching this file.
 */
export function buildHands(
  target,
  tipness,
  { pick = null, closed = false, pull = false, fit = DEFAULT_FIT } = {}
) {
  // Same seed open and closed, so the crush morphs THIS hand rather than
  // swapping in a different one. Both cases run the SAME sampling code below
  // and differ only in constants, so they consume the random stream at the same
  // rate by construction — the old version had to hand-count its draws per
  // branch to keep that true, and a branch that drew one number fewer turned
  // the crush into a full reshuffle.
  const rand = seededRandom(0x4a5d);
  const positions = target ?? new Float32Array(POINTS * 3);
  const tips = tipness ?? new Float32Array(POINTS);

  const curl = closed && !pull ? CLOSED_CURL : 0;

  // Every digit of both hands, resolved once: where it is rooted, which way it
  // reaches, and how long it is. Ten of these, and there are never more.
  const digits = [];
  for (let h = 0; h < HANDS.length; h++) {
    const hand = HANDS[h];
    const box = fit[h] ?? DEFAULT_FIT[h];

    // The two ellipses for THIS weapon. Closed, the grip collapses to a small
    // circle at the weapon's centre whatever shape the weapon was, because by
    // then the weapon is a disc of debris and no longer has a shape.
    const gripRx = closed ? CLOSED_GRIP : box.halfW + GRIP_GAP;
    const gripRy = closed ? CLOSED_GRIP : box.halfH + GRIP_GAP;
    const reach = closed ? CLOSED_REACH : REACH;
    const knuckleRx = gripRx + reach;
    const knuckleRy = gripRy + reach;

    for (let d = 0; d < DIGITS.length; d++) {
      // Round the arc from the thumb. `spin` puts the thumb at the top of the
      // arc for both hands, which is the storyboard's "thumbs facing up".
      const a =
        hand.facing +
        hand.spin *
          (ARC_SPAN / 2 -
            (d * ARC_SPAN) / (DIGITS.length - 1) +
            DIGIT_ARC_JITTER[d]);

      const kx = box.cx + Math.cos(a) * ellipseR(knuckleRx, knuckleRy, a);
      const ky = box.cy + Math.sin(a) * ellipseR(knuckleRx, knuckleRy, a);

      // Reach back at the weapon, off dead-radial by this digit's own skew,
      // and hooked further round when the hand is closing.
      const dir = a + Math.PI + DIGIT_SKEW[d] * hand.spin + curl * hand.spin;

      // Length is the gap between the two ellipses at this digit's own angle,
      // trimmed by its own reach — so the tips stop an even distance off the
      // weapon whichever side they come in from.
      const span =
        ellipseR(knuckleRx, knuckleRy, a) - ellipseR(gripRx, gripRy, a);

      digits.push({
        kx,
        ky,
        fx: Math.cos(dir),
        fy: Math.sin(dir),
        len: span * DIGITS[d].reach,
        halfW: DIGITS[d].halfW,
      });
    }
  }

  const n = pick ? pick.length : POINTS;

  for (let k = 0; k < n; k++) {
    const i = pick ? pick[k] : k;
    const i3 = i * 3;

    const r0 = rand();
    const r1 = rand();
    const r2 = rand();
    const r3 = rand();
    const r4 = rand();

    // Which hand, then which digit of it by area.
    const handIdx = r0 < 0.5 ? 0 : 1;
    let d = DIGITS.length - 1;
    for (let q = 0; q < DIGIT_CDF.length; q++) {
      if (r1 <= DIGIT_CDF[q]) {
        d = q;
        break;
      }
    }
    const digit = digits[handIdx * DIGITS.length + d];

    // Perpendicular to this digit's own direction — every digit has its own,
    // so "width" has to follow it rather than the hand's.
    const px = -digit.fy;
    const py = digit.fx;

    // Weighted toward the tip, so density and brightness agree.
    const t = Math.sqrt(r2);
    const halfW = digit.halfW * (1 - TAPER * t);

    let x;
    let y;
    let tip;

    if (r3 < CAP_SHARE) {
      // Rounded tip cap: a half-disc centred on the very tip, bulging only
      // forward (theta confined to +/-90 degrees off the digit's axis) so it
      // can never fatten the shaft it caps.
      const capR = digit.halfW * (1 - TAPER) * Math.sqrt(r4);
      const theta = (r2 - 0.5) * Math.PI;
      const ca = Math.cos(theta);
      const sa = Math.sin(theta);
      const tipX = digit.kx + digit.fx * digit.len;
      const tipY = digit.ky + digit.fy * digit.len;
      x = tipX + (digit.fx * ca + px * sa) * capR;
      y = tipY + (digit.fy * ca + py * sa) * capR;
      tip = NAIL_PAD;
    } else {
      const off = (r4 - 0.5) * 2 * halfW;
      const r = t * digit.len;
      x = digit.kx + digit.fx * r + px * off;
      y = digit.ky + digit.fy * r + py * off;

      tip = NAIL_PAD * Math.pow(t, TIP_POW);

      // The nail plate, and the dim band that outlines it. An OVAL, not a
      // rectangle: a rectangular plate came out as a bright bar down the
      // finger and read as a highlight rather than as a nail.
      if (t >= NAIL_FROM && t <= NAIL_TO) {
        const du = ((t - NAIL_FROM) / (NAIL_TO - NAIL_FROM)) * 2 - 1;
        const dv = off / (halfW * NAIL_HALF);
        const q = du * du + dv * dv;
        if (q <= 1) {
          // Distance in from the oval's own border.
          const edge = 1 - Math.sqrt(q);
          tip = edge < NAIL_EDGE ? NAIL_OUTLINE : NAIL_PLATE;
        }
      }
    }

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = (r3 - 0.5) * 0.06;
    tips[i] = tip;

    // The pull: translate this point out along its hand's `facing` — the
    // direction away from the weapon. Applied per point inside the loop so it
    // follows the same hand index the digit came from; the whole hand moves as
    // one rigid body and the weapon is left behind to shatter.
    if (pull) {
      const h = HANDS[handIdx];
      positions[i3] += Math.cos(h.facing) * PULL_BACK;
      positions[i3 + 1] += Math.sin(h.facing) * PULL_BACK;
    }
  }

  return { positions, tipness: tips };
}

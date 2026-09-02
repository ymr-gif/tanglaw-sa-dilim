/**
 * knife.js — the left-hand weapon.
 *
 * The storyboard draws a broad cleaver rather than a slim knife, and that is
 * the right call at this point density: a slim blade is four points wide and
 * disappears, while a cleaver has an actual silhouette. Blade, bolster, handle;
 * blade pointing left with a squared tip, so it sits in profile beside the gun.
 *
 * Sized so it carries the same visual weight as the gun next to it — roughly
 * the same length and the same filled area, which is what stops one of the two
 * reading as an afterthought.
 *
 * The blade is a tapered quad rather than a rectangle: a rectangle reads as a
 * plank. Points are distributed by area across the three parts, so the taper
 * does not turn into a brightness gradient.
 */

import { POINTS } from '../theme.js';
import { seededRandom } from '../noise.js';

/**
 * Each part is a quad defined along x by its two edges, so a taper is just two
 * lines that are not parallel: [x0, x1, yLow0, yLow1, yHigh0, yHigh1].
 */
const PARTS = [
  // The angled front. A blade whose top corner is cut away reads as a knife;
  // a plain rectangle reads as a hammer head, which is what an earlier attempt
  // came out as. This part is what puts a point on it.
  [-0.58, -0.34, -0.26, -0.28, 0.04, 0.2],
  // The body of the blade. DEEP and nearly rectangular — a blade that tapers
  // all the way from tip to heel comes out as a wedge and the eye files it as
  // a megaphone. A cleaver is a slab with a straight spine.
  [-0.34, 0.05, -0.28, -0.29, 0.2, 0.23],
  // The neck, deliberately thin. The silhouette has to step IN here and back
  // out again; without that notch the blade and the handle merge into one
  // L-shaped lump and the whole thing reads as a boot.
  [0.05, 0.14, 0.03, 0.03, 0.15, 0.15],
  // The handle rides the SPINE, not the centreline, and is a third the depth
  // of the blade. That ratio is the strongest cue in the shape: a knife is a
  // grip with a blade hanging below it.
  [0.14, 0.53, 0.02, 0.05, 0.18, 0.15],
];

const AREA_CDF = (() => {
  const cdf = new Float32Array(PARTS.length);
  let total = 0;
  for (let p = 0; p < PARTS.length; p++) {
    const [x0, x1, l0, l1, h0, h1] = PARTS[p];
    // Trapezoid: mean height times length.
    total += (x1 - x0) * ((h0 - l0 + (h1 - l1)) / 2);
    cdf[p] = total;
  }
  for (let p = 0; p < cdf.length; p++) cdf[p] /= total;
  return cdf;
})();

/**
 * Where along a tapered part a point lands, for `u` in 0..1.
 *
 * Sampling x uniformly and then y between the two edges packs the narrow end —
 * on the blade that is a 2.6x density gradient, which renders as a bright band
 * along the tip and reads as a highlight nobody asked for. The width grows
 * linearly, so its area integrates to a quadratic and inverts in closed form.
 */
function alongByArea(a, b, u) {
  const d = b - a;
  if (Math.abs(d) < 1e-6) return u;
  const total = (a + b) / 2;
  return (-a + Math.sqrt(a * a + 2 * d * u * total)) / d;
}

/**
 * @param {Float32Array|null} target  buffer to write into; allocated if null
 * @param {object} opts
 * @param {ArrayLike<number>} [opts.pick] point indices to place; default all
 * @param {number} [opts.tilt] radians about the shape's own origin
 * @param {number} [opts.scale]
 * @param {[number, number]} [opts.offset]
 */
export function buildKnife(
  target,
  { pick = null, tilt = 0, scale = 1, offset = [0, 0] } = {}
) {
  // Same seed every call, for the same reason the gun has one: a rescaled or
  // repositioned knife must be the same knife moved, not a fresh scatter.
  const rand = seededRandom(0x4b1f);
  const out = target ?? new Float32Array(POINTS * 3);

  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);
  const n = pick ? pick.length : POINTS;

  for (let k = 0; k < n; k++) {
    const i = pick ? pick[k] : k;
    const i3 = i * 3;

    const u = rand();
    let p = PARTS.length - 1;
    for (let q = 0; q < AREA_CDF.length; q++) {
      if (u <= AREA_CDF[q]) {
        p = q;
        break;
      }
    }

    const [x0, x1, l0, l1, h0, h1] = PARTS[p];
    const t = alongByArea(h0 - l0, h1 - l1, rand());
    const x = x0 + t * (x1 - x0);
    const low = l0 + t * (l1 - l0);
    const high = h0 + t * (h1 - h0);
    const y = low + rand() * (high - low);

    out[i3] = (x * cos - y * sin) * scale + offset[0];
    out[i3 + 1] = (x * sin + y * cos) * scale + offset[1];
    out[i3 + 2] = (rand() - 0.5) * 0.05 * scale;
  }

  return out;
}

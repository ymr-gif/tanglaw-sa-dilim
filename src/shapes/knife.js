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

/* ── The kitchen knife (Refusal panel only) ──────────────────────────────
 *
 * A slimmer, curved-profile kitchen knife for the Refusal weapon panel.
 * Distinct from PARTS/buildKnife above, which Threshold's falling-cleaver
 * beat depends on unchanged — this shape is never used there.
 *
 * Same local convention as PARTS: blade toward -x, handle toward +x, so
 * tilt and offset behave the same way for callers.
 */

/**
 * Blade in TWO tapering parts, not one — a single point-to-heel taper over
 * the whole length read as a triangle/arrowhead (tried first, rejected).
 * Splitting a short TIP from a longer BODY concentrates the point where it
 * belongs. NECK is the waist before the handle.
 * [x0, x1, l0, l1, h0, h1], same convention as PARTS above.
 *
 * The tip sits ON the spine line, not centred between the two edges — a
 * centred point read as a spearhead: both edges sweeping in equally to a
 * point centred in the blade's height is exactly a spear tip. A knife's
 * spine runs on straight, nearly level, and only the cutting edge sweeps up
 * from below to meet it — so the point lands where the spine already is,
 * with the whole blade hanging below that line.
 */
const SPINE_Y = 0.06;
const KITCHEN_TIP = [-0.46, -0.34, SPINE_Y, -0.05, SPINE_Y, 0.065];
const KITCHEN_BODY = [-0.34, 0.0, -0.05, -0.17, 0.065, 0.075];
const KITCHEN_NECK = [0.0, 0.03, -0.05, -0.05, -0.01, -0.01];

/**
 * The handle is a CAPSULE — a rectangle with two rounded end-caps, not an
 * ellipse. An ellipse handle was tried first and read as a ball on a stick;
 * a capsule keeps the elongated, roughly constant-width "grip" silhouette
 * an ellipse can't, while staying just as rounded. The caps are half-discs
 * (only the outward-facing half of each), the same technique the tip caps
 * in shapes/hands.js use — a full disc at each end would double-cover the
 * rectangle's own corners.
 *
 * Sized so the BLADE carries roughly two-thirds of the filled area, the
 * handle the other third. An earlier pass sized the handle nearly as large
 * as the blade and it read as a harpoon — a shaft with a bulb on the end —
 * rather than a knife.
 *
 * The capsule's aspect ratio matters as much as its area. A short, wide one
 * (length under 2x its own diameter) still reads as a ball once the point
 * sprites' glow blurs its corners — it has to run at least 3-4x longer than
 * it is wide to survive that blur as a visible grip rather than a blob.
 */
const CAP_R = 0.05;
const RECT_LEN = 0.28;
/** Handle centreline matches the neck's, so the grip continues the blade's
 *  own centreline rather than the spine's — the spine keeps running, but a
 *  hand doesn't grip along the very top edge of a blade. */
const HANDLE_Y = -0.03;
const LEFT_CAP_CX = KITCHEN_NECK[1] + CAP_R;
const RECT_X0 = LEFT_CAP_CX;
const RECT_X1 = RECT_X0 + RECT_LEN;
const RIGHT_CAP_CX = RECT_X1;
const KITCHEN_RECT = [RECT_X0, RECT_X1, HANDLE_Y - CAP_R, HANDLE_Y - CAP_R, HANDLE_Y + CAP_R, HANDLE_Y + CAP_R];

/** The four trapezoid parts, in order along the blade. */
const KITCHEN_PARTS = [KITCHEN_TIP, KITCHEN_BODY, KITCHEN_NECK, KITCHEN_RECT];

/** Per-part areas, cumulative — same pattern as AREA_CDF above, plus the two
 *  end-caps' combined area (one full circle) as the implicit final bucket
 *  (u past the last entry), split 50/50 between them at sampling time since
 *  both caps have identical area. */
const KITCHEN_AREA_CDF = (() => {
  const areas = KITCHEN_PARTS.map(([x0, x1, l0, l1, h0, h1]) =>
    (x1 - x0) * ((h0 - l0 + (h1 - l1)) / 2)
  );
  const capsArea = Math.PI * CAP_R * CAP_R;
  const total = areas.reduce((a, b) => a + b, 0) + capsArea;
  const cdf = new Float32Array(areas.length);
  let running = 0;
  for (let p = 0; p < areas.length; p++) {
    running += areas[p];
    cdf[p] = running / total;
  }
  return cdf;
})();

/**
 * @param {Float32Array|null} target  buffer to write into; allocated if null
 * @param {object} opts
 * @param {ArrayLike<number>} [opts.pick] point indices to place; default all
 * @param {number} [opts.tilt] radians about the shape's own origin
 * @param {number} [opts.scale]
 * @param {[number, number]} [opts.offset]
 */
export function buildKitchenKnife(
  target,
  { pick = null, tilt = 0, scale = 1, offset = [0, 0] } = {}
) {
  // Own seed, distinct from buildKnife's 0x4b1f — a rescaled or repositioned
  // knife must be the same knife moved, not a fresh scatter.
  const rand = seededRandom(0x6b1d);
  const out = target ?? new Float32Array(POINTS * 3);

  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);
  const n = pick ? pick.length : POINTS;

  for (let k = 0; k < n; k++) {
    const i = pick ? pick[k] : k;
    const i3 = i * 3;

    const u = rand();
    let x, y;
    let part = -1;

    for (let p = 0; p < KITCHEN_AREA_CDF.length; p++) {
      if (u <= KITCHEN_AREA_CDF[p]) {
        part = p;
        break;
      }
    }

    if (part >= 0) {
      // Blade (tip/body), neck, or the handle's own rectangle mid-section.
      // Same area-weighted taper as PARTS/alongByArea above, so tapering to
      // a point does not turn into a bright band there.
      const [x0, x1, l0, l1, h0, h1] = KITCHEN_PARTS[part];
      const t = alongByArea(h0 - l0, h1 - l1, rand());
      x = x0 + t * (x1 - x0);
      const low = l0 + t * (l1 - l0);
      const high = h0 + t * (h1 - h0);
      y = low + rand() * (high - low);
    } else {
      // One of the handle's two end-caps, chosen 50/50 (equal area). Each is
      // a half-disc — area-correct radius (R*sqrt(u)), angle confined to the
      // outward-facing 180° so it bulges past the rectangle's end rather
      // than doubling up on the rectangle's own corners.
      const left = rand() < 0.5;
      const cx = left ? LEFT_CAP_CX : RIGHT_CAP_CX;
      const r = CAP_R * Math.sqrt(rand());
      const theta = left
        ? Math.PI / 2 + rand() * Math.PI // 90°..270°, facing -x
        : -Math.PI / 2 + rand() * Math.PI; // -90°..90°, facing +x
      x = cx + Math.cos(theta) * r;
      y = HANDLE_Y + Math.sin(theta) * r;
    }

    out[i3] = (x * cos - y * sin) * scale + offset[0];
    out[i3 + 1] = (x * sin + y * cos) * scale + offset[1];
    out[i3 + 2] = (rand() - 0.5) * 0.05 * scale;
  }

  return out;
}

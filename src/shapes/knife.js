/**
 * knife.js — the chef's knife.
 *
 * ONE shape, used twice: falling point-down through the Threshold (`thresh-02`)
 * and lying in profile beside the gun in the Refusal (`ref-04`/`ref-05`). There
 * used to be two — a broad cleaver for the Threshold and a stubbier kitchen
 * knife for the Refusal — and the deck read as two different objects. It is one
 * knife now, and its outline is not invented: every number below was MEASURED
 * off the reference silhouette the author supplied, by aligning that image to
 * its own principal axis and reading the top and bottom envelopes off it.
 *
 * All proportions are therefore expressed in two units and nothing else:
 * BLADE_LEN along the shape, and DEPTH (the blade's depth at the heel, its
 * deepest point) across it. Re-proportioning the knife means changing those two
 * and leaving every ratio alone.
 *
 * WHAT THE MEASUREMENTS SAY, and what each one is doing to the read:
 *
 *   - The blade is 64.5% of the length and 4:1 long against its own depth. The
 *     old shapes were 2:1 and 3:1, which is why one read as a cleaver and the
 *     other as a hammer head. Four is where it starts reading as a knife.
 *   - The spine is DEAD STRAIGHT from the heel forward through 55% of the
 *     blade, and it carries straight on across the top of the handle too. One
 *     unbroken line along the top of the whole object is the single strongest
 *     cue in the silhouette. Curve it and this becomes a scimitar.
 *   - The point sits 24% of the depth BELOW that line — not on it, and not
 *     centred in the blade. Centred is a spearhead; on the spine is a scalpel.
 *   - The cutting edge leaves the heel almost flat and sweeps up to the point
 *     on a power curve. A straight edge makes a triangle, and a triangle is
 *     read as a shard rather than a blade.
 *   - The underside STEPS UP at the heel, by 40% of the depth, in the space of
 *     a couple of percent of the length. That step is the whole bolster. It is
 *     what stops the blade and handle merging into one L-shaped lump.
 *   - The handle's underside swells, waists, and then HOOKS DOWN at the butt
 *     before rounding off. That hook is what makes the object look held rather
 *     than machined, and it is the detail the eye misses but notices missing.
 *   - Two rivets, punched out as holes on the handle's centreline. In a point
 *     field a hole is cheap: it is simply where no point may land.
 *
 * Local convention, unchanged: blade toward -x, handle toward +x, so `tilt` and
 * `offset` behave the same way for both callers. A quarter turn the positive
 * way stands it up point-down, which is what the Threshold does with it.
 */

import { POINTS } from '../theme.js';
import { seededRandom } from '../noise.js';

/* ── The two units everything else is written in ────────────────────────── */

/** Tip to heel. The handle follows on from x = 0. */
const BLADE_LEN = 0.72;
/** The blade's depth at the heel — its deepest point, as on any chef's knife.
 *  Measured at BLADE_LEN / 4.05. */
const DEPTH = 0.178;

const TIP_X = -BLADE_LEN;
const HEEL_X = 0;
/** The one straight line along the top of the entire object. */
const SPINE_Y = 0.09;

/* ── The blade ──────────────────────────────────────────────────────────── */

const EDGE_HEEL_Y = SPINE_Y - DEPTH;
/** Measured: the point lands 24% of the depth below the spine line. */
const TIP_Y = SPINE_Y - 0.24 * DEPTH;
/** The spine runs level back to here — 55% of the blade — and only falls to
 *  the point over the front 45%. */
const SPINE_BREAK_X = TIP_X + 0.45 * BLADE_LEN;
/** How it falls over that stretch. Above 1 it holds level and then drops away,
 *  which is a knife; at 1 it is one long straight bevel, which is a scalpel. */
const SPINE_POW = 2.4;
/** How the cutting edge sweeps up to the tip. Above 2 it leaves the heel flat
 *  and puts the curvature in the front half, which is what was measured. */
const BELLY_POW = 2.3;

function bladeTop(x) {
  if (x >= SPINE_BREAK_X) return SPINE_Y;
  const t = (SPINE_BREAK_X - x) / (SPINE_BREAK_X - TIP_X);
  return SPINE_Y - (SPINE_Y - TIP_Y) * Math.pow(t, SPINE_POW);
}

function bladeBottom(x) {
  const s = (HEEL_X - x) / (HEEL_X - TIP_X);
  return EDGE_HEEL_Y + (TIP_Y - EDGE_HEEL_Y) * Math.pow(s, BELLY_POW);
}

/* ── The handle ─────────────────────────────────────────────────────────── */

/** Measured: handle is 35.5% of the length against the blade's 64.5%. */
const HANDLE_LEN = (BLADE_LEN * 0.355) / 0.645;
const HANDLE_X0 = HEEL_X;
const HANDLE_X1 = HANDLE_X0 + HANDLE_LEN;

/**
 * The handle's two edges, read straight off the reference at even stations and
 * kept as tables rather than fitted to a formula.
 *
 * Both are stated as DEPTHS BELOW THE SPINE, in units of DEPTH, against `u`
 * running 0 at the bolster to 1 at the butt. Writing them this way is what
 * makes the top table almost all zeroes for the first 40% — that is the spine
 * line continuing across the handle, and it should stay obvious at a glance.
 *
 * The bottom table is the one carrying the handle's character. Read it: 0.61 at
 * the bolster, out to 0.67 (the swell your fingers close on), back to 0.59 (the
 * waist), then 0.77 (the hook at the butt), then in again as it rounds off. No
 * formula was going to produce that sequence, and an eased curve through it
 * read as a bar of soap.
 */
const HANDLE_TOP = [
  [0.0, 0.0], [0.2, 0.005], [0.4, 0.01], [0.47, 0.02], [0.54, 0.036],
  [0.61, 0.052], [0.68, 0.069], [0.75, 0.1], [0.83, 0.13], [0.9, 0.167],
  [1.0, 0.215],
];

const HANDLE_BOTTOM = [
  [0.0, 0.607], [0.12, 0.604], [0.19, 0.628], [0.26, 0.65], [0.33, 0.666],
  [0.4, 0.672], [0.47, 0.665], [0.54, 0.639], [0.61, 0.594], [0.68, 0.597],
  [0.75, 0.69], [0.83, 0.768], [0.9, 0.757], [1.0, 0.64],
];

/** Straight-line interpolation between stations. The stations are close enough
 *  together that a smoother scheme changes nothing a point field can show. */
function lerpTable(table, u) {
  if (u <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    if (u <= table[i][0]) {
      const [ua, va] = table[i - 1];
      const [ub, vb] = table[i];
      return va + ((vb - va) * (u - ua)) / (ub - ua);
    }
  }
  return table[table.length - 1][1];
}

/** The butt is rounded, not sawn off. The last few percent narrow elliptically
 *  about the handle's own centreline, which works whatever the thickness is
 *  doing there — a half-disc cap would need a constant thickness to cap. */
const BUTT_START = 0.94;

const handleU = (x) => (x - HANDLE_X0) / HANDLE_LEN;

function handleEdges(x) {
  const u = handleU(x);
  let top = SPINE_Y - lerpTable(HANDLE_TOP, u) * DEPTH;
  let bottom = SPINE_Y - lerpTable(HANDLE_BOTTOM, u) * DEPTH;
  if (u > BUTT_START) {
    const k = (u - BUTT_START) / (1 - BUTT_START);
    const shrink = Math.sqrt(Math.max(0, 1 - k * k));
    const mid = (top + bottom) / 2;
    const half = ((top - bottom) / 2) * shrink;
    top = mid + half;
    bottom = mid - half;
  }
  return [bottom, top];
}

const handleBottom = (x) => handleEdges(x)[0];
const handleTop = (x) => handleEdges(x)[1];

/**
 * The rivets, as [x, y, radius]. Measured at 12% and 84% along the handle, both
 * on its centreline, both a shade under a tenth of DEPTH across.
 */
const RIVETS = [0.118, 0.836].map((u) => {
  const x = HANDLE_X0 + u * HANDLE_LEN;
  const [lo, hi] = handleEdges(x);
  return [x, (lo + hi) / 2, 0.098 * DEPTH];
});

/* ── Sampling ───────────────────────────────────────────────────────────── */

/**
 * A region between two curves over an x-range, sampled at uniform density.
 *
 * The old version of this file described every part as a trapezoid so its area
 * could be integrated in closed form and inverted. A curved belly has no such
 * form, so the integral is done numerically instead: slice the range into
 * columns, take each column's depth, and keep the running sum as a CDF. Picking
 * a column against that CDF and then a y uniformly inside it is uniform over
 * the region, curve or no curve — which is the property that matters, because
 * an uneven density renders as a bright band and reads as a highlight nobody
 * asked for.
 */
const COLUMNS = 384;

function band(x0, x1, low, high) {
  const dx = (x1 - x0) / COLUMNS;
  const cdf = new Float32Array(COLUMNS);
  let total = 0;
  for (let c = 0; c < COLUMNS; c++) {
    const x = x0 + (c + 0.5) * dx;
    total += Math.max(0, high(x) - low(x));
    cdf[c] = total;
  }
  for (let c = 0; c < COLUMNS; c++) cdf[c] /= total;
  return { x0, dx, cdf, low, high, area: total * dx };
}

const BANDS = [
  band(TIP_X, HEEL_X, bladeBottom, bladeTop),
  band(HANDLE_X0, HANDLE_X1, handleBottom, handleTop),
];

/** Cumulative share of the filled area, so blade and handle come out at one
 *  density rather than half the points each. */
const BAND_CDF = (() => {
  const total = BANDS.reduce((a, b) => a + b.area, 0);
  const cdf = new Float32Array(BANDS.length);
  let running = 0;
  for (let i = 0; i < BANDS.length; i++) {
    running += BANDS[i].area;
    cdf[i] = running / total;
  }
  return cdf;
})();

function pickBand(u) {
  for (let i = 0; i < BAND_CDF.length; i++) if (u <= BAND_CDF[i]) return BANDS[i];
  return BANDS[BANDS.length - 1];
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
  // Same seed every call: a rescaled or repositioned knife must be the same
  // knife moved, not a fresh scatter.
  const rand = seededRandom(0x4b1f);
  const out = target ?? new Float32Array(POINTS * 3);

  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);
  const n = pick ? pick.length : POINTS;

  for (let k = 0; k < n; k++) {
    const i = pick ? pick[k] : k;
    const i3 = i * 3;

    let x = 0;
    let y = 0;
    // Redraw the WHOLE sample when it lands in a rivet — band and all. Nudging
    // the point out instead would pile a bright rim around each hole, and
    // retrying within the same band would quietly raise the handle's density.
    for (let attempt = 0; attempt < 32; attempt++) {
      const b = pickBand(rand());
      const u = rand();
      let c = 0;
      let lo = 0;
      let hi = COLUMNS - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (b.cdf[mid] < u) lo = mid + 1;
        else {
          c = mid;
          hi = mid - 1;
        }
      }
      x = b.x0 + (c + rand()) * b.dx;
      const low = b.low(x);
      y = low + rand() * (b.high(x) - low);

      let inRivet = false;
      for (let r = 0; r < RIVETS.length; r++) {
        const [rx, ry, rr] = RIVETS[r];
        const ddx = x - rx;
        const ddy = y - ry;
        if (ddx * ddx + ddy * ddy < rr * rr) {
          inRivet = true;
          break;
        }
      }
      if (!inRivet) break;
    }

    out[i3] = (x * cos - y * sin) * scale + offset[0];
    out[i3 + 1] = (x * sin + y * cos) * scale + offset[1];
    out[i3 + 2] = (rand() - 0.5) * 0.05 * scale;
  }

  return out;
}

/**
 * Unit-scale extent and filled area, for callers that have to solve a scale
 * against another shape's — refusal.js matches this knife's filled AREA to the
 * gun's, because each weapon gets half the point field and equal area is
 * therefore equal density. Derived from the geometry above rather than written
 * down, so re-proportioning the knife cannot leave a stale constant behind.
 */
export const KNIFE_METRICS = {
  length: HANDLE_X1 - TIP_X,
  height: SPINE_Y - EDGE_HEEL_Y,
  area:
    BANDS.reduce((a, b) => a + b.area, 0) -
    RIVETS.reduce((a, [, , r]) => a + Math.PI * r * r, 0),
};

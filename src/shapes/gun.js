/**
 * gun.js — the handgun, in side profile.
 *
 * Built from rectangles, the same technique as the chair silhouette in
 * `mask.js`'s `seat()` — proven to read at this point density, needs no asset,
 * and stays tunable by numbers rather than by redrawing.
 *
 * TWO CALLERS, ONE SHAPE.
 *
 *   Effects (`docs/superpowers/plans/2026-09-02-effects-sequence.md`) builds it
 *   from the four broken shards of the child's mask, whole field, at origin:
 *   pass `shardOf` and the points keep their shard identity — shard 0 becomes
 *   the grip, 1 the slide, 2 the barrel, and 3, the intruder, becomes the
 *   trigger and the muzzle. The child's four wounds become the weapon's four
 *   parts. Nothing says this out loud; the geometry says it. That mapping is
 *   load-bearing, not arbitrary.
 *
 *   Refusal needs the same silhouette smaller, mirrored and off to one side,
 *   built from a SUBSET of the field because the knife and the hands have the
 *   rest: pass `pick`, `scale`, `flip` and `offset` and leave `shardOf` unset.
 *   Without a shard mapping the parts are filled by area instead, so a subset
 *   still comes out at an even density.
 *
 * The audience has watched this exact silhouette fire. Seeing it crushed in
 * Refusal is the answer to that, which is why it is reused rather than redrawn.
 */

import { POINTS } from '../theme.js';
import { seededRandom } from '../noise.js';

/**
 * Muzzle pointing right, in the same normalised space the mask uses (roughly
 * -1..1). Rectangles are [x0, x1, y0, y1], grouped by shard.
 *
 * THREE THINGS MAKE THIS READ AS A HANDGUN rather than as a bracket, and all
 * three were added after looking at the first version on screen:
 *
 *   The grip RAKES BACK. A vertical grip reads as a right angle; a raked one
 *   reads as a pistol. There is no rotated-rectangle primitive here, so the
 *   rake is a staircase of five rectangles — at this point density the steps
 *   disappear and only the lean survives.
 *
 *   There is a TRIGGER GUARD. It is the single most recognisable feature of the
 *   silhouette; without the loop the trigger is just a notch in the frame.
 *
 *   The barrel is SLIMMER than the slide and starts where the slide ends, so
 *   the two read as different parts instead of one long bar.
 */
const PARTS = [
  // 0 grip — eight steps, each one further left as it descends. ~16 degrees.
  // Eight rather than four: at four the staircase is visible as steps along the
  // backstrap, and a stepped grip reads as a mistake rather than as a rake.
  [
    [-0.66, -0.34, -0.09, 0.0],
    [-0.68, -0.36, -0.18, -0.09],
    [-0.70, -0.38, -0.27, -0.18],
    [-0.72, -0.40, -0.36, -0.27],
    [-0.75, -0.43, -0.45, -0.36],
    [-0.77, -0.45, -0.54, -0.45],
    [-0.79, -0.47, -0.63, -0.54],
    [-0.82, -0.50, -0.72, -0.63],
  ],
  // 1 slide — the top slab.
  [[-0.7, 0.34, 0.08, 0.32]],
  // 2 barrel, and the frame it sits on. The frame runs out to x = 0 so the
  // trigger guard has something to hang from; stopping it short leaves the
  // guard floating in the gap between grip and barrel, which is what the first
  // version did.
  [
    [0.34, 0.88, 0.12, 0.28],
    [-0.7, 0.0, -0.02, 0.08],
  ],
  // 3 the intruder shard: trigger, its guard, and the muzzle.
  [
    [-0.28, -0.2, -0.2, -0.04], // trigger
    [-0.34, -0.02, -0.3, -0.22], // guard, bottom bar
    [-0.08, 0.0, -0.3, -0.02], // guard, front post
    [0.88, 0.96, 0.1, 0.3], // muzzle
  ],
];

/** Recoil pivots here — the web of the grip, not the centre of the shape. */
const PIVOT = [-0.46, -0.3];

/**
 * A cumulative-area table over a list of rectangles.
 *
 * Everything here fills BY AREA, never by rectangle count. Picking uniformly
 * gives a tiny rectangle the same share of the points as a large one, and at
 * this density that is not a subtle difference — the muzzle and the trigger
 * come out as solid white blocks beside a grainy grip.
 */
function areaCdf(rects) {
  const cdf = new Float32Array(rects.length);
  let total = 0;
  for (let r = 0; r < rects.length; r++) {
    total += (rects[r][1] - rects[r][0]) * (rects[r][3] - rects[r][2]);
    cdf[r] = total;
  }
  for (let r = 0; r < cdf.length; r++) cdf[r] /= total;
  return cdf;
}

function pickRect(rects, cdf, u) {
  for (let r = 0; r < cdf.length; r++) {
    if (u <= cdf[r]) return rects[r];
  }
  return rects[rects.length - 1];
}

/** Per-shard tables, for the Effects staging. */
const PART_CDF = PARTS.map(areaCdf);

/** One table over every rectangle, for callers with no shard mapping. */
const ALL = PARTS.flat();
const ALL_CDF = areaCdf(ALL);

/**
 * @param {Float32Array|null} target  buffer to write into; allocated if null
 * @param {object} opts
 * @param {Uint8Array} [opts.shardOf] per-point shard — keeps the Effects staging
 * @param {ArrayLike<number>} [opts.pick] point indices to place; default all
 * @param {number} [opts.tilt] radians about the grip pivot (Effects recoil)
 * @param {number} [opts.scale]
 * @param {boolean} [opts.flip] mirror in x — muzzle points left
 * @param {[number, number]} [opts.offset]
 */
export function buildGun(
  target,
  { shardOf = null, pick = null, tilt = 0, scale = 1, flip = false, offset = [0, 0] } = {}
) {
  // Same seed every call, so a recoiled or rescaled gun is the SAME gun moved
  // rather than a fresh scatter. Reseeding here would make the points jump.
  const rand = seededRandom(0x9d17);
  const out = target ?? new Float32Array(POINTS * 3);

  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);
  const mirror = flip ? -1 : 1;
  const n = pick ? pick.length : POINTS;

  for (let k = 0; k < n; k++) {
    const i = pick ? pick[k] : k;
    const i3 = i * 3;

    let r;
    if (shardOf) {
      const shard = shardOf[i];
      r = pickRect(PARTS[shard], PART_CDF[shard], rand());
    } else {
      r = pickRect(ALL, ALL_CDF, rand());
    }

    const x = r[0] + rand() * (r[1] - r[0]);
    const y = r[2] + rand() * (r[3] - r[2]);

    const px = x - PIVOT[0];
    const py = y - PIVOT[1];

    const rx = PIVOT[0] + px * cos - py * sin;
    const ry = PIVOT[1] + px * sin + py * cos;

    out[i3] = rx * scale * mirror + offset[0];
    out[i3 + 1] = ry * scale + offset[1];
    out[i3 + 2] = (rand() - 0.5) * 0.05 * scale;
  }

  return out;
}

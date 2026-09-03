/**
 * cracks.js — the whole composition, broken along lines radiating from the
 * knife's entry point.
 *
 * This is `mask.js`'s `assignShards` technique applied to the frame instead
 * of the face: sectors by ANGLE around one origin, with the sector boundary
 * perturbed by radius so each crack wanders instead of running a straight
 * line out from the impact point. Reused deliberately rather than
 * reinvented — see the comment on `assignShards` in mask.js for why nearest-
 * anchor / Voronoi splitting is the wrong tool here (it produces straight
 * bisector cuts, which read as a sliced image, not a cracked one).
 *
 * DISPLACEMENT IS SMALL, ON PURPOSE. The Effects plan learned this the hard
 * way: past a certain distance a "crack" stops reading as breakage in one
 * picture and starts reading as several unrelated pieces drifting apart. The
 * composition has to stay findable as itself, only broken.
 *
 * TWO CALLERS, ONE SHATTER.
 *
 *   Threshold (`thresh-02`) breaks the WHOLE picture about the knife's entry
 *   point: `buildCracks(ARRIVED, ORIGIN)` with every point.
 *
 *   Refusal (`ref-06`) breaks a single WEAPON about its grip. That is a
 *   smaller, tighter crack — a thing being torn apart in a hand, not a whole
 *   picture breaking — so it passes `pick` (that weapon's point subset) to
 *   leave the rest of the field alone, and lower displacement / rotation so
 *   the shards read as breaking OUT of the grip rather than as the whole
 *   frame shattering. Same wedge machinery underneath; only the scope and
 *   violence differ.
 */

import { POINTS } from '../theme.js';
import { seededRandom } from '../noise.js';

const TAU = Math.PI * 2;

/**
 * The shatter is small by default so the composition stays findable as one
 * broken picture (see the header note). `thresh-02` asks for MORE violence,
 * so the displacement and per-wedge wander are pushed up from the stock
 * values: the wedges still hinge on the knife's entry point and stay legible,
 * but the break reads as a hard, wide shatter instead of a hairline crack.
 */

/** ~7 wedges, per the storyboard's shatter — enough to read as broken glass,
 *  few enough that each wedge is still a legible chunk of the picture. */
const WEDGES = 7;

/** How far a wedge travels outward. Bigger = the wider shatter thresh-02 wants. */
const DISPLACE = 0.135;
const DISPLACE_VAR = 0.055;

/** Rotation per wedge — more turn reads as a more violent crumple. */
const ROT_MAX = 0.095;

/** "crack" — fixed so the same knife strike produces the same break every run. */
const SEED = 0xc4ac0001;

/**
 * @param {Float32Array} source  the intact shape the shards come out of
 * @param {[number, number]|[number]} origin  the crack's hinge point
 * @param {object} [opts]
 * @param {ArrayLike<number>} [opts.pick]  point indices to crack; default all.
 *        Unpicked points are copied through untouched, so a single weapon can
 *        be taken apart while the rest of the field holds.
 * @param {number} [opts.wedges]  wedge count for THIS call — defaults to WEDGES
 * @param {number} [opts.displace]  defaults to DISPLACE — the local (Refusal)
 *        tear uses a smaller value, because a weapon breaking in a grip is not
 *        the whole frame shattering
 * @param {number} [opts.rot]  defaults to ROT_MAX — same reason, scaled down
 */
export function buildCracks(source, origin, opts = {}) {
  const ox = origin.x ?? origin[0] ?? 0;
  const oy = origin.y ?? origin[1] ?? 0;
  const pick = opts.pick ?? null;
  const wedges = opts.wedges ?? WEDGES;
  const displace = opts.displace ?? DISPLACE;
  const rotMax = opts.rot ?? ROT_MAX;

  // A different seed per call, so two weapons split apart independently rather
  // than as rotational copies of each other. Within one call it is fixed, so
  // the same weapon makes the same break every run. The Threshold's single-call
  // usage gets exactly the old SEED, so its break does not move.
  const seed = opts.seed ?? (pick && pick.length ? 0x7e3a8001 + (pick.length & 0xff) : SEED);
  const rand = seededRandom(seed);

  // Per-wedge outward direction (its own angular bisector), rotation and
  // reach — decided once so every point in a wedge moves as one rigid piece,
  // the way mask.js's FRACTURE table drives its four shards.
  const wedge = [];
  for (let w = 0; w < wedges; w++) {
    const mid = (w + 0.5) * (TAU / wedges);
    wedge.push({
      dir: [Math.cos(mid), Math.sin(mid)],
      rot: (rand() * 2 - 1) * rotMax,
      mag: displace + (rand() * 2 - 1) * DISPLACE_VAR,
    });
  }

  // Copy the source through first so UNPICKED points pass untouched — the
  // caller merges several cracked subsets over one base, so a pick must not
  // zero the rest of the field.
  const out = source.slice();

  const n = pick ? pick.length : POINTS;

  for (let k = 0; k < n; k++) {
    const i = pick ? pick[k] : k;
    const i3 = i * 3;
    const x = source[i3];
    const y = source[i3 + 1];
    const z = source[i3 + 2];

    const dx = x - ox;
    const dy = y - oy;
    const r = Math.hypot(dx, dy);

    // Same wobble shape as mask.js's assignShards: mostly one low frequency
    // so the crack stays a line while it wanders, a little of a higher one
    // for fine jag, and a positional term so the seven cracks are not
    // rotational copies of one another.
    const wobble =
      0.22 * Math.sin(r * 6.5 + 1.3) +
      0.05 * Math.sin(r * 15.0 + 0.4) +
      0.04 * Math.sin(x * 7.0 + y * 5.0);

    let a = Math.atan2(dy, dx) + wobble;
    a = ((a % TAU) + TAU) % TAU;

    const w = Math.min(wedges - 1, Math.floor((a / TAU) * wedges));
    const s = wedge[w];

    // Pivot about the knife's entry point, not the wedge's own centroid.
    // Rotating about a shared origin keeps every wedge hinged to its
    // neighbours, so the gap is hairline near the knife and widest at the
    // rim — a crack, not pieces sliding past each other.
    const cos = Math.cos(s.rot);
    const sin = Math.sin(s.rot);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;

    out[i3] = ox + rx + s.dir[0] * s.mag;
    out[i3 + 1] = oy + ry + s.dir[1] * s.mag;
    out[i3 + 2] = z + (rand() - 0.5) * 0.03;
  }

  return out;
}

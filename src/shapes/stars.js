/**
 * stars.js — what the hands become.
 *
 * "Change hands to stars and the dense particles will fade." Not one light but
 * many: the thing that did the saving becomes the thing that endures.
 *
 * Each star is five spokes radiating from a centre rather than a filled
 * ten-gon. A filled star at this point density is a blob; spokes that taper to
 * nothing at the tip actually read as a star glyph, and they hold the read at
 * projector contrast, which is the only place it matters.
 *
 * These must not be confusable with the Q&A ember field, the nearest existing
 * thing in the deck. Embers are loose, dim, warm-multicoloured and orbiting.
 * These are discrete, bright, yellow, and they hold position.
 */

import { POINTS } from '../theme.js';
import { seededRandom } from '../noise.js';

const SPOKES = 5;
const OUTER = 0.075;
const INNER = 0.028;

/** Roughly what the storyboard draws, scattered across the frame. */
const DEFAULT_COUNT = 20;
const SPAN_X = 1.85;
const SPAN_Y = 0.95;

/**
 * Laid out on a jittered grid rather than by plain random placement.
 *
 * Twenty independent draws over a frame this wide reliably leaves one quarter
 * of it empty and clumps three stars together somewhere else — which reads as a
 * mistake, not as a sky. Stratifying keeps the coverage even and the jitter
 * keeps it from reading as a grid.
 */
const GRID_COLS = 5;

/**
 * @param {Float32Array|null} target  positions; allocated if null
 * @param {Float32Array|null} phase   per-point breathing phase; allocated if null
 * @param {object} opts
 * @param {ArrayLike<number>} [opts.pick] point indices to place; default all
 * @param {number} [opts.count]
 */
export function buildStars(target, phase, { pick = null, count = DEFAULT_COUNT } = {}) {
  const rand = seededRandom(0x57a2);
  const positions = target ?? new Float32Array(POINTS * 3);
  const phases = phase ?? new Float32Array(POINTS);

  // Each point's rest offset from its own star's centre, in the x/y plane.
  // Scaled per frame, this is how a star breathes in SIZE — multiplying the
  // spoke offsets about the centre reads as the star swelling and shrinking.
  const offset = new Float32Array(POINTS * 3);

  const rows = Math.max(1, Math.ceil(count / GRID_COLS));
  const stars = [];

  for (let s = 0; s < count; s++) {
    const col = s % GRID_COLS;
    const row = Math.floor(s / GRID_COLS);
    // Cell centre, then jitter almost a whole cell so the grid never shows.
    const u = (col + 0.5 + (rand() - 0.5) * 0.9) / GRID_COLS;
    const v = (row + 0.5 + (rand() - 0.5) * 0.9) / rows;

    stars.push({
      x: (u * 2 - 1) * SPAN_X,
      y: (v * 2 - 1) * SPAN_Y,
      spin: rand() * Math.PI * 2,
      size: 0.75 + rand() * 0.5,
      phase: rand() * Math.PI * 2,
    });
  }

  const n = pick ? pick.length : POINTS;

  for (let k = 0; k < n; k++) {
    const i = pick ? pick[k] : k;
    const i3 = i * 3;

    const star = stars[(rand() * stars.length) | 0];
    const spoke = (rand() * SPOKES) | 0;

    // Along the spoke, biased outward so the tips stay sharp rather than the
    // centre swallowing every point.
    const t = Math.sqrt(rand());
    const angle = star.spin + (Math.PI * 2 * spoke) / SPOKES;

    // The spoke narrows to nothing at the tip. INNER is its half-width at the
    // centre, which is also what sets the star's inner radius by eye.
    const half = INNER * (1 - t);
    const along = t * OUTER * star.size;
    const across = (rand() * 2 - 1) * half * star.size;

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const ox = along * cos - across * sin;
    const oy = along * sin + across * cos;

    positions[i3] = star.x + ox;
    positions[i3 + 1] = star.y + oy;
    positions[i3 + 2] = (rand() - 0.5) * 0.05;

    offset[i3] = ox;
    offset[i3 + 1] = oy;
    offset[i3 + 2] = 0;

    // Whole stars breathe together and out of phase with each other. Phasing
    // per point would be a shimmer, which is the ember field's idiom.
    phases[i] = star.phase;
  }

  return { positions, phase: phases, offset };
}

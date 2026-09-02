/**
 * student.js — the lone figure at the start of Threshold.
 *
 * The storyboard draws the simplest possible kid: a circle head on a cone
 * body, plus a mortarboard — diamond board, band, tassel — so the figure
 * reads as a student without a label. Added on request; kept inside the
 * deck's existing constraints rather than as a new object: it is still one
 * silhouette in the single THRESHOLD.student yellow, still sampled into the
 * same fixed POINTS budget as everything else here. It is still the
 * abstract child, not a specific rendered person — just one now wearing
 * something unambiguous.
 */

import { POINTS } from '../theme.js';
import { seededRandom } from '../noise.js';

/** Head: a filled disc. Body: a cone, narrow at the neck, wide at the hem. */
const HEAD = { cy: 0.30, r: 0.135 };
const BODY = { yTop: 0.17, yBot: -0.34, wTop: 0.05, wBot: 0.20 };

/** Cap band: a short rectangle resting on the head, under the board. */
const CAP_BAND = { yTop: 0.435, yBot: 0.395, halfW: 0.10 };

/** Cap board: the flat diamond on top, wide and short — a mortarboard, not a kite. */
const CAP_BOARD = { cy: 0.485, halfW: 0.30, halfH: 0.095 };

/** Tassel: a thin string from the board's corner down to a small tuft. */
const TASSEL = {
  attach: [0.22, 0.46],
  end: [0.19, 0.20],
  stringHalfW: 0.010,
  tuftR: 0.035,
  tuftShare: 0.25, // fraction of the tassel's own points spent on the tuft
};

/** Share of points spent on each region. The rest goes to the body-cone. */
const HEAD_SHARE = 0.28;
const CAP_BAND_SHARE = 0.03;
const CAP_BOARD_SHARE = 0.11;
const TASSEL_SHARE = 0.03;

/** "student" — fixed so the figure samples identically on every boot. */
const SEED = 0x57ade57;

export function buildStudent({ scale = 1, offset = [0, 0] } = {}) {
  const rand = seededRandom(SEED);
  const out = new Float32Array(POINTS * 3);

  const bandAt = HEAD_SHARE + CAP_BAND_SHARE;
  const boardAt = bandAt + CAP_BOARD_SHARE;
  const tasselAt = boardAt + TASSEL_SHARE;

  for (let i = 0; i < POINTS; i++) {
    const i3 = i * 3;
    const roll = rand();
    let x, y;

    if (roll < HEAD_SHARE) {
      // Rejection-sample the disc so the edge stays a circle, not a square
      // with corners cut off.
      do {
        x = rand() * 2 - 1;
        y = rand() * 2 - 1;
      } while (x * x + y * y > 1);
      x *= HEAD.r;
      y = HEAD.cy + y * HEAD.r;
    } else if (roll < bandAt) {
      x = (rand() * 2 - 1) * CAP_BAND.halfW;
      y = CAP_BAND.yBot + rand() * (CAP_BAND.yTop - CAP_BAND.yBot);
    } else if (roll < boardAt) {
      // Rejection-sample a diamond (L1 disc) so the board reads as a flat
      // mortarboard tilted toward camera, not a square with square corners.
      do {
        x = rand() * 2 - 1;
        y = rand() * 2 - 1;
      } while (Math.abs(x) + Math.abs(y) > 1);
      x *= CAP_BOARD.halfW;
      y = CAP_BOARD.cy + y * CAP_BOARD.halfH;
    } else if (roll < tasselAt) {
      if (rand() < TASSEL.tuftShare) {
        // The tuft at the end of the string: a small dense cluster.
        let dx, dy;
        do {
          dx = rand() * 2 - 1;
          dy = rand() * 2 - 1;
        } while (dx * dx + dy * dy > 1);
        x = TASSEL.end[0] + dx * TASSEL.tuftR;
        y = TASSEL.end[1] + dy * TASSEL.tuftR;
      } else {
        const t = rand();
        x =
          TASSEL.attach[0] + t * (TASSEL.end[0] - TASSEL.attach[0]) +
          (rand() * 2 - 1) * TASSEL.stringHalfW;
        y = TASSEL.attach[1] + t * (TASSEL.end[1] - TASSEL.attach[1]);
      }
    } else {
      // Cone: walk down the body and widen linearly. Sampling `t` uniformly
      // rather than area-correcting the width means the narrow neck comes out
      // slightly denser than the hem — the same bias a real cone silhouette
      // has when filled with a flat scatter, so it is left alone.
      const t = rand();
      y = BODY.yTop + t * (BODY.yBot - BODY.yTop);
      const w = BODY.wTop + t * (BODY.wBot - BODY.wTop);
      x = (rand() * 2 - 1) * w;
    }

    out[i3] = offset[0] + x * scale;
    out[i3 + 1] = offset[1] + y * scale;
    // Volume, not flatness — a flat cutout reads as a paper doll under drift.
    out[i3 + 2] = (rand() - 0.5) * 0.05;
  }

  return out;
}

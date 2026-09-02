/**
 * student.js — the lone figure at the start of Threshold.
 *
 * The storyboard draws the simplest possible kid: a circle head on a cone
 * body. That is deliberate, not a placeholder — the mask is the deck's only
 * detailed form, and a second detailed silhouette here would compete with it.
 * Simplicity is also what keeps this a child in the abstract rather than a
 * specific rendered person, which matters given who this section is about.
 */

import { POINTS } from '../theme.js';
import { seededRandom } from '../noise.js';

/** Head: a filled disc. Body: a cone, narrow at the neck, wide at the hem. */
const HEAD = { cy: 0.30, r: 0.135 };
const BODY = { yTop: 0.17, yBot: -0.34, wTop: 0.05, wBot: 0.20 };

/** Share of points spent on the head vs the body-cone. */
const HEAD_SHARE = 0.34;

/** "student" — fixed so the figure samples identically on every boot. */
const SEED = 0x57ade57;

export function buildStudent({ scale = 1, offset = [0, 0] } = {}) {
  const rand = seededRandom(SEED);
  const out = new Float32Array(POINTS * 3);

  for (let i = 0; i < POINTS; i++) {
    const i3 = i * 3;
    let x, y;

    if (rand() < HEAD_SHARE) {
      // Rejection-sample the disc so the edge stays a circle, not a square
      // with corners cut off.
      do {
        x = rand() * 2 - 1;
        y = rand() * 2 - 1;
      } while (x * x + y * y > 1);
      x *= HEAD.r;
      y = HEAD.cy + y * HEAD.r;
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

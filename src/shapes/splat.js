/**
 * splat.js — the stain the bullet becomes.
 *
 * There is no figure and nothing is struck on screen. The bullet cluster and
 * its wind streaks — all 17000 points — convert straight into the stain: the
 * thing that was travelling becomes the consequence of its travelling, which is
 * a cleaner image than either a body or a stain fading in from nowhere. Blood
 * arriving in empty air is worse than blood on a drawn figure, because what an
 * audience imagines is worse than what can be rendered at this point density.
 * Same principle as the empty seat this section retired.
 *
 * THREE COMPONENTS, because a single radial spray reads as a firework:
 *
 *   Core        several overlapping blobs of different sizes, merged. NOT a
 *               circle with a noisy radius: a radius function of angle is
 *               symmetric about its own frequencies, so it comes out as petals
 *               with bright seams where the radius is small and the points
 *               pile up — a flower, which is the first thing this looked like.
 *               Real splatter is one mass with smaller ones run into it.
 *   Satellites  droplets flung outward, density falling as 1/r^2 and biased
 *               RIGHTWARD. The bullet travels left to right, so the stain
 *               throws that way and the direction of the shot stays legible in
 *               it. Droplets, not single points: one point at this size is a
 *               speck, six together are a drop.
 *   Drips       five short tails running down from the core's lower edge, each
 *               thinning as it descends.
 */

import { POINTS } from '../theme.js';
import { seededRandom } from '../noise.js';

const CORE_SHARE = 0.55;
const SAT_SHARE = 0.3;
/** The rest are drips. */

/**
 * Satellites live between these radii.
 *
 * The outer bound is set by what the camera can actually see. `eff-02` dollies
 * forward to z ~ 1.3, where the visible half-height is only about 0.6 — so a
 * spray reaching 1.15 puts most of its droplets outside the frame and the ones
 * left inside read as an evenly spread starfield rather than as a spray thrown
 * from a stain.
 */
const SAT_MIN = 0.2;
const SAT_MAX = 0.78;

/** Points per droplet. */
const DROP = 6;

const DRIPS = 5;

/**
 * The core, as overlapping blobs.
 *
 * [x, y, radius, weight]. One large mass slightly left of centre, with smaller
 * ones merged into it — heavier to the right, where the bullet was going. The
 * weights are sampling weights, not areas: the overlaps are what make the
 * density uneven, and uneven density is most of what makes it read as a stain
 * rather than as a shape.
 */
const BLOBS = [
  [-0.03, 0.01, 0.22, 1.0],
  [0.11, 0.06, 0.15, 0.55],
  [-0.14, -0.06, 0.13, 0.45],
  [0.08, -0.11, 0.12, 0.4],
  [-0.06, 0.14, 0.1, 0.3],
  [0.21, -0.03, 0.09, 0.28],
  [0.02, -0.18, 0.08, 0.22],
  [-0.19, 0.09, 0.07, 0.18],
];

const BLOB_CDF = (() => {
  const cdf = new Float32Array(BLOBS.length);
  let total = 0;
  for (let b = 0; b < BLOBS.length; b++) {
    total += BLOBS[b][3];
    cdf[b] = total;
  }
  for (let b = 0; b < cdf.length; b++) cdf[b] /= total;
  return cdf;
})();

/**
 * Where the drips start. Inside the mass, not at its lowest extent: the core's
 * underside is a different height at every x, so hanging the drips off the
 * deepest point leaves the outer ones floating below a gap.
 */
const CORE_BOTTOM = -0.15;

export function buildSplat() {
  const rand = seededRandom(0xb100d);
  const out = new Float32Array(POINTS * 3);

  const coreEnd = Math.floor(POINTS * CORE_SHARE);
  const satEnd = coreEnd + Math.floor(POINTS * SAT_SHARE);

  /* ── Core ─────────────────────────────────────────────────────────────── */
  for (let i = 0; i < coreEnd; i++) {
    const i3 = i * 3;

    const u = rand();
    let b = BLOBS.length - 1;
    for (let k = 0; k < BLOB_CDF.length; k++) {
      if (u <= BLOB_CDF[k]) { b = k; break; }
    }

    const a = rand() * Math.PI * 2;
    // sqrt keeps the area density even inside one blob; the overlaps between
    // blobs are then the only thing making the mass uneven, which is what a
    // stain looks like.
    const r = BLOBS[b][2] * Math.sqrt(rand());

    out[i3] = BLOBS[b][0] + Math.cos(a) * r;
    out[i3 + 1] = BLOBS[b][1] + Math.sin(a) * r * 0.92;
    out[i3 + 2] = (rand() - 0.5) * 0.09;
  }

  /* ── Satellites ───────────────────────────────────────────────────────── */
  const ratio = Math.log(SAT_MAX / SAT_MIN);

  for (let i = coreEnd; i < satEnd; i += DROP) {
    // One droplet centre, then DROP points scattered tightly around it.
    let a = 0;
    for (let tries = 0; tries < 8; tries++) {
      a = rand() * Math.PI * 2;
      // Rightward bias. Nothing is excluded outright — a stain that threw only
      // one way reads as a comet.
      const w = 0.12 + 0.88 * ((0.5 + 0.5 * Math.cos(a)) ** 3);
      if (rand() < w) break;
    }

    // Log-uniform radius IS the 1/r^2 falloff: with density per unit area
    // proportional to 1/r^2, the radial mass per unit r is constant / r.
    const r = SAT_MIN * Math.exp(rand() * ratio);
    const spread = 0.012 + (r / SAT_MAX) * 0.05;

    const cx = Math.cos(a) * r;
    const cy = Math.sin(a) * r * 0.85;

    for (let k = 0; k < DROP && i + k < satEnd; k++) {
      const i3 = (i + k) * 3;
      out[i3] = cx + (rand() - 0.5) * spread;
      out[i3 + 1] = cy + (rand() - 0.5) * spread;
      out[i3 + 2] = (rand() - 0.5) * 0.07;
    }
  }

  /* ── Drips ────────────────────────────────────────────────────────────── */
  for (let i = satEnd; i < POINTS; i++) {
    const i3 = i * 3;

    const d = (i - satEnd) % DRIPS;
    // Spread across the core's underside, off-centre so they are not a comb.
    const dx = -0.2 + d * 0.11 + Math.sin(d * 2.7) * 0.04;
    const len = 0.12 + (((d * 37) % 11) / 11) * 0.18;

    const t = rand(); // 0 at the core, 1 at the tip
    // Narrow the whole way with a bead at the tip. Tapering from wide to a
    // point gives a pennant, not a drip — a run of blood is the same width all
    // the way down and gathers into a drop at the end.
    const width = 0.018 - t * 0.006 + (t > 0.86 ? 0.022 : 0);

    out[i3] = dx + (rand() - 0.5) * width * 2;
    out[i3 + 1] = CORE_BOTTOM - t * len;
    out[i3 + 2] = (rand() - 0.5) * 0.05;
  }

  return out;
}

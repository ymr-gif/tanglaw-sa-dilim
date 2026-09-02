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
 * COVERAGE OVER REACH, as of 2026-09-03. `effects.js` confines and scales the
 * finished splat to fill the left half of the screen, but scaling up a small
 * dense core inside a wide sparse halo just spreads the same sparseness over
 * more area — it does not read as "covered." CORE_SHARE and CORE_SCALE below
 * exist to make the core itself big enough that scaling it doesn't hollow it
 * out. Satellites and drips stayed proportionally smaller on purpose; they are
 * texture at the edge of a mass now, not the mass itself.
 *
 * FOUR COMPONENTS, because a single radial spray reads as a firework:
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
 *   Spikes      four claw-shaped throws, wide at the core and tapering to a
 *               point, fanned from up-and-back to down-and-forward. Added
 *               2026-09-03 because the core+satellites read as a round pool
 *               at a glance — a stain needs a few pieces big enough to read as
 *               THROWN, not just a haze of droplets around a blob. The one
 *               nearest level with the bullet's path is the longest: the main
 *               thrust follows the shot, the others are what missed it.
 *   Drips       five short tails running down from the core's lower edge, each
 *               thinning as it descends.
 */

import { POINTS } from '../theme.js';
import { seededRandom } from '../noise.js';

const CORE_SHARE = 0.58;
const SAT_SHARE = 0.19;
const SPIKE_SHARE = 0.16;
/** The rest are drips. */

/**
 * Scales the whole BLOBS layout (positions and radii together) without
 * hand-editing eight rows. `effects.js` confines and scales the finished
 * splat to fill the left half of the screen — that's a camera-framing
 * concern. This is a shape concern: at CORE_SHARE's original size, the core
 * was a small dense knot inside a wide, sparse satellite halo, so scaling
 * the whole thing up (effects.js) just spread the same knot over more empty
 * space. A bigger core, sharing more of the point budget, is what actually
 * reads as coverage rather than a dot with a halo.
 */
const CORE_SCALE = 2.4;

/**
 * Satellites live between these radii. The inner bound now sits just past
 * the (much bigger, CORE_SCALE'd) core's own edge — satellites are an outer
 * halo beyond the mass, not noise scattered inside it, which is what they'd
 * be if SAT_MIN were still smaller than the core's own reach.
 *
 * The outer bound is set by what the camera can actually see, AND by the
 * spikes: `effects.js` confines the whole splat to the left half of the
 * screen, and the one thing that should visibly reach nearest the boundary is
 * the main-thrust Spike, not a stray satellite.
 */
const SAT_MIN = 0.5;
const SAT_MAX = 1.05;

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
 *
 * Blobs 0 and 1's weights were flattened (1.0->0.6, 0.55->0.35) 2026-09-03:
 * their centres sit close enough together that after CORE_SCALE they overlap
 * heavily, and that lens was the single densest patch in the whole splat —
 * dense enough that even a much darker BLOOD intensity (see effects.js)
 * still blew it out to white on its own. This spreads more of the core's
 * points to the rest of the mass instead of stacking them in one spot; the
 * other blobs' weights are unchanged.
 */
const BLOBS = [
  [-0.03, 0.01, 0.22, 0.6],
  [0.11, 0.06, 0.15, 0.35],
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
 * The four spikes: `angle` in degrees (0 is the bullet's own rightward axis,
 * positive is up), `length` and `width` (base half-width, tapering to a point
 * at the tip), and a sampling `weight`.
 *
 * ORDERED TOP TO BOTTOM ON PURPOSE. `effects.js` reveals the splat in this
 * same order — topmost spike first, fast, down to the bottom — so this array
 * is the animation's script as well as the geometry. Reorder one and you
 * reorder the other; that is intentional, not a trap.
 *
 * The one nearest level with the bullet's own line (index 2, close to 0°) is
 * the longest and thickest: the main thrust follows the shot, the shorter
 * ones above and below are what missed that exact line. It is now the single
 * farthest-reaching feature in the whole splat (see SAT_MAX) — `effects.js`
 * confines the splat to the left half of the screen and lets this one spike
 * alone approach the boundary, so the reach reads as deliberate.
 */
const SPIKES = [
  { angle: 68, length: 0.68, width: 0.075, weight: 0.8 },
  { angle: 26, length: 0.86, width: 0.088, weight: 1.0 },
  { angle: -10, length: 1.25, width: 0.1, weight: 1.3 },
  { angle: -50, length: 0.74, width: 0.078, weight: 0.9 },
];

const SPIKE_WEIGHT_TOTAL = SPIKES.reduce((sum, s) => sum + s.weight, 0);

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
  const spikeEnd = satEnd + Math.floor(POINTS * SPIKE_SHARE);

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
    const r = BLOBS[b][2] * CORE_SCALE * Math.sqrt(rand());

    out[i3] = BLOBS[b][0] * CORE_SCALE + Math.cos(a) * r;
    out[i3 + 1] = BLOBS[b][1] * CORE_SCALE + Math.sin(a) * r * 0.92;
    out[i3 + 2] = (rand() - 0.5) * 0.09;
  }

  /* ── Satellites ───────────────────────────────────────────────────────── */
  for (let i = coreEnd; i < satEnd; i += DROP) {
    // One droplet centre, then DROP points scattered tightly around it.
    let a = 0;
    for (let tries = 0; tries < 8; tries++) {
      a = rand() * Math.PI * 2;
      // A soft rightward lean, not a hard bias — this layer's job is now to
      // COVER the frame evenly (`effects.js` fills the whole left half with
      // it), and a strong lean left big gaps top, bottom and left of the
      // core. The Spikes carry the "thrown rightward" legibility instead.
      const w = 0.55 + 0.45 * ((0.5 + 0.5 * Math.cos(a)) ** 2);
      if (rand() < w) break;
    }

    // sqrt-uniform radius: EVEN density per unit area across the whole
    // annulus, unlike the 1/r^2 falloff this replaced (log-uniform radius),
    // which read as a dense knot fading to almost nothing before the edge —
    // exactly the "small dot with a halo" look the frame-filling ask needs
    // this layer to stop being.
    const r = SAT_MIN + (SAT_MAX - SAT_MIN) * Math.sqrt(rand());
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

  /* ── Spikes ───────────────────────────────────────────────────────────── */
  // Wide at the core (t=0), tapering to a point at the tip (t=1) — a flung
  // streak thins as it goes, unlike a Drip's constant width plus end bead.
  {
    let idx = satEnd;
    for (let s = 0; s < SPIKES.length; s++) {
      const spike = SPIKES[s];
      const count = s === SPIKES.length - 1
        ? spikeEnd - idx
        : Math.round(((spikeEnd - satEnd) * spike.weight) / SPIKE_WEIGHT_TOTAL);

      const a = (spike.angle * Math.PI) / 180;
      const dirX = Math.cos(a);
      const dirY = Math.sin(a);
      const perpX = -dirY;
      const perpY = dirX;

      for (let k = 0; k < count && idx < spikeEnd; k++, idx++) {
        const i3 = idx * 3;

        const t = rand(); // 0 at the core, 1 at the tip
        const w = spike.width * (1 - t) ** 0.7;
        const off = (rand() - 0.5) * 2 * w;

        out[i3] = dirX * spike.length * t + perpX * off;
        out[i3 + 1] = dirY * spike.length * t + perpY * off;
        out[i3 + 2] = (rand() - 0.5) * 0.06;
      }
    }
  }

  /* ── Drips ────────────────────────────────────────────────────────────── */
  for (let i = spikeEnd; i < POINTS; i++) {
    const i3 = i * 3;

    const d = (i - spikeEnd) % DRIPS;
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

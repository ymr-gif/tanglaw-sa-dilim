/**
 * shadow.js — the three demonic shadows that slither in behind the student.
 *
 * Each shadow is a thick sinuous body (a cubic Bezier, sampled with jitter and
 * a lateral taper) ending in a head that carries two eyes and a jagged mouth.
 *
 * THE EYES DO THE WORK, NOT THE BODY. `eyeness` marks which points are eye or
 * mouth versus body, so the scene can light the face brightly and leave the
 * body dim. This is the same move as the Refusal plan's hands, where only the
 * fingertips are lit: a dark mass with two bright points and a jagged line
 * reads as a face even though the mass itself is just scattered noise. Do not
 * try to make the body itself anatomically convincing — it will always lose
 * that fight at 17000 points across three creatures, and it is not the fight
 * that makes this read as demonic.
 *
 * ORIGIN, NOT ARRIVAL POINT. Every curve's tail (control point 0) sits close
 * to the student's own silhouette, and the head (control point 3) sits out at
 * the settled, flanking position. That ordering is what lets `arrived: false`
 * mean "retreated back down its own tail" rather than "parachuted in from a
 * screen edge" — the storyboard is explicit that these came FROM the child.
 */

import { POINTS } from '../theme.js';
import { seededRandom } from '../noise.js';

/** One RNG stream for all three shadows, consumed in index order — see below. */
const SEED = 0x5ade0001;

/**
 * Settled control points [tail, c1, c2, head], hand-placed against the
 * storyboard: left and right flank the student near shoulder height, the
 * third rises behind the head. Every tail's z is pulled slightly negative —
 * "behind" the student in camera depth — so the origin reads as the child's
 * own back rather than empty air beside them.
 *
 * Tails moved down to the student's own feet 2026-09-03 (BODY.yBot in
 * student.js, offset, lands around y = -0.40) rather than the centreline —
 * these come UP OUT of the ground the child stands on, not out of their
 * back, and every other control point grew to match: a shadow anchored at
 * the feet needs far more reach to loom over the child at all, and reach is
 * what an imposing shadow is. The three are still not mirrors of each
 * other — left biggest, right smaller and tighter, the rising one tallest
 * of all since it looms directly behind the head.
 *
 * HOOKED, not a straight diagonal reach, as of 2026-09-03 (reference art
 * supplied by the storyboard): `c1` swings each body OUT past the student
 * before `c2`/head curl it back IN over the shoulder. A monotonic tail to
 * head reads as an arm held out straight; a hook that bulges past its own
 * head and doubles back is what makes it look like it is slithering rather
 * than posing.
 *
 * WIDENED the same day: the first hooked pass curled the heads back in far
 * enough that all three sat close together over the student, cramped in the
 * middle of a frame with a lot of unused space at either side. The heads now
 * land much further out — the hook still bulges past them on the way there,
 * so the motion reads the same, but it no longer pulls the face back toward
 * centre once it gets there.
 *
 * The right-hand curve is intentionally smaller than the left and the left is
 * intentionally not a mirror of it — three identical, symmetric loops would
 * read as a decal, not as three separate things that arrived on their own.
 */
const CURVES = [
  // left — "unspoken trauma"
  [
    [-0.05, -0.40, -0.16],
    [-1.05, -0.06, -0.05],
    [-1.32, 0.55, 0.04],
    [-1.1, 0.88, 0.08],
  ],
  // right — "student isolation" — tighter, lower; asymmetric on purpose
  [
    [0.06, -0.40, -0.16],
    [0.88, -0.12, -0.05],
    [1.08, 0.32, 0.04],
    [0.9, 0.56, 0.08],
  ],
  // rising behind the head — "toxic online spaces"
  [
    [0.0, -0.38, -0.16],
    [-0.32, 0.10, -0.05],
    [-0.02, 0.68, 0.04],
    [0.02, 0.95, 0.08],
  ],
];

/**
 * Where each shadow's face ends up. Exported because the Threshold's three
 * labels anchor to them: a word that names a shadow has to sit beside that
 * shadow, and it has to keep sitting beside it while the thing slithers.
 * Read-only — this is the same array the curves are built from.
 */
export const SHADOW_HEADS = CURVES.map((c) => c[3]);

/**
 * Not-arrived pose: collapse each curve toward its own tail (already sitting
 * behind the student) and push it further back in z. Retreating ALONG the
 * same curve, rather than sliding it off to some screen edge, is what keeps
 * the entry vector honest when the scene later morphs false -> true: every
 * point's path runs from behind the child outward, never in from a side.
 */
function retreat(curve) {
  const tail = curve[0];
  return curve.map(([x, y, z]) => [
    tail[0] + (x - tail[0]) * 0.1,
    tail[1] + (y - tail[1]) * 0.1,
    tail[2] - 0.55 + (z - tail[2]) * 0.1,
  ]);
}

function bezierPoint(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  const a = mt * mt * mt;
  const b = 3 * mt * mt * t;
  const c = 3 * mt * t * t;
  const d = t * t * t;
  return [
    a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
    a * p0[2] + b * p1[2] + c * p2[2] + d * p3[2],
  ];
}

function bezierTangent(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  return [
    3 * mt * mt * (p1[0] - p0[0]) + 6 * mt * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]),
    3 * mt * mt * (p1[1] - p0[1]) + 6 * mt * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]),
  ];
}

/**
 * Share of each shadow's points spent on each feature. Rest is body.
 *
 * `HEAD_FRAC` is a filled disc at the end of the curve, and it was added after
 * looking at the first version on screen. Without it the eyes and the mouth
 * float at the thin end of a taper and the whole thing reads as a tentacle
 * with something stuck on the tip. A face needs a face-shaped mass under it
 * before the features on top of it mean anything.
 */
const EYE_FRAC = 0.04; // per eye
const MOUTH_FRAC = 0.065;
const HEAD_FRAC = 0.22;
// Grown 0.14 -> 0.20 2026-09-03, per the reference art's much bigger, more
// dominant heads — the body is texture, the face is the point, and a small
// head on a now-larger hooked body read as an afterthought.
const HEAD_R = 0.2;

// Close together relative to HEAD_R, on purpose: this is the parameter that
// decides demonic-vs-smoke, not the body. See the header comment. Scaled up
// with HEAD_R so the face keeps the same proportions on the bigger head.
const EYE_R = 0.042;
const EYE_SEP = 0.1;
const EYE_UP = 0.06;

// Wider and sharper 2026-09-03 to match: fewer, bigger teeth cut deeper reads
// as a sinister grin at a distance — the first pass (7 teeth, JAG 0.075) blurred
// into a soft smear under bloom at normal viewing distance, same problem the
// header warns about with the body. Big, unambiguous zigzags over a wider arc.
const MOUTH_HALF_W = 0.16;
const MOUTH_Y = -0.07;
const MOUTH_TEETH = 5;
const MOUTH_JAG = 0.11;

// Body taper: near-nothing at the tail (it came from the child, not a solid
// object), thickening toward the head. It stops well short of the head disc's
// own width, so the silhouette steps IN at the neck and back OUT at the face —
// the same notch knife.js needs between blade and handle, and for the same
// reason: without it the body and the head merge into one smooth cone.
const TAIL_THICK = 0.016;
const HEAD_THICK = 0.11;

function triWave(u) {
  const f = u - Math.floor(u);
  return f < 0.5 ? f * 2 : (1 - f) * 2;
}

export function buildShadows({ arrived }) {
  const rand = seededRandom(SEED);

  const positions = new Float32Array(POINTS * 3);
  const eyeness = new Float32Array(POINTS);

  for (let i = 0; i < POINTS; i++) {
    const i3 = i * 3;
    const which = i % 3;
    const curve = arrived ? CURVES[which] : retreat(CURVES[which]);
    const [c0, c1, c2, c3] = curve;

    // Which feature this point belongs to is drawn from the SAME rand stream
    // as everything else, and — critically — the draw never depends on
    // `arrived`. That is what keeps point i the same "role" (eye, mouth or
    // body fleck) in both calls, so the morph between them never reassigns
    // what a point is mid-flight.
    const roll = rand();
    let x, y, z;

    if (roll < EYE_FRAC * 2) {
      const side = roll < EYE_FRAC ? -1 : 1;
      let ex, ey;
      do {
        ex = rand() * 2 - 1;
        ey = rand() * 2 - 1;
      } while (ex * ex + ey * ey > 1);
      x = c3[0] + side * EYE_SEP + ex * EYE_R;
      y = c3[1] + EYE_UP + ey * EYE_R;
      z = c3[2] + (rand() - 0.5) * 0.02;
      eyeness[i] = 1;
    } else if (roll < EYE_FRAC * 2 + MOUTH_FRAC) {
      const u = rand() * 2 - 1;
      const phase = ((u + 1) / 2) * MOUTH_TEETH;
      const tooth = triWave(phase);
      x = c3[0] + u * MOUTH_HALF_W;
      y = c3[1] + MOUTH_Y - tooth * MOUTH_JAG + (rand() - 0.5) * 0.012;
      z = c3[2] + (rand() - 0.5) * 0.02;
      eyeness[i] = 1;
    } else if (roll < EYE_FRAC * 2 + MOUTH_FRAC + HEAD_FRAC) {
      // The head itself: a filled disc for the features to sit on. Left
      // body-coloured, so the eyes and the mouth stay the only lit things on it.
      let hx, hy;
      do {
        hx = rand() * 2 - 1;
        hy = rand() * 2 - 1;
      } while (hx * hx + hy * hy > 1);
      x = c3[0] + hx * HEAD_R;
      y = c3[1] + hy * HEAD_R;
      z = c3[2] + (rand() - 0.5) * 0.05;
      eyeness[i] = 0;
    } else {
      const t = rand();
      const p = bezierPoint(c0, c1, c2, c3, t);
      const tan = bezierTangent(c0, c1, c2, c3, t);
      let nx = -tan[1];
      let ny = tan[0];
      const len = Math.hypot(nx, ny) || 1;
      nx /= len;
      ny /= len;

      const thick = TAIL_THICK + (HEAD_THICK - TAIL_THICK) * t * t;
      const lateral = (rand() * 2 - 1) * thick;
      const depth = (rand() - 0.5) * (thick + 0.05);

      x = p[0] + nx * lateral;
      y = p[1] + ny * lateral;
      z = p[2] + depth;
      eyeness[i] = 0;
    }

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;
  }

  return { positions, eyeness };
}

/**
 * refusal.js — beats 19-24. Six sentences, six images.
 *
 * The classroom becomes the cage, the cage becomes two weapons, hands close out
 * of the shadows and crush them, and the hands themselves become stars.
 *
 *   hold     the whole mask, exactly as Prevention left it.
 *   bars     the mask's own points rise into five white prison bars.
 *   weapons  the bars become a knife (left) and the Effects handgun (right).
 *   hands    many yellow hands fade in out of the dark, surrounding both.
 *   crush    the hands close; the weapons break and scatter, denser at the fist.
 *   stars    the hands become stars; the debris fades to nothing.
 *
 * THE THROUGH-LINE TO PROTECT: every shape here is made of the same points as
 * the mask. Nothing arrives from outside the piece. That is what stops the
 * section reading as a slideshow of unrelated objects, and it is the same rule
 * that makes the Effects gun defensible.
 *
 * Beat `ref-01` holds Prevention's end state and must never drift from it,
 * which is why this file imports Prevention's own geometry and colour rather
 * than rebuilding them. Only that beat uses them. Until 2026-09-03 that end
 * state was the near-whole mask with one gap (shard 3, EMPOWER, seated only
 * at close-01); now that `prevention.js` seats shard 3 at prev-04, `ref-01`
 * holds a complete mask instead. Nothing in this file forced that — it just
 * follows Prevention's state, as designed.
 *
 * `ref-02` is RETIRED. See beats.js — nothing is its honest successor.
 *
 * TRANSITIONS RESHUFFLE. The storyboard's instruction for the whole section is
 * "the dots reshuffling": a straight lerp moves every point on the same clock
 * and reads as one shape being PULLED into another, where a scattered arrival
 * reads as redistribution. `reshuffle` (in _base.js) is called before every
 * transition between images here.
 */

import { COLOR, POINTS } from '../theme.js';
import { seededRandom } from '../noise.js';
import { createSequence } from '../sequence.js';
import { buildBars } from '../shapes/bars.js';
import { buildGun } from '../shapes/gun.js';
import { buildHands } from '../shapes/hands.js';
import { buildKnife } from '../shapes/knife.js';
import { buildStars } from '../shapes/stars.js';
import { geometryFor, colorsFor } from './prevention.js';
import { clearDelays, reshuffle, rgbOf, solid } from './_base.js';

/* ── The point split ────────────────────────────────────────────────────── */

/**
 * The field divides once, and every beat from `hands` onward respects it.
 *
 * Hands take the smaller share deliberately. Ten hands is far more shape than
 * two weapons, but most of a hand is never lit — the palms fade into the dark
 * by design — so the hands need fewer points than their area suggests, and the
 * weapons need to stay bright while they are being crushed.
 *
 * The weapons therefore thin when the hands arrive: at `weapons` all 17000
 * points are in the two shapes, at `hands` only 55% of them still are. That is
 * visible and it is the honest read of the section's own rule — the hands are
 * made of the weapons' own material redistributing, not of anything new.
 */
const HAND_SHARE = 0.45;

/**
 * Where the two weapons sit, and therefore where the fists close.
 *
 * Must stay in step with `WEAPON_X` in shapes/hands.js — the hands ring these
 * exact points.
 */
const KNIFE_AT = [-0.71, 0];
const GUN_AT = [0.71, 0];

const split = (() => {
  const rand = seededRandom(0x5e1f);
  const wasHand = new Uint8Array(POINTS);
  const hand = [];
  const weapon = [];
  // At `weapons` the whole field is the two weapons, split by index parity so
  // both form simultaneously out of the bars rather than one after the other.
  const allKnife = [];
  const allGun = [];

  for (let i = 0; i < POINTS; i++) {
    (i % 2 === 0 ? allKnife : allGun).push(i);
    if (rand() < HAND_SHARE) {
      wasHand[i] = 1;
      hand.push(i);
    } else {
      weapon.push(i);
    }
  }

  return {
    wasHand,
    hand: Int32Array.from(hand),
    weapon: Int32Array.from(weapon),
    allKnife: Int32Array.from(allKnife),
    allGun: Int32Array.from(allGun),
  };
})();

/* ── Geometry ───────────────────────────────────────────────────────────── */

/** Translate a subset of a buffer so its bounding box centres on (cx, cy). */
function centreOn(buf, idx, cx, cy) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let k = 0; k < idx.length; k++) {
    const i3 = idx[k] * 3;
    if (buf[i3] < minX) minX = buf[i3];
    if (buf[i3] > maxX) maxX = buf[i3];
    if (buf[i3 + 1] < minY) minY = buf[i3 + 1];
    if (buf[i3 + 1] > maxY) maxY = buf[i3 + 1];
  }

  const dx = cx - (minX + maxX) / 2;
  const dy = cy - (minY + maxY) / 2;

  for (let k = 0; k < idx.length; k++) {
    const i3 = idx[k] * 3;
    buf[i3] += dx;
    buf[i3 + 1] += dy;
  }
}

/**
 * Both weapons, horizontal and in profile, at matched visual weight.
 *
 * The scales are chosen so the two come out at the same length AND the same
 * filled area — a knife that reads beside a gun that does not looks like a
 * mistake, and unequal density is how that happens first.
 *
 * The gun is mirrored. The storyboard draws both weapons pointing left; the
 * Effects gun fires to the right, and a mirrored silhouette is still plainly
 * the same object, so the staging wins.
 */
const geo = {};

function weapons() {
  if (geo.weapons) return geo.weapons;

  const buf = new Float32Array(POINTS * 3);
  // Scales solved so the two come out at the same FILLED AREA. Both area and
  // length cannot be matched at once, and area is the one that matters: each
  // weapon gets half the field, so area IS density, and the sparser of two
  // silhouettes is the one that starts reading as an afterthought. The knife
  // comes out the longer object by about a third, which is simply true of a
  // chef's knife beside a handgun.
  //
  // RETUNE THESE WHENEVER gun.js OR knife.js CHANGES SHAPE. They are not free
  // parameters; they are solved against those files' own extent and area:
  //
  //   gun area at scale 1     0.7132  (the sum of its rectangles)
  //   knife area at scale 1   0.1346  (KNIFE_METRICS.area)
  //   knife scale             the largest that keeps the knife's own span clear
  //                           of x = 0 once centred on KNIFE_AT
  //   gun scale               sqrt(knife area at that scale / 0.7132)
  //
  // The KNIFE is the one that gets capped, and the gun comes down to meet its
  // area, because `crushed()` and `debris()` below tell the two weapons apart
  // BY THE SIGN OF X. A knife long enough to reach across the origin would send
  // its own butt flying to the wrong fist.
  //
  // The pair is also sized to survive the device matrix. A wider, more
  // present staging looked better at 16:9 and put both weapons half off the
  // frame in portrait, where the fit is height-bound and the visible world is
  // barely wider than the mask. This is the largest the pair can be and still
  // fit the narrowest profile the deck supports.
  // Rotated 135° clockwise from the previous 0.16 rad, per a look at the
  // actual rendered slide rather than the geometry alone.
  buildKnife(buf, { pick: split.allKnife, scale: 1.2032, tilt: 0.16 - (3 * Math.PI) / 4 });
  buildGun(buf, { pick: split.allGun, scale: 0.5227, tilt: -0.14, flip: true });
  centreOn(buf, split.allKnife, KNIFE_AT[0], KNIFE_AT[1]);
  centreOn(buf, split.allGun, GUN_AT[0], GUN_AT[1]);

  geo.weapons = buf;
  return buf;
}

/** Open hands ringing both weapons; the weapons hold their positions. */
function handsOpen() {
  if (geo.handsOpen) return geo.handsOpen;

  const buf = weapons().slice();
  const tip = new Float32Array(POINTS);
  buildHands(buf, tip, { pick: split.hand });

  geo.handsOpen = buf;
  geo.tipOpen = tip;
  return buf;
}

/** Radius of the compacted weapon at the moment the fist closes on it. */
const CRUSH_R = 0.23;

/**
 * How far the crush smears each point around the fist, in radians.
 *
 * This has to be wide — near enough a hundred degrees either way. The gun's
 * material occupies two opposite arcs (barrel up-left, grip down-right) and
 * leaves two voids of well over a hundred degrees between them, so a modest
 * jitter leaves the voids intact and the "crushed" weapon comes out as the
 * same diagonal it went in as, with an arch-shaped hole in the debris. At this
 * width each void is covered from both sides and the mass fills, while the
 * bias toward each point's original direction keeps the collapse reading as a
 * collapse rather than as a teleport.
 */
const ANGLE_SMEAR = 3.4;

/**
 * How much of each point's original distance from the fist survives the crush.
 *
 * Low, and for the same reason the angle is smeared so hard: a map that
 * preserves radius can only put a point at the centre if something was already
 * there, and the gun's own centre is the hole inside its trigger guard — so the
 * "crushed" weapon came out as a ring with a clean circle punched through it.
 */
const RADIUS_MEMORY = 0.35;

/**
 * Fists closed, weapons compressed. The instant before they give.
 *
 * The weapon is remapped into a small disc rather than scaled down inside it.
 * Scaling was the first attempt and it keeps every feature: the gun's trigger
 * guard survived the compression and left a rectangular black hole sitting in
 * the middle of the debris, which reads as a mistake rather than as a crush.
 * A crush destroys the shape.
 *
 * Both halves of that matter. The radial exponent is under 1, so the outside
 * comes in further than the middle and the disc fills solid. The angle needs
 * jitter for the same reason: a purely radial remap preserves which DIRECTIONS
 * had material, and the gun has none at all below its own centre — that empty
 * wedge came straight through the compression as an arch-shaped hole in the
 * debris. Smearing the angle closes it.
 */
function crushed() {
  if (geo.crushed) return geo.crushed;

  const rand = seededRandom(0xc2f1);
  handsOpen();
  const buf = weapons().slice();
  const tip = new Float32Array(POINTS);
  buildHands(buf, tip, { pick: split.hand, closed: true });

  // How far each weapon reaches, so the remap is in its own terms.
  const maxR = [1e-4, 1e-4];
  for (let k = 0; k < split.weapon.length; k++) {
    const i3 = split.weapon[k] * 3;
    const w = buf[i3] < 0 ? 0 : 1;
    const fist = w === 0 ? KNIFE_AT : GUN_AT;
    const r = Math.hypot(buf[i3] - fist[0], buf[i3 + 1] - fist[1]);
    if (r > maxR[w]) maxR[w] = r;
  }

  for (let k = 0; k < split.weapon.length; k++) {
    const i3 = split.weapon[k] * 3;
    const w = buf[i3] < 0 ? 0 : 1;
    const fist = w === 0 ? KNIFE_AT : GUN_AT;

    const px = buf[i3] - fist[0];
    const py = buf[i3 + 1] - fist[1];
    const r = Math.hypot(px, py) || 1e-4;

    // sqrt of a uniform draw fills a disc evenly; mixing in the point's own
    // radius keeps some memory of what was on the outside.
    const u = RADIUS_MEMORY * (r / maxR[w]) + (1 - RADIUS_MEMORY) * rand();
    const rr = CRUSH_R * Math.sqrt(u);
    const a = Math.atan2(py, px) + (rand() - 0.5) * ANGLE_SMEAR;

    buf[i3] = fist[0] + Math.cos(a) * rr;
    buf[i3 + 1] = fist[1] + Math.sin(a) * rr;
  }

  geo.crushed = buf;
  geo.tipClosed = tip;
  return buf;
}

/** How far the furthest fragment can travel. */
const MAX_THROW = 1.05;

/**
 * The scatter, in two reaches.
 *
 * "Scatter denser" at the crush, which the storyboard calls out twice.
 *
 * The plan proposed displacing each point by an amount proportional to its
 * distance from the fist. That was tried and it does not do what it says: a
 * displacement proportional to radius is a uniform dilation, and dilating a
 * uniform cloud leaves it uniform — what actually appeared on screen was a
 * bright rim with a hollow middle, the exact opposite of the note.
 *
 * What produces the note's image is a displacement drawn from a distribution
 * that is heavily weighted toward zero: nearly every fragment stays close to
 * where the weapon broke and a few fly, so the debris piles up at the fist and
 * thins toward the edges. `pow(rand(), 2.6)` is that distribution.
 *
 * The direction has to be RANDOM, not outward. Pushing every fragment away
 * from the fist evacuates the middle — the mean throw is larger than the
 * crushed weapon's own radius, so an outward kick turns the mass into a ring
 * with a clean hole punched through it. A random direction is a blur instead:
 * the centre stays where the weapon broke and the edges thin, which is the
 * note. Whatever flies far also rises, and that is the difference from the
 * Effects shatter, which throws everything equally in a straight line and
 * reads as violence; this one has to read as release.
 */
function debris(reach) {
  const key = `debris${reach}`;
  if (geo[key]) return geo[key];

  const rand = seededRandom(0xd3b8);
  const buf = crushed().slice();

  for (let k = 0; k < split.weapon.length; k++) {
    const i3 = split.weapon[k] * 3;
    const fist = buf[i3] < 0 ? KNIFE_AT : GUN_AT;

    const throwOut = Math.pow(rand(), 2.6) * MAX_THROW * reach;
    const a = rand() * Math.PI * 2;

    buf[i3] += Math.cos(a) * throwOut;
    buf[i3 + 1] += Math.sin(a) * throwOut + throwOut * 0.55;
    buf[i3 + 2] += (rand() - 0.5) * 0.12 * reach;
  }

  geo[key] = buf;
  return buf;
}

/** The hands become stars. The debris does not transform; it stays and goes. */
function stars() {
  if (geo.stars) return geo.stars;

  const buf = debris(1).slice();
  const phase = new Float32Array(POINTS);
  buildStars(buf, phase, { pick: split.hand });

  geo.stars = buf;
  geo.starPhase = phase;
  return buf;
}

/* ── Colour ─────────────────────────────────────────────────────────────── */

/**
 * White and yellow, and nothing else.
 *
 * Festival hues are legal here — Refusal is after `prev-01` — and the
 * storyboard spends almost none of them. That restraint is what lets the
 * section read as cold structure resolving into warm light without spending
 * the Close's full-colour moment early.
 *
 * `radiance` is the deck's near-white. At these intensities every point is
 * already clipping to white on its own, so the bars and the weapons separate by
 * density, not by the numbers below.
 */
const BARS_COL = solid(COLOR.radiance, 2.2);
const WEAPON_COL = solid(COLOR.radiance, 3.4);

/** Weapons stay white; hands are yellow. One buffer, two populations. */
const MIXED_COL = (() => {
  const white = rgbOf(COLOR.radiance, 3.4);
  const yellow = rgbOf(COLOR.gold, 2.6);
  const out = new Float32Array(POINTS * 3);

  for (let i = 0; i < POINTS; i++) {
    const c = split.wasHand[i] ? yellow : white;
    out[i * 3] = c[0];
    out[i * 3 + 1] = c[1];
    out[i * 3 + 2] = c[2];
  }
  return out;
})();

/* ── Brightness ─────────────────────────────────────────────────────────── */

/**
 * Brightness is per-point and animated by hand here rather than by the morph
 * engine, because two populations need different things at the same time: the
 * hands carry a fixed gradient from fingertip to palm, and the debris is on its
 * own fade. One update hook owns both, and every value it produces is either a
 * scene scalar apply() also sets or a pure function of absolute time.
 */

/** The palms are NEARLY gone, not absent — hands must read as connected forms. */
const PALM_FLOOR = 0.06;

const bright = {
  /** Per-point hand base: 0 when there are no hands on screen. */
  tip: null,
  /** 0..1 lift from the tipness gradient toward flat — the stars resolving. */
  lift: 0,
  liftTo: 0,
  /** Debris/weapon multiplier. */
  debris: 1,
  debrisTo: 1,
  /** ms for the ramps above. */
  ms: 1,
  /** Stars breathe; hands do not. */
  breathe: false,
};

function resetBright() {
  bright.tip = null;
  bright.lift = 0;
  bright.liftTo = 0;
  bright.debris = 1;
  bright.debrisTo = 1;
  bright.ms = 1;
  bright.breathe = false;
}

function paint(field, dt, time) {
  const step = (dt * 1000) / bright.ms;

  if (bright.lift !== bright.liftTo) {
    const d = bright.liftTo - bright.lift;
    bright.lift += Math.sign(d) * Math.min(Math.abs(d), step);
  }
  if (bright.debris !== bright.debrisTo) {
    const d = bright.debrisTo - bright.debris;
    bright.debris += Math.sign(d) * Math.min(Math.abs(d), step);
  }

  const tip = bright.tip;
  const phase = geo.starPhase;

  for (let i = 0; i < POINTS; i++) {
    if (!split.wasHand[i]) {
      field.brightness[i] = bright.debris;
      continue;
    }

    const base = tip ? PALM_FLOOR + tip[i] * (1 - PALM_FLOOR) : 1;
    let v = base + (1 - base) * bright.lift;

    if (bright.breathe && phase) {
      // Absolute time, so apply() reproduces it exactly. Whole stars breathe
      // together and out of phase with each other; per-point phasing would be
      // a shimmer, which is the Q&A ember field's idiom, not this one.
      v *= 0.8 + 0.2 * Math.sin(time * 0.9 + phase[i]);
    }

    field.brightness[i] = v;
  }
}

/* ── The crush ──────────────────────────────────────────────────────────── */

/**
 * Three stages, through `createSequence` rather than nested `onComplete`, so
 * apply() is one line and a click landing mid-crush cannot leave a half-run
 * cascade behind.
 */
const crush = createSequence([
  {
    // Fast. A slow crush reads as a hug.
    //
    // The one place in this section that does NOT reshuffle: this is a hand
    // closing, so deformation is the correct read, and at 420ms a 0.55 stagger
    // would still have points in flight when the next stage fires.
    ms: 420,
    play: (ctx) => {
      clearDelays(ctx.field);
      bright.tip = geo.tipClosed;
      bright.ms = 420;
      ctx.field.morph(crushed(), { duration: 420, ease: 'inQuad' });
    },
    done: (ctx) => {
      bright.tip = geo.tipClosed;
      ctx.field.snap(crushed(), MIXED_COL);
    },
  },
  {
    ms: 180,
    play: (ctx) => {
      // Optional on purpose. The camera rig is the Effects plan's Task 1 and is
      // not in the tree right now; Refusal must not be blocked on it, and the
      // impact reads without a shake. The moment the rig lands, this lights up
      // with no further change here.
      ctx.rig?.shake(0.035, 380);
      reshuffle(ctx.field, 0.2); // grain in the break, not a redistribution
      ctx.field.morph(debris(0.28), { duration: 180, ease: 'outExpo' });
    },
    done: (ctx) => ctx.field.snap(debris(0.28), MIXED_COL),
  },
  {
    ms: 1400,
    play: (ctx) => {
      reshuffle(ctx.field, 0.3);
      bright.ms = 1400;
      bright.debrisTo = 0.62; // begins to dim; ref-07 finishes it
      ctx.field.morph(debris(1), { duration: 1400, ease: 'outExpo' });
    },
    done: (ctx) => {
      bright.debris = 0.62;
      bright.debrisTo = 0.62;
      ctx.field.snap(debris(1), MIXED_COL);
    },
  },
]);

/* ── The scene ──────────────────────────────────────────────────────────── */

const DRIFT = {
  hold: 0.007,
  bars: 0.005,
  weapons: 0.005,
  hands: 0.006,
  crush: 0.006,
  stars: 0.006,
};

export default {
  mount(ctx) {
    clearDelays(ctx.field);
    resetBright();
    ctx.field.setDrift(DRIFT.hold);
  },

  enter(state, ctx) {
    const { field, mask } = ctx;
    // A click landing mid-crush must not leave the sequence running into the
    // next beat. Nothing else in the deck can stop it.
    crush.stop();
    clearDelays(field);
    field.setDrift(DRIFT[state.mode] ?? DRIFT.hold);

    switch (state.mode) {
      case 'hold': {
        // All four lit and seated. Identical to prev-04's end state.
        resetBright();
        field.setUpdate(null);
        field.brightness.fill(1);
        field.morph(geometryFor(mask, 3), { duration: 900, ease: 'outExpo' });
        field.morphColor(colorsFor(mask.shardOf, 3), { duration: 900 });
        break;
      }

      case 'bars': {
        // The mask's own points become the cage — nothing fades out and in.
        resetBright();
        field.setUpdate(null);
        field.brightness.fill(1);
        reshuffle(field);
        field.morph(buildBars(), { duration: 1600, ease: 'inOutQuad' });
        field.morphColor(BARS_COL, { duration: 1600, ease: 'inOutQuad' });
        break;
      }

      case 'weapons': {
        resetBright();
        field.setUpdate(null);
        field.brightness.fill(1);
        reshuffle(field);
        field.morph(weapons(), { duration: 1400, ease: 'inOutQuad' });
        field.morphColor(WEAPON_COL, { duration: 1400, ease: 'inOutQuad' });
        break;
      }

      case 'hands': {
        // The hands arrive by the weapons' own points redistributing. The
        // weapons themselves do not move on this beat — only the hands arrive.
        resetBright();
        handsOpen();
        bright.tip = geo.tipOpen;
        bright.ms = 1200;
        reshuffle(field);
        field.morph(geo.handsOpen, { duration: 1200, ease: 'outExpo' });
        field.morphColor(MIXED_COL, { duration: 1200, ease: 'outCubic' });
        field.setUpdate((dt, time) => paint(field, dt, time));
        break;
      }

      case 'crush': {
        crushed();
        bright.tip = geo.tipOpen;
        bright.lift = 0;
        bright.liftTo = 0;
        bright.debris = 1;
        bright.debrisTo = 1;
        bright.breathe = false;
        field.setUpdate((dt, time) => paint(field, dt, time));
        crush.start(ctx);
        break;
      }

      case 'stars': {
        // The hands are what become the stars. The debris does not transform;
        // it stays where it landed and goes. Drifting it as well reads as busy.
        stars();
        bright.tip = geo.tipClosed;
        bright.ms = 1200;
        bright.lift = 0;
        bright.liftTo = 1; // the tipness gradient resolves into flat starlight
        bright.debrisTo = 0;
        bright.breathe = true;
        reshuffle(field, 0.5);
        field.morph(geo.stars, { duration: 1600, ease: 'outExpo' });
        field.morphColor(MIXED_COL, { duration: 900 });
        field.setUpdate((dt, time) => paint(field, dt, time));
        break;
      }
    }
  },

  apply(state, ctx) {
    const { field, mask } = ctx;
    crush.stop();
    clearDelays(field);
    field.sceneOffset.fill(0);
    field.setDrift(DRIFT[state.mode] ?? DRIFT.hold);

    switch (state.mode) {
      case 'hold':
        resetBright();
        field.setUpdate(null);
        field.brightness.fill(1);
        field.snap(geometryFor(mask, 3), colorsFor(mask.shardOf, 3));
        break;

      case 'bars':
        resetBright();
        field.setUpdate(null);
        field.brightness.fill(1);
        field.snap(buildBars(), BARS_COL);
        break;

      case 'weapons':
        resetBright();
        field.setUpdate(null);
        field.brightness.fill(1);
        field.snap(weapons(), WEAPON_COL);
        break;

      case 'hands':
        resetBright();
        handsOpen();
        bright.tip = geo.tipOpen;
        field.snap(geo.handsOpen, MIXED_COL);
        field.setUpdate((dt, time) => paint(field, dt, time));
        break;

      case 'crush':
        // The whole three-stage end state, with nothing played. A jump lands
        // after the crush — no shake, no half-run stage.
        crushed();
        bright.tip = geo.tipClosed;
        bright.lift = 0;
        bright.liftTo = 0;
        bright.breathe = false;
        crush.settle(ctx);
        field.setUpdate((dt, time) => paint(field, dt, time));
        break;

      case 'stars':
        stars();
        bright.tip = geo.tipClosed;
        bright.lift = 1;
        bright.liftTo = 1;
        bright.debris = 0;
        bright.debrisTo = 0;
        bright.breathe = true;
        field.snap(geo.stars, MIXED_COL);
        field.setUpdate((dt, time) => paint(field, dt, time));
        break;
    }
  },

  unmount(ctx) {
    crush.stop();
    resetBright();
    ctx.field.resetSceneMods();
  },
};

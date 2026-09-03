/**
 * refusal.js — beats 19-24. Six sentences, six images.
 *
 * The classroom becomes the cage, the cage becomes two weapons, hands reach out
 * of the shadows and tear the weapons apart, and the hands themselves become
 * stars.
 *
 *   hold     the whole mask, exactly as Prevention left it.
 *   bars     the mask's own points rise into five white prison bars.
 *   weapons  the bars become a knife (left) and the Effects handgun (right).
 *   hands    many yellow hands fade in out of the dark, surrounding both.
 *   crush    the hands PULL BACK, and each weapon shatters into wedges from its
 *            grip — the thresh-02 shatter (buildCracks), applied per weapon.
 *   stars    the hands become stars; the wedge debris fades to nothing.
 *
 * THE THROUGH-LINE TO PROTECT: every shape here is made of the same points as
 * the mask. Nothing arrives from outside the piece. That is what stops the
 * section reading as a slideshow of unrelated objects, and it is the same rule
 * that makes the Effects gun defensible.
 *
 * THE CRUSH IS A TEAR, NOT A PUNCH. Until the 2026-09-03 rewrite (*) `ref-06`
 * closed the hands into fists and compressed each weapon into a blurry disc of
 * debris — a crush. The directive 2026-09-03 replaced it with the same shatter
 * the Threshold uses on the whole picture: the hands simply draw back, and the
 * weapon comes apart in wedges radiating from the grip. Closure reads as
 * pressure; pulling apart reads as dismantling — the section's own word for
 * what it is asking the audience to do with a weapon. `crushed()` and
 * `debris()` are RETIRED (the old crush), kept on the deck's usual terms but
 * no longer wired into any beat.
 *
 * (*) documented in CONTEXT.md §6 and generated in docs/RUNSHEET.md.
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
import { buildCracks } from '../shapes/cracks.js';
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
 * weapons need to stay bright while they are being torn apart.
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
 * A subset's centre and half-extents, for handing to shapes/hands.js.
 *
 * MEASURED, not written down. The hands cup whatever the weapons actually are,
 * so re-tilting or rescaling a weapon moves its hand with it and nothing in
 * either file needs editing. Hands pinned to hardcoded numbers silently stop
 * fitting the moment the staging changes, which is exactly what happened when
 * the knife was re-tilted.
 */
function boxOf(buf, idx) {
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

  return {
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    halfW: (maxX - minX) / 2,
    halfH: (maxY - minY) / 2,
  };
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
  // area. The original reason — `crushed()`/`debris()` told the two weapons
  // apart BY THE SIGN OF X, so a knife reaching across the origin sent its own
  // butt to the wrong fist — is retired with the crush; the tear separates the
  // two by explicit point subset instead. The scales are kept as they are all
  // the same, because they were also tuned to the device matrix below and the
  // visual balance holds.
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

  // Measured off the weapons as actually built, so the hands fit whatever the
  // staging above produced. Left weapon first, matching HANDS in hands.js.
  geo.fit = [boxOf(buf, split.allKnife), boxOf(buf, split.allGun)];

  geo.weapons = buf;
  return buf;
}

/** Open hands ringing both weapons; the weapons hold their positions. */
function handsOpen() {
  if (geo.handsOpen) return geo.handsOpen;

  const buf = weapons().slice();
  const tip = new Float32Array(POINTS);
  buildHands(buf, tip, { pick: split.hand, fit: geo.fit });

  geo.handsOpen = buf;
  geo.tipOpen = tip;
  return buf;
}

/* ── RETIRED CRCUSH (the old ref-06) ─────────────────────────────────────── */

/**
 * The pre-2026-09-03 `ref-06` compressed each weapon into a disc of debris and
 * scattered it. Superseded by the tear below — the hands now pull the weapons
 * apart into wedges instead of crushing them — but kept whole on the deck's
 * usual terms (see effects.js's retired states) so the old behaviour can be
 * restored with a beat-state change and without archaeology.
 */

const CRUSH_R = 0.23;
const ANGLE_SMEAR = 3.4;
const RADIUS_MEMORY = 0.35;
const MAX_THROW = 1.05;

function crushed() {
  if (geo.crushed) return geo.crushed;
  const rand = seededRandom(0xc2f1);
  handsOpen();
  const buf = weapons().slice();
  const tip = new Float32Array(POINTS);
  buildHands(buf, tip, { pick: split.hand, closed: true, fit: geo.fit });
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

/* ── The tear: the hands pull the weapons apart ──────────────────────────── */

/**
 * How far, and how hard, each weapon cracks at its grip.
 *
 * The weapons sit about 1.4 apart, so these are deliberately LOCAL values —
 * a weapon breaking in a hand is not the whole frame shattering (that is
 * thresh-02's buildCracks default). `TEAR_DISPLACE` is the unit displacement
 * at reach 1; the reach multiplier below (0 -> full crack -> outward drift)
 * scales it stage by stage. `TEAR_ROT` keeps each wedge barely turning, so the
 * break reads as pieces forced apart along the pull, not as an explosion.
 *
 * TUNE THESE AGAINST THE RENDERED SLIDE, not the numbers: wedge displacement
 * reads differently at different viewport sizes, exactly like every other
 * displacement in this deck.
 */
const TEAR_DISPLACE = 0.16;
const TEAR_ROT = 0.06;
/** The reach that lands before ref-07 hands over — the debris' resting place. */
const TEAR_FINAL = 1.7;

/**
 * Both weapons, cracked into wedges about their own grip points.
 *
 * The grip point is the weapon's measured box centre (`geo.fit`) — the exact
 * spot the hands have cupped since `ref-05`, so the crack radiates from where
 * the tear is happening. Each weapon splits through `buildCracks` (the same
 * shatter thresh-02 uses on the whole picture) over ITS OWN point subset with
 * its own origin, then the two are re-merged. Unpicked points (the other
 * weapon, and any hands already placed) pass through untouched.
 *
 * `reach` is a staged magnitude: 0.5 is the crack beginning as the hands draw
 * back, 1 is the break landing, TEAR_FINAL is the wedges drifting out and
 * dimming on the way to ref-07.
 */
function pulledApart(reach = 1) {
  const key = `pulled${reach}`;
  if (geo[key]) return geo[key];

  const base = weapons();
  const disp = TEAR_DISPLACE * reach;
  const knifeCrack = buildCracks(base, [geo.fit[0].cx, geo.fit[0].cy], {
    pick: split.allKnife,
    displace: disp,
    rot: TEAR_ROT * Math.min(1, reach),
  });
  const gunCrack = buildCracks(base, [geo.fit[1].cx, geo.fit[1].cy], {
    pick: split.allGun,
    displace: disp,
    rot: TEAR_ROT * Math.min(1, reach),
  });

  const out = base.slice();
  for (let k = 0; k < split.allKnife.length; k++) {
    const i3 = split.allKnife[k] * 3;
    out[i3] = knifeCrack[i3];
    out[i3 + 1] = knifeCrack[i3 + 1];
    out[i3 + 2] = knifeCrack[i3 + 2];
  }
  for (let k = 0; k < split.allGun.length; k++) {
    const i3 = split.allGun[k] * 3;
    out[i3] = gunCrack[i3];
    out[i3 + 1] = gunCrack[i3 + 1];
    out[i3 + 2] = gunCrack[i3 + 2];
  }

  geo[key] = out;
  return out;
}

/**
 * The composed ref-06 state: weapons cracked into wedges AND the hands pulled
 * back, in one buffer — the hands and the weapons are disjoint point subsets,
 * so the two poses write to different indices and never collide.
 */
function tear(reach) {
  const key = `tear${reach}`;
  if (geo[key]) return geo[key];
  const buf = pulledApart(reach).slice();
  const tip = new Float32Array(POINTS);
  buildHands(buf, tip, { pick: split.hand, pull: true, fit: geo.fit });
  geo[key] = buf;
  // Same pose for every reach (only the weapon wedge magnitude changes), so the
  // pulled-back tipness is identical whichever stage built it first.
  geo.tipTear = tip;
  return buf;
}

/** The hands become stars. The wedge debris does not transform; it stays and
 *  goes — it starts from where the tear left it (pulledApart at TEAR_FINAL),
 *  so the fragments ref-07 carries are the ones the audience just watched fly. */
function stars() {
  if (geo.stars) return geo.stars;

  pulledApart(TEAR_FINAL);
  const buf = pulledApart(TEAR_FINAL).slice();
  const phase = new Float32Array(POINTS);
  const built = buildStars(buf, phase, { pick: split.hand });

  geo.stars = buf;
  geo.starPhase = phase;
  // Per-point rest offset from each star's centre, for size breathing.
  geo.starOffset = built.offset;
  // Per-point blink mode: 0 slow-fade, 1 shutter.
  geo.starMode = built.mode;
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

/*
 * Star life (ref-07). Stars blink two ways — a slow-fader ramps smoothly from
 * near-dark to full and back over a long breath; a shutter snaps sharply on
 * and off, fast. Both are pure functions of the absolute time handed to paint
 * (never the morph clock), so `apply()` reproduces them exactly and re-entry —
 * including jumping in mid-line — never restarts or glitches the loop. The
 * size breath rides the same per-star phase as its blink, so each star's
 * brightness and its swelling are one motion.
 */
const STAR_TWINKLE_LO = 0.15;
const STAR_TWINKLE_AMP = 0.85;
const SLOW_FADE_SPEED = 0.42; // long, gentle 0..100 breath
const SHUTTER_SPEED = 4.2; // fast on/off
const SHUTTER_DUTY = 0.62; // fraction of the cycle spent bright before the snap
const SHUTTER_DIM = 0.08; // how far a shutter drops when it is "off"
const STAR_SIZE_AMP = 0.16;
const STAR_SIZE_SPEED = 1.15;
const STAR_SIZE_SKEW = 0.9;

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
  const off = geo.starOffset;
  const mode = geo.starMode;

  for (let i = 0; i < POINTS; i++) {
    if (!split.wasHand[i]) {
      field.brightness[i] = bright.debris;
      field.sceneOffset[i * 3 + 2] = 0;
      continue;
    }

    const i3 = i * 3;
    const base = tip ? PALM_FLOOR + tip[i] * (1 - PALM_FLOOR) : 1;
    let v = base + (1 - base) * bright.lift;

    if (bright.breathe && phase) {
      // Pure function of the absolute time, so apply() and re-entry reproduce
      // it exactly and the loop never restarts or glitches. Whole stars blink
      // in two idioms, one per star at its own phase:
      //
      //   SLOW-FADE  a smooth 0..100 ramp over a long breath — the sky slowly
      //              brightening and receding.
      //   SHUTTER    a fast, sharp on/off at a fixed duty — a quick blink that
      //              spends just over half its time bright, then snaps away.
      const ph = phase[i];
      if (mode[i] === 1) {
        // Shutter: square-ish blink at the fixed duty — bright for duty of the
        // cycle, then a sharp snap to dim. On the sine this is a level cut.
        const on = Math.sin(time * SHUTTER_SPEED + ph) > Math.cos((Math.PI / 2) * SHUTTER_DUTY);
        v *= on ? 1 : SHUTTER_DIM;
      } else {
        // Slow-fade: gentle 0..100 across the whole breath.
        const tw = 0.5 + 0.5 * Math.sin(time * SLOW_FADE_SPEED + ph);
        v *= STAR_TWINKLE_LO + STAR_TWINKLE_AMP * tw;
      }

      // SIZE: swell and shrink the spoke offsets about the star's centre on a
      // cycle of its own, so even bright stars are never frozen frames.
      const size = 1 + STAR_SIZE_AMP * Math.sin(time * STAR_SIZE_SPEED + ph * STAR_SIZE_SKEW);
      const k = size - 1;
      field.sceneOffset[i3] = off[i3] * k;
      field.sceneOffset[i3 + 1] = off[i3 + 1] * k;
      field.sceneOffset[i3 + 2] = 0;
    } else {
      field.sceneOffset[i3] = 0;
      field.sceneOffset[i3 + 1] = 0;
      field.sceneOffset[i3 + 2] = 0;
    }

    field.brightness[i] = v;
  }
}

/* ── The tear (render-wise still the "crush" beat) ───────────────────────── */

/**
 * Three stages, through `createSequence` rather than nested `onComplete`, so
 * apply() is one line and a click landing mid-tear cannot leave a half-run
 * cascade behind.
 *
 * The shape of the beat changed 2026-09-03: instead of closing into fists and
 * compressing the weapons, the hands draw back and each weapon cracks into
 * wedges from its grip (tear → pulledApart). The stage rhythm survives — fast
 * break, shake, then a longer outward drift and dim toward ref-07.
 */
const crush = createSequence([
  {
    // Fast. The hands begin to draw back and the weapon cracks open at the
    // grip, in the one motion. This stage could reshuffle, but a 0.55 stagger
    // at 420ms would still have points in flight when the next stage fires.
    ms: 420,
    play: (ctx) => {
      clearDelays(ctx.field);
      bright.tip = geo.tipTear;
      bright.ms = 420;
      ctx.field.morph(tear(0.55), { duration: 420, ease: 'inQuad' });
    },
    done: (ctx) => {
      bright.tip = geo.tipTear;
      ctx.field.snap(tear(0.55), MIXED_COL);
    },
  },
  {
    ms: 180,
    play: (ctx) => {
      // Optional on purpose. The camera rig is the Effects plan's Task 1 and is
      // not in the tree right now; Refusal must not be blocked on it, and the
      // break reads without a shake. The moment the rig lands, this lights up
      // with no further change here.
      ctx.rig?.shake(0.035, 380);
      reshuffle(ctx.field, 0.2); // grain in the break, not a redistribution
      ctx.field.morph(tear(1), { duration: 180, ease: 'outExpo' });
    },
    done: (ctx) => ctx.field.snap(tear(1), MIXED_COL),
  },
  {
    ms: 1400,
    play: (ctx) => {
      reshuffle(ctx.field, 0.3);
      bright.ms = 1400;
      bright.debrisTo = 0.62; // begins to dim; ref-07 finishes it
      ctx.field.morph(tear(TEAR_FINAL), { duration: 1400, ease: 'outExpo' });
    },
    done: (ctx) => {
      bright.debris = 0.62;
      bright.debrisTo = 0.62;
      ctx.field.snap(tear(TEAR_FINAL), MIXED_COL);
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
        // The hands draw back and the weapons crack open from the grips. The
        // initial pose (stage 1) is the hands just beginning to draw back, so
        // build tear() ahead so geo.tipTear exists before crush.start() plays.
        tear(0.55);
        bright.tip = geo.tipTear;
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
        // The hands are what become the stars. The wedge debris does not
        // transform; it stays where the tear threw it and goes. Drifting it as
        // well reads as busy.
        stars();
        bright.tip = geo.tipTear;
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
        // after the tear — no shake, no half-run stage. `crush.settle()` runs
        // every stage's `done`, which builds tear(TEAR_FINAL) and tips it.
        tear(TEAR_FINAL);
        bright.tip = geo.tipTear;
        bright.lift = 0;
        bright.liftTo = 0;
        bright.breathe = false;
        crush.settle(ctx);
        field.setUpdate((dt, time) => paint(field, dt, time));
        break;

      case 'stars':
        stars();
        bright.tip = geo.tipTear;
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

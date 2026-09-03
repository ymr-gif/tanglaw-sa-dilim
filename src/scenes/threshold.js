/**
 * threshold.js — slides 2-3. A child alone, three shadows, and a knife.
 *
 * Three beats, one per sentence CH speaks. The re-cut is not imposed on the
 * words; the words already had it in them (see beats.js and
 * docs/superpowers/plans/2026-09-02-threshold-sequence.md):
 *
 *   thresh-01  three shadows come out of the child's own back and are named
 *   thresh-02  a knife falls into the picture and shatters it
 *   thresh-03  the wreckage holds. only the eyes still move
 *
 * COLOUR. This section is vivid, which the old §3 rule forbade and the amended
 * one allows: the deck's colour argument is TEMPERATURE, not saturation. These
 * hues are cold and violent — electric violet, hard red — against the festival
 * palette's warmth, and the yellow student is the single warm thing in frame
 * because they are the single living thing in it. No festival hue appears here.
 *
 * THE POINT BUDGET. One THREE.Points object holds everything, so the child and
 * the shadows and the knife are all carved out of the same 17000 points by
 * index:
 *
 *   i % 4 === 0   the child                                    (4250 points)
 *   i % 4 === 3   the knife, from thresh-02 on                  (4250 points)
 *   everything else   the three shadows, by i % 3               (8500 points)
 *
 * Two things fall out of that arithmetic and both are wanted. The child keeps
 * exactly the points it had in `cold-02` and never re-scatters, so it holds
 * still while the darkness leaves it. And the knife is made of shadow — the
 * blade is not a new object arriving, it is what was already standing behind
 * the child, and residue 3 can never take a point from residue 0.
 *
 * The knife's quarter is generous for its size, deliberately. It has to be the
 * densest thing on screen the moment it lands or it disappears into the picture
 * it is breaking, which is what the first version of this scene did.
 */

import { Vector3 } from 'three';

import { COLOR, POINTS, THRESHOLD, TIME } from '../theme.js';
import { rgbOf, clearDelays, delayFraction } from './_base.js';
import { createSequence } from '../sequence.js';
import { buildStudent } from '../shapes/student.js';
import { buildShadows, SHADOW_HEADS } from '../shapes/shadow.js';
import { buildCracks } from '../shapes/cracks.js';
import { buildKnife } from '../shapes/knife.js';

/* ── Who owns which point ───────────────────────────────────────────────── */

const isStudent = (i) => i % 4 === 0;
const isKnife = (i) => i % 4 === 3;

/**
 * The child's placement, exported so `cold-02` builds the same figure from the
 * same numbers. It is deliberately small: the loneliness is the image, and a
 * figure that fills the frame is not alone in it.
 */
export const STUDENT = { scale: 1.0, offset: [0, -0.06] };

/**
 * Built once, with EVERY point, and shared with coldopen.js.
 *
 * Sharing the buffer rather than rebuilding it is what makes the first move of
 * `thresh-01` read correctly. The points that stay behind are the points that
 * were already there, so the child does not flinch, shift or re-scatter as
 * three quarters of the field peels off its back.
 */
export const STUDENT_FIGURE = buildStudent(STUDENT);

/* ── The three states of the picture ────────────────────────────────────── */

const near = buildShadows({ arrived: false });
const far = buildShadows({ arrived: true });

/** Child from one buffer, shadows from the other. */
function compose(shadowPositions) {
  const out = new Float32Array(POINTS * 3);
  for (let i = 0; i < POINTS; i++) {
    const i3 = i * 3;
    const src = isStudent(i) ? STUDENT_FIGURE : shadowPositions;
    out[i3] = src[i3];
    out[i3 + 1] = src[i3 + 1];
    out[i3 + 2] = src[i3 + 2];
  }
  return out;
}

/** The darkness pooled behind the child, before any of it has come out. */
const POOLED = compose(near.positions);

/** The settled pose: three shadows flanking and rising behind the child. */
const ARRIVED = compose(far.positions);

/* ── The knife, and where it goes in ────────────────────────────────────── */

/**
 * Upright, handle up, blade down. buildKnife draws a cleaver lying on its side
 * with the blade toward -x, so a quarter turn the positive way stands it up
 * point-down; the offset then lifts it so the tip sits just below the middle of
 * the picture, in the child.
 */
const KNIFE = {
  pick: (() => {
    const pick = [];
    for (let i = 0; i < POINTS; i++) if (isKnife(i)) pick.push(i);
    return pick;
  })(),
  tilt: Math.PI / 2,
  // Small enough to read as a knife IN the picture rather than a slab across
  // it. At 0.85 the cleaver was as wide as the child and as tall as the frame,
  // and the two shapes fought; this leaves the composition visible around it.
  scale: 0.62,
  offset: [0, 0.3],
};

/** Where the tip lands, and therefore where every crack radiates from. */

const ORIGIN = [0.05, -0.06];

/** How far above the frame the knife starts its fall. */
const DROP = 1.15;

/**
 * knife.js draws a CLEAVER — broad, deep, squared tip, blade toward -x — and
 * that is the right shape where it was written for: lying on its side next to
 * the gun in the Refusal, where a slim blade would be four points wide and
 * vanish.
 *
 * Stood on its tip it is the wrong shape. A cleaver's proportions rotated 90
 * degrees read as a red slab with a handle, and the first version of this beat
 * put exactly that through the middle of the picture. So the Threshold narrows
 * it toward its own centreline and tapers the last fifth into an actual point.
 *
 * Done here rather than in knife.js on purpose: the Refusal depends on the
 * cleaver being a cleaver, and this is a fact about standing one up, not a fact
 * about knives.
 */
const NARROW = 0.5;
const TIP_SHARE = 0.2;
const TIP_WIDTH = 0.12;

function sharpen(out) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const i of KNIFE.pick) {
    const x = out[i * 3];
    const y = out[i * 3 + 1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const cx = (minX + maxX) / 2;
  const tipEnd = minY + (maxY - minY) * TIP_SHARE;

  for (const i of KNIFE.pick) {
    const i3 = i * 3;
    let k = NARROW;
    if (out[i3 + 1] < tipEnd) {
      // Linear from a near-point at the very tip up to full width at the
      // shoulder. Linear, not eased: a curved taper reads as a leaf.
      const t = (out[i3 + 1] - minY) / (tipEnd - minY);
      k *= TIP_WIDTH + (1 - TIP_WIDTH) * t;
    }
    out[i3] = cx + (out[i3] - cx) * k;
  }
}

function withKnife(picture) {
  const out = picture.slice();
  buildKnife(out, KNIFE);
  sharpen(out);
  return out;
}

/** Picture untouched, knife embedded. The instant of impact. */
const PIERCED = withKnife(ARRIVED);

/** Fully broken. Small displacement, so the picture stays findable as itself. */
const CRACKED = withKnife(buildCracks(ARRIVED, ORIGIN));

/** The fast separation: most of the way there, then stage 3 finishes it. */
const SEPARATING = (() => {
  const out = new Float32Array(POINTS * 3);
  for (let i = 0; i < POINTS * 3; i++) {
    out[i] = PIERCED[i] + (CRACKED[i] - PIERCED[i]) * 0.62;
  }
  return out;
})();

/**
 * `thresh-03`'s one small move: the wedges open a little further, radially,
 * and stop. The knife is excluded by name — the storyboard's clearest single
 * instruction is that it stays upright and whole while everything around it is
 * in pieces, so it may not drift with them.
 */
const SETTLED = (() => {
  const out = CRACKED.slice();
  for (let i = 0; i < POINTS; i++) {
    if (isKnife(i)) continue;
    const i3 = i * 3;
    const dx = out[i3] - ORIGIN[0];
    const dy = out[i3 + 1] - ORIGIN[1];
    const r = Math.hypot(dx, dy) || 1;
    out[i3] += (dx / r) * 0.035;
    out[i3 + 1] += (dy / r) * 0.035;
  }
  return out;
})();

/* ── Colour ─────────────────────────────────────────────────────────────── */

/**
 * Intensities are low next to the ash values elsewhere in the deck, and that is
 * arithmetic rather than timidity. These shapes concentrate the whole field
 * into a fraction of the frame — the eyes put ~900 points inside six discs of
 * radius 0.032 — and under additive blending perceived brightness is density
 * times intensity. The eyes still come out the brightest thing on screen by a
 * wide margin, which is the point: the eyes are what make this read as demonic
 * rather than as smoke.
 */
const LIT = { student: 1.25, body: 0.5, eye: 0.8 };

function pictureColors() {
  const student = rgbOf(THRESHOLD.student, LIT.student);
  const body = rgbOf(THRESHOLD.shadow, LIT.body);
  const eye = rgbOf(THRESHOLD.shadowEye, LIT.eye);
  const out = new Float32Array(POINTS * 3);

  for (let i = 0; i < POINTS; i++) {
    const c = isStudent(i) ? student : far.eyeness[i] ? eye : body;
    out[i * 3] = c[0];
    out[i * 3 + 1] = c[1];
    out[i * 3 + 2] = c[2];
  }
  return out;
}

const PICTURE_COLORS = pictureColors();

/**
 * The wreckage.
 *
 * The picture does not change palette — it broke, it did not become a different
 * picture — but it does go DOWN. Two reasons, and the second is the one that
 * made this necessary rather than merely nice:
 *
 *   The light goes out of a thing when it breaks, and this is the deck's whole
 *   vocabulary for that.
 *
 *   The knife lands exactly where the child is, because the storyboard puts it
 *   through the middle of the picture. Under additive blending a full-intensity
 *   yellow child sitting inside a full-intensity red blade averages out to an
 *   orange smear and neither shape survives. Dropping the picture is what lets
 *   the blade read as a blade.
 *
 * The eyes are the exception and keep every bit of their brightness: they are
 * the one thing still alive in the frame, and `thresh-03` is built on the
 * audience not being able to look away from them.
 */
const WRECK_DIM = 0.42;

const WRECK_COLORS = (() => {
  const out = PICTURE_COLORS.slice();
  const blood = rgbOf(COLOR.blood, 1.1);

  for (let i = 0; i < POINTS; i++) {
    if (far.eyeness[i] && !isStudent(i)) continue;
    out[i * 3] *= WRECK_DIM;
    out[i * 3 + 1] *= WRECK_DIM;
    out[i * 3 + 2] *= WRECK_DIM;
  }

  for (const i of KNIFE.pick) {
    out[i * 3] = blood[0];
    out[i * 3 + 1] = blood[1];
    out[i * 3 + 2] = blood[2];
  }
  return out;
})();

/* ── The slither ────────────────────────────────────────────────────────── */

/**
 * A travelling wave along each body, out of phase per shadow, driven from
 * ABSOLUTE time and nothing else. That is what makes it apply()-safe: a jump
 * into this section produces the same motion as clicking into it, because
 * there is no accumulated state to reproduce.
 *
 * Amplitude grows with distance from the child, so the tails stay pinned where
 * they emerged and the heads carry the movement. Phase is derived from that
 * same distance, which is what turns three wobbling blobs into three things
 * travelling along their own length.
 */
const SLITHER = 0.055;
const AMP = new Float32Array(POINTS);
const PHASE = new Float32Array(POINTS);

for (let i = 0; i < POINTS; i++) {
  if (isStudent(i)) continue; // the child does not slither
  const i3 = i * 3;
  const r = Math.hypot(ARRIVED[i3] - STUDENT.offset[0], ARRIVED[i3 + 1] - STUDENT.offset[1]);
  AMP[i] = SLITHER * Math.min(1, r / 0.9);
  PHASE[i] = r * 5.5 + (i % 3) * 2.1;
}

/** Barely there, and only on the faces. `thresh-03` uses this alone. */
const GAZE = 0.2;

function slitherAt(field, time, facesOnly) {
  const o = field.sceneOffset;
  for (let i = 0; i < POINTS; i++) {
    const i3 = i * 3;
    let a = AMP[i];
    if (facesOnly) a = far.eyeness[i] ? a * GAZE : 0;
    if (a === 0) {
      o[i3] = 0;
      o[i3 + 1] = 0;
      continue;
    }
    o[i3] = Math.sin(time * 1.6 + PHASE[i]) * a;
    o[i3 + 1] = Math.cos(time * 1.3 + PHASE[i]) * a * 0.6;
  }
}

/* ── The labels ─────────────────────────────────────────────────────────── */

/**
 * One anchor per shadow, straight above its own head.
 *
 * Two earlier schemes tried and dropped, both 2026-09-03: pushing radially
 * past the head (the original) worked only while the three heads sat spread
 * out at roughly shoulder height, and broke the moment the curves hooked and
 * the heads clustered near the top — all three labels landed in the same
 * patch of sky. Moving them below the tails instead avoided the heads but
 * put the words nowhere near the shadows they name, on a slide about naming
 * three specific things. Now that the heads themselves are spread wide
 * (CURVES again), sitting a fixed gap directly above each one's own x gives
 * every label the shortest path to the thing it names with no overlap risk
 * baked in from the geometry — shardlabel.js's own collision pass (see
 * overlay/shardlabel.js) is still there as a backstop, not the plan.
 *
 * These are MUTATED every frame by the slither, in place. deck.js hands the
 * same Vector3 objects to the label pool, which re-projects them each frame —
 * so a word tracks its shadow's motion, this time including the head's own
 * position again (x and a fixed y-offset off it).
 */
const LABEL_ABOVE = 0.4; // clears the HEAD_R=0.2 disc with margin for the glow

export const labelAnchors = SHADOW_HEADS.map(
  ([x, y]) => new Vector3(x, y + LABEL_ABOVE, 0)
);

const LABEL_BASE = labelAnchors.map((v) => v.clone());

/** Head points sit at the far end of the curve, so they carry the widest swing. */
const HEAD_AMP = SHADOW_HEADS.map(([x, y]) => {
  const r = Math.hypot(x - STUDENT.offset[0], y - STUDENT.offset[1]);
  return { amp: SLITHER * Math.min(1, r / 0.9), phase: r * 5.5 };
});

function trackLabels(time, which) {
  for (let i = 0; i < labelAnchors.length; i++) {
    const { amp, phase } = HEAD_AMP[i];
    const a = which === 'faces' ? amp * GAZE : which === 'still' ? 0 : amp;
    labelAnchors[i].set(
      LABEL_BASE[i].x + Math.sin(time * 1.6 + phase + i * 2.1) * a,
      LABEL_BASE[i].y + Math.cos(time * 1.3 + phase + i * 2.1) * a * 0.6,
      LABEL_BASE[i].z
    );
  }
}

/* ── Beat 1: the shadows arrive ─────────────────────────────────────────── */

/**
 * Two stages. The darkness pools behind the child first — a short, unstaggered
 * move that barely reads as motion — and only then comes out. Without it the
 * shadows are a straight lerp out of the child's body, which reads as the child
 * dissolving rather than as something leaving them.
 */
const arrive = createSequence([
  {
    ms: 320,
    play: (ctx) => {
      clearDelays(ctx.field);
      ctx.field.morph(POOLED, { duration: 320, ease: 'inOutQuad' });
      ctx.field.morphColor(PICTURE_COLORS, { duration: 900 });
    },
    done: (ctx) => ctx.field.snap(POOLED, PICTURE_COLORS),
  },
  {
    ms: TIME.slither,
    play: (ctx) => {
      // One shadow every ~700ms, in the order CH names them, matching the
      // labels' own stagger. The delay is per POINT, keyed by which shadow the
      // point belongs to — the same posDelay mechanism that lights shards
      // 200ms apart, pointed at three creatures instead of four shards.
      const { field } = ctx;
      for (let i = 0; i < POINTS; i++) {
        field.posDelay[i] = isStudent(i)
          ? 0
          : delayFraction((i % 3) * TIME.shadowStagger, TIME.slither);
      }
      field.morph(ARRIVED, { duration: TIME.slither, ease: 'outExpo' });
    },
    done: (ctx) => {
      clearDelays(ctx.field);
      ctx.field.snap(ARRIVED, PICTURE_COLORS);
    },
  },
]);

/* ── Beat 2: the knife falls, and the picture breaks ────────────────────── */

/**
 * `dropT` runs 1 -> 0 across the pierce and is the ONLY piece of per-frame
 * state this scene accumulates. It is safe because every path that could
 * interrupt it sets it directly: `settle` zeroes it, and both `enter` and
 * `apply` call `stopAll` first.
 *
 * The fall is quadratic in distance covered rather than linear, so the blade
 * accelerates the way a dropped object does. A linear fall reads as a lowered
 * object, which is a different and much less alarming thing.
 */
let dropT = 0;

/**
 * Advance the fall and write it. ASSIGNS rather than adds — sceneOffset is not
 * cleared between frames, so accumulating here would launch the blade out of
 * frame within a second instead of dropping it into the picture.
 */
function fall(field, dt) {
  if (dropT > 0) dropT = Math.max(0, dropT - (dt * 1000) / TIME.pierce);

  const s = 1 - dropT;
  const y = DROP * (1 - s * s);
  const o = field.sceneOffset;
  for (const i of KNIFE.pick) o[i * 3 + 1] = y;
}

const stab = createSequence([
  {
    ms: TIME.pierce,
    play: (ctx) => {
      dropT = 1;
      clearDelays(ctx.field);
      ctx.field.morph(PIERCED, { duration: TIME.pierce, ease: 'linear' });
      ctx.field.morphColor(WRECK_COLORS, { duration: TIME.pierce });
    },
    done: (ctx) => {
      dropT = 0;
      ctx.field.snap(PIERCED, WRECK_COLORS);
    },
  },
  {
    ms: TIME.crack,
    play: (ctx) => {
      // The shake fires HERE, not with the fall: this is the frame the tip
      // reaches the picture, and an impact that lands early reads as a stumble.
      ctx.rig.shake(0.05, 420);
      ctx.field.morph(SEPARATING, { duration: TIME.crack, ease: 'linear' });
    },
    done: (ctx) => ctx.field.snap(SEPARATING, null),
  },
  {
    ms: TIME.wreck,
    play: (ctx) => ctx.field.morph(CRACKED, { duration: TIME.wreck, ease: 'outExpo' }),
    done: (ctx) => ctx.field.snap(CRACKED, WRECK_COLORS),
  },
]);

/* ── The scene ──────────────────────────────────────────────────────────── */

/** Nothing a previous beat started may keep running into the next one. */
function stopAll() {
  arrive.stop();
  stab.stop();
  dropT = 0;
}

export default {
  /** Read by deck.js when a beat carries `labels` instead of a `caption`. */
  labelAnchors,
  labelStagger: TIME.shadowStagger,
  labelTone: 'dark',

  mount(ctx) {
    clearDelays(ctx.field);
  },

  enter(state, ctx) {
    const { field } = ctx;
    stopAll();

    if (state.mode === 'shadows') {
      field.setDrift(0.012);
      field.setUpdate((dt, time) => {
        slitherAt(field, time, false);
        trackLabels(time, 'bodies');
      });
      arrive.start(ctx);
      return;
    }

    if (state.mode === 'shatter') {
      // The slither STOPS at the stab, mid-movement. Everything in frame
      // freezes except the blade, which is the only thing still arriving.
      //
      // Baked, not zeroed: the shadows were mid-swing when the operator
      // clicked, and zeroing would snap them back a frame before the knife
      // lands. The crack has to start from where the picture visibly was.
      field.setDrift(0.006);
      field.bakeOffsets();
      field.sceneOffset.fill(0);
      field.setUpdate((dt) => fall(field, dt));
      stab.start(ctx);
      return;
    }

    // wreckage. Near-stillness, and the eyes are the last thing alive in it.
    field.setDrift(0.002);
    field.setUpdate((dt, time) => {
      slitherAt(field, time, true);
      trackLabels(time, 'faces');
    });
    field.morph(SETTLED, { duration: TIME.wreck, ease: 'outExpo' });
    field.morphColor(WRECK_COLORS, { duration: 400 });
  },

  apply(state, ctx) {
    const { field } = ctx;
    stopAll();
    clearDelays(field);

    if (state.mode === 'shadows') {
      field.setDrift(0.012);
      field.setUpdate((dt, time) => {
        slitherAt(field, time, false);
        trackLabels(time, 'bodies');
      });
      // Never replays the arrival. A jump into slide 3 lands on the settled
      // pose, because an operator recovering from a mis-click wants the state,
      // not the performance of reaching it.
      arrive.settle(ctx);
      return;
    }

    if (state.mode === 'shatter') {
      field.setDrift(0.006);
      field.sceneOffset.fill(0);
      field.setUpdate(null);
      // Lands AFTER the stab: knife embedded, picture cracked, at rest. A jump
      // must never re-stab any more than it may re-fire the Effects gun.
      stab.settle(ctx);
      return;
    }

    field.setDrift(0.002);
    field.setUpdate((dt, time) => {
      slitherAt(field, time, true);
      trackLabels(time, 'faces');
    });
    field.snap(SETTLED, WRECK_COLORS);
  },

  unmount(ctx) {
    stopAll();
    // The shadows were mid-swing and the wedges mid-drift; bake so the title's
    // reshuffle starts from where the points visibly are rather than snapping
    // back to where the last morph left them.
    ctx.field.bakeOffsets();
    ctx.field.resetSceneMods();
  },
};

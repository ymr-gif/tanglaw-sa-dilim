/**
 * threshold.js — slides 2-3. A child alone, three shadows, and a bullseye.
 *
 * Three beats were storyboarded, one per sentence CH speaks; `thresh-03` —
 * the wreckage holding, unmoving — was cut 2026-09-03 as a repeat of what
 * `thresh-02` already ends on. Its `mode: 'wreckage'` branch is left in
 * `enter`/`apply` below rather than deleted; see the note above it.
 *
 *   thresh-01  three shadows come out of the child's own back and are named
 *   thresh-02  a target falls into the picture, takes a shot, and shatters
 *
 * COLOUR. This section is vivid, which the old §3 rule forbade and the amended
 * one allows: the deck's colour argument is TEMPERATURE, not saturation. These
 * hues are cold and violent — electric violet, hard red — against the festival
 * palette's warmth, and the yellow student is the single warm thing in frame
 * because they are the single living thing in it. No festival hue appears here.
 *
 * THE POINT BUDGET. One THREE.Points object holds everything, so the child and
 * the shadows and the target are all carved out of the same 17000 points by
 * index:
 *
 *   i % 4 === 0   the child                                    (4250 points)
 *   i % 4 === 3   the bullseye, from thresh-02 on                (4250 points)
 *   everything else   the three shadows, by i % 3               (8500 points)
 *
 * Two things fall out of that arithmetic and both are wanted. The child keeps
 * exactly the points it had in `cold-02` and never re-scatters, so it holds
 * still while the darkness leaves it. And the target is made of shadow — it is
 * not a new object arriving, it is what was already standing behind the child,
 * and residue 3 can never take a point from residue 0.
 *
 * The bullseye's quarter is generous for its size, deliberately. It has to be
 * the densest thing on screen the moment it lands or it disappears into the
 * picture it is breaking, which is what the first version of this scene did
 * with the knife it used to be.
 */

import { Vector3 } from 'three';

import { COLOR, POINTS, THRESHOLD, TIME } from '../theme.js';
import { rgbOf, clearDelays, delayFraction } from './_base.js';
import { createSequence } from '../sequence.js';
import { buildStudent } from '../shapes/student.js';
import { buildShadows, SHADOW_HEADS } from '../shapes/shadow.js';
import { buildCracks } from '../shapes/cracks.js';
import { buildBullseye } from '../shapes/bullseye.js';

/* ── Who owns which point ───────────────────────────────────────────────── */

const isStudent = (i) => i % 4 === 0;
const isBullseye = (i) => i % 4 === 3;

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

/* ── The bullseye, and where it goes in ─────────────────────────────────── */

/** Where the shot lands, and therefore where every crack radiates from. */
const ORIGIN = [0.05, -0.06];

/**
 * Centred directly on `ORIGIN` — unlike the knife it replaced, a target is
 * radially symmetric about its own middle, so there is no tip offset to solve
 * for and no `tilt` to give it: buildBullseye's rings look the same rotated
 * any way at all.
 */
const BULLSEYE = {
  pick: (() => {
    const pick = [];
    for (let i = 0; i < POINTS; i++) if (isBullseye(i)) pick.push(i);
    return pick;
  })(),
  // Small enough to read as a target IN the picture rather than a disc across
  // it, on the same reasoning the knife it replaced was kept narrow: leave the
  // composition visible around it rather than crowding the child.
  scale: 0.34,
  offset: ORIGIN,
};

/** How far above the frame the bullseye starts its fall. */
const DROP = 1.15;

function withBullseye(picture) {
  const out = picture.slice();
  buildBullseye(out, BULLSEYE);
  return out;
}

/** Picture untouched, bullseye embedded. The instant of impact. */
const PIERCED = withBullseye(ARRIVED);

/** Fully broken. Small displacement, so the picture stays findable as itself. */
const CRACKED = withBullseye(buildCracks(ARRIVED, ORIGIN));

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
 * and stop. The bullseye is excluded by name — the storyboard's clearest
 * single instruction was that it stays upright and whole while everything
 * around it is in pieces, so it may not drift with them.
 *
 * `thresh-03` itself is retired (see the file header) and no beat reaches
 * this constant any more. Left here rather than deleted, on the same
 * reasoning `effects.js` keeps its own retired states: it costs nothing to
 * keep, and restoring the beat is a one-line change away.
 */
const SETTLED = (() => {
  const out = CRACKED.slice();
  for (let i = 0; i < POINTS; i++) {
    if (isBullseye(i)) continue;
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
 *   The bullseye lands exactly where the child is, because the storyboard
 *   puts it through the middle of the picture. Under additive blending a
 *   full-intensity yellow child sitting inside a full-intensity red target
 *   averages out to an orange smear and neither shape survives. Dropping the
 *   picture is what lets the target read as a target.
 *
 * The eyes are the exception and keep every bit of their brightness: they are
 * the one thing still alive in the frame — originally for `thresh-03`'s
 * benefit, and left this way since retiring that beat costs nothing.
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

  for (const i of BULLSEYE.pick) {
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
 * One anchor per shadow, pushed a little further out along the direction the
 * head already sits from the child, so the word clears the face it names
 * instead of sitting on it.
 *
 * These are MUTATED every frame by the slither, in place. deck.js hands the
 * same Vector3 objects to the label pool, which re-projects them each frame —
 * so a word tracks its shadow rather than marking where it once was.
 */
const LABEL_PUSH = 0.55;

export const labelAnchors = SHADOW_HEADS.map(([x, y]) => {
  const len = Math.hypot(x, y) || 1;
  return new Vector3(x + (x / len) * LABEL_PUSH, y + (y / len) * LABEL_PUSH, 0);
});

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
  for (const i of BULLSEYE.pick) o[i * 3 + 1] = y;
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
      // THE GUNSHOT. Fires HERE, not with the fall: this is the frame the
      // target reaches the picture, and an impact that lands early reads as
      // a stumble. Same magnitude as the Effects gun's own shot
      // (`rig.shake(0.06, 520)` in effects.js) — it is the same kind of bang.
      ctx.rig.shake(0.05, 420);
      ctx.field.morph(SEPARATING, { duration: TIME.crack, ease: 'linear' });
    },
    done: (ctx) => ctx.field.snap(SEPARATING, null),
  },
  {
    ms: TIME.wreck,
    play: (ctx) => {
      // THE SHATTER, alongside the gunshot rather than instead of it: a
      // second, softer jolt as the wedges carry on separating outward. Lower
      // power and a longer decay than the gunshot above — a rattle following
      // the bang, not a second bang.
      ctx.rig.shake(0.022, 640);
      ctx.field.morph(CRACKED, { duration: TIME.wreck, ease: 'outExpo' });
    },
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

    // wreckage. Retired with thresh-03 — no beat sets this mode any more, kept
    // dormant per the file header. Near-stillness, eyes the last thing alive.
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

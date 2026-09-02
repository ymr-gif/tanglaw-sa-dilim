/**
 * close.js — beats 25-26. The mask completes, then becomes a lantern.
 *
 * "Final shard seats, mask completes in full color, rises, dissolves upward
 *  into lantern glow. Loops indefinitely." (CONTEXT.md §6)
 *
 * close-01 is the first moment in the entire deck where all four hues are lit
 * at FULL rather than Prevention's partial brightness — the mask's own true
 * colours, not the festival diagram. All four shards have been seated since
 * prev-04 (shard 3, the one that was foreign, seats the same beat it lights);
 * what arrives new here is the colour, not the geometry.
 *
 * close-02 must be safe to hold through applause, so it never ends: points
 * stream upward, fade, and re-seed at the mask, forever. There is no beat after
 * this one. The operator presses Q when Q&A begins.
 */

import { Color } from 'three';

import { COLOR, TIME } from '../theme.js';
import { POINTS } from '../theme.js';
import { clearDelays, createFlare, reshuffle } from './_base.js';

/**
 * The close does not light the mask in four assigned hues. It lights the mask in
 * ITS OWN colours, sampled from the artwork pixel by pixel.
 *
 * Every section before this has been the deck's reading of the mask — ash for
 * the unlit face, one hue per root cause, one hue per solution. Here the mask
 * stops being a diagram of the argument and goes back to being the object it
 * actually is: pink, gold, and the white face underneath. That is what
 * "Tanglaw" is for, and it is the brightest frame in the presentation.
 */
const FULL = 2.4;

/** How far a point rises before it re-seeds at the mask. */
const RISE_SPAN = 1.5;

/**
 * The fade is by absolute height, not by distance travelled.
 *
 * Travelled-distance fading looks correct until you notice that a point which
 * starts at the chin and one that starts at the crown reach the top of the
 * frame at completely different points in their own climb — so the crown's
 * points cross the frame edge at full brightness and the dissolve gets a hard
 * horizontal cut. Fading on where a point actually *is* has no edge.
 */
const FADE_TOP = 0.92;
const FADE_LEN = 0.66;

/** How hard the artwork's own saturation is pushed for emission. */
const SATURATE = 2.1;

/** Below this saturation a pixel is "the white face", not a colour. */
const NEUTRAL = 0.14;

/** The bloom as the mask completes. The brightest instant in the deck. */
const bloom = createFlare({ peak: 2.3, ms: 1100 });

let colorCache = null;

/**
 * The artwork's own colours, lifted to emission brightness.
 *
 * Two corrections, both learned from looking at it on screen rather than
 * reasoning about it:
 *
 *   Saturation is pushed hard. Paint reflects light; these points EMIT it
 *   against a near-black field, and colour read straight off the artwork comes
 *   out looking washed and grey once it is glowing.
 *
 *   The near-white pixels — the mask's own face, a large part of the image —
 *   are tinted toward `radiance` rather than left neutral. Left alone they
 *   render as grey and drain the warmth out of the brightest moment in the
 *   deck. Warm white reads as light; neutral white reads as an unlit screen.
 */
function fullColors(mask) {
  if (colorCache) return colorCache;

  const src = mask.artColor;
  const out = new Float32Array(src.length);

  const c = new Color();
  const warm = new Color(COLOR.radiance);
  const hsl = { h: 0, s: 0, l: 0 };

  for (let i = 0; i < src.length; i += 3) {
    c.setRGB(src[i], src[i + 1], src[i + 2]);
    c.getHSL(hsl);

    if (hsl.s < NEUTRAL) {
      // The face. Keep its value, take the warmth from the festival cream.
      c.copy(warm).multiplyScalar(0.34 + hsl.l * 0.46);
    } else {
      c.setHSL(hsl.h, Math.min(1, hsl.s * SATURATE), hsl.l);
    }

    out[i] = c.r * FULL;
    out[i + 1] = c.g * FULL;
    out[i + 2] = c.b * FULL;
  }

  colorCache = out;
  return colorCache;
}

/**
 * The upward dissolve. Each point climbs at its own rate, dims as it goes, and
 * re-seeds at the bottom of its climb — so the lantern is always dispersing and
 * always whole, and the loop has no seam to notice.
 */
function stream(field, mask, dt) {
  const { sceneOffset, brightness, noise } = field;

  // Where the points ACTUALLY are, from the last composed frame — not where the
  // morph is taking them. Fading against the destination looks correct once the
  // morph has settled and is wrong for every frame before that: a point still
  // travelling gets the brightness of somewhere it has not arrived, so some
  // cross the top of the frame lit and the dissolve grows a hard edge.
  const live = field.points.geometry.attributes.position.array;

  for (let i = 0; i < POINTS; i++) {
    const i3 = i * 3;
    const roll = noise.roll(i);
    const speed = 0.055 + roll * 0.13;

    let y = sceneOffset[i3 + 1] + speed * dt;
    if (y > RISE_SPAN) y -= RISE_SPAN;

    sceneOffset[i3 + 1] = y;
    // A little outward wander as it climbs, so the column is not a pillar.
    sceneOffset[i3] = Math.sin(y * 2.1 + roll * 6.28) * 0.06 * (y / RISE_SPAN);

    // Gone before it reaches the top of the frame, wherever it started.
    brightness[i] = Math.min(1, Math.max(0, (FADE_TOP - live[i3 + 1]) / FADE_LEN));
  }
}

export default {
  mount(ctx) {
    clearDelays(ctx.field);
  },

  enter(state, ctx) {
    const { field, mask } = ctx;
    clearDelays(field);
    field.brightness.fill(1);

    if (state.mode === 'complete') {
      field.setDrift(0.007);
      field.setUpdate(null);

      // Refusal hands its stars over by reshuffling, not by sliding — "the
      // transition will be like the dots reshuffling" is the storyboard's last
      // frame, and this entry is where it lands. It costs nothing on the paths
      // that do not come from the stars.
      reshuffle(field, 0.6);

      // The final shard still arrives last — it seats on "bringing the light".
      // Layered ON TOP of the reshuffle rather than replacing it, so the two
      // do not cancel each other out.
      for (let i = 0; i < field.posDelay.length; i++) {
        const last = mask.shardOf[i] === 3 ? 0.34 : 0;
        field.posDelay[i] = Math.min(0.92, field.posDelay[i] + last);
        field.colDelay[i] = last;
      }

      field.morph(mask.states.complete, { duration: 1500, ease: 'outExpo' });
      field.morphColor(fullColors(mask), { duration: 1500, ease: 'outCubic' });

      // Everything blooms together. This is the only moment in the deck that
      // does — every other light arrives one shard at a time.
      bloom.trigger(null);
      field.setUpdate((dt) => {
        if (!bloom.step(field, dt)) field.setUpdate(null);
      });
      return;
    }

    // lantern
    field.setDrift(0.01);
    field.morph(mask.states.lantern, { duration: TIME.lantern, ease: 'inOutQuad' });
    field.morphColor(fullColors(mask), { duration: TIME.lantern });
    field.setUpdate((dt) => stream(field, mask, dt));
  },

  apply(state, ctx) {
    const { field, mask } = ctx;
    clearDelays(field);
    field.brightness.fill(1);

    if (state.mode === 'complete') {
      field.setUpdate(null);
      bloom.reset(field);
      field.setDrift(0.007);
      field.snap(mask.states.complete, fullColors(mask));
    } else {
      field.setDrift(0.01);
      field.snap(mask.states.lantern, fullColors(mask));
      field.setUpdate((dt) => stream(field, mask, dt));
    }
  },

  unmount(ctx) {
    // Fold the stream's offsets into the base first, so whatever comes next —
    // usually the Q&A embers — starts from where the points visibly are.
    ctx.field.bakeOffsets();
    ctx.field.resetSceneMods();
  },
};

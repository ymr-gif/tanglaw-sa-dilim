/**
 * pointfield.js — the single THREE.Points object, and the morph engine.
 *
 * THE LIBRARY SEAM (CONTEXT.md §7)
 *   anime.js animates a scalar from 0 to 1. Three.js reads it every frame.
 *   anime.js never touches the scene graph; Three never handles timing.
 *   Both libraries stay in the lane they're good at.
 *
 * Per frame, for every point:
 *
 *   posBase   = lerp(from, to, ease(stagger(t)))
 *   position  = posBase + drift(time) + sceneOffset
 *
 *   colorBase = lerp(colourFrom, colourTo, ease(stagger(tc)))
 *   colour    = colorBase * brightness
 *
 * The *Base buffers are what animations interpolate between; the composed
 * buffers are what the GPU sees. Keeping them separate is what stops drift and
 * brightness from compounding into themselves every time a new morph starts.
 *
 * `stagger` is a per-point delay in 0..1. One mechanism covers two things the
 * deck needs everywhere: shards lighting ~200ms apart, and the classroom grid
 * going dark outward from one desk instead of all at once.
 *
 * `sceneOffset` and `brightness` are scratch buffers a scene drives from its
 * own per-frame hook — the lantern's upward stream, the embers' orbits, the
 * breathing. They are cleared on unmount, so no scene can leak into the next.
 */

import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Points,
  PointsMaterial,
} from 'three';
import { animate } from 'animejs';

import { POINTS, BASE_POINT_SIZE } from './theme.js';
import { createNoise } from './noise.js';

/**
 * Easing is applied per point, after the stagger remap, so a delayed point gets
 * the whole eased curve rather than the tail of someone else's. anime.js still
 * owns the clock — it drives the raw scalar linearly.
 */
const EASE_FN = {
  linear: (t) => t,
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inQuad: (t) => t * t,
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
};

const DEFAULT_DRIFT = 0.006;

/**
 * The point sprite: a solid core with a short glow falloff.
 *
 * Pure black kills glow falloff, which is why the background is
 * indigo-charcoal and the points are additive (§4).
 *
 * The core is deliberately hard. A wide soft gradient looks better on a laptop
 * and turns to haze on a projector — low contrast plus a room that is never
 * fully dark means the faint outer half of every sprite simply disappears, and
 * the mask loses its edges. Most of the sprite is opaque, with just enough
 * falloff at the rim to keep the glow.
 */
function glowTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0.0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.42, 'rgba(255,255,255,0.92)');
  grad.addColorStop(0.66, 'rgba(255,255,255,0.42)');
  grad.addColorStop(1.0, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}

export function createPointField() {
  const noise = createNoise(POINTS);

  // Uploaded to the GPU.
  const position = new Float32Array(POINTS * 3);
  const color = new Float32Array(POINTS * 3);

  // Interpolated. Never include drift, offsets or brightness.
  const posBase = new Float32Array(POINTS * 3);
  const colorBase = new Float32Array(POINTS * 3);

  const from = new Float32Array(POINTS * 3);
  const to = new Float32Array(POINTS * 3);
  const colorFrom = new Float32Array(POINTS * 3);
  const colorTo = new Float32Array(POINTS * 3);

  // Scene-owned modifiers.
  const posDelay = new Float32Array(POINTS);
  const colDelay = new Float32Array(POINTS);
  const sceneOffset = new Float32Array(POINTS * 3);
  const brightness = new Float32Array(POINTS).fill(1);

  /**
   * Per-point tone from the artwork, set once at boot and never by a scene.
   *
   * `brightness` belongs to whichever scene is running and gets overwritten
   * constantly; this is the mask's own value structure, which is true for the
   * whole presentation. Keeping them separate is what lets the artwork's detail
   * survive a scene that is busy dimming half the field for its own reasons.
   */
  const tone = new Float32Array(POINTS).fill(1);

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(position, 3));
  geometry.setAttribute('color', new BufferAttribute(color, 3));

  const material = new PointsMaterial({
    size: BASE_POINT_SIZE,
    map: glowTexture(),
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    sizeAttenuation: true,
  });

  const points = new Points(geometry, material);
  points.frustumCulled = false; // several states fly well outside the mask bounds

  // Two independent tracks: geometry and light do not always move together.
  // Prevention converges over 1100ms while each shard lights over 700ms.
  const track = {
    pos: { t: 1, ease: 'outExpo', anim: null, onDone: null },
    col: { t: 1, ease: 'outCubic', anim: null, onDone: null },
  };

  const drift = [0, 0, 0];
  let driftScale = DEFAULT_DRIFT;
  let updateHook = null;

  function settle(tr) {
    if (tr.anim) {
      tr.anim.pause();
      tr.anim = null;
    }
    tr.t = 1;
    if (tr.onDone) {
      const done = tr.onDone;
      tr.onDone = null;
      done();
    }
  }

  function run(name, duration, ease, onDone) {
    const tr = track[name];
    if (tr.anim) {
      tr.anim.pause();
      tr.anim = null;
    }
    tr.onDone = onDone ?? null;
    tr.ease = ease;
    tr.t = 0;

    if (duration <= 0) {
      settle(tr);
      return;
    }

    // Linear here on purpose — easing happens per point, after the stagger.
    tr.anim = animate(tr, {
      t: 1,
      duration,
      ease: 'linear',
      onComplete: () => {
        tr.anim = null;
        if (tr.onDone) {
          const done = tr.onDone;
          tr.onDone = null;
          done();
        }
      },
    });
  }

  const field = {
    points,
    geometry,
    material,
    noise,
    posDelay,
    colDelay,
    sceneOffset,
    brightness,

    get isAnimating() {
      return Boolean(track.pos.anim || track.col.anim);
    },

    /**
     * Raw 0..1 progress of the geometry track.
     *
     * Exposed so a scene can bend the path points travel along. A morph is a
     * straight lerp between two states, which is honest but lifeless; a scene
     * that knows how far through it is can add a tangential offset shaped like
     * sin(pi*t) and turn that straight line into an arc that still lands
     * exactly where it was going to.
     */
    get posProgress() {
      return track.pos.t;
    },

    /** Set once at boot from the artwork. Never call this from a scene. */
    setTone(values) {
      tone.set(values);
    },

    /** Amplitude of the always-on wobble. Scenes raise it for loose fields. */
    setDrift(scale) {
      driftScale = scale;
    },

    /** Per-frame scene hook: fn(dt, time, field). Cleared on unmount. */
    setUpdate(fn) {
      updateHook = fn ?? null;
    },

    /** Clear every scene-owned modifier. Called on unmount, always. */
    resetSceneMods() {
      sceneOffset.fill(0);
      brightness.fill(1);
      posDelay.fill(0);
      colDelay.fill(0);
      updateHook = null;
      driftScale = DEFAULT_DRIFT;
    },

    /**
     * Fold the current scene offsets into the interpolation base and zero them.
     * A scene that has moved points from its per-frame hook calls this in
     * unmount(), so the next scene morphs from where the points visibly are
     * rather than snapping back to where the last morph left them.
     */
    bakeOffsets() {
      for (let i = 0; i < POINTS * 3; i++) {
        posBase[i] += sceneOffset[i];
        from[i] = posBase[i];
        to[i] = posBase[i];
      }
      sceneOffset.fill(0);
      track.pos.t = 1;
    },

    /** Animate geometry toward `target`. */
    morph(target, { duration = 900, ease = 'outExpo', onComplete } = {}) {
      from.set(posBase);
      to.set(target);
      run('pos', duration, ease, onComplete);
    },

    /** Animate colour toward `target`. */
    morphColor(target, { duration = 700, ease = 'outCubic', onComplete } = {}) {
      colorFrom.set(colorBase);
      colorTo.set(target);
      run('col', duration, ease, onComplete);
    },

    /**
     * Snap to a state with no animation. This is what every scene's apply()
     * uses, and it is the half everyone skips — it buys mis-click recovery,
     * section jumping, and interruption (§5).
     */
    snap(targetPos, targetCol) {
      settle(track.pos);
      settle(track.col);

      if (targetPos) {
        from.set(targetPos);
        to.set(targetPos);
        posBase.set(targetPos);
      }
      if (targetCol) {
        colorFrom.set(targetCol);
        colorTo.set(targetCol);
        colorBase.set(targetCol);
      }
    },

    /**
     * Finish whatever is in flight, instantly, and run its completion.
     * "Audiences never notice a skipped animation; they absolutely notice a
     *  deck running a full beat behind the speaker." (§5)
     */
    finish() {
      settle(track.pos);
      settle(track.col);
    },

    /** Composes and uploads one frame. Called by the render loop, always. */
    update(dt, time) {
      if (updateHook) updateHook(dt, time, field);

      const tp = track.pos.t;
      const tc = track.col.t;
      const easePos = EASE_FN[track.pos.ease] ?? EASE_FN.outExpo;
      const easeCol = EASE_FN[track.col.ease] ?? EASE_FN.outCubic;

      for (let i = 0; i < POINTS; i++) {
        const i3 = i * 3;

        const dp = posDelay[i];
        const ep = easePos(dp >= 1 ? 1 : Math.min(1, Math.max(0, (tp - dp) / (1 - dp))));

        posBase[i3] = from[i3] + (to[i3] - from[i3]) * ep;
        posBase[i3 + 1] = from[i3 + 1] + (to[i3 + 1] - from[i3 + 1]) * ep;
        posBase[i3 + 2] = from[i3 + 2] + (to[i3 + 2] - from[i3 + 2]) * ep;

        noise.drift(i, time, driftScale, drift);

        position[i3] = posBase[i3] + drift[0] + sceneOffset[i3];
        position[i3 + 1] = posBase[i3 + 1] + drift[1] + sceneOffset[i3 + 1];
        position[i3 + 2] = posBase[i3 + 2] + drift[2] + sceneOffset[i3 + 2];

        const dc = colDelay[i];
        const ec = easeCol(dc >= 1 ? 1 : Math.min(1, Math.max(0, (tc - dc) / (1 - dc))));

        colorBase[i3] = colorFrom[i3] + (colorTo[i3] - colorFrom[i3]) * ec;
        colorBase[i3 + 1] = colorFrom[i3 + 1] + (colorTo[i3 + 1] - colorFrom[i3 + 1]) * ec;
        colorBase[i3 + 2] = colorFrom[i3 + 2] + (colorTo[i3 + 2] - colorFrom[i3 + 2]) * ec;

        const b = brightness[i] * tone[i];
        color[i3] = colorBase[i3] * b;
        color[i3 + 1] = colorBase[i3 + 1] * b;
        color[i3 + 2] = colorBase[i3 + 2] * b;
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
    },
  };

  return field;
}

/**
 * main.js — boot, renderer, camera, the resize contract, and the render loop.
 *
 * This file owns nothing narrative. It builds the one Points object the deck
 * runs on, hands everything to deck.js, and then does the same three things
 * every frame forever: compose the field, place the shard label, draw.
 *
 * THE ONLY HARD SIZING REQUIREMENT (CONTEXT.md §8)
 *   It fits any common monitor with no overflow, at any aspect ratio, without
 *   manual adjustment.
 */

import { Color, PerspectiveCamera, Scene, Timer, WebGLRenderer } from 'three';

import { COLOR, FIT_MARGIN } from './theme.js';
import { loadMask } from './mask.js';
import { createPointField } from './pointfield.js';
import { createCaption } from './overlay/caption.js';
import { createShardLabel } from './overlay/shardlabel.js';
import { createTracker } from './overlay/tracker.js';
import { createDeck } from './deck.js';

const FOV = 50;

/**
 * Dolly the camera so the mask's bounding sphere fits with margin.
 *
 * On a wide monitor the vertical FOV binds; on a narrow or portrait one the
 * horizontal does. Taking the minimum handles both without a branch — which is
 * the whole reason the mask never crops and never floats in a sea of space.
 */
function fitDistance(radius, fovDeg, aspect) {
  const vFov = (fovDeg * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  return (radius * FIT_MARGIN) / Math.sin(Math.min(vFov, hFov) / 2);
}

async function boot() {
  const container = document.getElementById('stage');
  const overlayEl = document.getElementById('overlay');
  const veil = document.getElementById('veil');

  const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const scene = new Scene();
  // Deep indigo-charcoal, NOT pure black — festival colour needs somewhere to
  // bleed into, and pure black kills the glow falloff (§4).
  scene.background = new Color(COLOR.void);

  const camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
  const timer = new Timer();

  const mask = await loadMask();
  const field = createPointField();
  scene.add(field.points);

  /**
   * Driven by the container rather than the viewport, so it behaves the same in
   * fullscreen and windowed.
   *
   * Point size deliberately does NOT get a second height factor here. §8 gives
   * the formula `baseSize * (clientHeight / 900)` for screen-space sizing;
   * `sizeAttenuation` already makes rendered point size scale linearly with
   * container height (the fit distance depends only on aspect and FOV, never on
   * height), so applying both would scale points with the square of the height
   * and clog a large display. The intent of §8 is met; the multiplication is
   * not repeated.
   */
  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;

    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.set(0, 0, fitDistance(mask.radius, FOV, camera.aspect));
    camera.updateProjectionMatrix();
  }

  // ResizeObserver rather than the `resize` event — it also fires on fullscreen
  // toggle, devtools opening, and window snapping, which the plain event misses.
  new ResizeObserver(resize).observe(container);
  resize();

  const overlay = {
    caption: createCaption(overlayEl),
    shardlabel: createShardLabel(overlayEl),
    // Attached to the body, not #overlay: the tracker is review chrome that
    // outlives any single beat, and it must sit above the black veil so `B`
    // does not blind the operator to their own position.
    tracker: createTracker(document.body),
  };

  const ctx = { renderer, scene, camera, timer, container, field, mask, overlay, veil };
  const deck = createDeck(ctx);
  deck.start();

  renderer.setAnimationLoop(() => {
    // Clamped: a backgrounded tab returns with a huge delta, and the lantern
    // and ember streams integrate against it. Without this, coming back to the
    // deck jumps the field a long way in one frame.
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.05);
    const time = timer.getElapsed();

    field.update(dt, time);
    overlay.shardlabel.update(camera, container);
    renderer.render(scene, camera);
  });

  // Handy in rehearsal: the operator can check position from the console.
  window.__deck = deck;
}

boot().catch((error) => {
  console.error('[tanglaw] failed to start:', error);
});

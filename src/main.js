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
import { createCameraRig } from './camera-rig.js';
import { createDeck } from './deck.js';

const FOV = 50;

/**
 * Dolly the camera so the mask's bounding BOX fits with margin.
 *
 * Fitting the bounding sphere instead is the obvious version and it is wrong for
 * this shape: the mask plus crown very nearly fills its own bounding box, so the
 * circumscribed radius overshoots the real extent by up to √2 and the deck sits
 * in a sea of empty space. Fitting width and height independently and taking
 * whichever binds frames it properly at any aspect ratio.
 */
function fitDistance(halfW, halfH, fovDeg, aspect) {
  const vFov = (fovDeg * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);

  const forHeight = (halfH * FIT_MARGIN) / Math.tan(vFov / 2);
  const forWidth = (halfW * FIT_MARGIN) / Math.tan(hFov / 2);

  return Math.max(forHeight, forWidth);
}

async function boot() {
  const container = document.getElementById('stage');
  const overlayEl = document.getElementById('overlay');
  const veil = document.getElementById('veil');
  const flash = document.getElementById('flash');

  const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const scene = new Scene();
  // Deep indigo-charcoal, NOT pure black — festival colour needs somewhere to
  // bleed into, and pure black kills the glow falloff (§4).
  scene.background = new Color(COLOR.void);

  const camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
  // Every write to the camera goes through here. resize() sets the fit
  // distance, scenes set an offset, the rig composes them with the sway.
  const rig = createCameraRig(camera);
  const timer = new Timer();

  const mask = await loadMask();
  const field = createPointField();
  field.setTone(mask.artLuma);
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

    // The third argument (updateStyle) MUST stay true.
    //
    // Passing false tells Three not to set the canvas's CSS size. Combined with
    // setPixelRatio(2) that leaves a canvas whose backing store is 2w x 2h and
    // whose CSS size is unset — so it lays out at its buffer size, twice the
    // container, and the deck renders zoomed in and cropped on every retina,
    // tablet and phone display. It looks perfect on any DPR-1 monitor, which is
    // what made it survive several rounds of aspect-ratio testing.
    renderer.setSize(w, h);
    camera.aspect = w / h;
    // The rig places the camera every frame; resize only tells it how far back
    // the mask has to sit. Writing position.z here would be overwritten anyway.
    rig.setFit(fitDistance(mask.halfW, mask.halfH, FOV, camera.aspect));
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

  const ctx = { renderer, scene, camera, rig, timer, container, field, mask, overlay, veil, flash };
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
    // Before the label: the shard label projects through the camera, so it has
    // to be placed against the camera this frame will actually draw with.
    rig.update(dt, time);
    overlay.shardlabel.update(camera, container);
    renderer.render(scene, camera);
  });

  // Handy in rehearsal: the operator can check position from the console.
  window.__deck = deck;
}

boot().catch((error) => {
  console.error('[tanglaw] failed to start:', error);
});

/**
 * shardlabel.js — the Roots and Prevention words, anchored to their shards.
 *
 * "Never position captions by absolute px offsets from a shard. Use
 *  shardlabel.js to project the 3D shard position to screen space each frame,
 *  then clamp the resulting position inside the safe area." (CONTEXT.md §8)
 *
 * Every frame, not every beat: the shards drift constantly and the window can
 * be resized mid-sentence, so a label computed once is wrong almost
 * immediately. Clamping is what keeps a word off the bezel and out of projector
 * overscan on a monitor nobody tested.
 */

import { Vector3 } from 'three';

/**
 * The label is pushed out along its shard's own direction from centre, far
 * enough to clear the mask entirely — a word sitting inside the face is
 * unreadable against the points, and the eye tries to read both at once.
 *
 * The floor matters more than the multiplier: an inner shard (the eye sits only
 * ~0.3 from centre) would otherwise land on top of the face no matter how much
 * it were scaled.
 */
const OUTWARD = 1.42;
const MIN_RADIUS = 1.3;

export function createShardLabel(overlayEl) {
  const el = document.createElement('p');
  el.className = 'shard-label';
  el.dataset.tone = 'dark';
  overlayEl.appendChild(el);

  const projected = new Vector3();
  let anchor = null;

  return {
    /**
     * @param {string} text   rendered verbatim — lowercase in Roots, uppercase
     *                        in Prevention, exactly as beats.js has it
     * @param {Vector3} at    the shard's anchor in world space
     * @param {'dark'|'light'} tone
     * @param {boolean} immediate  true for apply(), so a jump lands instantly
     */
    show(text, at, tone, immediate = false) {
      anchor = at;
      el.textContent = text;
      el.dataset.tone = tone;

      if (immediate) {
        el.classList.add('is-visible');
      } else {
        requestAnimationFrame(() => el.classList.add('is-visible'));
      }
    },

    hide() {
      anchor = null;
      el.classList.remove('is-visible');
    },

    /** Called from the render loop, every frame. */
    update(camera, container) {
      if (!anchor) return;

      const len = anchor.length() || 1;
      projected
        .copy(anchor)
        .multiplyScalar(Math.max(OUTWARD, MIN_RADIUS / len))
        .project(camera);

      const w = container.clientWidth;
      const h = container.clientHeight;

      let x = (projected.x * 0.5 + 0.5) * w;
      let y = (-projected.y * 0.5 + 0.5) * h;

      // The same safe area the CSS uses: max(6vw, 2rem) / max(4vh, 2rem).
      const padX = Math.max(w * 0.06, 32);
      const padY = Math.max(h * 0.04, 32);

      const lw = el.offsetWidth;
      const lh = el.offsetHeight;

      x = Math.min(Math.max(x, padX + lw / 2), w - padX - lw / 2);
      y = Math.min(Math.max(y, padY + lh / 2), h - padY - lh / 2);

      el.style.transform = `translate(${Math.round(x - lw / 2)}px, ${Math.round(y - lh / 2)}px)`;
    },
  };
}

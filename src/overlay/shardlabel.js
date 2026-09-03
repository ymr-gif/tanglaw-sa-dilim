/**
 * shardlabel.js — words anchored to things on screen, rather than centred.
 *
 * "Never position captions by absolute px offsets from a shard. Use
 *  shardlabel.js to project the 3D shard position to screen space each frame,
 *  then clamp the resulting position inside the safe area." (CONTEXT.md §8)
 *
 * Every frame, not every beat: the shards drift constantly, the Threshold's
 * shadows slither, and the window can be resized mid-sentence, so a label
 * computed once is wrong almost immediately. Clamping is what keeps a word off
 * the bezel and out of projector overscan on a monitor nobody tested.
 *
 * ONE LABEL OR SEVERAL. Roots and Prevention show a single word on a single
 * shard; `thresh-01` shows three at once, one on each shadow, arriving in the
 * order CH names them. Both go through here, and the only difference is who
 * decides where the anchor is:
 *
 *   show(...)      one label, pushed OUT along its shard's own direction from
 *                  centre far enough to clear the mask. The push is this
 *                  module's, because clearing the mask is a fact about the mask.
 *
 *   showMany(...)  several labels, each projected from the anchor AS GIVEN.
 *                  The caller placed them, because only the caller knows what
 *                  its shapes look like. Anchors may be mutated in place
 *                  between frames — that is how a label tracks a moving thing.
 *
 * Elements are pooled and reused rather than created per beat, so a label that
 * is already on screen stays on screen through a re-show instead of flickering.
 */

import { Vector3 } from 'three';

/**
 * The single-label push. Far enough out to clear the mask entirely — a word
 * sitting inside the face is unreadable against the points, and the eye tries
 * to read both at once.
 *
 * The floor matters more than the multiplier: an inner shard (the eye sits only
 * ~0.3 from centre) would otherwise land on top of the face no matter how much
 * it were scaled.
 */
const OUTWARD = 1.42;
const MIN_RADIUS = 1.3;

export function createShardLabel(overlayEl) {
  const els = [];
  const projected = new Vector3();

  /** One entry per visible label: { el, at, push }. Empty when nothing shows. */
  let live = [];

  function elementAt(i) {
    if (!els[i]) {
      const el = document.createElement('p');
      el.className = 'shard-label';
      el.dataset.tone = 'dark';
      overlayEl.appendChild(el);
      els[i] = el;
    }
    return els[i];
  }

  /**
   * @param {{text: string, at: Vector3, tone: 'dark'|'light', delay?: number}[]} items
   * @param {boolean} immediate  true for apply(), so a jump lands instantly
   * @param {boolean} push       apply the mask-clearing outward push
   */
  function render(items, immediate, push) {
    live = items.map((item, i) => {
      const el = elementAt(i);
      el.textContent = item.text;
      el.dataset.tone = item.tone;

      // The stagger is a CSS transition-delay, not a timer. It costs nothing,
      // it cannot leak into the next beat, and apply() clears it by passing
      // `immediate` — which is exactly the behaviour a jump needs, since an
      // operator recovering from a mis-click should not have to sit through
      // three words arriving politely one at a time.
      el.style.transitionDelay = immediate ? '0ms' : `${item.delay ?? 0}ms`;

      if (immediate) el.classList.add('is-visible');
      else requestAnimationFrame(() => el.classList.add('is-visible'));

      return { el, at: item.at, push };
    });

    // Anything left over from a beat that showed more labels than this one.
    for (let i = items.length; i < els.length; i++) {
      els[i].style.transitionDelay = '0ms';
      els[i].classList.remove('is-visible');
    }
  }

  return {
    /**
     * @param {string} text   rendered verbatim — lowercase in Roots, uppercase
     *                        in Prevention, exactly as beats.js has it
     * @param {Vector3} at    the shard's anchor in world space
     * @param {'dark'|'light'} tone
     * @param {boolean} immediate
     */
    show(text, at, tone, immediate = false) {
      render([{ text, at, tone }], immediate, true);
    },

    /** Several labels, anchors used as given. See the header. */
    showMany(items, immediate = false) {
      render(items, immediate, false);
    },

    hide() {
      live = [];
      for (const el of els) {
        // Reset before hiding, or a staggered label fades out on its delay too
        // and the last word lingers alone after everything else has gone.
        el.style.transitionDelay = '0ms';
        el.classList.remove('is-visible');
      }
    },

    /** Called from the render loop, every frame. */
    update(camera, container) {
      if (!live.length) return;

      const w = container.clientWidth;
      const h = container.clientHeight;

      // The same safe area the CSS uses: max(6vw, 2rem) / max(4vh, 2rem).
      const padX = Math.max(w * 0.06, 32);
      const padY = Math.max(h * 0.04, 32);

      // First pass: project and clamp each label into the safe area, short of
      // the bottom band so several words never march down into the caption zone.
      const boxes = [];
      const bottomBand = padY + h * 0.06;
      for (const { el, at, push } of live) {
        projected.copy(at);
        if (push) {
          const len = at.length() || 1;
          projected.multiplyScalar(Math.max(OUTWARD, MIN_RADIUS / len));
        }
        projected.project(camera);

        let x = (projected.x * 0.5 + 0.5) * w;
        let y = (-projected.y * 0.5 + 0.5) * h;

        const lw = el.offsetWidth;
        const lh = el.offsetHeight;

        x = Math.min(Math.max(x, padX + lw / 2), w - padX - lw / 2);
        y = Math.min(Math.max(y, bottomBand + lh / 2), h - padY - lh / 2);

        boxes.push({ el, lw, lh, x, y });
      }

      // Second pass: keep labels from stacking on each other. When any two
      // boxes overlap, the upper one is pushed up (it wins the vertical fight)
      // and the loser sinks to just below it — repeated until nothing touches.
      let moved = true;
      while (moved) {
        moved = false;
        for (let i = 0; i < boxes.length; i++) {
          for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i];
            const b = boxes[j];
            const overlapX = Math.abs(a.x - b.x) < (a.lw + b.lw) / 2;
            const overlapY = Math.abs(a.y - b.y) < (a.lh + b.lh) / 2;
            if (!overlapX || !overlapY) continue;

            const gap = (a.lh + b.lh) / 2 + 10;
            // The upper label is authoritative; drop the one below it.
            if (a.y < b.y) {
              const low = b.y + gap;
              b.y = Math.min(Math.max(low, bottomBand + b.lh / 2), h - padY - b.lh / 2);
            } else {
              const low = a.y + gap;
              a.y = Math.min(Math.max(low, bottomBand + a.lh / 2), h - padY - a.lh / 2);
            }
            moved = true;
          }
        }
      }

      for (const { el, lw, lh, x, y } of boxes) {
        el.style.transform = `translate(${Math.round(x - lw / 2)}px, ${Math.round(y - lh / 2)}px)`;
      }
    },
  };
}

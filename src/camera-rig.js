/**
 * camera-rig.js — one owner for the camera.
 *
 * Until the Effects sequence, no scene had ever moved the camera and there was
 * nothing to compose: resize() set `position.z` and that was the whole story.
 * Three things now want the camera at once — the parallax sway, the sequence's
 * tracking and dolly, and the shake — so they need one place to compose rather
 * than three writers fighting over `camera.position`.
 *
 * `fit` comes from resize() and is the only thing that sets viewing distance.
 * No scene may write it; a scene that wants to be closer offsets toward it.
 *
 * `offset` is scene-driven and ABSOLUTE — a scene sets where it wants to be,
 * never nudges. That is deliberate: apply() must be able to reproduce a scene's
 * camera exactly, and it cannot do that against a value accumulated over frames
 * it never ran.
 *
 * `shake` is a decaying impulse, and the only part of the rig that is not a
 * pure function of its inputs. It is never reproduced by apply(); a jump lands
 * after the shake, which is what an operator recovering from a mis-click wants.
 */

import { SWAY } from './theme.js';

export function createCameraRig(camera) {
  let fitZ = 3;
  const offset = { x: 0, y: 0, z: 0 };

  let shakePower = 0;
  let shakeMs = 1;
  let shakeT = 0;

  return {
    /** From resize() only. The one thing that decides viewing distance. */
    setFit(z) {
      fitZ = z;
    },

    /** Read-only. A scene composing its own framing needs the fit distance to
     *  compute what's actually visible; it still may never write it. */
    getFitZ() {
      return fitZ;
    },

    /** Absolute, in world units. `z` is negative to move toward the field. */
    setOffset(x, y, z) {
      offset.x = x;
      offset.y = y;
      offset.z = z;
    },

    shake(power, ms) {
      shakePower = power;
      shakeMs = ms;
      shakeT = 1;
    },

    /** Called on unmount. A scene must never leak its camera into the next. */
    clearScene() {
      offset.x = offset.y = offset.z = 0;
      shakeT = 0;
    },

    update(dt, time) {
      // Parallax: a pure function of absolute time, so it is apply()-safe and
      // identical whether the deck was clicked through or jumped into.
      let x = Math.sin(time * SWAY.rateX) * SWAY.amount;
      let y = Math.sin(time * SWAY.rateY + 1.3) * SWAY.amount * 0.6;

      if (shakeT > 0) {
        shakeT = Math.max(0, shakeT - (dt * 1000) / shakeMs);
        // Squared decay: a real impact is violent then gone, not a fade.
        const k = shakePower * shakeT * shakeT;
        x += (Math.random() * 2 - 1) * k;
        y += (Math.random() * 2 - 1) * k;
      }

      camera.position.set(offset.x + x, offset.y + y, fitZ + offset.z);
      camera.lookAt(offset.x, offset.y, 0);
    },
  };
}

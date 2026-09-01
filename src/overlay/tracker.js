/**
 * tracker.js — the review chrome. Position, beat id, speaker, progress.
 *
 * THIS IS AN AUTHORING TOOL, NOT PART OF THE PIECE.
 *
 * The deck's whole discipline is that anything on screen is attention the
 * audience is not giving the speaker (CONTEXT.md §4). A permanent "07/22" in the
 * corner violates that outright — so the tracker hides itself the moment the
 * deck goes fullscreen, which is the only state it is ever presented in, and
 * comes back when you exit. `H` overrides either way.
 *
 * It shows the beat **id** alongside the number on purpose. `beats.js` says ids
 * are stable and must never be renumbered, so "roots-02" survives inserting a
 * beat and "slide 7" does not. When you come back with "this one needs work",
 * the id is the thing worth quoting.
 *
 * The speaker column is here for the same reason CONTEXT.md §10 calls it the
 * operator's job: handoffs are the only thing in the production that cannot be
 * fixed in code, so the operator should be able to see the next one coming.
 */

import { beats, totalBeats } from '../beats.js';

export function createTracker(root) {
  const el = document.createElement('div');
  el.className = 'tracker';
  el.innerHTML = `
    <div class="tracker__bar"><div class="tracker__fill"></div></div>
    <div class="tracker__hint">&larr; &rarr; Space &middot; 1-8 jump &middot; Q qna &middot; B black &middot; H hide</div>
    <div class="tracker__read">
      <span class="tracker__pos"><span class="tracker__index">01</span><span
        class="tracker__sep">/</span><span class="tracker__total">${totalBeats}</span></span>
      <span class="tracker__id">cold-01</span>
      <span class="tracker__speaker">BR</span>
    </div>
  `;
  root.appendChild(el);

  const fill = el.querySelector('.tracker__fill');
  const index = el.querySelector('.tracker__index');
  const id = el.querySelector('.tracker__id');
  const speaker = el.querySelector('.tracker__speaker');

  let visible = true;

  function render() {
    el.classList.toggle('is-hidden', !visible);
  }

  // Presenting means fullscreen. Reviewing means windowed. The tracker follows
  // that distinction rather than asking anyone to remember a key.
  document.addEventListener('fullscreenchange', () => {
    visible = !document.fullscreenElement;
    render();
  });

  return {
    /** @param {number} i beat index, or -1 while the Q&A field is up */
    update(i) {
      if (i < 0) {
        index.textContent = '--';
        id.textContent = 'qna';
        speaker.textContent = '';
        speaker.classList.remove('is-handoff');
        fill.style.width = '100%';
        return;
      }

      const beat = beats[i];
      index.textContent = String(i + 1).padStart(2, '0');
      id.textContent = beat.id;
      speaker.textContent = beat.speaker;
      speaker.classList.toggle('is-handoff', Boolean(beat.handoff));
      fill.style.width = `${((i + 1) / totalBeats) * 100}%`;
    },

    toggle() {
      visible = !visible;
      render();
    },
  };
}

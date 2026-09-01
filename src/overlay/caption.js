/**
 * caption.js — the on-screen words.
 *
 * THE TEXT BUDGET (CONTEXT.md §4)
 *   Hard ceiling: 5 words per beat. This is live — anything the audience reads
 *   is attention they are not giving the speaker. Most beats carry
 *   `caption: null`, and this module renders nothing for them.
 *
 * CASE IS LOAD-BEARING
 *   Text is rendered exactly as beats.js has it. Roots and Effects are
 *   lowercase because the darkness is said under the breath; Prevention and
 *   Close are uppercase because the light is declarative. There is no
 *   `text-transform` in this project, and there must never be one.
 *
 * The display face is reserved for two beats — the title and the refusal line
 * (§4). Everything else is body. A third exception would dilute both.
 */

const DISPLAY_BEATS = new Set(['title-01', 'ref-01']);

export function createCaption(overlayEl) {
  const el = document.createElement('p');
  el.className = 'caption';
  el.dataset.variant = 'body';
  overlayEl.appendChild(el);

  let current = null;

  return {
    /**
     * Show a beat's caption. Pass the beat itself — the variant is derived from
     * its id, so no scene has to remember which face it should be using.
     */
    show(beat) {
      const text = beat?.caption ?? null;

      if (!text) {
        this.clear();
        return;
      }
      if (current === beat.id) return;

      current = beat.id;
      el.dataset.variant = DISPLAY_BEATS.has(beat.id) ? 'display' : 'body';

      // Verbatim. No case normalisation, no trimming of the one long line.
      el.textContent = text;

      // Next frame, so the transition runs rather than the text simply being
      // there. On a snap this is imperceptible; on an enter it is the fade.
      requestAnimationFrame(() => el.classList.add('is-visible'));
    },

    clear() {
      current = null;
      el.classList.remove('is-visible');
    },

    /** Snap version for apply() — no fade, so a jump lands instantly. */
    snap(beat) {
      const text = beat?.caption ?? null;
      current = text ? beat.id : null;

      if (!text) {
        el.classList.remove('is-visible');
        return;
      }
      el.dataset.variant = DISPLAY_BEATS.has(beat.id) ? 'display' : 'body';
      el.textContent = text;
      el.classList.add('is-visible');
    },
  };
}

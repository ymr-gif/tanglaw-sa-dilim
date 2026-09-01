/**
 * deck.js — the beat index, and every key the operator can press.
 *
 * A STATE MACHINE, NOT A TIMELINE (CONTEXT.md §5)
 *
 *   Do not build one long anime.js timeline and scrub through it. Two speakers
 *   alternating seven times in front of a live audience means pacing will not
 *   match any timeline authored in advance.
 *
 * So: an array of beats, and an index. Click advances the index. NOTHING IS ON
 * A TIMER, EVER. Auto-timing desyncs from real speaking pace within about
 * thirty seconds, and then the rest of the speech is spent chasing slides.
 *
 * The three things apply() buys, all implemented here:
 *
 *   Mis-click recovery — `prev` walks back by applying every earlier beat
 *                        instantly rather than rewinding animations.
 *   Section jumping    — number keys apply every beat up to the target, so two
 *                        keystrokes reach anywhere in the deck.
 *   Interruption       — a click mid-animation finishes it instantly and then
 *                        advances. One click is always one beat. Nothing queues.
 */

import { beats, QNA, SECTIONS, sectionStart } from './beats.js';

import coldopen from './scenes/coldopen.js';
import threshold from './scenes/threshold.js';
import title from './scenes/title.js';
import roots from './scenes/roots.js';
import effects from './scenes/effects.js';
import prevention from './scenes/prevention.js';
import refusal from './scenes/refusal.js';
import close from './scenes/close.js';
import qna from './scenes/qna.js';

const SCENES = {
  coldopen,
  threshold,
  title,
  roots,
  effects,
  prevention,
  refusal,
  close,
  qna,
};

/** Roots and Prevention put their word on the shard; everything else centres. */
function isShardWord(beat) {
  return (
    (beat.scene === 'roots' || beat.scene === 'prevention') &&
    (beat.state.shard ?? -1) >= 0 &&
    Boolean(beat.caption)
  );
}

export function createDeck(ctx) {
  const { field, mask, overlay, veil } = ctx;

  let index = 0;
  let mounted = null;
  let inQna = false;
  let qnaReturn = 0;

  function mountScene(name) {
    if (mounted === name) return;
    if (mounted) SCENES[mounted].unmount(ctx);
    mounted = name;
    SCENES[name].mount(ctx);
  }

  function showText(beat, immediate) {
    if (isShardWord(beat)) {
      overlay.caption.clear();
      overlay.shardlabel.show(
        beat.caption,
        mask.anchors[beat.state.shard],
        beat.scene === 'roots' ? 'dark' : 'light',
        immediate
      );
      return;
    }

    overlay.shardlabel.hide();
    if (immediate) overlay.caption.snap(beat);
    else overlay.caption.show(beat);
  }

  function goTo(i, { animate = true } = {}) {
    index = Math.min(Math.max(i, 0), beats.length - 1);
    const beat = beats[index];

    mountScene(beat.scene);
    if (animate) SCENES[beat.scene].enter(beat.state, ctx);
    else SCENES[beat.scene].apply(beat.state, ctx);

    showText(beat, !animate);
    overlay.tracker.update(index);
  }

  /**
   * Walk every beat up to `target`, applying each. Because apply() is a snap,
   * the whole walk resolves in one frame — which is what makes a mid-speech
   * recovery invisible to the room.
   */
  function applyThrough(target) {
    const end = Math.min(Math.max(target, 0), beats.length - 1);

    for (let i = 0; i <= end; i++) {
      const beat = beats[i];
      mountScene(beat.scene);
      SCENES[beat.scene].apply(beat.state, ctx);
    }

    index = end;
    showText(beats[end], true);
    overlay.tracker.update(end);
  }

  const deck = {
    get index() {
      return index;
    },

    get beat() {
      return beats[index];
    },

    get inQna() {
      return inQna;
    },

    start() {
      goTo(0, { animate: false });
      // Let the opening state settle in, then breathe into it — the room is
      // still arriving when this happens.
      requestAnimationFrame(() => SCENES[beats[0].scene].enter(beats[0].state, ctx));
    },

    next() {
      if (inQna) return; // Q&A is a mode; it does not sit in the beat index

      // Snap the in-flight animation to done rather than queueing behind it.
      if (field.isAnimating) field.finish();

      if (index >= beats.length - 1) return; // nothing after close-02
      goTo(index + 1);
    },

    prev() {
      if (inQna) return;
      if (index === 0) return;
      applyThrough(index - 1);
    },

    jump(sectionId) {
      if (inQna) deck.toggleQna();
      const target = sectionStart(sectionId);
      if (target >= 0) applyThrough(target);
    },

    /**
     * Q&A is a mode, not a beat: its length is unknown, and the operator may
     * want to come back to the close for a final line (§9).
     */
    toggleQna() {
      if (!inQna) {
        inQna = true;
        qnaReturn = index;
        overlay.caption.clear();
        overlay.shardlabel.hide();
        mountScene(QNA.scene);
        SCENES[QNA.scene].enter(QNA.state, ctx);
        overlay.tracker.update(-1);
      } else {
        inQna = false;
        goTo(qnaReturn);
      }
    },

    /** B — black the screen. A real veil, so the operator decides the length. */
    toggleBlack() {
      veil.hidden = !veil.hidden;
    },
  };

  /* ── Controls (§5) ────────────────────────────────────────────────────── */

  window.addEventListener('keydown', (event) => {
    const key = event.key;

    if (key === 'ArrowRight' || key === ' ' || key === 'Spacebar') {
      event.preventDefault();
      deck.next();
      return;
    }

    if (key === 'ArrowLeft') {
      event.preventDefault();
      deck.prev();
      return;
    }

    if (key === 'q' || key === 'Q') {
      deck.toggleQna();
      return;
    }

    if (key === 'b' || key === 'B') {
      deck.toggleBlack();
      return;
    }

    // The tracker is review chrome. It already hides itself in fullscreen; this
    // is the manual override in either direction.
    if (key === 'h' || key === 'H') {
      overlay.tracker.toggle();
      return;
    }

    if (key === 'f' || key === 'F') {
      // From a keypress only — browsers block programmatic fullscreen without
      // a user gesture (§10).
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.();
      return;
    }

    const section = SECTIONS.find((s) => s.key === key);
    if (section) deck.jump(section.id);
  });

  // Click advances. The operator may be working from a presenter remote, which
  // most often reports as a click or as the arrow keys.
  window.addEventListener('pointerdown', (event) => {
    if (event.button === 0) deck.next();
  });

  // Nothing in a live deck should scroll or open a context menu.
  window.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });

  /* Hide the cursor after ~2s of stillness (§10). */
  let idleTimer = null;
  function poke() {
    document.body.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => document.body.classList.add('idle'), 2000);
  }
  window.addEventListener('mousemove', poke);
  poke();

  return deck;
}

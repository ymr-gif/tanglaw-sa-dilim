/**
 * sequence.js — a short, explicit list of stages for a beat that has more than one.
 *
 * `start` plays them in order. `settle` skips to the finished state without
 * playing anything — which is exactly what apply() needs, and what a jump into
 * the middle of a section needs.
 *
 * Stages are {ms, play(ctx), done(ctx)}: `play` animates, `done` states the end
 * result. `settle` calls every stage's `done` in order and no `play` at all, so
 * the end state is defined once and cannot drift from what the animation
 * actually produces.
 *
 * The deck's older idiom for this is a nested `onComplete`, which `grid-fail`
 * uses and which works for two stages — but `field.finish()` runs pending
 * completions, so an operator clicking mid-chain kicks off the next stage
 * exactly as the next beat is entering, and apply() has to replicate a cascade
 * it never ran. An explicit stage list removes that class of bug entirely.
 *
 * THIS IS THE ONE PLACE THE DECK USES setTimeout, and it does not break
 * "nothing is on a timer": the timer sequences WITHIN a beat the operator has
 * already triggered. It never advances the beat index. `unmount` must call
 * `stop()`, and so must any `enter`/`apply` that could interrupt a run.
 */

export function createSequence(stages) {
  let timer = null;
  let index = 0;

  function step(ctx) {
    if (index >= stages.length) return;
    const stage = stages[index++];
    stage.play(ctx);
    timer = setTimeout(() => step(ctx), stage.ms);
  }

  return {
    start(ctx) {
      clearTimeout(timer);
      index = 0;
      step(ctx);
    },

    /** The end state, with nothing played. This is what apply() calls. */
    settle(ctx) {
      clearTimeout(timer);
      index = stages.length;
      for (const stage of stages) stage.done(ctx);
    },

    stop() {
      clearTimeout(timer);
      timer = null;
    },
  };
}

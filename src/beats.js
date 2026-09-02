/**
 * beats.js — the single source of truth for the entire presentation.
 *
 * Every other part of the deck reads from this file. The renderer reads
 * `scene`, `state`, and `caption`. Nothing else in the codebase should contain
 * speech text or on-screen copy.
 *
 * Rewriting the speech = editing this file only.
 *
 * A dedicated OPERATOR drives the deck — neither speaker touches the keyboard.
 * `speaker`, `script`, `cue`, and `handoff` exist for the operator's printed
 * run sheet, not for the screen. Nothing in this file is rendered except
 * `caption`.
 *
 * FIELDS
 *   id        stable identifier. Never reuse or renumber; the section jump
 *             table keys off these.
 *   scene     which scene module renders this beat.
 *   state     passed to scene.enter() / scene.apply(). Shape is scene-specific.
 *   speaker   'BR' | 'CH' — who is talking. Operator reference only.
 *   handoff   true when the speaker changes at this beat. The operator's
 *             most important column.
 *   caption   on-screen text, or null. HARD CEILING: 5 words.
 *   labels    OPTIONAL. Several words at once, each anchored to its own moving
 *             thing on screen rather than centred. Only `thresh-01` uses it.
 *             A beat has `caption` or `labels`, never both.
 *   script    what the speaker says. Presenter view only.
 *   cue       staging note to self. Presenter view only.
 *   section   used by the 1-8 jump keys.
 *
 * CAPTION CASE IS LOAD-BEARING
 *   Threshold, Roots and Effects captions are lowercase — the darkness is
 *   unspoken, diminished, said under the breath. Prevention and Close captions
 *   are uppercase — the light is declarative. Do not normalize these.
 *
 * THE 5-WORD CEILING HAS EXACTLY TWO EXCEPTIONS
 *   `ref-01` and `thresh-01`, both granted deliberately and both documented at
 *   the beat itself. Anything else over five words is a mistake, not a third
 *   exception.
 */

export const SPEAKERS = {
  BR: { label: 'BR', color: '#d4256b' },
  CH: { label: 'CH', color: '#2bb8c9' },
};

export const SECTIONS = [
  { key: '1', id: 'coldopen',   label: 'Cold open'  },
  { key: '2', id: 'threshold',  label: 'Threshold'  },
  { key: '3', id: 'title',      label: 'Title'      },
  { key: '4', id: 'roots',      label: 'Roots'      },
  { key: '5', id: 'effects',    label: 'Effects'    },
  { key: '6', id: 'prevention', label: 'Prevention' },
  { key: '7', id: 'refusal',    label: 'Refusal'    },
  { key: '8', id: 'close',      label: 'Close'      },
];

export const beats = [

  // ─────────────────────────────────────────────────────────────────────
  // COLD OPEN — no structure, no face, no color. Voice carries everything.
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'cold-01',
    section: 'coldopen',
    scene: 'coldopen',
    state: { mode: 'void' },
    speaker: 'BR',
    handoff: false,
    caption: null,
    script: `Are you afraid of the darkness?`,
    cue: `Open on near-black. Ask it, then STOP. Count three full beats
          before you click. The silence is the first thing the room notices —
          do not rush past it.`,
  },
  {
    id: 'cold-02',
    section: 'coldopen',
    scene: 'coldopen',
    state: { mode: 'student' },
    speaker: 'BR',
    handoff: false,
    caption: null,
    script: `When we were children, darkness meant the shadow beneath the bed,
             or the hallway when the lights went out. We were taught that
             daylight brings safety. But today, a far more dangerous darkness
             clouds classrooms across the Philippines.`,
    cue: `Click on "When we were children". The scattered field gathers into
          a child standing alone — slowly, over about the whole first half of
          the paragraph. It is finished and holding well before you reach
          "a far more dangerous darkness", which is the line it illustrates.
          Hold as long as you like; the figure drifts but never resolves
          further.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // THRESHOLD — what settles into a school. Three beats, one per sentence.
  //
  // The paragraph was one beat until 2026-09-02 and the storyboard split it:
  // the three things CH names ARE the three shadows, and "stabbings shatter
  // our peace" IS the knife. The re-cut is the words already having beats in
  // them, not a re-cut imposed on the words.
  // See docs/superpowers/plans/2026-09-02-threshold-sequence.md.
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'thresh-01',
    section: 'threshold',
    scene: 'threshold',
    state: { mode: 'shadows' },
    speaker: 'CH',
    handoff: true,
    caption: null,
    /**
     * The deck's SECOND sanctioned exception to the 5-word ceiling, after
     * `ref-01`. Seven words, but never seven at once: one label arrives with
     * each shadow, in the order CH says them, so the reading is spread across
     * the sentence instead of dumped into it. Lowercase — §4's rule for the
     * dark half, and these three are exactly what it describes: unspoken,
     * diminished, said under the breath.
     *
     * Anchored to the shadows themselves, not to the centre, so each word
     * lands on the thing it names and tracks it as it moves.
     */
    labels: ['unspoken trauma', 'student isolation', 'toxic online spaces'],
    script: `It is a darkness that doesn't vanish at the morning bell. It creeps
             through corridors as unspoken trauma, student isolation, and toxic
             online spaces exploiting young minds.`,
    cue: `>>> CH TAKES OVER. Click on "morning bell". Three shadows come out
          of the child's own back and take up position, one every ~0.7s, each
          bringing its word. Name them as they land — "unspoken trauma" on the
          first, and so on. The child stays lit; nothing happens to them yet.`,
  },
  {
    id: 'thresh-02',
    section: 'threshold',
    scene: 'threshold',
    state: { mode: 'shatter' },
    speaker: 'CH',
    handoff: false,
    caption: null,
    script: `It is the darkness of rising campus violence — where hostility
             replaces healing, stabbings shatter our peace, and the threat of
             extreme aggression lingers over every desk.`,
    cue: `Click ON the word "stabbings". A knife falls into the middle of the
          picture, the frame jolts, and the whole image cracks apart around it.
          It is fast — under a second — so do not click early and then wait.`,
  },
  {
    id: 'thresh-03',
    section: 'threshold',
    scene: 'threshold',
    state: { mode: 'wreckage' },
    speaker: 'CH',
    handoff: false,
    caption: null,
    script: `When a place of learning becomes a ground of fear, darkness has
             settled in.`,
    cue: `Click, then say the line into a still frame. Everything stops except
          the shadows' eyes. Let the stillness sit for a beat before you hand
          back to BR — the line is about something having settled, and the
          image is agreeing with it.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // TITLE — first sight of the mask. Unlit, hollow-eyed.
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'title-01',
    section: 'title',
    scene: 'title',
    state: { mode: 'assemble' },
    speaker: 'BR',
    handoff: true,
    caption: 'Tanglaw sa Dilim',
    script: `This is why we present Tanglaw sa Dilim: Illuminating Campus
             Extremism and Aggression.`,
    cue: `>>> BR TAKES OVER. Points converge into the mask outline. Say the
          title WITH the convergence, not before it. Subtitle fades in on
          the English half of the line.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // ROOTS — mask fractures into four shards. One lights per beat.
  // Mirrors PREVENTION exactly. Same four positions.
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'roots-00',
    section: 'roots',
    scene: 'roots',
    state: { fracture: true, shard: -1 },
    speaker: 'BR',
    handoff: false,
    caption: null,
    script: `First, we must confront the Roots. These children don't start out
             as monsters. They are shaped in the shadows —`,
    cue: `Mask cracks into four dim shards. Nothing lit yet. The dash at the
          end of "shadows" is your click.`,
  },
  {
    id: 'roots-01',
    section: 'roots',
    scene: 'roots',
    state: { shard: 0 },
    speaker: 'BR',
    handoff: false,
    caption: 'bullying',
    script: `— beginning with persistent bullying and discrimination that
             alienates them from their peers.`,
    cue: `Cracked cheek shard, gray-violet.`,
  },
  {
    id: 'roots-02',
    section: 'roots',
    scene: 'roots',
    state: { shard: 1 },
    speaker: 'BR',
    handoff: false,
    caption: 'untreated',
    script: `Underneath lies an untreated mental health crisis, where emotional
             distress is ignored until pain turns to rage.`,
    cue: `Hollow eye shard, gray-blue. Hold on "pain turns to rage."`,
  },
  {
    id: 'roots-03',
    section: 'roots',
    scene: 'roots',
    state: { shard: 2 },
    speaker: 'BR',
    handoff: false,
    caption: 'to be seen',
    script: `Out of that profound loneliness grows a desperate craving for
             notoriety — to be seen, even through tragedy.`,
    cue: `Mouth shard, smiling too wide, gray-gold. This is the MassKara
          smile doing its actual job — the performance of okay-ness.`,
  },
  {
    id: 'roots-04',
    section: 'roots',
    scene: 'roots',
    state: { shard: 3 },
    speaker: 'BR',
    handoff: false,
    caption: 'weaponized',
    script: `Ultimately, this vulnerability is weaponized by Nihilistic Violent
             Extremism online, convincing isolated youth that destruction is
             their only power.`,
    cue: `The intruder shard. Wrong hue, wrong geometry — it should visibly
          not belong to the same face. It is the only external force in this
          section and the design says so before you do.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // EFFECTS — the literal sequence. The mask's shards become a gun, it fires,
  // the camera tracks the bullet, and the blood arrives. It ENDS THERE.
  //
  // The gun's formation used to fire itself ~1.8s after the click, unattended.
  // Split 2026-09-03 so `eff-00` forms and holds — the operator decides when
  // the room is ready. The shot itself briefly got its own beat (`eff-04`) too,
  // but that added a THIRD click where the storyboard only wants two: the
  // shot and the bullet pan are one continuous action, so `eff-01`'s click now
  // fires the gun and carries straight on into the tracking shot. `eff-04` is
  // retired, not reused — like `eff-03` before it, its id is never coming back.
  //
  // There used to be a fourth beat after the blood, in which the stain
  // dispersed into a darkened grid of desks. Cut 2026-09-03: it did not connect
  // to what came before it, and the splat is the stronger place to stop. The
  // section now hands straight to the mask. effects.js keeps the `grid-dark`
  // state, retired alongside `shatter` and `seat`, so restoring it is a
  // one-line change to a beat's `state`.
  //
  // This section used to be the deck's quiet floor. It is now its loudest
  // passage, by an explicit decision of the author recorded in CONTEXT.md §6.
  // The contrast it used to carry is now the four-second black hold after
  // eff-02 — see that beat's cue, and do not shorten it.
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'eff-00',
    section: 'effects',
    scene: 'effects',
    state: { mode: 'gun-form' },
    speaker: 'CH',
    handoff: true,
    caption: null,
    script: `Second, we must face the Effects.`,
    cue: `>>> CH TAKES OVER. Click on "Effects." The four shards of the mask
          converge into a handgun over ~1.8s and HOLD THERE, formed but not
          fired. Wait for your next click — it fires the gun AND carries
          straight into the bullet shot below, no second click needed.`,
  },
  {
    id: 'eff-01',
    section: 'effects',
    scene: 'effects',
    state: { mode: 'bullet' },
    speaker: 'CH',
    handoff: false,
    caption: null,
    script: `Left unchecked, families lose their loved ones — parents send their
             children to learn, only to receive news that their life was cut
             short.`,
    cue: `Click on "Left unchecked." THE SHOT FIRES FIRST — flash, screen
          shake, the muzzle kicks up — and then, with no further click, the
          camera locks to the bullet and the wind tears past it. THIS BEAT
          LOOPS FOREVER once the bullet lands — it is the one safe place to
          sit in the section, so take the whole line at your own pace and do
          not hurry to the click.`,
  },
  {
    id: 'eff-02',
    section: 'effects',
    scene: 'effects',
    state: { mode: 'splat' },
    speaker: 'CH',
    handoff: false,
    caption: null,
    script: `We face mass casualty risks, where a single weapon turns a quiet
             morning into tragedy. This breeds a contagion of hopelessness
             across the student body — learning stops, ambition fades, and
             classrooms turn into spaces of constant fear, shattering trust in
             our schools.`,
    cue: `Click on "We face." The camera pushes FORWARD through an empty frame
          for ~1.7s — nothing is there, and that is the point. Do not fill the
          silence. The blood then arrives suddenly, sweeping left to right;
          time your click so it lands on "tragedy."

          THEN STAY HERE. Say the whole contagion sentence to the stain — no
          click. The camera drifts back off it as you speak, which is the only
          movement left in the section and is meant to feel like withdrawal.
          This is the last image of the dark half of the deck.

          AFTER THE LINE: press B and hold black for FOUR full seconds before
          Prevention. Do not rush this. The deck has just been loud for three
          beats; Prevention does not work without the silence.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // PREVENTION — the turn. Structural mirror of ROOTS.
  // Same four shard positions. Festival color enters the deck here for the
  // first time. What broke it is what fixes it, said visually.
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'prev-00',
    section: 'prevention',
    scene: 'prevention',
    state: { converge: true, shard: -1 },
    speaker: 'BR',
    handoff: true,
    caption: null,
    script: `Finally, we must commit to Prevention — because early intervention
             beats late damage control.`,
    cue: `>>> BR TAKES OVER. Fragments begin drifting inward. This is the
          turning point of the whole piece — lift your delivery here.`,
  },
  {
    id: 'prev-01',
    section: 'prevention',
    scene: 'prevention',
    state: { shard: 0 },
    speaker: 'BR',
    handoff: false,
    caption: 'CAPACITATE',
    script: `We must capacitate our guidance counselors by bridging staffing
             shortages and freeing them from paperwork to focus on crisis
             support.`,
    cue: `Magenta. Relights the same shard that was "bullying."`,
  },
  {
    id: 'prev-02',
    section: 'prevention',
    scene: 'prevention',
    state: { shard: 1 },
    speaker: 'BR',
    handoff: false,
    caption: 'TRAIN',
    script: `We must train teachers in de-escalation and mental health first
             aid.`,
    cue: `Marigold. Relights "untreated."`,
  },
  {
    id: 'prev-03',
    section: 'prevention',
    scene: 'prevention',
    state: { shard: 2 },
    speaker: 'BR',
    handoff: false,
    caption: 'REDESIGN',
    script: `We must redesign classrooms for physical safety — upgrading fragile
             glass windows to impact-resistant film, installing quick-lock
             doors, and creating dedicated blind spots.`,
    cue: `Cyan. Relights "to be seen." Longest line in the section —
          let the shard finish lighting before you finish the sentence.`,
  },
  {
    id: 'prev-04',
    section: 'prevention',
    scene: 'prevention',
    state: { shard: 3 },
    speaker: 'BR',
    handoff: false,
    caption: 'EMPOWER',
    script: `Lastly, we must empower peer networks with anonymous reporting
             channels backed by Child Protection Committees.`,
    cue: `Jade. Relights the intruder shard AND seats it — the only one that
          was foreign now flies home and belongs. Do not point this out. Let
          it work.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // REFUSAL — classroom becomes cage becomes weapons becomes light.
  //
  // Six sentences, six beats. `ref-02` is RETIRED and must never be reused:
  // it held four sentences that are now spread across five beats, so nothing
  // is its honest successor. A stale reference to it should fail loudly.
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'ref-01',
    section: 'refusal',
    scene: 'refusal',
    state: { mode: 'hold' },
    speaker: 'CH',
    handoff: true,
    caption: null,
    script: `Do not surrender our generation to despair.`,
    cue: `>>> CH TAKES OVER. Mask whole — the exact state Prevention ended on.
          Nothing moves but the drift. Click on "despair."`,
  },
  {
    id: 'ref-03',
    section: 'refusal',
    scene: 'refusal',
    state: { mode: 'bars' },
    speaker: 'CH',
    handoff: false,
    caption: 'Do not build prisons out of our classrooms.',
    script: `Do not build prisons out of our classrooms.`,
    cue: `The mask's own points rise into five white prison bars. Read the
          caption ALOUD, in sync with the audience reading it. Only beat in
          the deck where screen and voice say the same words. Click on
          "classrooms."`,
  },
  {
    id: 'ref-04',
    section: 'refusal',
    scene: 'refusal',
    state: { mode: 'weapons' },
    speaker: 'CH',
    handoff: false,
    caption: null,
    script: `When a child turns to violence, society failed them long before
             they picked up a weapon.`,
    cue: `Caption clears. The bars become a knife (left) and the Effects
          handgun (right), both bright white. Click on "weapon."`,
  },
  {
    id: 'ref-05',
    section: 'refusal',
    scene: 'refusal',
    state: { mode: 'hands' },
    speaker: 'CH',
    handoff: false,
    caption: null,
    script: `Refuse the cheap comfort of vengeance.`,
    cue: `Many yellow hands fade in out of the shadows around both weapons —
          fingertips vivid, palms swallowed by the dark. The weapons do not
          change yet. Click on "vengeance."`,
  },
  {
    id: 'ref-06',
    section: 'refusal',
    scene: 'refusal',
    state: { mode: 'crush' },
    speaker: 'CH',
    handoff: false,
    caption: null,
    script: `Fix the toxic environments poisoning our youth and hold the line
             for healing —`,
    cue: `The hands close into fists, thumbs up. The weapons break and
          scatter, densest at the crush. Fast — do not wait for it. The dash
          at the end of "healing" is your click.`,
  },
  {
    id: 'ref-07',
    section: 'refusal',
    scene: 'refusal',
    state: { mode: 'stars' },
    speaker: 'CH',
    handoff: false,
    caption: null,
    script: `— because treating children as lost causes surrenders the
             future.`,
    cue: `The hands become stars. The debris fades to nothing. Hold here as
          long as you like — the stars breathe. Clicking on into close-01
          reshuffles them into the completed mask.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // CLOSE — full colour, the mask's own. Mask becomes lantern.
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'close-01',
    section: 'close',
    scene: 'close',
    state: { mode: 'complete' },
    speaker: 'BR',
    handoff: true,
    caption: null,
    script: `We don't answer a cry for help with higher walls and darker cells —
             we answer it by bringing the light.`,
    cue: `>>> BR TAKES OVER. Final shard seats on "bringing the light."
          Mask completes in full festival color. First time in the whole
          deck all four hues are lit at once.`,
  },
  {
    id: 'close-02',
    section: 'close',
    scene: 'close',
    state: { mode: 'lantern' },
    speaker: 'BR',
    handoff: false,
    caption: 'Tanglaw',
    script: `By illuminating the root causes of our pain and guiding struggling
             minds out of the dark, we reclaim our safe spaces and rekindle the
             light every student deserves.`,
    cue: `Mask rises and dissolves upward into lantern glow. Scene LOOPS —
          safe to hold through applause. Do not click forward; there is no
          beat after this one. Press Q when Q&A begins.`,
  },

];

/**
 * Q&A hold — a MODE, not a beat.
 *
 * `Q` toggles in from close-02, `Q` again returns. Q&A length is unknown and
 * you may want to come back to the close for a final line, so this deliberately
 * sits outside the beat index.
 */
export const QNA = {
  scene: 'qna',
  state: { mode: 'embers' },
  caption: null,
  cue: `The ember field. Lantern has dispersed — same points, now loose warm
        embers in slow independent orbit, drifting up and re-seeding at the
        bottom, brightness breathing out of phase. All four festival hues
        present but low. No mask, no structure, no caption.

        Keep it SLOW. Anything energetic competes with the answer being given.
        Target something watchable for ten minutes without noticing a loop.`,
};

export const totalBeats = beats.length;

/** First beat index of a section — used by the number-key jump table. */
export function sectionStart(sectionId) {
  return beats.findIndex((b) => b.section === sectionId);
}

/** Every beat up to and including `index`, for apply()-based fast-forward. */
export function beatsUpTo(index) {
  return beats.slice(0, index + 1);
}

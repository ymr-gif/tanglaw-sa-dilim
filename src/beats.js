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
 *   script    what the speaker says. Presenter view only.
 *   cue       staging note to self. Presenter view only.
 *   section   used by the 1-8 jump keys.
 *
 * CAPTION CASE IS LOAD-BEARING
 *   Roots and Effects captions are lowercase — the darkness is unspoken,
 *   diminished, said under the breath. Prevention and Close captions are
 *   uppercase — the light is declarative. Do not normalize these.
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
    state: { mode: 'drift' },
    speaker: 'BR',
    handoff: false,
    caption: null,
    script: `When we were children, darkness meant the shadow beneath the bed,
             or the hallway when the lights went out. We were taught that
             daylight brings safety. But today, a far more dangerous darkness
             clouds classrooms across the Philippines.`,
    cue: `Points begin drifting. Scene loops indefinitely — take as long
          as you want here.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // THRESHOLD — the childhood door vs. the school corridor.
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'thresh-01',
    section: 'threshold',
    scene: 'threshold',
    state: { mode: 'split' },
    speaker: 'CH',
    handoff: true,
    caption: null,
    script: `It is a darkness that doesn't vanish at the morning bell. It creeps
             through corridors as unspoken trauma, student isolation, and toxic
             online spaces exploiting young minds. It is the darkness of rising
             campus violence — where hostility replaces healing, stabbings
             shatter our peace, and the threat of extreme aggression lingers
             over every desk. When a place of learning becomes a ground of
             fear, darkness has settled in.`,
    cue: `>>> CH TAKES OVER. Two clouds, same silhouette: one warm, one
          drained. Warm side dims steadily across the paragraph. Land
          "darkness has settled in" as the warm side finishes going out.`,
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
  // EFFECTS — emotional floor. Least motion, least color, most silence.
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'eff-00',
    section: 'effects',
    scene: 'effects',
    state: { mode: 'gun' },
    speaker: 'CH',
    handoff: true,
    caption: null,
    script: `Second, we must face the Effects.`,
    cue: `>>> CH TAKES OVER. Shatter runs ~1.4s. Click on "Effects," let the
          break happen, THEN start the next line. Do not talk over the break.`,
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
    cue: `Everything dims except one empty seat-shaped void. No caption.
          This is the quietest slide in the deck. Slow down.`,
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
             morning into tragedy.`,
    cue: `Grid of desk-points. One extinguishes, spread propagates outward.
          Abstract only — never depict the act.`,
  },
  {
    id: 'eff-03',
    section: 'effects',
    scene: 'effects',
    state: { mode: 'grid-dark' },
    speaker: 'CH',
    handoff: false,
    caption: 'learning stops',
    script: `This breeds a contagion of hopelessness across the student body —
             learning stops, ambition fades, and classrooms turn into spaces of
             constant fear, shattering trust in our schools.`,
    cue: `Grid fully dark. After this line, hold black for two seconds before
          clicking into Prevention. Deliberate. Uncomfortable. Let it be.`,
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
    cue: `Jade. Relights the intruder shard — the only one that was foreign
          is now the one that belongs. Do not point this out. Let it work.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // REFUSAL — the only full sentence the audience reads all night.
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'ref-01',
    section: 'refusal',
    scene: 'refusal',
    state: { mode: 'hold', gap: true },
    speaker: 'CH',
    handoff: true,
    caption: 'Do not build prisons out of our classrooms.',
    script: `Do not surrender our generation to despair. Do not build prisons
             out of our classrooms.`,
    cue: `>>> CH TAKES OVER. Mask nearly whole, one gap remaining. Read the
          caption ALOUD, in sync with the audience reading it. Only beat in
          the deck where screen and voice say the same words.`,
  },
  {
    id: 'ref-02',
    section: 'refusal',
    scene: 'refusal',
    state: { mode: 'hold', gap: true, dim: true },
    speaker: 'CH',
    handoff: false,
    caption: null,
    script: `When a child turns to violence, society failed them long before
             they picked up a weapon. Refuse the cheap comfort of vengeance.
             Fix the toxic environments poisoning our youth and hold the line
             for healing — because treating children as lost causes surrenders
             the future.`,
    cue: `Caption clears, mask holds. Nothing moves but the slow noise.
          All attention on CH.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // CLOSE — final shard seats. Full festival color. Mask becomes lantern.
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

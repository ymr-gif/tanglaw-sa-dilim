# Run Sheet

> **Generated file — do not edit by hand.**
> `src/beats.js` is the source of truth. Edit that, then run `npm run runsheet`.

Every beat in speaking order: what the speaker says, where to click, what the
deck does, and what the audience reads.

**26 beats** · **6 handoffs** · **12 beats with on-screen text** (14 carry none)

Quote the **id** when a beat needs changes — ids are stable and never
renumbered, so `roots-02` survives an inserted beat and "slide 7" does not.
The same id shows in the deck's tracker (bottom right, `H` to toggle).

## At a glance

| # | id | Section | Speaker | On screen |
|---|---|---|---|---|
| 1 | [`cold-01`](#cold-01) | Cold open | BR | — |
| 2 | [`cold-02`](#cold-02) | Cold open | BR | — |
| 3 | [`thresh-01`](#thresh-01) | Threshold | **CH** ⇠ handoff | — |
| 4 | [`title-01`](#title-01) | Title | **BR** ⇠ handoff | `Tanglaw sa Dilim` |
| 5 | [`roots-00`](#roots-00) | Roots | BR | — |
| 6 | [`roots-01`](#roots-01) | Roots | BR | `bullying` |
| 7 | [`roots-02`](#roots-02) | Roots | BR | `untreated` |
| 8 | [`roots-03`](#roots-03) | Roots | BR | `to be seen` |
| 9 | [`roots-04`](#roots-04) | Roots | BR | `weaponized` |
| 10 | [`eff-00`](#eff-00) | Effects | **CH** ⇠ handoff | — |
| 11 | [`eff-01`](#eff-01) | Effects | CH | — |
| 12 | [`eff-02`](#eff-02) | Effects | CH | — |
| 13 | [`eff-03`](#eff-03) | Effects | CH | `learning stops` |
| 14 | [`prev-00`](#prev-00) | Prevention | **BR** ⇠ handoff | — |
| 15 | [`prev-01`](#prev-01) | Prevention | BR | `CAPACITATE` |
| 16 | [`prev-02`](#prev-02) | Prevention | BR | `TRAIN` |
| 17 | [`prev-03`](#prev-03) | Prevention | BR | `REDESIGN` |
| 18 | [`prev-04`](#prev-04) | Prevention | BR | `EMPOWER` |
| 19 | [`ref-01`](#ref-01) | Refusal | **CH** ⇠ handoff | — |
| 20 | [`ref-03`](#ref-03) | Refusal | CH | `Do not build prisons out of our classrooms.` |
| 21 | [`ref-04`](#ref-04) | Refusal | CH | — |
| 22 | [`ref-05`](#ref-05) | Refusal | CH | — |
| 23 | [`ref-06`](#ref-06) | Refusal | CH | — |
| 24 | [`ref-07`](#ref-07) | Refusal | CH | — |
| 25 | [`close-01`](#close-01) | Close | **BR** ⇠ handoff | — |
| 26 | [`close-02`](#close-02) | Close | BR | `Tanglaw` |

Jump keys: `1` Cold open · `2` Threshold · `3` Title · `4` Roots · `5` Effects · `6` Prevention · `7` Refusal · `8` Close.

## The two deliberate pauses

Neither is in the code. Both are the operator's, on purpose — a pause baked
into a timer stops being a decision made in the room.

1. **After `cold-01`** — three full beats of silence before the second line.
2. **After `eff-03`** — two full seconds of black before Prevention. Use `B`,
   so the length is chosen in the moment.

## Beat by beat

### Cold open

Jump key `1`.

#### <a id="cold-01"></a>1 · `cold-01`

**Speaker** BR · **Scene** `coldopen` · **State** `mode: void`

**Says**

> Are you afraid of the darkness?

**On screen** nothing. The voice carries this beat.

**Click cue** Open on near-black. Ask it, then STOP. Count three full beats before you click. The silence is the first thing the room notices — do not rush past it.

#### <a id="cold-02"></a>2 · `cold-02`

**Speaker** BR · **Scene** `coldopen` · **State** `mode: drift`

**Says**

> When we were children, darkness meant the shadow beneath the bed, or the hallway when the lights went out. We were taught that daylight brings safety. But today, a far more dangerous darkness clouds classrooms across the Philippines.

**On screen** nothing. The voice carries this beat.

**Click cue** Points begin drifting. Scene loops indefinitely — take as long as you want here.

### Threshold

Jump key `2`.

#### <a id="thresh-01"></a>3 · `thresh-01`

> **HANDOFF — CH takes over here.**

**Speaker** CH · **Scene** `threshold` · **State** `mode: split`

**Says**

> It is a darkness that doesn't vanish at the morning bell. It creeps through corridors as unspoken trauma, student isolation, and toxic online spaces exploiting young minds. It is the darkness of rising campus violence — where hostility replaces healing, stabbings shatter our peace, and the threat of extreme aggression lingers over every desk. When a place of learning becomes a ground of fear, darkness has settled in.

**On screen** nothing. The voice carries this beat.

**Click cue** >>> CH TAKES OVER. Two clouds, same silhouette: one warm, one drained. Warm side dims steadily across the paragraph. Land "darkness has settled in" as the warm side finishes going out.

### Title

Jump key `3`.

#### <a id="title-01"></a>4 · `title-01` — Tanglaw sa Dilim

> **HANDOFF — BR takes over here.**

**Speaker** BR · **Scene** `title` · **State** `mode: assemble`

**Says**

> This is why we present Tanglaw sa Dilim: Illuminating Campus Extremism and Aggression.

**On screen** `Tanglaw sa Dilim` — 3 words, mixed case

**Click cue** >>> BR TAKES OVER. Points converge into the mask outline. Say the title WITH the convergence, not before it. Subtitle fades in on the English half of the line.

### Roots

Jump key `4`.

#### <a id="roots-00"></a>5 · `roots-00`

**Speaker** BR · **Scene** `roots` · **State** `fracture: true, shard: -1`

**Says**

> First, we must confront the Roots. These children don't start out as monsters. They are shaped in the shadows —

**On screen** nothing. The voice carries this beat.

**Click cue** Mask cracks into four dim shards. Nothing lit yet. The dash at the end of "shadows" is your click.

#### <a id="roots-01"></a>6 · `roots-01` — bullying

**Speaker** BR · **Scene** `roots` · **State** `shard: 0`

**Says**

> — beginning with persistent bullying and discrimination that alienates them from their peers.

**On screen** `bullying` — 1 word, lowercase

**Click cue** Cracked cheek shard, gray-violet.

#### <a id="roots-02"></a>7 · `roots-02` — untreated

**Speaker** BR · **Scene** `roots` · **State** `shard: 1`

**Says**

> Underneath lies an untreated mental health crisis, where emotional distress is ignored until pain turns to rage.

**On screen** `untreated` — 1 word, lowercase

**Click cue** Hollow eye shard, gray-blue. Hold on "pain turns to rage."

#### <a id="roots-03"></a>8 · `roots-03` — to be seen

**Speaker** BR · **Scene** `roots` · **State** `shard: 2`

**Says**

> Out of that profound loneliness grows a desperate craving for notoriety — to be seen, even through tragedy.

**On screen** `to be seen` — 3 words, lowercase

**Click cue** Mouth shard, smiling too wide, gray-gold. This is the MassKara smile doing its actual job — the performance of okay-ness.

#### <a id="roots-04"></a>9 · `roots-04` — weaponized

**Speaker** BR · **Scene** `roots` · **State** `shard: 3`

**Says**

> Ultimately, this vulnerability is weaponized by Nihilistic Violent Extremism online, convincing isolated youth that destruction is their only power.

**On screen** `weaponized` — 1 word, lowercase

**Click cue** The intruder shard. Wrong hue, wrong geometry — it should visibly not belong to the same face. It is the only external force in this section and the design says so before you do.

### Effects

Jump key `5`.

#### <a id="eff-00"></a>10 · `eff-00`

> **HANDOFF — CH takes over here.**

**Speaker** CH · **Scene** `effects` · **State** `mode: gun`

**Says**

> Second, we must face the Effects.

**On screen** nothing. The voice carries this beat.

**Click cue** >>> CH TAKES OVER. Click on "Effects." The four shards of the mask converge into a handgun over ~1.8s and THEN IT FIRES — flash, screen shake, the muzzle kicks up and stays up. The shot lands about two seconds after your click. Do not talk over it; let the room have it.

#### <a id="eff-01"></a>11 · `eff-01`

**Speaker** CH · **Scene** `effects` · **State** `mode: bullet`

**Says**

> Left unchecked, families lose their loved ones — parents send their children to learn, only to receive news that their life was cut short.

**On screen** nothing. The voice carries this beat.

**Click cue** Click on "Left unchecked." The camera locks to the bullet and the wind tears past it. THIS BEAT LOOPS FOREVER — it is the one safe place to sit in the section, so take the whole line at your own pace and do not hurry to the click.

#### <a id="eff-02"></a>12 · `eff-02`

**Speaker** CH · **Scene** `effects` · **State** `mode: splat`

**Says**

> We face mass casualty risks, where a single weapon turns a quiet morning into tragedy.

**On screen** nothing. The voice carries this beat.

**Click cue** Click on "We face." The camera pushes FORWARD through an empty frame for ~1.7s — nothing is there, and that is the point. Do not fill the silence. The blood then arrives suddenly, sweeping left to right; time your click so it lands on "tragedy."

#### <a id="eff-03"></a>13 · `eff-03` — learning stops

**Speaker** CH · **Scene** `effects` · **State** `mode: grid-dark`

**Says**

> This breeds a contagion of hopelessness across the student body — learning stops, ambition fades, and classrooms turn into spaces of constant fear, shattering trust in our schools.

**On screen** `learning stops` — 2 words, lowercase

**Click cue** Click on "This breeds." The stain disperses into the darkened classroom — one death, then every desk. Caption reads `learning stops`. AFTER THIS LINE: press B and hold black for FOUR full seconds before Prevention. Do not rush this. The deck has just been loud for four beats; Prevention does not work without the silence.

### Prevention

Jump key `6`.

#### <a id="prev-00"></a>14 · `prev-00`

> **HANDOFF — BR takes over here.**

**Speaker** BR · **Scene** `prevention` · **State** `converge: true, shard: -1`

**Says**

> Finally, we must commit to Prevention — because early intervention beats late damage control.

**On screen** nothing. The voice carries this beat.

**Click cue** >>> BR TAKES OVER. Fragments begin drifting inward. This is the turning point of the whole piece — lift your delivery here.

#### <a id="prev-01"></a>15 · `prev-01` — CAPACITATE

**Speaker** BR · **Scene** `prevention` · **State** `shard: 0`

**Says**

> We must capacitate our guidance counselors by bridging staffing shortages and freeing them from paperwork to focus on crisis support.

**On screen** `CAPACITATE` — 1 word, UPPERCASE

**Click cue** Magenta. Relights the same shard that was "bullying."

#### <a id="prev-02"></a>16 · `prev-02` — TRAIN

**Speaker** BR · **Scene** `prevention` · **State** `shard: 1`

**Says**

> We must train teachers in de-escalation and mental health first aid.

**On screen** `TRAIN` — 1 word, UPPERCASE

**Click cue** Marigold. Relights "untreated."

#### <a id="prev-03"></a>17 · `prev-03` — REDESIGN

**Speaker** BR · **Scene** `prevention` · **State** `shard: 2`

**Says**

> We must redesign classrooms for physical safety — upgrading fragile glass windows to impact-resistant film, installing quick-lock doors, and creating dedicated blind spots.

**On screen** `REDESIGN` — 1 word, UPPERCASE

**Click cue** Cyan. Relights "to be seen." Longest line in the section — let the shard finish lighting before you finish the sentence.

#### <a id="prev-04"></a>18 · `prev-04` — EMPOWER

**Speaker** BR · **Scene** `prevention` · **State** `shard: 3`

**Says**

> Lastly, we must empower peer networks with anonymous reporting channels backed by Child Protection Committees.

**On screen** `EMPOWER` — 1 word, UPPERCASE

**Click cue** Jade. Relights the intruder shard — the only one that was foreign is now the one that belongs. Do not point this out. Let it work.

### Refusal

Jump key `7`.

#### <a id="ref-01"></a>19 · `ref-01`

> **HANDOFF — CH takes over here.**

**Speaker** CH · **Scene** `refusal` · **State** `mode: hold, gap: true`

**Says**

> Do not surrender our generation to despair.

**On screen** nothing. The voice carries this beat.

**Click cue** >>> CH TAKES OVER. Mask nearly whole, one gap remaining — the exact state Prevention ended on. Nothing moves but the drift. Click on "despair."

#### <a id="ref-03"></a>20 · `ref-03` — Do not build prisons out of our classrooms.

**Speaker** CH · **Scene** `refusal` · **State** `mode: bars`

**Says**

> Do not build prisons out of our classrooms.

**On screen** `Do not build prisons out of our classrooms.` — 8 words, mixed case — **over the 5-word ceiling, deliberately**

**Click cue** The mask's own points rise into five white prison bars. Read the caption ALOUD, in sync with the audience reading it. Only beat in the deck where screen and voice say the same words. Click on "classrooms."

#### <a id="ref-04"></a>21 · `ref-04`

**Speaker** CH · **Scene** `refusal` · **State** `mode: weapons`

**Says**

> When a child turns to violence, society failed them long before they picked up a weapon.

**On screen** nothing. The voice carries this beat.

**Click cue** Caption clears. The bars become a knife (left) and the Effects handgun (right), both bright white. Click on "weapon."

#### <a id="ref-05"></a>22 · `ref-05`

**Speaker** CH · **Scene** `refusal` · **State** `mode: hands`

**Says**

> Refuse the cheap comfort of vengeance.

**On screen** nothing. The voice carries this beat.

**Click cue** Many yellow hands fade in out of the shadows around both weapons — fingertips vivid, palms swallowed by the dark. The weapons do not change yet. Click on "vengeance."

#### <a id="ref-06"></a>23 · `ref-06`

**Speaker** CH · **Scene** `refusal` · **State** `mode: crush`

**Says**

> Fix the toxic environments poisoning our youth and hold the line for healing —

**On screen** nothing. The voice carries this beat.

**Click cue** The hands close into fists, thumbs up. The weapons break and scatter, densest at the crush. Fast — do not wait for it. The dash at the end of "healing" is your click.

#### <a id="ref-07"></a>24 · `ref-07`

**Speaker** CH · **Scene** `refusal` · **State** `mode: stars`

**Says**

> — because treating children as lost causes surrenders the future.

**On screen** nothing. The voice carries this beat.

**Click cue** The hands become stars. The debris fades to nothing. Hold here as long as you like — the stars breathe. Clicking on into close-01 reshuffles them into the completed mask.

### Close

Jump key `8`.

#### <a id="close-01"></a>25 · `close-01`

> **HANDOFF — BR takes over here.**

**Speaker** BR · **Scene** `close` · **State** `mode: complete`

**Says**

> We don't answer a cry for help with higher walls and darker cells — we answer it by bringing the light.

**On screen** nothing. The voice carries this beat.

**Click cue** >>> BR TAKES OVER. Final shard seats on "bringing the light." Mask completes in full festival color. First time in the whole deck all four hues are lit at once.

#### <a id="close-02"></a>26 · `close-02` — Tanglaw

**Speaker** BR · **Scene** `close` · **State** `mode: lantern`

**Says**

> By illuminating the root causes of our pain and guiding struggling minds out of the dark, we reclaim our safe spaces and rekindle the light every student deserves.

**On screen** `Tanglaw` — 1 word, mixed case

**Click cue** Mask rises and dissolves upward into lantern glow. Scene LOOPS — safe to hold through applause. Do not click forward; there is no beat after this one. Press Q when Q&A begins.

### Q&A hold

#### <a id="qna"></a>`qna` — a mode, not a beat

**Scene** `qna` · **State** `mode: embers` · **On screen** nothing

`Q` toggles in from `close-02`, `Q` again returns. It sits outside the beat
index deliberately: Q&A length is unknown, and you may want to come back to
the close for a final line.

**Note** The ember field. Lantern has dispersed — same points, now loose warm embers in slow independent orbit, drifting up and re-seeding at the bottom, brightness breathing out of phase. All four festival hues present but low. No mask, no structure, no caption. Keep it SLOW. Anything energetic competes with the answer being given. Target something watchable for ten minutes without noticing a loop.

---

Regenerate with `npm run runsheet`. Design reasoning lives in `CONTEXT.md`.

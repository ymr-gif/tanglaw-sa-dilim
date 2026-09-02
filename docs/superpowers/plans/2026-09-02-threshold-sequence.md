# Threshold Sequence (slides 2–3) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A student stands alone. Three demonic shadows slither in behind them and are named. A knife pierces the picture and shatters it, and stays standing in the wreckage.

**Architecture:** Four new shapes (student, shadow, crack-field, and the knife reused from the Refusal plan) on the existing one-Points-object design. Structurally, `thresh-01` splits into three beats — the storyboard's staging maps sentence-for-sentence onto the script, which is what makes the split obvious rather than invented.

**Tech Stack:** Vite 5, Three.js, anime.js, vanilla JS.

**Spec:** `CONTEXT.md` (canonical — **see the colour decision below, which it currently forbids**), `docs/superpowers/specs/2026-09-01-tanglaw-sa-dilim-design.md`

**Storyboard:** [`docs/assets/threshold-storyboard.jpg`](../../assets/threshold-storyboard.jpg) — includes a reference photo for the shadows. Authority on staging; where it and this document disagree, it wins.

**Depends on:** the Refusal plan's `src/shapes/knife.js` and its shared `reshuffle` helper. The storyboard's closing note — *"transition to shuffle like normal"* — is that same helper.

---

## The mapping

The storyboard lines up with the script sentence for sentence. This is not a
re-cut being imposed on the words; it is the words already having four beats in
them.

| Slide | Id | Sentence | Image |
|---|---|---|---|
| 2 | `cold-02` | "…a far more dangerous darkness clouds classrooms across the Philippines." | **A student stands alone** in the middle. |
| 3 | `thresh-01` | "It is a darkness that doesn't vanish at the morning bell. It creeps through corridors as **unspoken trauma, student isolation, and toxic online spaces**…" | **Three shadows slither in from behind the student**, each labelled. |
| 3 | `thresh-02` | "It is the darkness of rising campus violence — where hostility replaces healing, **stabbings shatter our peace**…" | **A knife pierces the picture.** It shatters. |
| 3 | `thresh-03` | "When a place of learning becomes a ground of fear, darkness has settled in." | The wreckage holds. The knife stays upright. |

Note how tightly the storyboard already fits: the three shadow labels *are* the
three things sentence 2 names, and the knife *is* "stabbings shatter our peace".
Nothing here had to be invented to fit.

**Beat count: 22 → 24 from this plan alone.** With the Refusal plan's +4, the
finished deck is **28 beats**. Whoever sequences the work should know that both
plans move the count and the tracker reads it from `totalBeats` automatically.

---

## Decision 1 — the colour rule. Read this before anything else.

The spec list asks for **yellow student, neon purple shadows, vibrant red
knife**, in slides 2 and 3.

`CONTEXT.md` §3 forbids this, and not as a minor rule:

> "Darkness sections are near-monochrome. Festival color appears only as light,
> and only in Prevention onward. […] **This is the single most important
> constraint in the project.** Breaking it anywhere — a stray magenta in Roots,
> a warm accent in Effects — costs the entire effect."

This is a larger ask than the Effects `blood` exception, which was one colour on
one beat. Three saturated colours in the deck's **opening** changes what the
whole piece is:

- The deck's argument is carried structurally by colour — cold, drained, ash for
  the first half; festival colour arriving only when Prevention earns it. If
  slides 2–3 are already yellow, purple and red, **Prevention's turn has nothing
  left to be.** "The first time colour enters" stops being true on slide 2.
- The Close is built as the payoff of that arc. It is currently the brightest
  frame in the deck by a wide margin; it stops being remarkable if the opening
  was equally saturated.

Three ways forward. **All are one-line changes** — the colour lives in constants,
so the rest of this plan is identical whichever you pick.

**Option A — hybrid (recommended).** The student is **yellow**; the shadows and
knife stay near-monochrome (cold violet-black, and a hard desaturated red).

This is the one that costs nothing and might be *better* than either extreme.
The deck already permits "one weak lamp glow" in the cold open, and a single
warm figure alone in a cold frame is exactly the deck's existing language — the
student reads as the only living thing on screen, which is the point of the
image. The shadows do not need saturation to be frightening; they need to be
darker than the dark and to have eyes.

**Option B — full storyboard colours, §3 amended.** You get the look you drew.
Record it as a deliberate amendment the way the Effects plan records its own, and
accept the consequence: the deck is colourful throughout, and the
Prevention/Close arc needs re-thinking as something other than "colour arrives."
That re-think is real work and is not in this plan.

**Option C — muted palette.** All three colours, pulled toward the near-
monochrome band: `DIM.violet` (already in the palette, from Roots) for the
shadows, `LAMP` for the student, a dark red for the knife. Keeps the three-colour
identity, keeps the arc intact, loses the neon.

I have written the plan against **Option A**, with the constants isolated in one
block so switching is trivial.

---

## Decision 2 — three labels at once

Frame 2 puts three labels on screen: *unspoken trauma*, *student isolation*,
*toxic online spaces*. That is seven words, against a five-word ceiling with one
already-spent exception (`ref-01`).

**Recommended: allow it, staggered.** The labels arrive one at a time as each
shadow does, rather than all three at once. They are labels on objects, not prose
— the eye takes them the way it takes a diagram, and staggering them spreads the
reading across the sentence CH is speaking rather than dumping it in one hit.

Mechanically this is `shardlabel.js` doing what it already does — anchoring a
word to a projected 3D position — extended from one label to three. That is a
small generalisation of an existing overlay, not a new system.

**If you would rather not spend a second exception:** drop the labels entirely.
CH names all three things aloud in that exact sentence, so the screen would be
repeating the voice — which the deck deliberately does only once, at `ref-01`.

---

## Global Constraints

- **The cold open's character changes.** `coldopen.js` currently documents that nothing may resolve into a shape there. That was written about `cold-01`'s silence and still holds for it — **`cold-01` is untouched by this plan.** `cold-02` gaining a figure is a deliberate change to the second beat only.
- **The student is not the Effects silhouette.** A figure was cut from the Effects sequence for being a shooting victim rendered on screen. This one is a child standing alone before anything happens to them, and it does not reopen that decision.
- **`apply()` and `enter()` must reach an identical end state.** The shadow arrival and the shatter are both multi-stage; use `createSequence` from the Effects plan.
- **Nothing is on a timer.** Within-beat sequencing only.
- **`renderer.setSize(w, h)` keeps `updateStyle` true.**
- Point budget stays `POINTS = 17000`, split between the student and the three shadows.

---

## File structure

| File | Change | Responsibility |
|---|---|---|
| `src/beats.js` | modify | `thresh-01` becomes three beats. **22 → 24.** Task 1. |
| `src/shapes/student.js` | **create** | The lone figure. Task 2. |
| `src/shapes/shadow.js` | **create** | One demonic shadow; instanced three times. Task 3. |
| `src/shapes/cracks.js` | **create** | The shatter pattern radiating from the knife. Task 5. |
| `src/shapes/knife.js` | reuse | From the Refusal plan. Task 5. |
| `src/scenes/coldopen.js` | modify | `cold-02` gains the student. Task 2. |
| `src/scenes/threshold.js` | rewrite | Three states instead of one. Tasks 3–6. |
| `src/overlay/shardlabel.js` | generalise | One label → up to three. Task 4. |
| `src/theme.js` | modify | The colour block for this section. Task 1. |
| `docs/RUNSHEET.md` | regenerate | `npm run runsheet`. Task 1. |

---

### Task 1: Split the beats and set the palette

**Files:** Modify `src/beats.js`, `src/theme.js`; regenerate `docs/RUNSHEET.md`.

- [ ] **Step 1:** Split `thresh-01` into `thresh-01`, `thresh-02`, `thresh-03`, one sentence each per the mapping table. `thresh-01` keeps its id honestly — same position, same speaker, same handoff, same opening sentence. `speaker: 'CH'` throughout, `handoff: true` on `thresh-01` only.

- [ ] **Step 2:** Add the section's colours to `theme.js`, isolated so Decision 1 is a one-block change:

```js
/**
 * Threshold palette (slides 2-3).
 *
 * Option A of the colour decision: the student is warm and alone; the shadows
 * and the knife stay inside the near-monochrome band §3 requires of the deck's
 * first half. Swap this block wholesale to take Option B or C — nothing else in
 * the section reads colour from anywhere else.
 */
export const THRESHOLD = {
  student: 0xffc93c,      // yellow — the one living thing in frame
  shadowBody: 0x241a30,   // darker than the dark, faintly violet
  shadowEye: 0x8a5cc4,    // the only saturation the shadows get
  knife: 0x8c1a24,        // hard, desaturated. NOT the Effects `blood`
};
```

- [ ] **Step 3:** Write the `cue` field for each new beat — where in the sentence to click, and what happens.

- [ ] **Step 4:** Regenerate and verify.

```bash
npm run runsheet
node --input-type=module -e "
import { beats, totalBeats } from './src/beats.js';
console.log('total:', totalBeats, '(expect 24)');
const t = beats.filter(b => b.section === 'threshold');
console.log('threshold beats:', t.map(b => b.id).join(','), '(expect thresh-01,thresh-02,thresh-03)');
console.log('handoffs:', beats.filter(b => b.handoff).length, '(expect 6)');
"
```

- [ ] **Step 5:** Verify the deck runs at 24 beats with the old visuals. Tracker reads `/24`; `2` still jumps to Threshold; `←` walks back through all three.

- [ ] **Step 6:** Commit. Ships alone.

---

### Task 2: The student

**Files:** Create `src/shapes/student.js`; modify `src/scenes/coldopen.js`.

**Interfaces:** Produces `buildStudent({ scale, offset })` → `Float32Array(POINTS * 3)`

The storyboard draws the simplest possible figure — a circle head on a cone
body. Keep it that simple. A more detailed figure would fight the mask, which is
the deck's only detailed form, and simplicity is what makes it read as *a child*
rather than as a specific person.

- [ ] **Step 1:** Create `src/shapes/student.js`.

```js
import { POINTS } from '../theme.js';
import { seededRandom } from '../noise.js';

const HEAD = { cy: 0.30, r: 0.135 };
const BODY = { yTop: 0.17, yBot: -0.34, wTop: 0.05, wBot: 0.20 };

export function buildStudent({ scale = 1, offset = [0, 0] } = {}) {
  const rand = seededRandom(0x57ude);
  const out = new Float32Array(POINTS * 3);

  for (let i = 0; i < POINTS; i++) {
    const i3 = i * 3;
    let x, y;

    if (rand() < 0.34) {
      // Head. Rejection-sample the disc so the edge stays clean.
      do { x = rand() * 2 - 1; y = rand() * 2 - 1; } while (x * x + y * y > 1);
      x *= HEAD.r;
      y = HEAD.cy + y * HEAD.r;
    } else {
      const t = rand();
      y = BODY.yTop + t * (BODY.yBot - BODY.yTop);
      const w = BODY.wTop + t * (BODY.wBot - BODY.wTop);
      x = (rand() * 2 - 1) * w;
    }

    out[i3] = offset[0] + x * scale;
    out[i3 + 1] = offset[1] + y * scale;
    out[i3 + 2] = (rand() - 0.5) * 0.05;
  }
  return out;
}
```

- [ ] **Step 2:** Wire `cold-02`. The drifting field gathers into the student — `reshuffle(field)` then morph over ~2400ms, `ease: 'outExpo'`. Slow: this is the first shape the deck ever resolves into, and it should feel like something coming into focus rather than snapping on.

- [ ] **Step 3:** Colour `THRESHOLD.student`. Keep `cold-01` exactly as it is — scattered, formless, and silent.

- [ ] **Step 4:** Verify the figure reads as a child standing alone, and that the frame still feels empty around them. If it reads as crowded, shrink `scale`; the loneliness is the image.

- [ ] **Step 5:** Commit.

---

### Task 3: The shadows

**Files:** Create `src/shapes/shadow.js`; modify `src/scenes/threshold.js`.

**Interfaces:** Produces `buildShadows({ arrived })` → `{ positions, eyeness: Float32Array }`

Three serpentine forms that slither in **from behind the student**. The
reference photo shows the register: a large black mass, darker than the
background, with bright eyes and a jagged mouth as the only readable detail.

**The eyes do the work.** As with the hands in the Refusal plan, the body does
not have to be anatomically convincing — it has to be a dark mass with a face.
`eyeness` marks the points belonging to eyes and mouth so the scene can light
those and leave the body nearly black.

- [ ] **Step 1:** Create `src/shapes/shadow.js`. Each shadow is a thick sinuous curve — a cubic through four control points, points scattered along it with the thickness falling off toward the tail — plus two eye discs and a jagged mouth near the head end.

- [ ] **Step 2:** Three instances, arranged as the storyboard draws them: one entering from the left, one from the right, one rising behind the student's head. All three originate **behind the student's position** and travel outward, so the reading is that they came from the child, not at them.

- [ ] **Step 3:** `arrived: false` places each shadow off-frame along its entry vector; `arrived: true` is the settled pose. Same seed for both so beat 1's morph moves the same points.

- [ ] **Step 4:** Colour: body `THRESHOLD.shadowBody` at low intensity — it should read as a hole in the frame rather than as an object. Eyes and mouth `THRESHOLD.shadowEye` at high intensity, applied through the `brightness` buffer via `eyeness`.

- [ ] **Step 5:** The student stays lit and unchanged through this beat. The shadows arrive around them; nothing happens to the child yet.

- [ ] **Step 6:** Slither: a per-frame `sin(absolute time)` wave along each body's length, out of phase per shadow. Time-derived, so `apply()` reproduces it.

- [ ] **Step 7:** Verify they read as demonic rather than as smoke. If they do not, the fix is almost always the eyes — make them smaller, brighter and closer together, not the body bigger.

- [ ] **Step 8:** Commit.

---

### Task 4: Three labels

**Files:** Modify `src/overlay/shardlabel.js`, `src/scenes/threshold.js`.

Only if Decision 2 lands on "allow it". If not, skip this task entirely.

- [ ] **Step 1:** Generalise `shardlabel.js` from one element to a small pool. It already projects a world position to screen space each frame and clamps into the safe area; the change is to hold up to three of those at once, each with its own anchor and text.

- [ ] **Step 2:** Anchor one label to each shadow's head, so a label tracks its shadow as it slithers. Never a fixed pixel offset — the existing clamping rules apply unchanged.

- [ ] **Step 3:** Stagger the three arrivals ~700 ms apart, in the order CH says them: *unspoken trauma*, *student isolation*, *toxic online spaces*.

- [ ] **Step 4:** Case: lowercase. Threshold sits in the deck's dark half, and §4's rule for the darkness is lowercase — *"the darkness is unspoken, diminished, said under the breath"*, which is precisely what these three are.

- [ ] **Step 5:** Verify all three stay inside the safe area at 5:4 and portrait, where there is least horizontal room and the labels are most likely to collide with each other.

- [ ] **Step 6:** Commit.

---

### Task 5: The knife, and the shatter

**Files:** Create `src/shapes/cracks.js`; modify `src/scenes/threshold.js`.

**Interfaces:** Produces `buildCracks(origin)` → `Float32Array(POINTS * 3)`

The picture itself breaks. Not the mask — *the whole composition*, student and
shadows together, cracking along lines that radiate from where the knife went in.

The deck already knows how to do this. `mask.js` splits a shape into jagged
sectors radiating from a point, with the boundaries perturbed by radius so the
cracks wander. That is exactly this, applied to the frame instead of the face.
**Reuse the technique rather than inventing a second one** — and note that the
Refusal plan's `reshuffle` is not the right tool here, because a shatter should
look like breakage, not redistribution.

- [ ] **Step 1:** Create `src/shapes/cracks.js`: take the current composition, assign every point to one of ~7 jagged wedges around the knife's entry point, and displace each wedge outward and slightly rotated — small displacement, so the picture reads as *cracked* rather than as scattered. The Effects plan learned this the hard way; large displacement stops reading as a break.

- [ ] **Step 2:** Three stages via `createSequence`:
  1. **Pierce** (~260ms) — the knife drops in from above and embeds. `rig.shake(0.05, 420)` on impact.
  2. **Crack** (~180ms) — the wedges separate. Fast; a slow crack reads as melting.
  3. **Settle** (~900ms, `ease: 'outExpo'`) — the pieces drift slightly and stop.

- [ ] **Step 3:** **The knife stays upright and whole through all of it.** The storyboard is explicit: it is embedded in the middle while everything around it is in pieces. It must not crack, drift or dim with the rest.

- [ ] **Step 4:** Colour `THRESHOLD.knife`. The student and shadows keep their colours into the wreckage — the picture broke, it did not change palette.

- [ ] **Step 5:** `apply()` is `beat.settle(ctx)` — knife embedded, picture cracked, everything at rest.

- [ ] **Step 6:** Verify the composition is still legible after the break. If the student can no longer be found in the wreckage, the displacement is too large.

- [ ] **Step 7:** Commit.

---

### Task 6: The wreckage holds, then hands off

**Files:** Modify `src/scenes/threshold.js`.

*"When a place of learning becomes a ground of fear, darkness has settled in."*

- [ ] **Step 1:** `thresh-03` holds the shattered picture. No new geometry — the wedges settle further and the drift drops to near-stillness. The line is about something having *settled*, and the image should agree.

- [ ] **Step 2:** The shadows' eyes keep moving. Everything else stops. It is the one thing in frame still alive, and it should be the thing the audience cannot look away from while CH lands the line.

- [ ] **Step 3:** Hand off to the title. The storyboard's last frame says *"transition to shuffle like normal"* — so call `reshuffle(field, 0.6)` at the top of `title.js`'s entry, and the wreckage redistributes into the mask.

- [ ] **Step 4:** Verify the handoff on the real click, and confirm the title beat still lands its own moment — it is the first sight of the mask and must not feel like a continuation of the shatter.

- [ ] **Step 5:** Commit.

---

### Task 7: Full verification

- [ ] **Step 1:** All 24 beats forward, `←` back to 0, every number key, `Q` in and out. Zero console errors.
- [ ] **Step 2:** Tracker reads `/24`.
- [ ] **Step 3:** Jump safety — press `2` from cold. No knife, no shake, no shatter; the section start must be the shadows' settled pose.
- [ ] **Step 4:** Mid-sequence interruption — click into `thresh-02` and click again 200 ms in, mid-pierce. Must land cleanly on `thresh-03`.
- [ ] **Step 5:** Seven-profile device matrix, phone DPR 3 through 4K.
- [ ] **Step 6:** **Colour audit against whichever option Decision 1 lands on.** If Option A or C, confirm no festival hue appears before `prev-01`. If Option B, confirm `CONTEXT.md` §3 has been amended to match rather than left contradicting the code.
- [ ] **Step 7:** Caption audit — labels lowercase, and either three staggered or none, per Decision 2.
- [ ] **Step 8:** Frame cost at 1920×1080 and 320×180; small viewport holds the vsync cap.

---

## Self-Review

**Coverage.** Student alone → Task 2. Shadows slithering in from behind → Task 3.
Their three labels → Task 4. Knife pierces and shatters, knife stays upright →
Task 5. The settled wreckage and the shuffle into the mask slide → Task 6. Spec
list — three colours, demonic register — carried into Tasks 1 and 3.

**Placeholder scan.** None. `buildStudent` and the `THRESHOLD` palette block are
written out; `buildShadows`, `buildCracks` and the sequences are specified with
concrete counts, timings and easings. The two shapes that carry risk — the
shadows reading as demonic, and the shatter staying legible — gate their tasks.

**Type consistency.** `createSequence(stages)` → `{start, settle, stop}`,
`rig.shake(power, ms)` and `reshuffle(field, spread)` all come from the Effects
and Refusal plans and are used here under exactly those names. `buildStudent`,
`buildShadows` and `buildCracks` all return `POINTS`-length buffers matching
every other state in the deck.

**Risk register.**

| Risk | Where | Mitigation |
|---|---|---|
| Colour rule broken silently | Decision 1 | Three explicit options; palette isolated in one block; Task 7 Step 6 audits whichever was chosen |
| Shadows read as smoke, not demons | Task 3 | The eyes carry it — Step 7 says fix the eyes, not the body |
| Shatter makes the picture illegible | Task 5 | Small displacement, learned from Effects; Step 6 checks the student is still findable |
| Knife drifts with the wreckage | Task 5 | Step 3 states it explicitly; it is the storyboard's clearest instruction |
| Three labels collide or leave frame | Task 4 | Existing safe-area clamping; Step 5 tests 5:4 and portrait specifically |
| Cold open loses its emptiness | Task 2 | `cold-01` untouched; Step 4 checks the frame still feels empty around the figure |

**Open.** Decision 1 (colour) and Decision 2 (labels). Both are isolated so the
rest of the plan is unaffected either way — but Decision 1 should be made
deliberately, because it is the one constraint `CONTEXT.md` calls the most
important in the project.

# Threshold Sequence (slides 2–3) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A student stands alone. Three demonic shadows slither in behind them and are named. A knife pierces the picture and shatters it, and stays standing in the wreckage.

**Architecture:** Four new shapes (student, shadow, crack-field, and the knife reused from the Refusal plan) on the existing one-Points-object design. Structurally, `thresh-01` splits into three beats — the storyboard's staging maps sentence-for-sentence onto the script, which is what makes the split obvious rather than invented.

**Tech Stack:** Vite 5, Three.js, anime.js, vanilla JS.

**Spec:** `CONTEXT.md` (canonical — **§3 is amended by Task 0 of this plan**), `docs/superpowers/specs/2026-09-01-tanglaw-sa-dilim-design.md`

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

## Decisions — settled

### Colour: the storyboard's palette, as drawn

**Student yellow, shadows neon purple, knife vibrant red.** Decided for
vibrancy and visibility, and because this slide is doing symbolic work rather
than depicting anything literal.

`CONTEXT.md` §3 currently forbids this and must be amended to match — see
Task 0. Leaving the doc contradicting the deck is the one outcome that is not
allowed.

**A correction to an earlier draft of this plan.** It argued that saturated
colour here would leave Prevention's turn with nothing to be. That was
overstated. Title, Roots and Effects all still drain to near-monochrome
*between* this section and Prevention — roughly fourteen beats of it — so the
contrast at `prev-01` is measured against Effects, not against slide 3. The
local contrast is what an audience actually feels, and it survives untouched.

What the deck loses is a tidy sentence in its own documentation. What it gains
is a shape that is arguably better: **vivid → drained → vivid again.** The
Threshold shows what is at stake in full colour, the deck desaturates as the
analysis gets bleak, and colour returns when solutions arrive. That is a
stronger arc than a flat ramp, and Task 0 records it as the intended reading
rather than as damage.

**One thing to preserve while implementing.** Keep these hues *cold and
violent* in character, against Prevention's *warm and human* festival palette.
Not less saturated — different in temperature. The shadows are electric violet,
not the warm pink-violet of `fuchsia`; the knife is hard red. The student is the
single warm thing in the frame, which is the deck's existing language for "the
one living thing here" and is why the image works at all.

That separation is what stops the two palettes reading as one colour system, and
it costs nothing.

### Word limit: exception granted

All three shadow labels appear — *unspoken trauma*, *student isolation*, *toxic
online spaces*. Seven words, and this beat joins `ref-01` as the deck's second
sanctioned exception to the five-word ceiling.

Still **staggered**, one label arriving with each shadow: it spreads the reading
across the sentence CH is speaking instead of dumping seven words at once, and
it means each label lands on the thing it names.

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

### Task 0: Amend the colour rule

`CONTEXT.md` §3 forbids what this section does. Amend it before writing any
code, so the doc and the deck never contradict each other — the same discipline
the Effects plan follows.

- [ ] **Step 1:** In §3, replace the near-monochrome rule with:

```markdown
**First rule, as amended 2026-09-02.** The deck's colour argument is
temperature, not saturation.

Threshold (slides 2-3) carries vivid colour — a yellow student, neon purple
shadows, a red knife — because that beat is symbolic and has to read across a
lit room. Those hues are COLD and violent by design: electric violet, hard red.
Title, Roots and Effects then drain to near-monochrome, and the festival palette
— the mask's own WARM pinks and golds — still appears only from Prevention
onward.

So the shape is vivid, drained, vivid again: the Threshold shows what is at
stake, the deck desaturates as the analysis gets bleak, and colour returns when
solutions arrive. The contrast at prev-01 is measured against Effects, not
against slide 3, and is unaffected.

What is still forbidden anywhere before prev-01: the festival hues themselves
(`rose`, `ember`, `gold`, `fuchsia`, `radiance`). Warmth is what Prevention
earns.
```

- [ ] **Step 2:** Update the same rule where it is restated — `src/theme.js`'s header comment and `README.md`'s "Three rules the code enforces" — so all three agree.

- [ ] **Step 3:** Commit. Documentation only.

---

### Task 1: Split the beats and set the palette

**Files:** Modify `src/beats.js`, `src/theme.js`; regenerate `docs/RUNSHEET.md`.

- [ ] **Step 1:** Split `thresh-01` into `thresh-01`, `thresh-02`, `thresh-03`, one sentence each per the mapping table. `thresh-01` keeps its id honestly — same position, same speaker, same handoff, same opening sentence. `speaker: 'CH'` throughout, `handoff: true` on `thresh-01` only.

- [ ] **Step 2:** Add the palette to `theme.js`:

```js
/**
 * Threshold palette (slides 2-3). Vivid by decision — this beat is symbolic and
 * has to carry across a lit room.
 *
 * Kept COLD against the festival palette's warmth, so the two never read as one
 * colour system: electric violet rather than `fuchsia`'s warm pink-violet, and
 * a hard red. The student is the single warm thing in frame, which is the
 * deck's existing language for the one living thing in a scene.
 */
export const THRESHOLD = {
  student: 0xffe23d,   // yellow. Purer and brighter than `gold`'s amber
  shadow: 0x8f3dff,    // neon violet — electric, cold, nothing like `fuchsia`
  shadowEye: 0xd9b3ff, // near-white violet, so the eyes read at distance
};
```

- [ ] **Step 3:** The knife reuses **`COLOR.blood`**, the Effects red, rather than adding a near-duplicate. That is deliberate and worth keeping: the same red is the knife here and the blood there — the threat named on slide 3, realised in Effects. Update `blood`'s doc comment to say it now appears in both sections.

- [ ] **Step 4:** Write the `cue` field for each new beat — where in the sentence to click, and what happens.

- [ ] **Step 5:** Regenerate and verify.

```bash
npm run runsheet
node --input-type=module -e "
import { beats, totalBeats } from './src/beats.js';
const t = beats.filter(b => b.section === 'threshold');
console.log('threshold beats:', t.map(b => b.id).join(','), '(expect thresh-01,thresh-02,thresh-03)');
console.log('total:', totalBeats, '(+2 on whatever the count was)');
console.log('handoffs:', beats.filter(b => b.handoff).length, '(expect 6)');
"
```

- [ ] **Step 6:** Verify the deck runs with the old visuals at the new count. Tracker reads the new total; `2` still jumps to Threshold; `←` walks back through all three.

- [ ] **Step 7:** Commit. Ships alone.

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

- [ ] **Step 3:** Colour `THRESHOLD.student`, bright. Keep `cold-01` exactly as it is — scattered, formless, and silent.

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

- [ ] **Step 4:** Colour: body `THRESHOLD.shadow` — vivid neon violet, not a dark mass. Eyes and mouth `THRESHOLD.shadowEye` brighter still, applied through the `brightness` buffer via `eyeness`, so the faces read first and the bodies read as the thing carrying them.

- [ ] **Step 5:** The student stays lit and unchanged through this beat. The shadows arrive around them; nothing happens to the child yet.

- [ ] **Step 6:** Slither: a per-frame `sin(absolute time)` wave along each body's length, out of phase per shadow. Time-derived, so `apply()` reproduces it.

- [ ] **Step 7:** Verify they read as demonic rather than as smoke. If they do not, the fix is almost always the eyes — make them smaller, brighter and closer together, not the body bigger.

- [ ] **Step 8:** Commit.

---

### Task 4: Three labels

**Files:** Modify `src/overlay/shardlabel.js`, `src/scenes/threshold.js`.

The word-limit exception is granted, so this task is in scope. Seven words across three labels, staggered.

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

- [ ] **Step 4:** Colour `COLOR.blood` — the same red as the Effects splat, on purpose. The student and shadows keep their colours into the wreckage; the picture broke, it did not change palette.

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
- [ ] **Step 6:** **Colour audit.** Threshold may use `THRESHOLD.*` and `COLOR.blood`. Confirm **no festival hue** (`rose`, `ember`, `gold`, `fuchsia`, `radiance`) appears anywhere before `prev-01` — that half of the rule is unchanged and is the half Prevention still depends on.
- [ ] **Step 7:** Confirm `CONTEXT.md` §3, `theme.js`'s header and `README.md` all state the amended rule and agree with each other.
- [ ] **Step 8:** Caption audit — three labels, lowercase, staggered.
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
| Amended rule left contradicting the code | Task 0 | Amend §3, `theme.js` and `README.md` together, before any code; Task 7 Step 7 audits all three |
| Threshold hues drift warm and collide with the festival palette | Task 1 | Electric violet and hard red are specified against `fuchsia`'s warm pink-violet; temperature is what separates the two systems |
| Shadows read as smoke, not demons | Task 3 | The eyes carry it — Step 7 says fix the eyes, not the body |
| Shatter makes the picture illegible | Task 5 | Small displacement, learned from Effects; Step 6 checks the student is still findable |
| Knife drifts with the wreckage | Task 5 | Step 3 states it explicitly; it is the storyboard's clearest instruction |
| Three labels collide or leave frame | Task 4 | Existing safe-area clamping; Step 5 tests 5:4 and portrait specifically |
| Cold open loses its emptiness | Task 2 | `cold-01` untouched; Step 4 checks the frame still feels empty around the figure |

**Open.** Nothing. Colour and the word-limit exception are both settled above.

**Sequencing.** Task 0 is documentation and ships first so nothing is built
against a rule the docs still forbid. Task 1 is the beat split and also ships
alone. Everything from Task 2 depends on the Refusal plan's `knife.js` and
`reshuffle`, and on the Effects plan's `createSequence` and camera rig.

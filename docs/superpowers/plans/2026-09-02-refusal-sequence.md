# Refusal Sequence (the CH paragraph) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-cut the Refusal section from two long holds into six beats, and give each sentence its own image — the classroom becomes a cage, the cage becomes two weapons, hands rise and crush them, and the pieces scatter into light.

**Architecture:** The one-Points-object design is unchanged; three new shapes (bars, knife, hands) join the existing buffers. The structural change is the real one: `beats.js` grows from 22 beats to 26, the first time the beat count has moved.

**Tech Stack:** Vite 5, Three.js, anime.js, vanilla JS.

**Spec:** `CONTEXT.md` (canonical), `docs/superpowers/specs/2026-09-01-tanglaw-sa-dilim-design.md`

**Storyboard:** *pending — the author is providing a draft.* When it lands it becomes the authority on staging, exactly as `effects-storyboard.png` is for Effects, and this document defers to it.

**Depends on:** `docs/superpowers/plans/2026-09-02-effects-sequence.md` Tasks 1 and 2. This plan reuses that plan's **camera rig** (for the crush) and its **gun shape** (for the right-hand weapon). Build Effects first, or extract those two pieces on their own.

---

## The re-cut

CH's paragraph is six sentences carried by two beats. Each beat therefore holds
for roughly twenty-five seconds — **the longest holds in the deck**, on a near-
frozen image. Splitting it six ways is not only a visual upgrade; it is the fix
for the worst pacing problem in the piece.

| # | Sentence | Image |
|---|---|---|
| 1 | "Do not surrender our generation to despair." | The near-whole mask, held. The gap where the last shard belongs breathes. |
| 2 | "Do not build prisons out of our classrooms." | The mask's own points rise into **prison bars**. |
| 3 | "When a child turns to violence, society failed them long before they picked up a weapon." | The bars become **a knife (left) and a handgun (right)**. |
| 4 | "Refuse the cheap comfort of vengeance." | **Hands rise out of the dark** and settle beneath each weapon. |
| 5 | "Fix the toxic environments poisoning our youth and hold the line for healing" | The hands **close**. The weapons fragment and **scatter into light**. |
| 6 | "because treating children as lost causes surrenders the future." | See "Beat 6" below — three options, one recommended. |

**The through-line to protect:** every shape in this section is made of the same
points as the mask. The classroom becomes the cage becomes the weapons becomes
the light. Nothing arrives from outside the piece. This is the same rule that
makes the Effects gun defensible, and it is what stops the section reading as a
slideshow of unrelated objects.

---

## Two decisions to make before Task 1

### 1. Beat ids

`CONTEXT.md` says ids are stable and never renumbered, and the tracker and
README both tell you to quote the id rather than the number. That convention now
collides with a genuine re-cut.

**Recommended:** keep `ref-01`, **retire `ref-02`**, and number the five new
beats `ref-03` … `ref-07`.

- `ref-01` survives honestly: same position, same speaker, same handoff, same
  opening sentence. It only loses its second sentence and its caption.
- `ref-02` held four sentences that are now spread across five beats. There is
  no honest successor, so nothing inherits the name.
- The gap at `ref-02` is a deliberate scar. Anyone who finds an old note saying
  "`ref-02` needs work" will look it up, find nothing, and go read this document
  — which is the correct outcome.

**Alternative if you would rather have clean sequential ids:** renumber
`ref-01`…`ref-06` and accept that both names change meaning. Cheaper to read,
and the only cost is that notes written before today point at the wrong beats.
Say which you want; the plan works either way.

### 2. Captions

**Recommended: one caption in the whole section, on beat 2.**

`ref-01` currently carries `Do not build prisons out of our classrooms.` — the
single sanctioned exception to the 5-word ceiling, and the one beat in the deck
where the screen and the speaker say the same words at the same time. Under the
re-cut that sentence gets its own beat, so the caption moves with it to beat 2.

Every other beat in the section runs `caption: null`. The point of the re-cut is
that the images carry the argument; adding five more captions would put the
audience back to reading instead of watching, and would cost the section its one
genuinely arresting text moment by making it ordinary.

---

## Global Constraints

- **Festival hues are permitted here.** Refusal is after `prev-01`, so `rose`, `ember`, `gold`, `fuchsia` and `radiance` are all legal. The "scatter into light" in beat 5 should use them — it is the most colour the deck has shown outside the Close.
- **`apply()` and `enter()` must reach an identical end state.** The crush and the hand entrance are both multi-stage; use `createSequence` from the Effects plan rather than nested `onComplete`.
- **Nothing is on a timer.** Within-beat sequencing only.
- **Caption case in Refusal is sentence case** — that is the established pattern from `ref-01`, and the case rule in §4 only legislates Roots/Effects (lowercase) and Prevention/Close (uppercase).
- **Beat 1 must hold Prevention's exact end state.** `refusal.js` imports `geometryFor` and `colorsFor` from `prevention.js` for this reason; that import stays, and only beat 1 uses it.
- **`renderer.setSize(w, h)` keeps `updateStyle` true.**
- Point budget stays `POINTS = 17000`, split between the two weapons and the two hands.

---

## File structure

| File | Change | Responsibility |
|---|---|---|
| `src/beats.js` | modify | Two beats become six. **Beat count 22 → 26.** Task 1. |
| `src/shapes/bars.js` | **create** | The prison bars. Task 2. |
| `src/shapes/knife.js` | **create** | Left-hand weapon. Task 3. |
| `src/shapes/gun.js` | reuse + generalise | Right-hand weapon. From the Effects plan. Task 3. |
| `src/shapes/hands.js` | **create** | Two hands rising from below. Task 4. |
| `src/scenes/refusal.js` | rewrite | Six states instead of two. Tasks 2–6. |
| `src/camera-rig.js` | reuse | Shake on the crush. From the Effects plan. Task 5. |
| `src/sequence.js` | reuse | Multi-stage beats. From the Effects plan. Tasks 4, 5. |
| `docs/RUNSHEET.md` | regenerate | `npm run runsheet`. Task 1. |

---

### Task 1: Re-cut the beats

Do this first and alone. It is the structural change, it is mechanical, and
every later task depends on the beats existing.

**Files:** Modify `src/beats.js`; regenerate `docs/RUNSHEET.md`.

- [ ] **Step 1:** Replace the two Refusal entries with six, following the decisions above. Speaker is `CH` throughout; `handoff: true` on the first beat only — the section is still one continuous CH passage, so the handoff count stays at six for the whole deck.

- [ ] **Step 2:** Split the script verbatim, one sentence per beat. Do not reword. The em-dash before "because" in the source becomes the join between beats 5 and 6 — beat 5's script ends `…hold the line for healing —` and beat 6's begins `— because treating children…`, matching how `roots-00`/`roots-01` already handle a sentence broken across a click.

- [ ] **Step 3:** Write the `cue` field for each beat. These are the operator's run sheet and are the only place the new staging is written down for a human. Each must say where in the sentence to click.

- [ ] **Step 4:** Regenerate and confirm the count.

```bash
npm run runsheet
node --input-type=module -e "
import { beats, totalBeats } from './src/beats.js';
console.log('total:', totalBeats, '(expect 26)');
console.log('refusal:', beats.filter(b => b.section === 'refusal').length, '(expect 6)');
console.log('handoffs:', beats.filter(b => b.handoff).length, '(expect 6)');
console.log('captions in refusal:', beats.filter(b => b.section === 'refusal' && b.caption).length, '(expect 1)');
"
```

- [ ] **Step 5:** Verify the deck still runs with the new count before any visuals exist. All six beats will show the old held mask; that is expected. Check the tracker reads `/26`, that `7` still jumps to the section start, and that `←` walks back through all six.

- [ ] **Step 6:** Commit. Ship this alone — it is independently correct and it unblocks rehearsal on the real structure.

---

### Task 2: Prison bars

**Files:** Create `src/shapes/bars.js`; modify `src/scenes/refusal.js`.

**Interfaces:** Produces `buildBars()` → `Float32Array(POINTS * 3)`

- [ ] **Step 1:** Create `src/shapes/bars.js`. Seven vertical bars, running past the top and bottom of frame so they read as continuous rather than as seven floating rectangles, plus a cross-rail top and bottom to make it a cage rather than a fence.

```js
import { POINTS } from '../theme.js';
import { seededRandom } from '../noise.js';

const COUNT = 7;
const SPACING = 0.34;
const WIDTH = 0.085;
const TOP = 1.5;      // deliberately past the frame edge
const BOTTOM = -1.5;
const RAIL_Y = [1.16, -1.16];
const RAIL_H = 0.07;

export function buildBars() {
  const rand = seededRandom(0xba25);
  const out = new Float32Array(POINTS * 3);
  const x0 = -((COUNT - 1) * SPACING) / 2;

  for (let i = 0; i < POINTS; i++) {
    const i3 = i * 3;

    // One in six points goes to a rail; the rest to the uprights.
    if (rand() < 0.16) {
      const y = RAIL_Y[rand() < 0.5 ? 0 : 1];
      out[i3] = (rand() * 2 - 1) * (x0 * -1 + WIDTH);
      out[i3 + 1] = y + (rand() - 0.5) * RAIL_H;
    } else {
      const bar = (rand() * COUNT) | 0;
      out[i3] = x0 + bar * SPACING + (rand() - 0.5) * WIDTH;
      out[i3 + 1] = BOTTOM + rand() * (TOP - BOTTOM);
    }
    out[i3 + 2] = (rand() - 0.5) * 0.06;
  }
  return out;
}
```

- [ ] **Step 2:** Wire beat 2. Morph from beat 1's held mask over ~1600ms, `ease: 'inOutQuad'`. **The mask's own points become the cage** — do not fade one out and the other in. Colour holds Prevention's festival hues at reduced intensity so the bars read as cold structure without leaving the palette.

- [ ] **Step 3:** Show the caption `Do not build prisons out of our classrooms.` on this beat, and carry `ref-01`'s old cue with it: *read it aloud, in sync with the room.*

- [ ] **Step 4:** Verify the bars read as confinement and the caption stays legible against them. If the text fights the uprights, widen `SPACING` rather than moving the caption — the caption's position is governed by the safe-area rules and should not become a special case.

- [ ] **Step 5:** Commit.

---

### Task 3: Knife and gun

**Files:** Create `src/shapes/knife.js`; modify `src/shapes/gun.js`, `src/scenes/refusal.js`.

**Interfaces:**
- Produces: `buildKnife({ indices, scale, offset })` → writes into a shared buffer
- Modifies: `buildGun` gains `{ pick, scale, offset }` so it can place a subset of points anywhere, not only the whole field at origin

Both weapons stand **vertical, points up**, so the hands can rise beneath them
in beat 4. The gun is the Effects section's gun, rotated a quarter turn — the
same object the deck has already shown, which is the point.

- [ ] **Step 1:** Generalise `buildGun`. It currently distributes all `POINTS` by shard at the origin; it needs to place an arbitrary subset at an arbitrary scale and offset.

```js
export function buildGun(target, { pick, tilt = 0, scale = 1, offset = [0, 0] } = {}) { … }
```

Keep the existing shard-based call working — the Effects section depends on it — by defaulting `pick` to "all points, distributed by shard".

- [ ] **Step 2:** Create `src/shapes/knife.js`: blade as a tapered quad (wide at the bolster, meeting at a point), a short bolster rect, and a handle rect. Roughly 1.0 tall so it reads at the same visual weight as the gun beside it.

- [ ] **Step 3:** Wire beat 3. Points split by index parity — even indices to the knife on the left, odd to the gun on the right — so both weapons form simultaneously out of the bars rather than one after the other. Position at roughly `x = ∓0.62`.

- [ ] **Step 4:** **Verify both read at a glance**, side by side, and that they are the same visual weight. A knife that reads and a gun that does not will look like a mistake. Iterate before proceeding; every silhouette in this project needed it.

- [ ] **Step 5:** Commit.

---

### Task 4: Hands rising from the dark

**Files:** Create `src/shapes/hands.js`; modify `src/scenes/refusal.js`.

**Interfaces:** Produces `buildHands({ closed })` → `Float32Array(POINTS * 3)`

**This is the highest-risk shape in the section.** A hand is the hardest thing
here to make read at point density — it has five similar sub-shapes and no
strong silhouette. Budget iteration time, and take the fallback early rather
than grinding on a hand that will not resolve.

- [ ] **Step 1:** Create `src/shapes/hands.js`. Each hand: a rounded palm (ellipse, rejection-sampled), four fingers as rounded rects fanning slightly upward, and a thumb angled out. Mirrored left and right. Roughly 8,500 points each.

- [ ] **Step 2:** `closed: true` returns the same hand with fingers curled inward and the palm raised — the crush pose. Same seed as the open hand, so beat 5 morphs the *same* hand rather than swapping in a different one. Reseeding here would make every point jump, exactly as it would have with the gun's recoil.

- [ ] **Step 3:** Wire beat 4 as two stages via `createSequence`: hands rise from below frame into position beneath each weapon (~1100ms, `ease: 'outExpo'`), then hold. The weapons stay exactly where they are — nothing about them changes on this beat.

- [ ] **Step 4:** Colour: the hands are warm — `radiance` at low intensity. They are the first hopeful thing in the section and they should be legible as such before they do anything.

- [ ] **Step 5:** **Verify the hands read as hands.** If they do not after a couple of passes, take the fallback: two upward-cupping arcs, unmistakably cradling without being anatomical. Less literal, and it will not look broken. Record which was used.

- [ ] **Step 6:** Commit.

---

### Task 5: The crush, and the scatter into light

**Files:** Modify `src/scenes/refusal.js`.

The emotional peak of the section, and the one place the deck spends real
colour outside the Close.

- [ ] **Step 1:** Three stages via `createSequence`:
  1. **Close** (~420ms, `ease: 'inQuad'`) — hands morph to `closed`, weapons compress toward their centres. Fast; a slow crush reads as a hug.
  2. **Fragment** (~180ms) — a small camera shake via `rig.shake(0.035, 380)`, and the weapon points scatter outward with per-point `posDelay` from `noise.roll` so the break has grain.
  3. **Light** (~1400ms, `ease: 'outExpo'`) — fragments drift up and outward, colours morphing to the four festival hues interleaved, brightness rising.

- [ ] **Step 2:** The hands stay through the scatter and fade last. They did the thing; they should be the final part of the image to go.

- [ ] **Step 3:** `apply()` is `beat5.settle(ctx)` — hands closed, weapons gone, fragments dispersed and lit.

- [ ] **Step 4:** Verify the scatter reads as *release* and not as another shatter. The Effects shatter is violent and outward; this one is buoyant and upward. If they look alike, slow stage 3 and add more upward bias.

- [ ] **Step 5:** Commit.

---

### Task 6: The last sentence — three options

*"because treating children as lost causes surrenders the future."*

The section has to end without stealing the Close. `close-01` is where the mask
completes in full colour and `close-02` is the lantern; if Refusal resolves the
image completely, the Close has nowhere left to go.

**Recommended — the field of small lights.** The scattered fragments gather into
many small, separate, warm lights, spread across the frame, drifting slowly.
Not one light: many. Each one a child. The line is about writing children off,
and a field of individual lights says *these are all still here* without a word.
It also hands off perfectly — `close-01` then gathers them into the completed
mask, which is the argument the whole deck has been making.

**Alternative A — the held breath.** The fragments slow, hold suspended, and do
not resolve. The sentence is a warning, not a promise, and the image stays
unresolved until the Close answers it. Quieter, and it protects the Close
absolutely. Weaker as an image on its own.

**Alternative B — the empty desk, lit.** The points form a single school desk,
warm-lit and whole. Ties back to the classroom the section opened with, and
answers the retired empty-seat beat from Effects. Risk: it reintroduces
furniture the deck has otherwise dropped, and it is the most literal of the
three.

- [ ] **Step 1:** Pick one. Recommended is the field of lights.
- [ ] **Step 2:** Implement. For the recommended option: ~180 clusters of ~95 points each, positions scattered across `x ±1.5`, `y ±0.95`, each cluster breathing out of phase, all four festival hues interleaved at moderate intensity.
- [ ] **Step 3:** Verify it does not look like the Q&A ember field, which is the nearest thing already in the deck. Embers are loose, dim and orbiting; this should be clustered, brighter and steadier. If they are confusable, tighten the clusters and raise the intensity.
- [ ] **Step 4:** Commit.

---

### Task 7: Full verification

- [ ] **Step 1:** All 26 beats forward, `←` back to 0, every number key from several starting points, `Q` in and out. Zero console errors.
- [ ] **Step 2:** Tracker reads `/26` and the Refusal ids appear correctly.
- [ ] **Step 3:** Jump safety — press `7` from cold. No crush, no shake, no hand animation; the section start must be the held mask.
- [ ] **Step 4:** Mid-sequence interruption — click into beat 5 and click again 300ms in, mid-crush. Must land cleanly on beat 6 with no half-run stage and no stuck camera offset.
- [ ] **Step 5:** Seven-profile device matrix. Bars run past the frame edge by design; confirm that is true at 5:4 and portrait too, where the frame is taller.
- [ ] **Step 6:** Caption audit — exactly one caption in the section, on beat 2, sentence case, verbatim.
- [ ] **Step 7:** Frame cost at 1920×1080 and 320×180; small viewport holds the vsync cap.

---

## Self-Review

**Coverage.** Sentence 1 → Task 1 (beat kept as-is, per the author). Sentence 2
bars → Task 2. Sentence 3 knife and gun → Task 3. Sentence 4 hands → Task 4.
Sentence 5 crush and scatter → Task 5. Sentence 6 → Task 6, three options with
one recommended, as requested.

**Placeholder scan.** None. `buildBars` is written out; `buildKnife`,
`buildHands` and the sequences are specified with concrete dimensions, point
splits, timings and easings. The two shapes that carry real risk (hands, and the
knife/gun pair) gate their tasks on reading correctly.

**Type consistency.** `createSequence(stages)` → `{start, settle, stop}` and
`rig.shake(power, ms)` both come from the Effects plan and are used here under
exactly those names. `buildGun` is explicitly generalised in Task 3 Step 1 with
its existing call kept working, because Effects depends on it.

**Risk register.**

| Risk | Where | Mitigation |
|---|---|---|
| Hands do not read at point density | Task 4 | Fallback to cupping arcs specified up front; Step 5 gates it |
| Knife and gun read at different weights | Task 3 | Step 4 checks them side by side, not individually |
| Scatter looks like the Effects shatter | Task 5 | Step 4 contrasts them directly: violent/outward vs buoyant/upward |
| Beat 6 steals the Close | Task 6 | All three options chosen against that constraint; recommended one hands off to `close-01` |
| Beat 6 looks like the Q&A embers | Task 6 | Step 3 contrasts them; clusters vs loose orbits |
| Stale `ref-02` references after the re-cut | Decisions | Id retired rather than reused, so a lookup fails loudly instead of silently pointing at the wrong beat |
| Caption unreadable against the bars | Task 2 | Widen bar spacing, never special-case the caption's position |

**Open.** The storyboard, which supersedes staging here when it arrives. The two
decisions at the top (ids, captions) want confirming. Beat 6 wants a choice.

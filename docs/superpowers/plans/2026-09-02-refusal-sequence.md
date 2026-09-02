# Refusal Sequence (the CH paragraph) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-cut the Refusal section from two long holds into six beats, and give each sentence its own image — the classroom becomes a cage, the cage becomes two weapons, hands close out of the shadows and crush them, and the hands themselves become stars.

**Architecture:** The one-Points-object design is unchanged; four new shapes (bars, knife, hands, stars) join the existing buffers, and one shared `reshuffle` helper gives the whole section its transition feel. The structural change is the real one: `beats.js` grows from 22 beats to 26, the first time the beat count has moved.

**Tech Stack:** Vite 5, Three.js, anime.js, vanilla JS.

**Spec:** `CONTEXT.md` (canonical), `docs/superpowers/specs/2026-09-01-tanglaw-sa-dilim-design.md`

**Storyboard:** [`docs/assets/refusal-storyboard.jpg`](../../assets/refusal-storyboard.jpg) — the author's draft, including a reference image for the hands. It is the authority on staging; where this document and the storyboard disagree, the storyboard wins.

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
| 4 | "Refuse the cheap comfort of vengeance." | **Many hands fade in out of the shadows**, fingers splayed, surrounding both weapons. |
| 5 | "Fix the toxic environments poisoning our youth and hold the line for healing" | The hands **close into fists**, thumbs up. The weapons break and scatter — denser at the crush. |
| 6 | "because treating children as lost causes surrenders the future." | The hands **become stars**; the debris fades away. |

**The through-line to protect:** every shape in this section is made of the same
points as the mask. The classroom becomes the cage becomes the weapons becomes
the light. Nothing arrives from outside the piece. This is the same rule that
makes the Effects gun defensible, and it is what stops the section reading as a
slideshow of unrelated objects.

---

## Spec list, from the storyboard

| | |
|---|---|
| Bars | **white**, five of them |
| Weapons | **bright white** |
| Hands | **yellow** |
| Transition style | **"the dots reshuffling"** — see below |
| Beat 6 | **stars**, yellow. Hands become them; the debris fades |
| Beat 1 | the suggestion in this plan, accepted |

### "The dots reshuffling"

This is a section-wide instruction and it needs a shared implementation rather
than six ad-hoc ones. A straight lerp moves every point on the same clock, which
reads as a shape being *pulled* into another shape. Reshuffling means the points
arrive scattered in time, so the eye reads redistribution rather than
deformation.

The deck already has the mechanism — `posDelay`, the same per-point stagger that
lights shards 200 ms apart and throws the Effects splat across the frame:

```js
/** Section-wide transition feel: points redistribute rather than deform. */
export function reshuffle(field, spread = 0.55) {
  for (let i = 0; i < POINTS; i++) {
    field.posDelay[i] = field.noise.roll(i) * spread;
  }
}
```

Call it before every `morph` in this section. Nothing else changes.

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

- **Festival hues are permitted here.** Refusal is after `prev-01`, so `rose`, `ember`, `gold`, `fuchsia` and `radiance` are all legal. In practice the storyboard uses only white and yellow — a deliberately restricted palette that makes the section read as cold structure resolving into warm light, without spending the Close's full-colour moment early.
- **`apply()` and `enter()` must reach an identical end state.** The crush and the hand entrance are both multi-stage; use `createSequence` from the Effects plan rather than nested `onComplete`.
- **Nothing is on a timer.** Within-beat sequencing only.
- **Caption case in Refusal is sentence case** — that is the established pattern from `ref-01`, and the case rule in §4 only legislates Roots/Effects (lowercase) and Prevention/Close (uppercase).
- **Beat 1 must hold Prevention's exact end state.** `refusal.js` imports `geometryFor` and `colorsFor` from `prevention.js` for this reason; that import stays, and only beat 1 uses it.
- **`renderer.setSize(w, h)` keeps `updateStyle` true.**
- Point budget stays `POINTS = 17000`, split between the two weapons and the surrounding hands.

---

## File structure

| File | Change | Responsibility |
|---|---|---|
| `src/beats.js` | modify | Two beats become six. **Beat count 22 → 26.** Task 1. |
| `src/shapes/bars.js` | **create** | Five white prison bars. Task 2. |
| `src/shapes/stars.js` | **create** | The star field the hands become. Task 6. |
| `src/shapes/knife.js` | **create** | Left-hand weapon. Task 3. |
| `src/shapes/gun.js` | reuse + generalise | Right-hand weapon. From the Effects plan. Task 3. |
| `src/shapes/hands.js` | **create** | Many hands emerging from shadow. Task 4. |
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

const COUNT = 5;   // storyboard draws five
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

- [ ] **Step 2:** Wire beat 2. `reshuffle(field)` then morph from beat 1's held mask over ~1600ms, `ease: 'inOutQuad'`. **The mask's own points become the cage** — do not fade one out and the other in.

  Colour: **white**, per the spec list. This is the first hard white in the deck and it should feel like it — the festival hues Prevention just earned drain out into cold structure. `solid(COLOR.radiance, 2.2)` reads as white here without introducing a new palette entry.

- [ ] **Step 3:** Show the caption `Do not build prisons out of our classrooms.` on this beat, and carry `ref-01`'s old cue with it: *read it aloud, in sync with the room.*

- [ ] **Step 4:** Verify the bars read as confinement and the caption stays legible against them. If the text fights the uprights, widen `SPACING` rather than moving the caption — the caption's position is governed by the safe-area rules and should not become a special case.

- [ ] **Step 5:** Commit.

---

### Task 3: Knife and gun

**Files:** Create `src/shapes/knife.js`; modify `src/shapes/gun.js`, `src/scenes/refusal.js`.

**Interfaces:**
- Produces: `buildKnife({ indices, scale, offset })` → writes into a shared buffer
- Modifies: `buildGun` gains `{ pick, scale, offset }` so it can place a subset of points anywhere, not only the whole field at origin

Both weapons sit **roughly horizontal**, as the storyboard draws them — knife on
the left, handgun on the right, both reading in profile. The hands do not come
from below; they close in from all around (Task 4), so the weapons do not need
to stand up to be reachable.

The gun is the Effects section's gun at a smaller scale — the same object the
deck has already shown, which is the point. The audience has watched this exact
silhouette fire; seeing it crushed is the answer to that.

Colour: **bright white**, brighter than the bars. `solid(COLOR.radiance, 3.4)`.

- [ ] **Step 1:** Generalise `buildGun`. It currently distributes all `POINTS` by shard at the origin; it needs to place an arbitrary subset at an arbitrary scale and offset.

```js
export function buildGun(target, { pick, tilt = 0, scale = 1, offset = [0, 0] } = {}) { … }
```

Keep the existing shard-based call working — the Effects section depends on it — by defaulting `pick` to "all points, distributed by shard".

- [ ] **Step 2:** Create `src/shapes/knife.js`. The storyboard draws a broad cleaver-like blade rather than a slim knife — blade as a tapered quad with a squared tip, a short bolster, and a handle. Roughly 1.0 long so it carries the same visual weight as the gun beside it.

- [ ] **Step 3:** Wire beat 3. `reshuffle(field)`, then split points by index parity — even indices to the knife on the left, odd to the gun on the right — so both weapons form simultaneously out of the bars rather than one after the other. Position at roughly `x = ∓0.62`.

- [ ] **Step 4:** **Verify both read at a glance**, side by side, and that they are the same visual weight. A knife that reads and a gun that does not will look like a mistake. Iterate before proceeding; every silhouette in this project needed it.

- [ ] **Step 5:** Commit.

---

### Task 4: Many hands, out of the shadows

**Files:** Create `src/shapes/hands.js`; modify `src/scenes/refusal.js`.

**Interfaces:** Produces `buildHands({ closed })` → `{ positions: Float32Array(POINTS*3), tipness: Float32Array(POINTS) }`

**The storyboard makes this easier, not harder.** An earlier draft of this plan
flagged hands as the highest-risk shape here, because an anatomically convincing
hand has five similar sub-shapes and no strong silhouette. The reference image
sidesteps that entirely:

> "the hands fade in emerging from the shadows, fingertips vividly visible
> fading into the palms, thumbs facing up"

**Only the fingertips have to read.** The palms dissolve into black on purpose,
so there is no palm to get wrong. That inverts the risk: this is now one of the
easier shapes in the section, and the brightness gradient along each finger is
doing the work a silhouette would otherwise have to do.

It is also **many hands, not two.** They come in from every edge and surround
both weapons, as the storyboard draws and the reference shows.

- [ ] **Step 1:** Create `src/shapes/hands.js`. Each hand is five tapered fingers radiating from an implied palm; the palm itself gets almost no points because it is meant to vanish.

```js
import { POINTS } from '../theme.js';
import { seededRandom } from '../noise.js';

/** Hands per weapon. The storyboard shows roughly this many around each. */
const PER_WEAPON = 5;
const FINGERS = 5;

/**
 * A hand is drawn as fingers only.
 *
 * `tipness` is the whole trick: 1 at the fingertip, 0 at the base. The scene
 * multiplies brightness by it, so the tips are vivid and the palms fade into
 * the dark exactly as the reference image does. Nothing has to look like a
 * palm because no palm is ever lit.
 */
export function buildHands({ closed = false } = {}) {
  // Same seed for open and closed, so beat 5 morphs THIS hand rather than
  // swapping in a different one. Reseeding would make every point jump.
  const rand = seededRandom(0x4a5d);
  const positions = new Float32Array(POINTS * 3);
  const tipness = new Float32Array(POINTS);

  const hands = [];
  for (let w = 0; w < 2; w++) {
    const cx = w === 0 ? -0.62 : 0.62;
    for (let h = 0; h < PER_WEAPON; h++) {
      // Fan the hands around the weapon, all reaching inward.
      const a = Math.PI * (0.15 + 0.7 * (h / (PER_WEAPON - 1)));
      hands.push({
        // Origin sits off past the frame edge — they come out of the dark.
        ox: cx + Math.cos(a) * 0.95,
        oy: Math.sin(a) * 0.95 - 0.1,
        aim: a + Math.PI,          // fingers point back toward the weapon
      });
    }
  }

  for (let i = 0; i < POINTS; i++) {
    const i3 = i * 3;
    const hand = hands[(rand() * hands.length) | 0];
    const finger = (rand() * FINGERS) | 0;

    // Thumb is finger 0 and splays furthest; storyboard says thumbs face up.
    const isThumb = finger === 0;
    const spread = isThumb ? 0.55 : (finger - 2.5) * 0.13;

    // How far along the finger this point sits. Curled when closed.
    const t = rand();
    const len = closed ? 0.20 : 0.42;
    const curl = closed ? (isThumb ? 0.2 : 1.25) : 0;

    const dir = hand.aim + spread + curl * t;
    const r = 0.12 + t * len;

    positions[i3] = hand.ox + Math.cos(dir) * r + (rand() - 0.5) * 0.02;
    positions[i3 + 1] = hand.oy + Math.sin(dir) * r + (rand() - 0.5) * 0.02;
    positions[i3 + 2] = (rand() - 0.5) * 0.06;

    tipness[i] = t * t;   // squared, so the falloff into the palm is steep
  }

  return { positions, tipness };
}
```

- [ ] **Step 2:** Wire beat 4. `reshuffle(field)`, then morph from the weapons state — the hands arrive by the weapons' own leftover points redistributing, keeping the section's one-object rule. Duration ~1200ms, `ease: 'outExpo'`.

  **The weapons must stay lit and unchanged on this beat.** Nothing happens to them yet; only the hands arrive.

- [ ] **Step 3:** Colour **yellow**, per the spec list — `solid(COLOR.gold, 2.6)` — multiplied per point by `tipness` through the `brightness` buffer:

```js
for (let i = 0; i < POINTS; i++) field.brightness[i] = 0.06 + tipness[i] * 0.94;
```

That 0.06 floor is deliberate: the palms are *nearly* gone but not absent, so the
hands still read as connected forms rather than as floating claws.

- [ ] **Step 4:** Verify against the reference image in the storyboard: vivid fingertips, palms swallowed by the dark, thumbs reading as separate and facing up. If a hand reads as a starburst rather than a hand, reduce `spread` on the non-thumb fingers so they sit more parallel.

- [ ] **Step 5:** Commit.

---

### Task 5: The crush, and the scatter into light

**Files:** Modify `src/scenes/refusal.js`.

The emotional peak of the section, and the one place the deck spends real
colour outside the Close.

- [ ] **Step 1:** Three stages via `createSequence`:
  1. **Close** (~420ms, `ease: 'inQuad'`) — hands morph to `buildHands({ closed: true })`, weapons compress toward their centres. Fast; a slow crush reads as a hug. Thumbs stay up and stay visible, per the storyboard's labels on both fists.
  2. **Fragment** (~180ms) — a small camera shake via `rig.shake(0.035, 380)`, and the weapon points scatter outward.
  3. **Disperse** (~1400ms, `ease: 'outExpo'`) — fragments drift outward and begin to dim.

- [ ] **Step 2:** **The scatter is denser near the crush**, which the storyboard calls out twice. Weight the scatter displacement by distance from the fist so debris piles up where the weapon broke and thins toward the edges:

```js
// Storyboard: "scatter denser" at the point of the crush.
const d = Math.hypot(x - fistX, y - fistY);
const throwOut = 0.25 + d * 0.9;      // near points barely move; far ones fly
```

- [ ] **Step 3:** The hands stay lit through the scatter — they do not fade here. They are still holding at the end of this beat, and beat 6 is what becomes of them.

- [ ] **Step 4:** `apply()` is `beat5.settle(ctx)` — hands closed, weapons gone, fragments dispersed and dimming.

- [ ] **Step 5:** Verify the scatter reads as *release* rather than as another shatter. The Effects shatter is violent and outward; this one is a thing being closed on and let go of. If they look alike, slow stage 3 and add upward bias.

- [ ] **Step 6:** Commit.

---

### Task 6: The hands become stars

**Files:** Create `src/shapes/stars.js`; modify `src/scenes/refusal.js`.

**Interfaces:** Produces `buildStars(count)` → `Float32Array(POINTS * 3)`

Decided by the storyboard, and it is close to what this plan recommended: not
one light but many. *"Change hands to stars and the dense particles will fade."*

The hands are what become the stars — the thing that did the saving becomes the
thing that endures. The weapon debris does not transform; it simply goes. That
distinction is the whole beat and it must survive implementation: **debris fades
to nothing, hands become stars.**

- [ ] **Step 1:** Create `src/shapes/stars.js`. Roughly 20 five-pointed stars, as the storyboard draws, scattered across `x ±1.45`, `y ±0.92`. Each star is a small cluster: five spokes radiating from a centre, ~90 points each, so the glyph actually reads as a star rather than a dot.

```js
const SPOKES = 5;
const OUTER = 0.075;
const INNER = 0.028;
```

- [ ] **Step 2:** Split the field by what it was. Points that belonged to a hand go to the stars; points that belonged to the weapons fade out. Carry a `wasHand` flag from beat 4 rather than recomputing it — the assignment must match or the wrong points will transform.

- [ ] **Step 3:** Debris fades via the `brightness` buffer to 0 over ~1200ms. It does not move while fading; it is already where it landed and drifting it as well reads as busy.

- [ ] **Step 4:** Colour **yellow**, the same `COLOR.gold` the hands carried — they are the same points and should not change hue as they change shape. Brightness rises as they resolve.

- [ ] **Step 5:** Stars breathe slowly out of phase. Same `sin(absolute time)` idiom as everywhere else, so `apply()` reproduces it.

- [ ] **Step 6:** Verify the stars do not read as the Q&A ember field — the nearest existing thing. Embers are loose, dim, warm-multicoloured and orbiting; these are discrete yellow glyphs, brighter, steadier, and they hold position. If they are confusable, sharpen the spokes and raise the intensity.

- [ ] **Step 7:** Commit.

---

### Task 6B: Handing off to the Close

The storyboard's last frame is *"transition to usual mask"*, with the note that
*"the transition will be like the dots reshuffling."*

This is not a beat. It is what happens when the operator clicks from the last
Refusal beat into `close-01`, and the deck already does it — `close.js` morphs
to the completed mask on entry. The only change needed is that the transition
should reshuffle rather than glide.

- [ ] **Step 1:** Call `reshuffle(field, 0.6)` at the top of `close.js`'s `complete` entry, so the star field redistributes into the mask instead of sliding into it.

- [ ] **Step 2:** Verify the handoff on the real click. The stars should scatter and re-gather as the face; if it reads as the stars *sliding*, raise the spread.

- [ ] **Step 3:** Confirm the Close still lands its own moment. `close-01` is the first time all four hues are lit at once and must stay the brightest frame in the deck — the Refusal stars are yellow only, and that separation is what protects it.

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

**Coverage.** Sentence 1 → Task 1 (this plan's suggestion, accepted on the
storyboard). Sentence 2 bars → Task 2. Sentence 3 knife and gun → Task 3.
Sentence 4 hands → Task 4. Sentence 5 crush and scatter → Task 5. Sentence 6
stars → Task 6. The storyboard's final "transition to usual mask" frame →
Task 6B. Spec list — bar count, three colours, reshuffle transition — carried
into the tasks that own them.

**Placeholder scan.** None. `buildBars`, `buildHands` and `reshuffle` are
written out; `buildKnife`, `buildStars` and the sequences are specified with
concrete dimensions, point splits, timings and easings. The shapes that carry
real risk gate their tasks on reading correctly.

**Type consistency.** `createSequence(stages)` → `{start, settle, stop}` and
`rig.shake(power, ms)` both come from the Effects plan and are used here under
exactly those names. `buildGun` is explicitly generalised in Task 3 Step 1 with
its existing call kept working, because Effects depends on it.

**Risk register.**

| Risk | Where | Mitigation |
|---|---|---|
| Hands read as starbursts, not hands | Task 4 | Reduce non-thumb `spread` so fingers sit parallel; Step 4 gates it. Note the palm cannot fail — it is never lit |
| Knife and gun read at different weights | Task 3 | Step 4 checks them side by side, not individually |
| Scatter looks like the Effects shatter | Task 5 | Step 4 contrasts them directly: violent/outward vs buoyant/upward |
| Stars steal the Close | Task 6B | Refusal is yellow only; `close-01` keeps all four hues and stays the brightest frame |
| Stars look like the Q&A embers | Task 6 | Step 6 contrasts them: discrete bright glyphs holding position vs loose dim orbits |
| Debris transforms instead of fading | Task 6 | Step 2 splits the field by `wasHand`; only hands become stars |
| Stale `ref-02` references after the re-cut | Decisions | Id retired rather than reused, so a lookup fails loudly instead of silently pointing at the wrong beat |
| Caption unreadable against the bars | Task 2 | Widen bar spacing, never special-case the caption's position |

**Open.** Only the two decisions at the top — beat ids and the single-caption
recommendation. Everything else is settled by the storyboard.

One thing worth a second look during Task 5: the storyboard draws the scattered
debris in red pen, but red is `blood`, which this plan and `CONTEXT.md` confine
to Effects. Read as annotation ink rather than an instruction, so the debris is
specified as the weapons' own white breaking up and dimming. If actual red was
meant there, say so — it is a one-line change and a deliberate second exception
to the colour rule rather than an accident.

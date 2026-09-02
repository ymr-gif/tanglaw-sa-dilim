# Script + Motion Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the official final script, then fix the real problem — the deck animates for two seconds per beat and then holds a near-frozen image for the thirty the speaker is still talking.

**Architecture:** The script is a text edit in `src/beats.js` and touches no scene code. The motion work is four independent layers added around the existing one-Points-object design: real z-depth on the cloud, a slow camera parallax, a second ambient point field behind the mask, and per-frame idle behaviour for the four scenes that currently have none.

**Tech Stack:** Vite 5, Three.js, anime.js, vanilla JS.

**Spec:** `CONTEXT.md` (canonical), `docs/superpowers/specs/2026-09-01-tanglaw-sa-dilim-design.md`

## Global Constraints

- **No festival hue before `prev-01`.** Only `prevention.js`, `refusal.js`, `close.js`, `qna.js` may write `rose`/`ember`/`gold`/`fuchsia`/`radiance`. The ambient field added in Task 5 is bound by this too.
- **Caption case is verbatim from `beats.js`.** No `text-transform` anywhere, ever.
- **Captions stay English.** Decided this round. Filipino appears in the *spoken* script only; `Tanglaw sa Dilim` and `Tanglaw` were already Filipino and stay.
- **5-word caption ceiling**, one sanctioned exception at `ref-01`.
- **Nothing is on a timer.** No beat auto-advances. New motion is ambient, never narrative.
- **`apply()` and `enter()` must reach an identical end state.** See "The one hard rule" below — it governs every motion task here.
- **`renderer.setSize(w, h)` keeps `updateStyle` true.** Passing `false` renders the deck 2x and cropped on every HiDPI device.
- Timing constants live in `theme.js`. Colours are the artwork's own.

---

## The one hard rule for every motion task

Section jumping and mis-click recovery work because `apply()` snaps to a state
identical to what `enter()` animates to. Any motion added here must therefore be
one of:

1. **A pure function of absolute time** — `sin(time * rate + phase)`. Same input,
   same output, no history. This is the preferred form and most tasks use it.
2. **Integrated but looping** — the lantern stream and ember orbits already do
   this. Legal only because the loop has no meaningful "correct" position, and
   `bakeOffsets()` folds the offset in on unmount.

What is **illegal** is motion that integrates toward a destination, because a
jump cannot reproduce where it would have got to. If a new behaviour needs that,
it belongs in `enter()` as a morph, not in the per-frame hook.

---

## File structure

| File | Change | Responsibility |
|---|---|---|
| `src/beats.js` | modify | The official script. Task 1. Nothing else in the deck changes. |
| `src/mask.js` | modify | Real z-depth on the sampled cloud. Task 2. |
| `src/main.js` | modify | Camera parallax sway; mount the ambient field. Tasks 3, 5, 7. |
| `src/theme.js` | modify | `FIT_MARGIN`, new drift + parallax constants. Tasks 4, 7. |
| `src/ambient.js` | **create** | Second point system behind the mask. Task 5. |
| `src/scenes/roots.js` | modify | Shards breathe. Task 6. |
| `src/scenes/refusal.js` | modify | The gap breathes. Task 6. |
| `src/scenes/title.js` | modify | Settling shimmer. Task 6. |
| `src/deck.js` | modify | Tell the ambient field which half of the deck it is in. Task 5. |
| `docs/RUNSHEET.md` | regenerate | `npm run runsheet`. Task 1. |

---

### Task 1: The official script

Mechanical, and it unblocks rehearsal — do it first and ship it on its own.

**Files:** Modify `src/beats.js`; regenerate `docs/RUNSHEET.md`.

**What actually changed.** The new script maps 1:1 onto the existing 22 beats.
Speaker order and all six handoffs are unchanged, every sentence lands on a beat
that already exists, and **no scene code changes**. Nine beats change text;
thirteen are untouched.

| Beat | Change |
|---|---|
| `cold-01` | → Filipino: `Takot ka ba sa dilim?` |
| `cold-02` | comma dropped: "beneath the bed or the hallway" |
| `title-01` | → Filipino: `Dahil dito, buong-puso naming inilalahad ang Tanglaw sa Dilim: Illuminating Campus Extremism and Aggression.` |
| `roots-00` | first sentence → Filipino: `Una, kailangan nating harapin ang mismong ugat ng krisis na ito.` Rest unchanged. |
| `prev-00` | → Filipino: `At panghuli, kailangan nating panindigan ang prevention—dahil mas mahalagang magligtas bago pa may mangyaring pinsala.` |
| `prev-04` | → Filipino **and the content changed**: `At higit sa lahat, palakasin ang ugnayan ng mga mag-aaral sa pamamagitan ng Child Protection Committees.` Drops "anonymous reporting channels". |
| `close-01` | → Filipino: `Hindi natin sasagutin ang hiyaw ng kabataan sa pamamagitan ng mas mataas na pader o mas madilim na silya—sasagutin natin ito sa pamamagitan ng pagdadala ng liwanag.` |
| `close-02` | `every student deserve` → `deserves` |
| all | Em-dash style in the source is `—` unspaced; the manifest uses ` — ` spaced. Keep the manifest's spacing — it is a reading aid on the printed run sheet, not on-screen copy. |

**Two errors corrected, flagged for whoever wrote it:**

1. `prev-00` reads **"pencevention"**. Corrected to "prevention". `beats.js` is
   what BR reads off the run sheet, so leaving it would put a typo in front of
   the speaker mid-sentence.
2. `close-02` reads **"every student deserve"**. Corrected to "deserves".

**Captions are NOT touched.** `prev-04` keeps `EMPOWER` even though its line is
now Filipino — decided this round.

- [ ] **Step 1:** Edit the nine `script` fields in `src/beats.js`. Change nothing else — not `id`, `scene`, `state`, `speaker`, `handoff`, `caption`, or `section`.
- [ ] **Step 2:** Regenerate the run sheet.

```bash
npm run runsheet
```

- [ ] **Step 3:** Verify the structure is genuinely untouched.

```bash
node --input-type=module -e "
import { beats } from './src/beats.js';
const h = beats.filter(b => b.handoff).map(b => b.id).join(',');
console.log('beats:', beats.length, '(expect 22)');
console.log('handoffs:', h);
console.log('expect:  thresh-01,title-01,eff-00,prev-00,ref-01,close-01');
console.log('captioned:', beats.filter(b => b.caption).length, '(expect 12)');
"
```

Expected: 22 beats, the six handoff ids in that exact order, 12 captions.

- [ ] **Step 4:** Confirm CI's run sheet guard is satisfied.

```bash
git diff --quiet -- docs/RUNSHEET.md && echo "STALE — generator did not run" || echo "regenerated, ready to commit"
```

- [ ] **Step 5:** Commit. Ship this before starting Task 2 — rehearsal can begin on it.

---

### Task 2: Give the cloud real depth

**Files:** Modify `src/mask.js`.

**Interfaces:** Produces — `mask.base` z values spanning roughly `-0.30..0.05` instead of `±0.02`.

The point cloud is flat: z is `±0.02` on an object 2.0 tall. That is 2% depth,
which is why the mask reads as a printed poster and why no camera movement can
produce parallax. The face already has a proximity term computed for the tone
falloff (`near`); reuse it so the crown sits behind the face.

- [ ] **Step 1:** In `samplePoints`, alongside the existing `near` calculation, store a per-point depth.

```js
// The crown sits BEHIND the face. Reusing the same face-proximity term that
// drives the tone falloff means depth and brightness agree with each other:
// what is nearer is also brighter, which is how a real object reads.
artDepth[n] = -CROWN_DEPTH * (1 - near) + (rand() - 0.5) * 0.05;
```

- [ ] **Step 2:** Add the constant next to `CROWN_FLOOR`.

```js
/** How far behind the face the headpiece sits, in world units. */
const CROWN_DEPTH = 0.30;
```

- [ ] **Step 3:** In `normalize`, use it instead of the flat jitter.

```js
const z = depth[i];   // was: (rand() * 2 - 1) * 0.02
```

- [ ] **Step 4:** Verify the depth landed and the framing did not move.

```bash
npm run dev
```

In the console: the mask should look identical head-on. Depth is invisible until Task 3 moves the camera — that is expected, and is why these are separate tasks.

- [ ] **Step 5:** Commit.

---

### Task 3: Camera parallax — the single biggest win

**Files:** Modify `src/main.js`, `src/theme.js`.

**Interfaces:** Consumes — Task 2's depth. Produces — nothing; self-contained in the render loop.

A very slow camera sway turns Task 2's depth into visible parallax on **every
beat including the held ones**, at zero narrative cost. This is a pure function
of absolute time, so it is `apply()`-safe by construction.

- [ ] **Step 1:** Add the constants to `theme.js`.

```js
/**
 * Camera sway. The deck holds each beat for as long as the speaker talks —
 * ten to forty seconds — and idle drift alone is under half a percent of the
 * mask's height. Parallax is what keeps a held beat alive.
 *
 * The two rates are deliberately not multiples of each other, so the path
 * never visibly repeats within a presentation.
 */
export const SWAY = { amount: 0.055, rateX: 0.087, rateY: 0.061 };
```

- [ ] **Step 2:** In the render loop in `main.js`, after `field.update(...)`:

```js
// Parallax. Note this moves the camera but never its distance — `resize()`
// owns position.z and the fit math, and this must not fight it.
camera.position.x = Math.sin(time * SWAY.rateX) * SWAY.amount;
camera.position.y = Math.sin(time * SWAY.rateY + 1.3) * SWAY.amount * 0.6;
camera.lookAt(0, 0, 0);
```

- [ ] **Step 3:** In `resize()`, set only z so the sway is not stamped over each resize.

```js
camera.position.z = fitDistance(mask.halfW, mask.halfH, FOV, camera.aspect);
```

- [ ] **Step 4:** Verify. Load the deck and sit on `title-01` without touching anything for 30 seconds. The mask should breathe with visible depth — crown and face separating and closing — and never appear to stop.

- [ ] **Step 5:** Re-run the sizing matrix, because the camera changed.

```bash
node /tmp/.../devices.mjs      # the seven-profile script from the DPR fix
```

Expected: canvas CSS size equals its container on all seven profiles, no overflow, caption inside the safe area.

- [ ] **Step 6:** Commit.

---

### Task 4: Raise idle drift to something visible

**Files:** Modify `src/scenes/title.js`, `roots.js`, `refusal.js`, `prevention.js`.

Idle drift on the longest-held beats is `0.007`–`0.009` — 0.35–0.45% of the
mask's height, about 2–3 px at 1080p. It satisfies the letter of §7 ("never
perfectly still") and none of its intent.

- [ ] **Step 1:** Raise the four holding scenes. These are the beats the audience stares at longest.

```
title.js       0.008  ->  0.020
roots.js       0.009  ->  0.024
refusal.js     0.007  ->  0.018
prevention.js  0.009  ->  0.022
```

- [ ] **Step 2:** Leave `effects.js` alone. `seat` at `0.004` is the quietest beat in the deck **on purpose** — CONTEXT.md §6 calls for least motion there, and raising it would flatten the one moment built on stillness.

- [ ] **Step 3:** Verify by holding `roots-02` for 20 seconds. The field should feel alive without any point travelling far enough to blur the mask.

- [ ] **Step 4:** Commit.

---

### Task 5: Ambient field — fill the empty frame

**Files:** Create `src/ambient.js`; modify `src/main.js`, `src/deck.js`.

**Interfaces:**
- Produces: `createAmbient()` → `{ points, update(dt, time), setTone(hex, intensity, ms) }`
- Consumed by: `main.js` (mount + per-frame), `deck.js` (`setTone` on section change)

Roughly 70% of a 16:9 frame is empty indigo. A sparse, very dim field of motes
behind the mask gives the frame body and depth without competing — it must stay
subordinate, which is what the low intensity and large scale enforce.

**Colour rule applies.** The ambient field is ash for Cold open → Effects and may
only warm from `prev-01` onward. `deck.js` owns that switch; `ambient.js` has no
opinion about narrative.

- [ ] **Step 1:** Create `src/ambient.js`.

```js
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Points, PointsMaterial } from 'three';
import { seededRandom } from './noise.js';

const COUNT = 3500;
const SPAN = { x: 2.9, y: 1.9, z: 1.4 };

export function createAmbient() {
  const rand = seededRandom(0x5eed11);
  const pos = new Float32Array(COUNT * 3);
  const col = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    pos[i3] = (rand() * 2 - 1) * SPAN.x;
    pos[i3 + 1] = (rand() * 2 - 1) * SPAN.y;
    // Always behind the mask, which occupies roughly -0.30..0.05.
    pos[i3 + 2] = -0.6 - rand() * SPAN.z;
    seed[i] = rand();
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(pos, 3));
  geometry.setAttribute('color', new BufferAttribute(col, 3));

  const points = new Points(geometry, new PointsMaterial({
    size: 0.014, vertexColors: true, transparent: true,
    depthWrite: false, blending: AdditiveBlending, sizeAttenuation: true,
  }));
  points.frustumCulled = false;
  points.renderOrder = -1;

  const base = new Color();
  let target = new Color(0x2a2d3d);
  let intensity = 0.5;

  return {
    points,
    setTone(hex, level) { target = new Color(hex); intensity = level; },
    update(dt, time) {
      for (let i = 0; i < COUNT; i++) {
        const i3 = i * 3;
        const s = seed[i];
        // Absolute time only — no integration, so this is apply()-safe.
        pos[i3] += Math.sin(time * (0.02 + s * 0.03) + s * 6.28) * 0.00018;
        pos[i3 + 1] += 0.00022 + s * 0.00016;
        if (pos[i3 + 1] > SPAN.y) pos[i3 + 1] = -SPAN.y;

        const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * (0.25 + s * 0.5) + s * 12.9));
        base.copy(target).multiplyScalar(intensity * twinkle);
        col[i3] = base.r; col[i3 + 1] = base.g; col[i3 + 2] = base.b;
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
    },
  };
}
```

- [ ] **Step 2:** Mount it in `main.js`, before the mask so it renders behind.

```js
const ambient = createAmbient();
scene.add(ambient.points);
```

and in the render loop, before `field.update`:

```js
ambient.update(dt, time);
```

- [ ] **Step 3:** Put it in `ctx` so `deck.js` can reach it: add `ambient` to the `ctx` object literal.

- [ ] **Step 4:** In `deck.js`, switch its tone when the section crosses into the light. Add to `goTo` and `applyThrough`, after `overlay.tracker.update(...)`:

```js
// The colour rule reaches the background too: ash until Prevention earns light.
const LIGHT = new Set(['prevention', 'refusal', 'close']);
ctx.ambient.setTone(LIGHT.has(beat.section) ? 0xff7a3d : 0x2a2d3d,
                    LIGHT.has(beat.section) ? 0.42 : 0.5);
```

- [ ] **Step 5:** Verify the field is subordinate. Load `title-01`: the frame should have depth and texture, and if the motes read as a second subject rather than atmosphere, drop `intensity` — not `COUNT`.

- [ ] **Step 6:** Re-measure frame cost; this adds 3,500 points to the 17,000.

```bash
node /tmp/.../perf2.mjs
```

Expected: the small-viewport median stays at the ~16.7 ms vsync cap. If it rises above 16.7, the deck has become CPU-bound and `COUNT` must come down.

- [ ] **Step 7:** Commit.

---

### Task 6: Idle motion for the four dead scenes

**Files:** Modify `src/scenes/roots.js`, `refusal.js`, `title.js`.

`coldopen`, `title`, `roots` and `refusal` have no per-frame hook at all — nine
of twenty-two beats, including the five-beat Roots section that is the longest
stretch of the speech. All motion below is `sin(absolute time)`, so `apply()`
reproduces it exactly.

- [ ] **Step 1:** `roots.js` — the broken shards breathe. Each drifts along its own break direction, out of phase with the others, so the mask looks unstable rather than parked.

```js
const BREATHE = 0.020;
const RATE = [0.21, 0.17, 0.25, 0.13];   // no two in phase

function breathe(field, mask, time) {
  const { sceneOffset } = field;
  for (let i = 0; i < POINTS; i++) {
    const i3 = i * 3;
    const s = mask.shardOf[i];
    const k = Math.sin(time * RATE[s] + s * 1.7) * BREATHE;
    sceneOffset[i3] = SHARD_DIR[s][0] * k;
    sceneOffset[i3 + 1] = SHARD_DIR[s][1] * k;
  }
}
```

Export `SHARD_DIR` from `mask.js` for this. Call `breathe` from `setUpdate` in
both `enter()` and `apply()`.

- [ ] **Step 2:** `refusal.js` — only the gap moves. Shard 3 sways; everything seated holds. The one thing still wrong should be the one thing still moving.

```js
function gapSway(field, mask, time) {
  const k = Math.sin(time * 0.19) * 0.016;
  for (let i = 0; i < POINTS; i++) {
    if (mask.shardOf[i] !== 3) continue;
    field.sceneOffset[i * 3 + 1] = k;
  }
}
```

- [ ] **Step 3:** `title.js` — a settling shimmer. The mask has just assembled; let it look newly arrived rather than printed.

```js
function shimmer(field, time) {
  for (let i = 0; i < POINTS; i++) {
    const s = field.noise.roll(i);
    field.brightness[i] = 0.82 + 0.18 * Math.sin(time * (0.4 + s * 0.7) + s * 12.9);
  }
}
```

- [ ] **Step 4:** Leave `coldopen.js` alone. At drift `0.022`–`0.05` it is already the liveliest scene in the deck, and the cold open's emptiness is the point — the silence after "Takot ka ba sa dilim?" is the first thing the room notices.

- [ ] **Step 5:** Verify `apply()` still matches `enter()`. This is the regression these tasks most risk.

```bash
# Arrive at roots-02 by clicking; note the frame. Then press 1, then 4, then
# click to roots-02 again. The two must be indistinguishable.
```

- [ ] **Step 6:** Commit.

---

### Task 7: Fill more of the frame

**Files:** Modify `src/theme.js`.

- [ ] **Step 1:** `FIT_MARGIN` `1.35` → `1.15`. The mask grows about 17% and the dead margin shrinks. Do this *after* Task 5, so the ambient field is already carrying the outer frame and the mask is not merely bigger in a void.

- [ ] **Step 2:** Re-run the sizing matrix. A tighter margin is exactly where cropping appears first, especially on the 5:4 projector and portrait profiles.

Expected: no overflow, nothing cropped, on all seven device profiles.

- [ ] **Step 3:** Check `close-02` specifically. The lantern's `FADE_TOP` is tuned against the frame's world extent, which this changes; if points reach the top edge still lit, lower `FADE_TOP` in `close.js`.

- [ ] **Step 4:** Commit.

---

### Task 8: Full verification pass

- [ ] **Step 1:** All 22 beats forward, then `←` back to 0, then every number key from several starting points, then `Q` in and out. Zero console errors.
- [ ] **Step 2:** Seven-profile device matrix — phone DPR 3, tablet DPR 2, retina DPR 2, laptop, 4:3 projector, 4K. Canvas CSS size must equal its container on every one.
- [ ] **Step 3:** Colour audit — no festival hue in `coldopen`/`threshold`/`title`/`roots`/`effects`, **including the ambient field's tone**.
- [ ] **Step 4:** Caption audit against `beats.js`: Roots and Effects lowercase, Prevention and Close uppercase, 5-word ceiling with the one exception at `ref-01`.
- [ ] **Step 5:** Frame cost at 1920x1080 and 320x180. The small-viewport median must still sit at the vsync cap.
- [ ] **Step 6:** Hold `close-02` for a full minute. It must never visibly loop.

---

## Self-Review

**Spec coverage.** Script → Task 1. Empty frame → Tasks 5, 7. Static beats →
Tasks 2, 3, 4, 6. The colour rule is carried into the new ambient layer
(Task 5 Step 4) rather than being left to chance. §6's "least motion" for the
seat beat is explicitly protected (Task 4 Step 2), as is the cold open's
emptiness (Task 6 Step 4).

**Placeholder scan.** None — every step names concrete values, and the code for
the new module and the three idle behaviours is written out.

**Type consistency.** `createAmbient()` returns `{points, update(dt,time),
setTone(hex, level)}` and is called under exactly those names in Tasks 5.2–5.4.
`SHARD_DIR` is exported from `mask.js` in Task 6.1 and used there only.
`SWAY` is defined in `theme.js` (Task 3.1) and read in `main.js` (Task 3.2).

**Risk register.**

| Risk | Where | Mitigation |
|---|---|---|
| New motion breaks `apply()` idempotence | Tasks 3, 6 | Everything is `sin(absolute time)`; Task 6 Step 5 tests it directly |
| Ambient field competes with the mask | Task 5 | Lower `intensity`, never `COUNT` — density is what makes it read as atmosphere |
| Parallax fights the fit math | Task 3 | `resize()` owns `position.z` alone; sway writes x/y only |
| Tighter framing crops on some device | Task 7 | Sizing matrix re-run immediately after, before commit |
| Added points push past frame budget | Task 5 | Step 6 measures; the vsync cap is the pass/fail line |

**Deliberately not in this plan.** Bilingual captions (decided against this
round), any change to the beat structure (the script maps 1:1 onto it), and the
`close-02` caption case discrepancy already parked as minor.

# Effects Sequence (beats 10–13) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Effects section as a literal, cinematic sequence — the broken mask converges into a gun, it fires, the camera tracks the bullet in flight, then pushes forward through empty air into a blood splat, and the classroom goes dark.

**Architecture:** The deck's one-Points-object design is unchanged: three new shapes (gun, wind-field, splat) are just more POINTS-long buffers. What is genuinely new is a **camera rig** — until now no scene has ever moved the camera, and this sequence needs shake, tracking, recoil and a forward dolly. The rig is added once, owned by `main.js`, and driven by scenes through `ctx`.

**Tech Stack:** Vite 5, Three.js, anime.js, vanilla JS.

**Spec:** `CONTEXT.md` (canonical — **amended by Task 0 of this plan**), `docs/superpowers/specs/2026-09-01-tanglaw-sa-dilim-design.md`

**Storyboard:** [`docs/assets/effects-storyboard.png`](../../assets/effects-storyboard.png) — the author's rough draft. It is the authority on staging; where this document and the storyboard disagree, the storyboard wins.

---

## Storyboard → beats

The storyboard has six frames across four beats. This is the mapping, following
the drawing's own row grouping (the top row is bracketed as slide 10):

| Frame | Beat | Line spoken | Staging |
|---|---|---|---|
| 1 mask | **10** `eff-00` | "Second, we must face the Effects." | starts on the fractured mask |
| 2 gun | **10** | | shards converge into the handgun |
| 3 shoot | **10** | | muzzle flash, **recoil tilt up**, screen shake |
| 4 bullet + wind | **11** `eff-01` | "families lose their loved ones… news that their life was cut short" | tracking shot, **loops** |
| 5 camera advances | **12** `eff-02` | "mass casualty risks… a single weapon turns a quiet morning into tragedy" | camera pushes forward through an empty frame. **It stays empty.** |
| 6 blood splatter | **12** | | the bullet bursts into the stain. **sudden, dramatic, sweeps left→right** |
| — | **13** `eff-03` | "contagion of hopelessness… learning stops" | splat disperses into the dark classroom grid |

Beat 11 carries the loop because it is the longest line in the section and the
one held longest — a looping shot is the only thing safe to sit on for that
long.

**Frame 5 is a gift, not a gap.** An empty frame with the camera pushing forward
is the one moment of quiet left in a section that is now the loudest in the
deck. Do not fill it. It is what makes frame 6 land.

---

## Decision record — read this first

This plan **deliberately overrides** a rule in `CONTEXT.md` §6 that read:

> "Mass casualty is abstract only — a grid of desk-points where one extinguishes
> and the failure propagates. Never depict the act."

The concern was raised and the author reaffirmed the literal treatment. Recorded
here so nobody later "fixes" this back by accident, and so the reasoning is
visible to whoever picks the work up.

**Two things were flagged and remain true.** Whoever implements this should know
them, because they shape the tuning:

1. §1's thesis is *"when a child turns to violence, society failed them long
   before they picked up a weapon… every design decision downstream has to
   support that, not undercut it."* A weapon rendered with loving detail puts
   the act at the centre of the section. **The mitigation is Task 2's staging:**
   the gun is assembled out of the four broken shards of the child's mask, so
   the image reads as *this is what the shattered child became*, not as a
   weapon appearing from nowhere. This is the single most important creative
   instruction in this document.
2. §6 also specifies Effects as "least motion, least color, most silence." That
   is now inverted by design. The section becomes the loudest in the deck. The
   contrast that used to live *inside* Effects now has to be carried by the
   `B`-key black hold after `eff-03` — see Task 7.

**No figure is shown.** A silhouette was considered and dropped by the author.
The frame the camera advances through stays empty, and the blood alone carries
the beat. This is the storyboard's own frame 5, and it is the stronger choice:
what an audience imagines is worse than what can be drawn at this point density,
and a figure that read as a chess piece would deflate the sequence.

*If that is ever revisited,* the version discussed was deliberately unspecific —
the grey generic person glyph, head circle plus shoulder arc, nothing more. That
is a fifteen-line shape in the manner of `seat()`; it is not the detailed
student figure that an earlier draft of this plan specified, which is gone and
should stay gone.

**A content warning was declined.** Raised once, answered "no content warning"
on the storyboard. Recorded, not re-litigated.

**Two beats are being retired:** the empty seat (`eff-01`) and the propagating
desk-grid failure (`eff-02`). The empty seat was the quietest and arguably
strongest image in the deck. Their code is preserved in git history and the
shape generators are left in `mask.js` (`seat()`, `grid()`), so restoring either
is a one-line change to the beat's `state`.

---

## Global Constraints

- **`apply()` and `enter()` must reach an identical end state.** Camera shake, muzzle flash and bullet flight all violate this if written carelessly. Every one of them is specified below as either time-derived or explicitly settled by `apply()`.
- **The camera's `position.z` belongs to `resize()`.** No scene may write it directly; scenes offset through the rig.
- **Nothing is on a timer.** Within-beat sequencing (form → fire) is allowed and already has precedent in `grid-fail`'s `onComplete` chain. Beat *advancement* is never automatic.
- **Caption case is verbatim from `beats.js`.** `eff-03` keeps `learning stops`, lowercase.
- **Colour:** Effects is near-monochrome. This plan adds exactly one non-ash colour — `blood` — as a documented exception. **No festival hue (`rose`/`ember`/`gold`/`fuchsia`) may appear anywhere in Effects.** That rule is not being relaxed.
- **`renderer.setSize(w, h)` keeps `updateStyle` true.** Never pass `false`.
- Point budget stays at `POINTS = 17000`. The wind streaks reuse existing points; they do not add any.

---

## The sequence

| Beat | Line spoken | What happens |
|---|---|---|
| 10 `eff-00` | "Second, we must face the Effects." | The four mask shards converge into a dense gun. On the click, it fires: muzzle flash, screen shake, shockwave. |
| 11 `eff-01` | "families lose their loved ones… news that their life was cut short" | Camera locked to the bullet. Wind streaks tear past. **Loops indefinitely** — safe to hold for as long as CH talks. |
| 12 `eff-02` | "mass casualty risks… a single weapon turns a quiet morning into tragedy" | Camera pushes **forward** through an empty frame. Nothing is there. Then the bullet bursts into blood — sudden, sweeping left→right. |
| 13 `eff-03` | "contagion of hopelessness… learning stops" | The splat disperses into the darkened classroom grid. Unchanged in meaning. |

---

## File structure

| File | Change | Responsibility |
|---|---|---|
| `CONTEXT.md` | modify | Record the amended §6. Task 0. |
| `src/camera-rig.js` | **create** | Composes fit distance + parallax + scene offset + shake into one camera. Task 1. |
| `src/shapes/gun.js` | **create** | The gun silhouette buffer. Task 2. |
| `src/shapes/wind.js` | **create** | Bullet cluster + streaking wind field. Task 4. |
| `src/shapes/splat.js` | **create** | Blood splat buffer. The bullet becomes it. Task 5B. |
| `src/sequence.js` | **create** | Explicit stage runner so multi-stage beats stay `apply()`-safe. Task 5A. |
| `src/scenes/effects.js` | rewrite | Dispatcher for the four new states. Tasks 2–6. |
| `docs/assets/effects-storyboard.png` | added | The author's rough draft. Staging authority. |
| `src/theme.js` | modify | `blood` colour, sequence timings. Task 0. |
| `src/beats.js` | modify | Four `state` values and four `cue` fields. Task 6. |
| `src/main.js` | modify | Mount the rig; add `#flash` handling. Tasks 1, 3. |
| `index.html`, `src/style.css` | modify | `#flash` element for the muzzle flash. Task 3. |
| `docs/RUNSHEET.md` | regenerate | `npm run runsheet`. Task 6. |

Shapes live in a new `src/shapes/` directory rather than growing `mask.js`,
which is already the largest file in the project. `mask.js` keeps the mask;
these are not the mask.

---

### Task 0: Record the decision and add the palette entry

- [ ] **Step 1:** Amend `CONTEXT.md` §6. Replace the "Mass casualty is abstract only… Never depict the act." sentences with:

```markdown
**Effects.** From 2026-09-02 this section is a literal sequence: the broken
mask converges into a gun, fires, the camera tracks the bullet, and pulls back
to a blood splat before the classroom goes dark. This replaces the earlier rule
("mass casualty is abstract only — never depict the act") by an explicit
decision of the author, recorded in
`docs/superpowers/plans/2026-09-02-effects-sequence.md`.

The constraint that survives: the gun is assembled from the four shards of the
child's mask. It is what the shattered child became. A weapon that arrives from
outside the piece would contradict §1's thesis; a weapon made of the child does
not. After `eff-03`, hold black two full seconds before Prevention — the
section is now the loudest in the deck and that silence is the only contrast
left.
```

- [ ] **Step 2:** Add the colour to `src/theme.js`, inside `COLOR`:

```js
  /**
   * The one non-ash colour permitted in Effects, and the only exception to the
   * near-monochrome rule outside Prevention onward.
   *
   * The storyboard specifies "vibrant red", which overrides an earlier
   * recommendation for a dark desaturated stain. Vibrant it is. Note for
   * tuning: this is emissive against near-black under additive blending, so it
   * will read brighter on screen than the hex suggests, and brighter again on a
   * projector that is crushing its blacks.
   */
  blood: 0xe8142a,
```

- [ ] **Step 3:** Add the timings to `TIME` in `theme.js`:

```js
  gunForm: 1800,   // shards converge into the weapon
  fire: 140,       // muzzle flash duration
  recoil: 200,     // muzzle kicks up after the shot
  splatForm: 450,  // "dramatic, sudden" — this is deliberately fast
  advance: 1700,   // camera pushes FORWARD through frame 5
```

- [ ] **Step 4:** Commit. This task is documentation and constants only — no behaviour changes yet.

---

### Task 1: Camera rig

**Files:** Create `src/camera-rig.js`; modify `src/main.js`.

**Interfaces:**
- Produces: `createCameraRig(camera)` → `{ setFit(z), setOffset(x, y, z), shake(power, ms), clearScene(), update(dt, time) }`
- Consumed by: `main.js` (owns it, calls `update` each frame), `effects.js` (calls `setOffset` / `shake`)

No scene has ever moved the camera. Three things now want to at once — the
parallax sway, this sequence's tracking and dolly, and the shake — so they need
one place to compose rather than three writers fighting over `camera.position`.

- [ ] **Step 1:** Create `src/camera-rig.js`.

```js
import { SWAY } from './theme.js';

/**
 * One owner for the camera.
 *
 * `fit` comes from resize() and is the only thing that sets viewing distance.
 * `offset` is scene-driven and absolute — a scene sets where it wants to be,
 * never nudges. `shake` is a decaying impulse.
 *
 * Offsets are absolute rather than incremental on purpose: apply() must be able
 * to reproduce a scene's camera exactly, and it cannot do that against a value
 * that was accumulated over frames it never ran.
 */
export function createCameraRig(camera) {
  let fitZ = 3;
  const offset = { x: 0, y: 0, z: 0 };
  let shakePower = 0;
  let shakeMs = 1;
  let shakeT = 0;

  return {
    setFit(z) { fitZ = z; },
    setOffset(x, y, z) { offset.x = x; offset.y = y; offset.z = z; },
    shake(power, ms) { shakePower = power; shakeMs = ms; shakeT = 1; },

    /** Called on unmount. A scene must never leak its camera into the next. */
    clearScene() {
      offset.x = offset.y = offset.z = 0;
      shakeT = 0;
    },

    update(dt, time) {
      // Parallax: pure function of absolute time, so it is apply()-safe.
      let x = Math.sin(time * SWAY.rateX) * SWAY.amount;
      let y = Math.sin(time * SWAY.rateY + 1.3) * SWAY.amount * 0.6;

      if (shakeT > 0) {
        shakeT = Math.max(0, shakeT - (dt * 1000) / shakeMs);
        // Squared decay: a real impact is violent then gone, not a fade.
        const k = shakePower * shakeT * shakeT;
        x += (Math.random() * 2 - 1) * k;
        y += (Math.random() * 2 - 1) * k;
      }

      camera.position.set(offset.x + x, offset.y + y, fitZ + offset.z);
      camera.lookAt(offset.x, offset.y, 0);
    },
  };
}
```

- [ ] **Step 2:** In `main.js`, create the rig after the camera, put it in `ctx` as `rig`, have `resize()` call `rig.setFit(fitDistance(...))` instead of setting `camera.position.z`, and call `rig.update(dt, time)` in the render loop before `renderer.render`.

- [ ] **Step 3:** In `deck.js`'s `mountScene`, call `ctx.rig.clearScene()` immediately after `SCENES[mounted].unmount(ctx)`, so a scene's camera can never survive into the next scene.

- [ ] **Step 4:** Verify nothing regressed. Click all 22 beats. The deck should look exactly as before plus the parallax sway. Then run the seven-profile device matrix — the rig now owns framing, so a mistake here breaks every screen.

- [ ] **Step 5:** Commit.

---

### Task 2: The gun, assembled from the mask's shards

**Files:** Create `src/shapes/gun.js`; modify `src/scenes/effects.js`.

**Interfaces:**
- Produces: `buildGun(shardOf, { tilt = 0 } = {})` → `Float32Array(POINTS * 3)`. `tilt` is radians about the grip pivot; Task 3's recoil calls it with `0.24`.

Built from rectangles and an arc, the same technique as the existing chair
silhouette in `mask.js`'s `seat()` — proven to read clearly at this point
density, needs no asset, and stays tunable by numbers rather than by redrawing.

**The staging instruction that matters:** points keep their shard identity.
Shard 0 becomes the grip, shard 1 the slide, shard 2 the barrel, shard 3 — the
intruder, the piece that never belonged to the face — becomes the trigger and
the muzzle. The child's four wounds become the weapon's four parts. Nothing in
the deck says this out loud; the geometry says it.

- [ ] **Step 1:** Create `src/shapes/gun.js`.

```js
import { POINTS } from '../theme.js';
import { seededRandom } from '../noise.js';

/**
 * Side profile, muzzle pointing right, in the same normalised space the mask
 * uses (roughly -1..1). Rectangles are [x0, x1, y0, y1].
 *
 * Which shard becomes which part is load-bearing, not arbitrary — see the plan.
 */
const PARTS = {
  0: [[-0.62, -0.30, -0.62, 0.02]],                 // grip
  1: [[-0.66, 0.16, 0.04, 0.30]],                   // slide
  2: [[0.16, 0.86, 0.10, 0.26]],                    // barrel
  3: [[-0.34, -0.20, -0.20, 0.02],                  // trigger
      [0.80, 0.90, 0.08, 0.28]],                    // muzzle
};

/** Recoil pivots here — the web of the grip, not the centre of the shape. */
const PIVOT = [-0.46, -0.30];

export function buildGun(shardOf, { tilt = 0 } = {}) {
  // Same seed every call, so the recoiled gun is the SAME gun rotated rather
  // than a fresh scatter. Reseeding here would make the points jump.
  const rand = seededRandom(0x9d17);
  const out = new Float32Array(POINTS * 3);

  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);

  for (let i = 0; i < POINTS; i++) {
    const i3 = i * 3;
    const rects = PARTS[shardOf[i]];
    const r = rects[(rand() * rects.length) | 0];

    const x = r[0] + rand() * (r[1] - r[0]);
    const y = r[2] + rand() * (r[3] - r[2]);

    const px = x - PIVOT[0];
    const py = y - PIVOT[1];

    out[i3] = PIVOT[0] + px * cos - py * sin;
    out[i3 + 1] = PIVOT[1] + px * sin + py * cos;
    out[i3 + 2] = (rand() - 0.5) * 0.05;
  }
  return out;
}
```

- [ ] **Step 2:** Wire `case 'gun'` in `effects.js` — morph from the fractured mask over `TIME.gunForm` with `ease: 'inOutQuad'`, colour `solid(COLOR.ash, 8.0)`, `setDrift(0.006)`.

- [ ] **Step 3:** **Verify it reads as a gun.** Screenshot `eff-00` and look at it. This shape will need iterating — every silhouette in this project did. If it does not read at a glance on the first attempt, adjust the rectangles; do not proceed to Task 3 until it reads.

- [ ] **Step 4:** Verify the shard mapping is intact — the grip should be the same colour family the left-cheek shard carried in Roots.

- [ ] **Step 5:** Commit.

---

### Task 3: The shot — flash, shake, shockwave

**Files:** Modify `index.html`, `src/style.css`, `src/scenes/effects.js`.

- [ ] **Step 1:** Add a flash element to `index.html`, immediately after `#veil`:

```html
<!-- Muzzle flash. A DOM element rather than a scene light: it must cover the
     whole frame for a handful of frames, and the renderer has no cheap way to
     do that. -->
<div id="flash" hidden></div>
```

- [ ] **Step 2:** Style it in `style.css`:

```css
#flash {
  position: fixed;
  inset: 0;
  z-index: 4;
  background: #fff6e2;
  opacity: 0;
  pointer-events: none;
  transition: opacity 90ms ease-out;
}
#flash[hidden] { display: none; }
#flash.is-lit { opacity: 0.82; }
```

- [ ] **Step 3:** Fire on the click into `eff-00` — the gun is already formed, so this is the entry animation of the *fire* state, chained off the form the way `grid-fail` chains its spread.

```js
function fire(ctx) {
  const { field, rig, flash } = ctx;

  flash.hidden = false;
  requestAnimationFrame(() => flash.classList.add('is-lit'));
  setTimeout(() => {
    flash.classList.remove('is-lit');
    setTimeout(() => { flash.hidden = true; }, 120);
  }, TIME.fire);

  rig.shake(0.06, 520);

  // Recoil: the muzzle kicks UP and stays up. Storyboard frame 3.
  // `buildGun` is reused with a pivot rotation rather than a second hand-authored
  // shape, so the recoiled gun can never drift out of agreement with the gun.
  field.morph(buildGun(shardOf, { tilt: 0.24 }), {
    duration: TIME.recoil,
    ease: 'outExpo',
  });
}
```

**Recoil rotates about the grip, not the centre.** A gun pivoting around its
middle reads as a spinning object; one pivoting around the hand reads as recoil.
Pivot at roughly `(-0.46, -0.30)` — the web of the grip.

- [ ] **Step 4:** `apply()` for this state must land **after** the shot: no flash, no shake, gun still present, shockwave settled. A jump into `eff-00` must never fire the gun — the operator would be jumping back to recover from a mistake, and re-firing would be worse than the mistake.

- [ ] **Step 5:** Verify: click into `eff-00`, confirm one flash and one shake. Then press `5` to jump into the section and confirm **no** flash and **no** shake.

- [ ] **Step 6:** Commit.

---

### Task 4: Bullet tracking shot (looping)

**Files:** Create `src/shapes/wind.js`; modify `src/scenes/effects.js`.

**Interfaces:**
- Produces: `buildWind()` → `{ positions: Float32Array, streakOf: Uint16Array, speed: Float32Array }`, and `stepWind(field, wind, dt, time)`

The camera is locked to the bullet, so the bullet sits near centre-frame and the
*world* streaks past. About 1,500 points form the bullet; the remaining ~15,500
form roughly 2,000 wind streaks.

**Streaks from points:** `PointsMaterial` cannot stretch a point into a line, so
each streak is a short chain of 6–8 points spaced along x that travel together.
At speed the chain reads as one streak. This is why the wind reuses the existing
budget instead of adding a second object.

**Depth parallax is what sells speed:** streaks nearer the camera must move
several times faster than distant ones. Uniform speed reads as a texture
scrolling; varied speed reads as flight.

- [ ] **Step 1:** Create `src/shapes/wind.js` with `buildWind()` seeding streak chains across `x ∈ [-2.4, 2.4]`, `y ∈ [-1.3, 1.3]`, `z ∈ [-1.6, 0.5]`, and per-streak speed scaled by depth: `speed = 1.4 + (0.5 - z) * 1.9`.

- [ ] **Step 2:** `stepWind` moves every streak point along `-x` by `speed * dt`, and re-seeds a streak at the right edge with a fresh y/z when its head passes `x < -2.6`. Integrated-but-looping, which is legal — the same licence the lantern and ember fields already run under.

- [ ] **Step 3:** Bullet cluster: a dense ogive of ~1,500 points held at roughly `(-0.15, 0, 0)`, with a slow spin on its long axis and a small wobble. Colour `solid(COLOR.ash, 9.0)` — the bullet is the brightest thing in frame.

- [ ] **Step 4:** Add a vapour cone: ~600 points trailing the bullet in a widening cone, brightness falling off with distance behind it.

- [ ] **Step 5:** `unmount` must call `field.bakeOffsets()` before `resetSceneMods()`, exactly as `close.js` and `qna.js` do, or the next beat snaps back to wherever the morph left the points rather than where they visibly are.

- [ ] **Step 6:** Verify by holding `eff-01` for a full 90 seconds. It must never visibly loop, never speed up, and never drift off-centre.

- [ ] **Step 7:** Re-measure frame cost — this is the heaviest per-frame scene in the deck.

```bash
node /tmp/.../perf2.mjs
```

Expected: small-viewport median still at the ~16.7 ms vsync cap. If it rises, cut streak count before cutting anything else.

- [ ] **Step 8:** Commit.

---

### Task 5A: A sequencer, so multi-stage beats stay jump-safe

**Files:** Create `src/sequence.js`; modify `src/scenes/effects.js`.

**Interfaces:**
- Produces: `createSequence(stages)` → `{ start(ctx), settle(ctx), stop() }`

Two beats now have more than one stage: beat 10 (gun forms → fires) and beat 12
(camera advances → splat). The deck's existing idiom for this is a nested
`onComplete`, which `grid-fail` uses today and which works for two stages — but
`field.finish()` runs pending completions, so an operator clicking mid-chain
kicks off the next stage exactly as the next beat is entering, and `apply()` has
to replicate a cascade it never ran.

An explicit stage list with a `settle()` that plays nothing makes `apply()` one
line and removes the class of bug entirely. It is about twenty-five lines.

- [ ] **Step 1:** Create `src/sequence.js`.

```js
/**
 * A short, explicit list of stages for a beat that has more than one.
 *
 * `start` plays them in order. `settle` skips to the finished state without
 * playing anything — which is exactly what apply() needs, and what a jump into
 * the middle of the section needs.
 *
 * Stages are {ms, play(ctx), done(ctx)}: `play` animates, `done` states the end
 * result. `settle` calls every stage's `done` in order and no `play` at all, so
 * the end state is defined once and cannot drift from what the animation
 * actually produces.
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
    start(ctx) { index = 0; clearTimeout(timer); step(ctx); },
    settle(ctx) {
      clearTimeout(timer);
      index = stages.length;
      for (const stage of stages) stage.done(ctx);
    },
    stop() { clearTimeout(timer); },
  };
}
```

**This is the one place the deck uses `setTimeout`,** and it is worth being
explicit about why that does not break "nothing is on a timer": the timer
sequences *within* a beat the operator has already triggered. It never advances
the beat index. `unmount` must call `stop()`.

- [ ] **Step 2:** Wire beat 12 as two stages. The frame is empty for the whole first stage and that is the entire point — see the storyboard note above. Do not put anything in it.

```js
const beat12 = createSequence([
  {
    ms: TIME.advance,
    play: (ctx) => advanceCamera(ctx),        // empty frame, camera pushes in
    done: (ctx) => ctx.rig.setOffset(0, 0, -1.6),
  },
  {
    ms: TIME.splatForm,
    play: (ctx) => burst(ctx),                // bullet -> blood, sweeping L->R
    done: (ctx) => snapSplat(ctx),
  },
]);
```

- [ ] **Step 3:** Wire beat 10's form → fire the same way, so both multi-stage beats settle through one mechanism.

- [ ] **Step 4:** `apply()` for both beats becomes one line: `beatN.settle(ctx)`.

- [ ] **Step 5:** Verify: press `5`, then walk forward. Every state reached must be identical to clicking through. Then click into `eff-02` and click again one second in, mid-advance — the deck must land cleanly on `eff-03` with no half-run stage and no stuck camera offset.

- [ ] **Step 6:** Commit.

---

### Task 5B: The splat — the bullet becomes the blood

**Files:** Create `src/shapes/splat.js`; modify `src/scenes/effects.js`.

**Interfaces:**
- Produces: `buildSplat()` → `Float32Array(POINTS * 3)`

**The bullet becomes the blood.** There is no figure and nothing is struck on
screen: the bullet cluster and its wind streaks — all 17,000 points — convert
straight into the stain. The thing that was travelling becomes the consequence
of its travelling, which is a cleaner image than either a body or a stain
fading in from nowhere.

Two things follow from having no figure, both good:

- **The splat gets every point.** Where it would have been ~22% of a
  silhouette, it is now the entire field, so it can be as dense and as
  frame-filling as storyboard frame 6 draws it.
- **The audience supplies the body.** Blood arriving in empty air is worse than
  blood on a drawn figure, because what they imagine is worse than what can be
  rendered at this point density. Same principle as the empty seat this section
  retired.

- [ ] **Step 1:** Create `src/shapes/splat.js`, generating the thrown destination for those points. Three components, because a single radial spray reads as a firework rather than a stain:
  - **Core** (~55% of points): dense irregular blob, radius ~0.28, with a noisy edge — never a circle.
  - **Satellites** (~30%): droplets flung outward, density falling off as `1/r²`, **biased rightward** — the bullet travels left→right, so the stain throws that way and the direction of the shot stays legible in it.
  - **Drips** (~15%): four to six short vertical tails running down from the core's lower edge, each thinning as it descends.

- [ ] **Step 2:** (Camera advance now lives in Task 5A's stage 1.) For reference, the move is — storyboard frame 5. In `enter`, animate `rig.setOffset` forward to `z: -1.6` over `TIME.advance` with `ease: 'inOutQuad'`, driven from an anime.js scalar exactly as the field morphs are.

  Note the sign: the rig computes `camera.position.z = fitZ + offset.z`, so
  forward is **negative**. With `fitZ` around 2.9 an offset of `-1.6` lands at
  1.3 — still well clear of the 0.1 near plane.

  The frame is empty while this runs. That emptiness is the point; see the
  storyboard note above.

- [ ] **Step 2b:** The splat arrives **suddenly, sweeping left→right**. Chain it off the camera move's completion, and get the sweep from the per-point delay buffers the deck already has — `posDelay[i]` set to the point's normalised x in the splat target means left-hand points arrive first:

```js
// The stagger mechanism that lights shards 200ms apart is the same one that
// throws a splatter across the frame. Left edge lands first, right edge last.
for (let i = 0; i < POINTS; i++) {
  const x = splat[i * 3];
  field.posDelay[i] = (x - minX) / (maxX - minX) * 0.75;
  field.colDelay[i] = field.posDelay[i];
}
field.morph(splat, { duration: TIME.splatForm, ease: 'outExpo' });
field.morphColor(solid(COLOR.blood, 1.4), { duration: TIME.splatForm });
```

`TIME.splatForm` is 450ms on purpose. The storyboard says "dramatic, sudden" —
anything slower reads as the blood being drawn rather than thrown.

- [ ] **Step 3:** Colour: `solid(COLOR.blood, 3.2)`. **Nothing else in Effects may carry colour.** Check `roots.js`-style discipline: the shot, the bullet and the wind stay ash.

- [ ] **Step 4:** `apply()` snaps to: splat formed, camera fully pulled back, no motion.

- [ ] **Step 5:** Verify the splat reads as a stain, not a flower. Screenshot it. If the satellites look evenly distributed, the falloff is wrong.

- [ ] **Step 6:** Commit.

---

### Task 6: `eff-03` — the room goes dark

**Files:** Modify `src/scenes/effects.js`, `src/beats.js`; regenerate `docs/RUNSHEET.md`.

`eff-03` keeps its meaning and its `learning stops` caption. What changes is
where it comes *from*: previously the desk grid was already on screen from
`grid-fail`; now it has to arrive from the splat.

- [ ] **Step 1:** Morph the splat into `mask.states.grid` over 2200ms with `ease: 'inOutQuad'`, colours going to `GRID_DARK` on the way. **The red must be fully gone by the end** — Effects returns to monochrome before Prevention, or the colour rule leaks into the section that has spent the whole deck earning it.

  The stain becoming the classroom is exactly what "a contagion of hopelessness across the student body" says. One death, then every desk.

- [ ] **Step 2:** Camera returns to neutral: `rig.setOffset(0, 0, 0)` over the same duration.

- [ ] **Step 3:** Update the four `state` values in `beats.js`:

```
eff-00  { mode: 'gun' }
eff-01  { mode: 'bullet' }
eff-02  { mode: 'splat' }
eff-03  { mode: 'grid-dark' }
```

- [ ] **Step 4:** Rewrite the four `cue` fields — they are the operator's run sheet and currently describe a shatter, an empty seat and a grid failure that no longer exist. Each cue must say where in the sentence to click and what will happen.

- [ ] **Step 5:** Regenerate and confirm the guard passes:

```bash
npm run runsheet
git diff --quiet -- docs/RUNSHEET.md && echo "STALE" || echo "regenerated"
```

- [ ] **Step 6:** Commit.

---

### Task 7: Restore the contrast the section lost

Effects was the deck's quiet floor and is now its loudest passage. Without
compensation the deck runs loud from `eff-00` all the way to the close, and the
Prevention turn — the emotional pivot of the whole piece — lands on an audience
that has had no silence to recover in.

- [ ] **Step 1:** Extend the black hold. `CONTEXT.md` §6 called for two seconds after `eff-03`; make it **four**, and put it in the README's operator table as a hard instruction rather than a suggestion.

- [ ] **Step 2:** Add a note to the run sheet cue on `eff-03`: *"Do not rush this. The deck has just been loud for four beats; Prevention does not work without the silence."*

- [ ] **Step 3:** Commit.

---

### Task 8: Full verification

- [ ] **Step 1:** All 22 beats forward, `←` back to 0, every number key from several starting points, `Q` in and out. Zero console errors.
- [ ] **Step 2:** **Jump safety:** press `5` to enter Effects from cold. The gun must not fire, the flash must not trigger, the shake must not run. Then `←` and `→` across `eff-00`/`eff-01` repeatedly and confirm no accumulated drift.
- [ ] **Step 2b:** **Mid-sequence interruption:** click into `eff-02` and click again roughly one second in, while the camera is still advancing and the splat has not landed. The deck must reach `eff-03` cleanly — no half-run stage, no stuck camera offset, no red left on screen.
- [ ] **Step 2c:** Jump into `eff-02` with `5` then `→` `→`. Splat complete, camera fully advanced — identical to having clicked through.
- [ ] **Step 3:** Seven-profile device matrix. The rig now owns framing — canvas CSS size must equal its container on every profile, phone DPR 3 through 4K.
- [ ] **Step 4:** Colour audit: no festival hue anywhere in Effects; `blood` appears only in `eff-02`.
- [ ] **Step 5:** Frame cost at 1920×1080 and 320×180. Small viewport must hold the vsync cap.
- [ ] **Step 6:** Hold `eff-01` for 90 seconds and `close-02` for 60. Neither may visibly loop.

---

## Open questions — mostly answered by the storyboard

Settled by [`effects-storyboard.png`](../../assets/effects-storyboard.png):

| Question | Answer |
|---|---|
| Which weapon? | **Handgun**, side profile |
| Firing direction | **Muzzle right**, bullet travels left→right, wind streaks trail left |
| How graphic is the splat? | **Vibrant red.** Overrides the earlier dark-desaturated recommendation |
| Camera on `eff-02` | **Advances forward** — not the pull-back this plan originally assumed |
| Content warning | **No** |
| Gun in frame while firing? | **Yes**, and it **recoils tilt-up** and stays up |
| Impact target? | **None.** No figure, no body. The frame stays empty and the blood alone carries it |

Nothing is open. This section is handoff-ready.

Two judgement calls made in the absence of an instruction, both cheap to flip:

- **Beat 10 carries the whole top row** — mask, gun, and the shot — because the
  storyboard brackets those three frames together as slide 10. If the shot
  should instead land on the click *into* beat 11, it is a one-line move.
- **Splat satellite bias is rightward**, following the bullet. If the stain
  should read as spraying back toward the camera, invert the bias.

## Self-Review

**Coverage.** Gun → Task 2. Fire with shake and effects → Task 3. Looping bullet
tracking with wind streaks and particles → Task 4. Camera pan away to blood
splat → Task 5. Fourth beat kept as grid-dark → Task 6. The camera work all four
beats need → Task 1, built once rather than three times.

**Placeholder scan.** None. `PARTS`, the flash CSS, the rig and the fire
sequence are written out; the shapes that need visual iteration (gun, splat)
say so explicitly and gate the next task on reading correctly.

**Type consistency.** `createCameraRig(camera)` → `{setFit, setOffset, shake,
clearScene, update}` is defined in Task 1 and called under exactly those names in
Tasks 3, 5, 6. `buildGun(shardOf)`, `buildWind()`, `buildSplat()` all return
`Float32Array(POINTS * 3)` matching every other state buffer in the deck.

**Risk register.**

| Risk | Where | Mitigation |
|---|---|---|
| Gun silhouette does not read | Task 2 | Task 2 Step 3 gates progress on it reading at a glance |
| Jump into `eff-00` re-fires the gun | Task 3 | Step 4 specifies `apply()` lands post-shot; Task 8 Step 2 tests it |
| Wind field blows the frame budget | Task 4 | Step 7 measures against the vsync cap; cut streaks first |
| Camera rig breaks framing everywhere | Task 1 | Device matrix re-run in Task 1 Step 4, before anything is built on it |
| Deck runs loud from Effects to the close | Task 7 | Black hold extended to four seconds and made a hard operator instruction |
| Splat reads as a flower | Task 5B | Three-component construction with `1/r²` falloff and rightward bias |
| Someone "fills" the empty advance frame | Task 5A | Called out in the storyboard note and again in Step 2 — the emptiness is the beat |
| Multi-stage beat breaks on a mid-chain click | Task 5A | `createSequence` with a `settle()` that plays nothing; Task 8 Step 2b tests it |
| Red survives into Prevention | Task 6 | Step 1 requires colour back to monochrome before the section ends |


---

## Amendment — 2026-09-03: `eff-03` is cut

**Task 6 is reverted.** `eff-03` — the splat dispersing into the darkened
classroom grid — was removed by decision of the author: it did not connect to
what came before it, and the blood splat is the stronger place to stop. Effects
is now three beats and hands straight to the mask.

What moved, and what it means for the risks this plan tracked:

**The sentence was kept.** *"This breeds a contagion of hopelessness across the
student body — learning stops, ambition fades, and classrooms turn into spaces
of constant fear, shattering trust in our schools."* is CH's line, not a slide,
so it is now the second half of `eff-02`'s script. The operator holds on the
stain and speaks it; `eff-02`'s cue says so explicitly.

**The `learning stops` caption is gone,** and with it the only on-screen word in
Effects. It belonged to the classroom image. Putting it on `eff-02` would have
lit a caption during the 1.7s empty camera push, which is the one stretch of
this section the plan is most insistent must stay empty — so the caption lost,
not the silence. Restoring it is one field in `beats.js` if that call is wrong.

**`eff-02` now brings the camera home itself,** in a third `RECEDE_MS` stage.
This is not cosmetic. With nothing after it, the dolly would still be at
`ADVANCE_Z` when Prevention mounts, and `rig.clearScene()` would snap it back in
one frame at the single most important transition in the piece. As a stage it
also earns its keep: the camera withdrawing off the blood is the only movement
left in the section, and it reads as withdrawal, which is what the sentence is
about. `settle()` lands at offset 0, so `apply()` and a click-through are
identical — verified by comparing the two frames.

**"Red survives into Prevention" is no longer mitigated by Task 6 Step 1.** The
blood is now the last colour of the dark half, draining to ash over `prev-00`'s
700ms colour morph, behind the four-second black hold. That is the intended
outcome rather than a regression: `COLOR.blood` is not a festival hue, and no
festival hue appears before `prev-01`.

**The black hold moved from after `eff-03` to after `eff-02`** and is four
seconds, unchanged. While correcting the references, two documents that still
said *two* seconds (`CONTEXT.md` §10 and the run sheet generator) were brought
in line with the beat's own cue, which is the authority.

**`grid-dark` stays in `effects.js`, retired,** alongside `shatter`, `seat` and
`grid-fail`, with its geometry still built by `mask.js`. Restoring it is a
one-line change to a beat's `state` — but read the note in the file header
first: `splat` and `grid-dark` would then both be returning the camera.

Deck is 28 -> 27 beats.

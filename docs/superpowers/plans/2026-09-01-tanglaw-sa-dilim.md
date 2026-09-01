# Tanglaw sa Dilim Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete 22-beat live advocacy deck described in `CONTEXT.md` — one MassKara mask of 7000 points morphing through every beat, driven by an operator's keyboard.

**Architecture:** One `THREE.Points` object exists for the whole presentation. Scenes never create geometry; they write target position/colour buffers that the render loop lerps toward using a single anime.js-driven scalar `t`. `beats.js` is the only source of narrative content. `deck.js` is an index-based state machine — no timeline, nothing on a timer.

**Tech Stack:** Vite 5, Three.js (`SVGLoader`, `MeshSurfaceSampler`), anime.js, vanilla JS, self-hosted woff2 fonts.

**Spec:** `docs/superpowers/specs/2026-09-01-tanglaw-sa-dilim-design.md` (and `CONTEXT.md`, which is canonical)

## Global Constraints

- `POINTS = 7000`, fixed. Every state is a 7000-point buffer. Every transition is a lerp.
- **No festival hue (`magenta`, `marigold`, `cyan`, `jade`) may be written to a colour buffer before `prev-01`.** Cold open, Threshold, Title, Roots, Effects may use only `void`, `ash`, gray tints, `intruder`.
- Caption case is copied verbatim from `beats.js`. Never normalise, never uppercase via CSS.
- Hard ceiling 5 words per caption; the single exception is `ref-01`.
- Nothing is on a timer. No beat auto-advances, ever.
- No scene is ever perfectly still — drift noise runs at every beat including held ones.
- No network at runtime. Fonts are self-hosted; no CDN links in `index.html`.
- `apply()` and `enter()` must reach an identical end state.
- Colours are exactly: `void 0x0b0d1a`, `ash 0x2a2d3d`, `magenta 0xd4256b`, `marigold 0xe8a020`, `cyan 0x2bb8c9`, `jade 0x2e9e6b`, `intruder 0x6b8f3a`.
- Timing: `shardLight 700`, `shatter 1400`, `converge 1100`, `captionIn 400`.
- No test framework and no git in this project. Each task's verification is a browser check; there are no commit steps.

---

### Task 1: Scaffold, theme, fonts

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/style.css`, `src/theme.js`
- Create: `public/fonts/bebas-neue-400.woff2`, `public/fonts/mulish-400.woff2`, `public/fonts/mulish-600.woff2`

**Interfaces:**
- Produces: `theme.js` exports `COLOR`, `TIME`, `POINTS = 7000`, `FIT_MARGIN = 1.35`, `BASE_POINT_SIZE`.

- [ ] **Step 1:** `npm init -y`, then `npm i three animejs` and `npm i -D vite`. Set `"type": "module"` and scripts `dev`/`build`/`preview` in `package.json`.
- [ ] **Step 2:** Download the four woff2 files from `fonts.gstatic.com` into `public/fonts/`. Declare them with `@font-face` in `style.css` and real fallback stacks (`'Bebas Neue', Impact, sans-serif`; `'Mulish', system-ui, sans-serif`). No `<link>` to any CDN.
- [ ] **Step 3:** Write `theme.js` with the exact palette and timing constants from Global Constraints.
- [ ] **Step 4:** Write `index.html` with a single `#stage` container and `<script type="module" src="/src/main.js">`. Write `style.css`: `html,body{margin:0;height:100%;background:#0b0d1a;overflow:hidden}`, `#stage{position:fixed;inset:0}`.
- [ ] **Step 5: Verify.** `npm run dev`, open the page. Expect a full-bleed indigo-charcoal viewport, no scrollbars, no console errors. Confirm in devtools Network that both font families load from `/fonts/`, not a CDN.

---

### Task 2: Renderer, fit math, and the beat state machine

**Files:**
- Create: `src/main.js`, `src/deck.js`
- Read: `src/beats.js` (do not modify)

**Interfaces:**
- Consumes: `theme.js` constants; `beats.js` exports `beats`, `SECTIONS`, `QNA`, `sectionStart`, `totalBeats`.
- Produces: `ctx` object `{renderer, scene, camera, clock, container, points, mask, overlay, morph, snap, setUpdate, viewport}`; `deck.next()`, `deck.prev()`, `deck.jump(sectionId)`, `deck.toggleQna()`, `deck.toggleBlack()`, `deck.applyThrough(index)`.

- [ ] **Step 1:** `main.js` — create `WebGLRenderer({antialias:true})` with `setPixelRatio(Math.min(devicePixelRatio, 2))`, `PerspectiveCamera(50, ...)`, `Clock`, and a `Scene` with `background = new Color(COLOR.void)`.
- [ ] **Step 2:** Write the resize handler driven by the **container**, not the viewport, attached with `ResizeObserver` (it fires on fullscreen toggle and window snapping, which the `resize` event misses):

```js
function resize() {
  const { clientWidth: w, clientHeight: h } = container;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  camera.position.z = fitDistance(MASK_RADIUS, camera.fov, camera.aspect);
  material.size = BASE_POINT_SIZE * (h / 900);
}
const fitDistance = (radius, fovDeg, aspect) => {
  const vFov = (fovDeg * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  return (radius * FIT_MARGIN) / Math.sin(Math.min(vFov, hFov) / 2);
};
new ResizeObserver(resize).observe(container);
```

- [ ] **Step 3:** `deck.js` — hold `index`, current mounted scene module, and an `animating` flag. Implement `goTo(i, {animate})`: if the target beat's `scene` differs from the mounted one, `unmount()` then `mount()`; then call `enter(state, ctx)` or `apply(state, ctx)`.
- [ ] **Step 4:** Implement `applyThrough(index)` per spec §3 — walk beats `0..index`, mounting/unmounting as the scene name changes, calling `apply()` on each. Wire number keys `1`–`8` to `applyThrough(sectionStart(id))`.
- [ ] **Step 5:** Implement interruption: `next()` when `animating` finishes the in-flight animation instantly (set `t = 1`, run its completion) **then** enters the new beat. One click = one advance; nothing queues.
- [ ] **Step 6:** Bind controls — `→`/`Space`/click → next, `←` → prev, `1`–`8` → jump, `Q` → Q&A toggle, `B` → black toggle, `F` → fullscreen (from the keypress handler only; browsers block programmatic fullscreen without a user gesture). Prevent default on space/arrows so the page never scrolls.
- [ ] **Step 7:** Register a temporary stub scene that logs `id` and `state` for every beat so navigation can be exercised before any geometry exists.
- [ ] **Step 8: Verify.** Click through all 22 beats forward, then `←` back to 0. Press each of `1`–`8` from several starting points. Press `B` twice, `F` twice. Then drag the window from very narrow to full width and toggle fullscreen mid-beat — the spec's §8 sanity check. Expect no console errors, no scrollbars, no layout jump.

---

### Task 3: Mask art and sampling

**Files:**
- Create: `assets/mask.svg`, `src/mask.js`

**Interfaces:**
- Consumes: `theme.js`.
- Produces: `await loadMask()` → `{ base: Float32Array(POINTS*3), shardOf: Uint8Array(POINTS), radius: number, anchors: Vector3[4], states: {...} }`. Every state getter returns a `Float32Array(POINTS*3)`.

- [ ] **Step 1:** Author `assets/mask.svg` — geometric MassKara line-art on a 1000×1200 canvas. **Filled closed contours only, no holes**: every stroke is a band (out along one arc, back along a parallel arc, closed). Elements: face outline band, two brow bands, two almond eye rings (hollow centres, per §6), a nose diamond, a too-wide smile band with tooth gaps, cheek ornament petals, and a small radiating crown at the top.
- [ ] **Step 2:** Load with `SVGLoader`, convert every path to shapes, build one merged `ShapeGeometry`, and sample it with `MeshSurfaceSampler` to exactly `POINTS` positions. Centre the result on its bounding box, flip Y (SVG is y-down, Three is y-up), and scale so `radius` (bounding-sphere radius) is `1`.
- [ ] **Step 3:** Assign shards by nearest anchor, so all 7000 points belong to exactly one shard:

```js
const anchors = [
  new Vector3(-0.55, -0.15, 0),  // 0 cracked cheek, left
  new Vector3( 0.42,  0.38, 0),  // 1 hollow eye, upper right
  new Vector3( 0.00, -0.62, 0),  // 2 mouth, too wide
  new Vector3(-0.45,  0.52, 0),  // 3 foreign fragment, upper left
];
```

- [ ] **Step 4:** Implement the state generators listed in spec §6: `void`, `drift`, `split`, `assembled`, `fractured`, `shattered`, `seat`, `grid`, `converged`, `complete`, `lantern`, `embers`. `split` uses index parity — even points build the left silhouette, odd points the right, each at half scale, so both clouds are the same full shape at half density. `fractured` translates and rotates each shard away from centre along its own anchor vector, and gives **shard 3 extra rotation plus a non-uniform scale** so it visibly does not belong.
- [ ] **Step 5: Verify.** Temporarily render the `assembled` state as ash points. Expect a recognisable mask outline with hollow eyes and a wide smile, evenly dense, filling the frame with margin. Then temporarily render `fractured` — expect four separated pieces with shard 3 obviously wrong.

---

### Task 4: Morph engine and drift noise

**Files:**
- Create: `src/noise.js`
- Modify: `src/main.js` (render loop), `src/deck.js` (`ctx` wiring)

**Interfaces:**
- Produces: `ctx.morph(targetPos, targetCol, {duration, easing})`, `ctx.snap(targetPos, targetCol)`, `ctx.setUpdate(fn|null)`; `noise.driftOffset(i, time, out)`, `noise.curl(i)`.

- [ ] **Step 1:** `noise.js` — precompute a stable per-point phase, axis and amplitude from a seeded PRNG. `driftOffset` returns a slow sinusoidal offset; `curl` returns a stable pseudo-random unit vector used to make the shatter non-uniform.
- [ ] **Step 2:** Implement the library seam exactly as §7 requires — anime.js animates one scalar, Three reads it every frame:

```js
function morph(to, colors, { duration = 900, easing = 'easeOutExpo' } = {}) {
  from.set(current); colorFrom.set(colorCurrent);
  toBuf.set(to); colorTo.set(colors);
  state.t = 0;
  return anime({ targets: state, t: 1, duration, easing });
}
```

- [ ] **Step 3:** In the render loop, write `current[i] = from[i] + (to[i]-from[i]) * t`, add `driftOffset`, then `geometry.attributes.position.needsUpdate = true`. Lerp colours the same way. Call the registered per-frame `update(dt, ctx)` hook if a scene set one.
- [ ] **Step 4:** `snap()` sets `t = 1` immediately with no anime.js call — this is what `apply()` uses.
- [ ] **Step 5: Verify.** Wire two temporary keys to morph between `assembled` and `shattered`. Expect a smooth 1.4s transition, and — critically — visible slow drift when the animation has finished. Nothing should ever be frozen.

---

### Task 5: Roots and Prevention (built as a pair — they are mirrors)

**Files:**
- Create: `src/scenes/_base.js`, `src/scenes/roots.js`, `src/scenes/prevention.js`, `src/overlay/shardlabel.js`

**Interfaces:**
- Consumes: `ctx.morph/snap`, `mask.states.fractured/converged`, `mask.shardOf`, `mask.anchors`.
- Produces: `shardlabel.show(text, anchorVec3, ctx)`, `shardlabel.hide()`; both scenes export the `{mount, enter, apply, unmount}` contract.

- [ ] **Step 1:** `_base.js` — a helper that builds a colour buffer from a per-shard colour table, so both scenes stay declarative: `colorsForShards(shardOf, table)`.
- [ ] **Step 2:** `roots.js` — `state.fracture` morphs to `fractured` with all shards `ash`. `state.shard: n` lights shards `0..n` **cumulatively** to their dim tints (gray-violet, gray-blue, gray-gold, `intruder`), `TIME.shardLight` each, staggered ~200ms. State is self-describing: `{shard:2}` means 0,1,2 are lit.
- [ ] **Step 3:** `prevention.js` — the exact same four anchors in the same order. `state.converge` drifts fragments inward. `state.shard: n` lights shards `0..n` to festival hues at **partial** intensity, cumulatively, `TIME.converge` for geometry. Shard 3 lights jade but stays offset and un-seated (spec §4).
- [ ] **Step 4:** `shardlabel.js` — each frame, project the shard's centroid with `vec.project(camera)`, convert to CSS pixels, then **clamp inside the safe area** so a label never touches a bezel. Never a fixed px offset from the shard.
- [ ] **Step 5: Verify.** Click `roots-00` → `roots-04`, then `prev-00` → `prev-04`. Confirm each shard lights in the same screen position in both sections, previous shards stay lit, labels track their shards while drifting, and no festival hue appears anywhere in Roots.

---

### Task 6: Effects

**Files:**
- Create: `src/scenes/effects.js`

- [ ] **Step 1:** `shatter` — morph to `shattered` over `TIME.shatter` with outward velocity **plus `noise.curl` offsets**, so it does not read as a uniform expanding balloon.
- [ ] **Step 2:** `seat` — everything dims; points settle into a single empty chair outline, centred, very dim. No caption. This is the quietest beat in the deck; give it the least motion.
- [ ] **Step 3:** `grid-fail` — points form a classroom grid of desk clusters. One desk extinguishes, and the darkness propagates outward with a per-desk delay proportional to distance from it. Abstract only — never depict the act.
- [ ] **Step 4:** `grid-dark` — every desk dark, faint ash remaining, caption `learning stops`.
- [ ] **Step 5: Verify.** Play `eff-00` → `eff-03`. Confirm the shatter looks irregular, the seat beat is near-motionless, the grid failure spreads rather than switching off at once, and no warm accent appears anywhere in the section.

---

### Task 7: Cold open, Threshold, Title, Refusal, Close

**Files:**
- Create: `src/scenes/coldopen.js`, `src/scenes/threshold.js`, `src/scenes/title.js`, `src/scenes/refusal.js`, `src/scenes/close.js`, `src/overlay/caption.js`

**Interfaces:**
- Produces: `caption.set(text, {variant})`, `caption.clear()` — `variant: 'display'` for `title-01` and `ref-01` only, `'body'` everywhere else.

- [ ] **Step 1:** `caption.js` — a DOM node using `clamp(1.75rem, 4.5vw, 5rem)`, `max-width: min(90vw, 60ch)`, `padding: max(4vh, 2rem) max(6vw, 2rem)`, fading over `TIME.captionIn`. Renders `beat.caption` **verbatim**; no CSS `text-transform` anywhere in the project.
- [ ] **Step 2:** `coldopen.js` — `void` is scattered dim points, `drift` loops indefinitely so the beat can be held for any length.
- [ ] **Step 3:** `threshold.js` — the parity `split` state, left cloud warm-lamp, right cloud drained. The warm side dims slowly and monotonically across ~30s so it is always still dimming when the operator clicks.
- [ ] **Step 4:** `title.js` — points converge into the mask outline, ash only, hollow eyes, caption `Tanglaw sa Dilim` in the display face.
- [ ] **Step 5:** `refusal.js` — mask near-whole with shard 3's slot still a gap. `dim: true` clears the caption and holds. Nothing moves but the drift.
- [ ] **Step 6:** `close.js` — `complete` seats shard 3 and takes all four hues to full **together** (the first time all four are lit at once). `lantern` rises and dissolves upward into a warm glow, and **loops indefinitely** — it must be safe to hold through applause.
- [ ] **Step 7: Verify.** Play the full deck start to finish. Confirm the title and refusal captions use the condensed display face and every other caption uses the body face, and that `close-01` is genuinely the first full-colour moment.

---

### Task 8: Q&A ember field

**Files:**
- Create: `src/scenes/qna.js`
- Modify: `src/deck.js` (mode toggle, not a beat)

- [ ] **Step 1:** `qna.js` — from `close-02`, the lantern disperses into loose warm embers in slow independent orbit, drifting upward and re-seeding at the bottom, brightness breathing out of phase per point. All four festival hues present but low. No mask, no structure, no caption.
- [ ] **Step 2:** In `deck.js`, make `Q` a **mode** that remembers the beat it came from and restores it on the second press — it is deliberately outside the beat index because Q&A length is unknown.
- [ ] **Step 3: Verify.** Press `Q` at `close-02`, watch for a full minute. It must never visibly loop and never speed up. Press `Q` again and confirm it lands back exactly on `close-02`.

---

### Task 9: Polish and full verification pass

**Files:**
- Modify: `src/deck.js`, `src/style.css`, all scenes as needed
- Create: `README.md`

- [ ] **Step 1:** Easing audit — `easeOutExpo` on entry, `easeInQuad` on exit, everywhere.
- [ ] **Step 2:** Stagger audit — no two elements ever appear simultaneously; ~200ms apart.
- [ ] **Step 3:** Failsafes (§10) — hide the cursor after ~2s idle, disable the context menu and scrolling, and keep fullscreen on keypress only.
- [ ] **Step 4:** Write `README.md` — how to run, the full control table, the operator's handoff list, and the two deliberate pauses (three beats after `cold-01`; two seconds of black via `B` after `eff-03`).
- [ ] **Step 5: Verify** the five checks in spec §8 end to end: sizing sanity check, full click-through forward/back/jumps/`Q`, caption case audit against `beats.js`, colour audit (no festival hue before `prev-01`), and text budget (5 words, one exception at `ref-01`).

---

## Self-Review

**Spec coverage:** §1 decisions → Tasks 1, 3. §2 shared object → Tasks 2, 4. §3 scene contract, `applyThrough`, interruption → Task 2. §4 shards and lighting-vs-seating → Tasks 3, 5, 7. §5 module map → all tasks; every file in the map is created by some task. §6 states → Task 3. §7 colour discipline → enforced in Tasks 5-7, audited in Task 9. §8 verification → every task's final step, full pass in Task 9. §9 out of scope → nothing in this plan touches git or Pages.

**Placeholder scan:** none — every step names the concrete behaviour, and the tricky math (fit distance, morph seam, shard anchors) is written out.

**Type consistency:** `ctx.morph/snap/setUpdate` (Task 4) are used with those names in Tasks 5-8. `loadMask()` returns `{base, shardOf, radius, anchors, states}` (Task 3), consumed under those names in Task 5. `caption.set/clear` and `shardlabel.show/hide` are defined once and used consistently.

# Tanglaw sa Dilim — Implementation Spec

Date: 2026-09-01

**`CONTEXT.md` at the repo root is the canonical design document.** It holds the
thesis, the color rule, the motion rules, the beat table, and the reasoning
behind every decision. This spec does not restate it. This spec records the
implementation decisions `CONTEXT.md` leaves open, and fixes the module
contracts so the build has no ambiguity left in it.

Read `CONTEXT.md` first. Where the two disagree, `CONTEXT.md` wins.

---

## 1. Decisions taken at build time

| Open question | Decision |
|---|---|
| `assets/mask.svg` does not exist | Author a placeholder geometric MassKara line-art SVG. Filled shapes only, no holes — every stroke is a closed band contour, so `SVGLoader` needs no winding/hole detection to be correct. Swappable later without code changes. |
| Fonts | Bebas Neue (display) + Mulish (body), self-hosted as woff2 under `public/fonts/`. No CDN — §10 requires the deck to run with no network. |
| Deployment | Local only. `npm run dev` and `npm run build`. No git, no GitHub Pages this pass. |
| Scope | Full build order §11: all 22 beats, all 9 scenes, both overlays, all controls. |
| Point count | `POINTS = 7000`, fixed for the life of the deck. Every state is a 7000-point buffer, so every transition is a lerp (§7). |

## 2. The one shared object

`CONTEXT.md` §2 says the deck is one object in five states. The implementation
takes that literally: **there is exactly one `THREE.Points` in the scene for the
entire presentation.** Scenes never create geometry. They produce target buffers
for the points that already exist.

This is what makes `apply()` cheap and mis-click recovery instant — there is
nothing to build or tear down between beats.

```
ctx = {
  renderer, scene, camera, clock, container,
  points,        // the single THREE.Points
  mask,          // sampled states + shard assignment (mask.js)
  overlay,       // { caption, shardlabel }
  morph(to, colors, opts),   // animate current -> target, returns promise-ish handle
  snap(to, colors),          // no animation, for apply()
  setUpdate(fn),             // per-frame hook, cleared on unmount
}
```

### Morph seam (§7)

anime.js animates one scalar `t: 0 → 1`. The render loop reads it. anime.js
never touches the scene graph; Three never handles timing.

```
position[i] = from[i] + (to[i] - from[i]) * t   +   driftNoise(i, time)
color[i]    = colorFrom[i] + (colorTo[i] - colorFrom[i]) * t
```

`driftNoise` is a per-point stable phase/axis sinusoid, always on, in every
scene, at every beat, including held ones. Nothing is ever perfectly still (§7).

## 3. Scene contract

```js
export default {
  mount(ctx),          // claim the points, set up per-scene data
  enter(state, ctx),   // animate into this state
  apply(state, ctx),   // snap to this state, identical end result, no animation
  unmount(ctx),        // clear per-frame hook, release scene data
}
```

Every state object in `beats.js` is **self-describing**: `{shard: 2}` means
shards 0, 1 and 2 are lit, not "light one more". Cumulative meaning is derived,
never accumulated in scene-local variables. This is what makes `apply()` safe to
call out of order, which is what makes section jumping work.

`deck.js` implements jumping exactly as §5 describes: `applyThrough(index)`
walks beats `0..index`, mounting/unmounting as the scene changes and calling
`apply()` on each. Because `apply()` is a snap, the whole walk is one frame.

**Interruption:** a click during an animation finishes the in-flight animation
instantly (`t := 1`), then starts the new beat's `enter()`. One click always
equals one advance. Nothing queues.

## 4. Shards

Four shards partition the **entire** mask — nearest-anchor assignment, so every
point belongs to exactly one shard. Anchors sit on the four meaning-regions from
§6, and hold their positions across Roots and Prevention (this is the mirror,
and it is the spine of the piece).

| Shard | Region | Roots (dim) | Prevention (lit) |
|---|---|---|---|
| 0 | Cracked cheek, left | gray-violet | magenta — CAPACITATE |
| 1 | Hollow eye, upper right | gray-blue | marigold — TRAIN |
| 2 | Mouth, too wide | gray-gold | cyan — REDESIGN |
| 3 | Foreign fragment, upper left edge | `intruder` green | jade — EMPOWER |

Shard 3 gets a deliberate geometric wrongness in `fracture` — extra rotation and
a slight non-uniform scale — so it visibly does not belong to the same face
before anything is said about it.

### Lighting vs. seating

The manifest lights shard 3 at `prev-04`, but `ref-01` says one gap remains and
`close-01` says the final shard seats. These are two different things, and the
build keeps them separate:

- **Prevention** returns *color* to each shard in turn, cumulatively, at partial
  intensity. Geometry converges most of the way. Shard 3 lights jade but stays
  offset and un-seated.
- **Refusal** holds exactly that: near-whole mask, shard 3's slot still a gap.
- **`close-01`** seats shard 3 and takes all four hues to full together. This is
  why it is the first moment all four are lit at once, and why the piece that
  was foreign is the one that finally belongs.

## 5. Module map

| File | Responsibility |
|---|---|
| `src/main.js` | Renderer, camera, clock, `ResizeObserver`, render loop, boot. Owns nothing narrative. |
| `src/deck.js` | Beat index, key/click handling, scene mount/unmount, `applyThrough`, Q&A mode, black toggle, fullscreen, idle cursor hide. |
| `src/beats.js` | The manifest. Already written. Not modified by this build. |
| `src/theme.js` | `COLOR`, `TIME`, type scale, `POINTS`. |
| `src/mask.js` | Loads and samples `assets/mask.svg`; produces every named point state and the per-point shard assignment. |
| `src/noise.js` | Stable per-point drift and the curl-ish offsets the shatter needs. |
| `src/scenes/*.js` | Nine scenes. Sub-beats live inside a scene (§5) — Roots is one scene with four states. |
| `src/overlay/caption.js` | Centre captions. Case preserved verbatim from the manifest. Display face for `title-01` and `ref-01` only (§4). |
| `src/overlay/shardlabel.js` | Roots/Prevention shard words. Projects the shard centroid to screen space each frame, clamps inside the safe area. Never a fixed px offset (§8). |

## 6. States produced by `mask.js`

`void`, `drift`, `split` (parity-split into two half-density silhouettes of the
same shape), `assembled`, `fractured`, `shattered`, `seat` (an empty chair
outline), `grid` (classroom desk clusters), `converged`, `complete`, `lantern`,
`embers`. All 7000 points. All lerp-compatible with each other.

## 7. Colour discipline

`theme.js` exposes the §4 palette unchanged. The build enforces §3 structurally:
festival hues are only ever written into a colour buffer by `prevention.js`,
`refusal.js`, `close.js` and `qna.js`. Cold open, Threshold, Title, Roots and
Effects can only reach `void`, `ash`, the three gray tints, and `intruder`.

Breaking this anywhere costs the entire effect, so it is a review item, not a
preference.

## 8. Verification

There is no automated test suite. This is a live visual deck; the meaningful
checks are the ones `CONTEXT.md` specifies:

1. **Sizing sanity check (§8).** Load the deck, drag the window from very narrow
   to full width, toggle fullscreen mid-beat. Nothing crops, overflows or jumps.
2. **Full click-through.** All 22 beats forward, then backward, then every
   number key from several starting points, then `Q` in and out of the ember
   field. No beat may look broken when held.
3. **Caption case audit.** Roots and Effects lowercase, Prevention and Close
   uppercase, exactly as the manifest has them. Nothing normalises case.
4. **Colour audit.** No festival hue appears before `prev-01`.
5. **Text budget.** 5 words per beat, one deliberate exception at `ref-01`.

## 9. Out of scope

Git, GitHub Pages, the screen-recorded backup run, and the printed operator run
sheet. The deck must be buildable and runnable locally without any of them.

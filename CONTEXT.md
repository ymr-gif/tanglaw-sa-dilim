# Tanglaw sa Dilim — Project Context

*Illuminating Campus Extremism and Aggression*

A live-presented, code-built advocacy deck. Three.js + anime.js, Vite, deployed
to GitHub Pages.

This file is the single place where the reasoning lives. If a decision in the
codebase looks arbitrary, the explanation is here.

---

## 1. What this is

An advocacy presentation delivered live by two speakers, **BR** and **CH**,
alternating seven times across 26 beats. A **third person operates the deck** —
neither speaker touches the keyboard.

The subject is campus violence and extremism in Philippine schools: its roots,
its effects, and its prevention. The argument is not punitive. The closing
position is explicit — *when a child turns to violence, society failed them long
before they picked up a weapon* — and every design decision downstream has to
support that, not undercut it.

The visual language is **MassKara**. The subject matter is not.

---

## 2. The thesis, and why the theme isn't decoration

MassKara began in Bacolod in 1980, during the collapse of the sugar industry and
immediately after the *Don Juan* sank with many Negrenses aboard. A city in
mourning chose to put on smiling faces and dance anyway.

That is the same structure as the speech. Every student in that classroom is
wearing a mask. The smile is the performance of okay-ness; the darkness is what
sits underneath it. And *tanglaw sa dilim* — light in the darkness — is not
about tearing the mask off. It is about bringing enough light that the face
beneath can finally be seen.

So the entire deck runs on **one object in five states**:

| Section | Mask state |
|---|---|
| Cold open | Scattered dim points, drifting, no face yet |
| Roots | Points pull into a face — fractured, the smile cracked |
| Effects | The mask shatters outward |
| Prevention | Points converge and warm, one shard at a time |
| Close | The whole mask lifts and becomes a lantern |

One recurring object beats five unrelated 3D set pieces. It is a tenth of the
work and it turns a slideshow into a story.

**Considered alternative:** Dinagyang — soot-blackened Ati warriors, real
torches, drums — and *tanglaw* does literally mean torch. It is arguably the
better fit for an Iloilo audience. MassKara was chosen because it gives you
*hidden pain*, which is the larger half of this particular script. Dinagyang
gives you *carried fire*, which is only the ending. If the framing of the speech
shifts toward the call to action, revisit this.

---

## 3. The rule that keeps the theme from being tone-deaf

> **First rule, as amended 2026-09-02. The deck's colour argument is
> TEMPERATURE, not saturation.**

Threshold (slides 2-3) carries vivid colour — a yellow student, neon purple
shadows, a red knife — because that beat is symbolic and has to read across a
lit room. Those hues are COLD and violent by design: electric violet, hard red.
Title, Roots and Effects then drain to near-monochrome, and the festival palette
— the mask's own WARM pinks and golds — still appears only from Prevention
onward.

So the shape is vivid, drained, vivid again: the Threshold shows what is at
stake, the deck desaturates as the analysis gets bleak, and colour returns when
solutions arrive. The contrast at `prev-01` is measured against Effects, not
against slide 3, and is unaffected.

What is still forbidden anywhere before `prev-01`: the festival hues themselves
(`rose`, `ember`, `gold`, `fuchsia`, `radiance`). Warmth is what Prevention
earns.

Colour becomes hope, structurally. The audience feels the deck warming before
they consciously register why, and the metaphor never has to be explained out
loud. This is still the single most important constraint in the project — what
changed is which axis it runs along. A stray festival magenta in Roots, or a
warm accent in Effects, costs the entire effect exactly as it always did.

**What the amendment cost, and what it bought.** An earlier draft of this rule
argued that saturated colour in the Threshold would leave Prevention's turn with
nothing to be. That was overstated: Title, Roots and Effects still drain to
near-monochrome *between* the two, roughly fourteen beats of it, and local
contrast is what an audience actually feels. What the deck lost is a tidy
sentence in its own documentation. What it gained is a better arc.

**Second rule:** it is always the same mask. Assembling, cracking, shattering,
relighting. The repetition is what carries the narrative.

**Third rule:** Roots and Prevention are structural mirrors. Four shards, same
four positions, same order. What broke it is what fixes it. Never state this
aloud; the geometry says it.

---

## 4. Visual system

### Color

```js
export const COLOR = {
  void:     0x0b0d1a,   // background. deep indigo-charcoal, NOT pure black
  ash:      0x2a2d3d,   // unlit mask points
  rose:     0xff3d94,   // Prevention: guidance counselors
  ember:    0xff7a3d,   // Prevention: teacher training
  gold:     0xffc93c,   // Prevention: classroom redesign
  fuchsia:  0xc94ae8,   // Prevention: peer networks / CPCs
  radiance: 0xfff0c2,   // the close blooms past the four into plain light
  intruder: 0x6b8f3a,   // NVE shard. deliberately off-palette, sickly
};
```

The four festival hues are taken from `assets/mask-art.png` itself — the
artwork's own dominant colors (#f05aa5 pink, #f3ad67 orange, #f8e85d yellow),
pulled out and punched up for emission. They replaced an invented palette that
included cyan and jade; those were cool colors fighting a piece whose title
means *illumination*. Warm all the way through now.

Background is indigo-charcoal rather than pure black because festival color
needs somewhere to bleed into. Pure black kills the glow falloff.

`intruder` is the only color in the deck that doesn't belong to the festival
palette. That is the point — it is the one external force in the Roots section.

Festival hues are **emissive light sources**, never flat fills.

### Type

Two families, clearly distinct:

- **Display** — heavy condensed, used for the title and the refusal line only.
  Type treatment is an active design element here, not a delivery vehicle.
- **Body / captions** — warm humanist sans, generous line spacing and
  letter-spacing.

**Caption case is load-bearing and must not be normalized:**

- Roots and Effects captions are **lowercase**. The darkness is unspoken,
  diminished, said under the breath: `bullying`, `untreated`, `learning stops`.
- Prevention and Close captions are **UPPERCASE**. The light is declarative:
  `CAPACITATE`, `TRAIN`, `REDESIGN`, `EMPOWER`.

This is why the deck does not use all-caps labels uniformly. Case carries
meaning, so it can't also be a default.

### Text budget

**Hard ceiling: 5 words per beat.** This is live — anything the audience reads
is attention they are not giving the speaker. Most beats carry `caption: null`.

Two beats break the ceiling, and they are the only two.

`ref-01` — the refusal line, *"Do not build prisons out of our classrooms."* It
is the strongest sentence in the script and the only moment where screen and
voice say the same words simultaneously.

`thresh-01` — the three things CH names: *unspoken trauma*, *student isolation*,
*toxic online spaces*. Seven words, but never seven at once. They arrive one per
shadow, ~700ms apart, each anchored to the thing it names, so the reading is
spread across the sentence being spoken instead of dumped into it. A beat whose
text works this way carries `labels` in beats.js rather than `caption`.

Anything else over five words is a mistake, not a third exception.

### Mask art

Geometric line-art, not photographic. A photo of a real MassKara mask pulls
attention toward the festival itself; a stylized outline stays a symbol and
stays yours. Source lives at `assets/mask.svg`, sampled to points at build.

---

## 5. Architecture

### The load-bearing decision

**The script is the data structure.** `src/beats.js` holds the speech, speaker
assignments, on-screen captions, and staging cues, in speaking order. Scenes are
dumb renderers that read from it.

The speech will be rewritten several more times before presentation day. In a
manifest, a rewrite is a text edit. Scattered across scene files, a rewrite is
an archaeology expedition.

### State machine, not timeline

Do not build one long anime.js timeline and scrub through it. Two speakers
alternating seven times in front of a live audience means pacing will not match
any timeline authored in advance.

Instead: an array of **beats**. Click advances the index.

```js
export default {
  mount(ctx),           // build geometry, add to scene
  enter(state, ctx),    // animate to this state
  apply(state, ctx),    // snap to this state, no animation
  unmount(ctx),         // dispose
}
```

`ctx` carries the shared renderer, camera, mask point buffers, and clock. Scenes
never own the renderer.

**`apply()` is the half everyone skips.** Write it at the same time as `enter()`
or it will never get written. It buys three things:

- **Mis-click recovery.** Overshot? Jump back; every prior beat applies
  instantly. No rewinding animations.
- **Section jumping.** Number keys go straight to a section by applying every
  beat up to it. Two keystrokes from anywhere if something goes wrong mid-speech.
- **Interruption.** Clicking during an animation snaps it to done rather than
  queuing. Audiences never notice a skipped animation; they absolutely notice a
  deck running a full beat behind the speaker.

### Controls

| Key | Action |
|---|---|
| `→` / `Space` | Next beat |
| `←` | Previous beat |
| `1`–`8` | Jump to section |
| `Q` | Toggle Q&A hold (see §9) |
| `B` | Black the screen (toggle) |
| `F` | Fullscreen |

Nothing is on a timer. Ever. Auto-timing desyncs from real speaking pace within
about thirty seconds, and then the rest of the speech is spent chasing slides.

### Repo structure

```
tanglaw/
├── index.html
├── public/
│   └── fonts/
├── src/
│   ├── main.js             boot, renderer, resize contract, loop
│   ├── deck.js             beat index, key handling
│   ├── beats.js            ← THE MANIFEST. everything lives here
│   ├── theme.js            palette, type scale, timing constants
│   ├── mask.js             mask geometry, sampled point states
│   ├── pointfield.js       the one THREE.Points object, and the morph engine
│   ├── camera-rig.js       the only writer of camera.position
│   ├── sequence.js         explicit stages, for a beat with more than one
│   ├── noise.js            seeded RNG and the per-point drift
│   ├── scenes/
│   │   ├── _base.js        scene contract, colour and stagger helpers
│   │   ├── coldopen.js
│   │   ├── threshold.js
│   │   ├── title.js
│   │   ├── roots.js
│   │   ├── effects.js
│   │   ├── prevention.js
│   │   ├── refusal.js
│   │   ├── close.js
│   │   └── qna.js          Q&A hold state
│   ├── shapes/             everything the field is asked to become
│   │   ├── student.js      the child, cold-02 and slide 3
│   │   ├── shadow.js       the three demonic shadows
│   │   ├── cracks.js       the composition, broken around a point
│   │   ├── knife.js        the cleaver — Refusal, and stood up in Threshold
│   │   ├── gun.js          Effects and Refusal
│   │   ├── wind.js         the bullet's tracking shot
│   │   ├── splat.js        eff-02
│   │   ├── bars.js         the classroom as a cage
│   │   ├── hands.js        the hands that close on the weapons
│   │   └── stars.js        what the hands become
│   └── overlay/
│       ├── caption.js      the on-screen words
│       ├── shardlabel.js   labels anchored to 3D positions (one, or three)
│       └── tracker.js      review chrome. H toggles; hidden in fullscreen
├── tools/
│   └── runsheet.mjs        generates docs/RUNSHEET.md from beats.js
└── assets/
    └── mask-art.png
```

Eight scene files for the narrative, one for Q&A. Sub-beats are handled *inside*
a scene, not by new files — Roots is one scene with four states, not four
scenes.

---

## 6. Beat-by-beat spec

Full script text and staging cues live in `src/beats.js`. This is the visual
summary.

**The beat table used to live here and no longer does.** It was a second,
hand-maintained copy of `src/beats.js`, and by 2026-09-03 it had drifted badly —
still listing the retired `shatter`/`seat`/`grid-fail` staging for Effects, the
two-cloud `split` for the Threshold, and 26 beats when the deck ran 27. Keeping
two tables in agreement is exactly the failure `tools/runsheet.mjs` exists to
prevent, so there is now one:

**[`docs/RUNSHEET.md`](docs/RUNSHEET.md)** — generated from `beats.js` by
`npm run runsheet`. Every beat in speaking order with its id, section, speaker,
handoff, state, script, click cue and on-screen text. CI fails if it is stale.

What stays in this file is the reasoning a generated document cannot carry: the
shard mapping below, and the section notes after it.

`ref-02` is retired, not renumbered. It held four sentences that are now
spread across five beats, so no beat is its honest successor and the gap is
deliberate — see `docs/superpowers/plans/2026-09-02-refusal-sequence.md`.

Bold speaker = handoff. The operator watches this column.

### Shard mapping

The four shards hold their positions across both sections. This is the spine of
the whole piece.

| Position | Roots (dim) | Prevention (lit) |
|---|---|---|
| Cracked cheek | bullying / discrimination — gray-violet | CAPACITATE — magenta |
| Hollow eye | untreated mental health — gray-blue | TRAIN — marigold |
| Mouth, too wide | craving to be seen — gray-gold | REDESIGN — cyan |
| Foreign fragment | NVE online — `intruder` green | EMPOWER — jade |

The mouth shard is the MassKara smile doing its literal job: the too-wide grin
as the performance of okay-ness.

The fourth shard should visibly not belong — wrong hue, slightly wrong geometry.
It is the only external force in Roots. In Prevention it becomes jade and seats
correctly: the piece that was foreign is the one that now belongs.

### Section notes

**Cold open.** No structure, no face, no color. `cold-01` is the rule in full:
drift never resolves, so it can hold for any length, and voice does everything.
From 2026-09-02, `cold-02` alone breaks it — the field gathers into a student
standing alone, ready for the sentence about the classrooms it ends on. That is
a change to the second beat only; the silence after "are you afraid of the
darkness?" must still land on nothing.

**Threshold.** From 2026-09-02 this section is three beats, one per sentence,
replacing the earlier two-cloud staging ("identical silhouette, one warm and one
drained, warm side dims across CH's paragraph"). Three demonic shadows come out
of the student's own back and are named — *unspoken trauma*, *student
isolation*, *toxic online spaces*, staggered, the deck's second and last
exception to the five-word ceiling. A knife falls into the middle of the picture
and shatters it. The wreckage holds, and only the shadows' eyes still move.
Recorded in `docs/superpowers/plans/2026-09-02-threshold-sequence.md`.

**Title.** First sight of the mask — outline only, unlit, hollow eyes.

**Roots.** Mask cracks on entry, all four shards dim. One lights per click.

**Effects.** From 2026-09-02 this section is a literal sequence: the broken
mask converges into a gun, fires, the camera tracks the bullet, and pushes
forward through an empty frame into a blood splat. This replaces the earlier
rule ("mass casualty is abstract only — never depict the act") by an explicit
decision of the author, recorded in
`docs/superpowers/plans/2026-09-02-effects-sequence.md`.

Forming and firing were one beat, timed to fire itself ~1.8s after the click,
until 2026-09-03. Split into `eff-00` (forms, holds) and `eff-04` (fires) so
the operator decides when the room has sat with the gun long enough, rather
than the deck deciding for them.

**It ends on the splat.** A fourth beat followed it until 2026-09-03, in which
the stain dispersed into a darkened grid of desks; it was cut for not connecting
to what came before it, and its sentence moved onto `eff-02`, which now holds
the stain while CH speaks it and lets the camera withdraw off the blood. The
`grid-dark` state is retired in `effects.js`, not deleted, alongside `shatter`,
`seat` and `grid-fail`.

The constraint that survives: the gun is assembled from the four shards of the
child's mask. It is what the shattered child became. A weapon that arrives from
outside the piece would contradict §1's thesis; a weapon made of the child does
not. After `eff-02`, hold black FOUR full seconds before Prevention — the
section is now the loudest in the deck and that silence is the only contrast
left. Four, not the two this rule originally said: the sequence turned out
louder than the plan that specified it, and two seconds does not pay for it.

**Prevention.** The turn. Fragments drift inward, one shard relights per click.
Festival color enters the deck here for the first time.

**Refusal.** Six beats, one per sentence. The mask holds whole with its gap,
then its own points rise into prison bars; the bars become a knife and the
Effects handgun; many hands fade in out of the shadows around them; the hands
close and the weapons break and scatter; the hands become stars. Every shape is
made of the same points as the mask — nothing arrives from outside the piece.
Bars white, weapons bright white, hands and stars yellow. Transitions
reshuffle rather than lerp. The only full sentence the audience reads sits on
`ref-03`.

**Close.** Final shard seats, mask completes in full color, rises, dissolves
upward into lantern glow. Loops indefinitely. There is nothing after it except
the Q&A hold.

---

## 7. Motion

### Timing constants

```js
export const TIME = {
  shardLight: 700,
  shatter:    1400,
  converge:   1100,
  captionIn:  400,
};
```

### The library seam

anime.js animates a single scalar `t` from 0 to 1. Three.js reads it every
frame. anime.js never touches the scene graph; Three never handles timing. Both
libraries stay in the lane they're good at.

```js
function morph(from, to, t) {
  const pos = geo.attributes.position.array;
  for (let i = 0; i < pos.length; i++) {
    pos[i] = from[i] + (to[i] - from[i]) * t;
  }
  geo.attributes.position.needsUpdate = true;
}
```

Sample the mask mesh into a **fixed point count** so every state is the
same-length array. Then all transitions are a lerp. Use `MeshSurfaceSampler`
from `three/examples/jsm/math/`.

### Rules

- **Never let a scene sit perfectly still.** Even at rest, run a slow noise
  offset. A frozen 3D scene reads as a crash to an audience.
- **Ease out on entry, ease in on exit.** `easeOutExpo` arriving, `easeInQuad`
  leaving. Most of what separates smooth from janky.
- **Stagger everything.** Never let multiple elements appear simultaneously.
  ~200ms apart reads as choreographed instead of clunky.
- **Shatter needs noise.** Outward velocity plus curl noise, or it looks like a
  uniform expanding balloon.
- **Prevention convergence is staggered on purpose.** Lights return one at a
  time. That *is* the "early intervention" beat, visually.

---

## 8. Sizing and layout

The only hard requirement: **it fits any common monitor with no overflow, at any
aspect ratio, without manual adjustment.**

### Canvas

Resize handler on `window`, driven by the container rather than the viewport, so
it behaves the same in fullscreen and windowed:

```js
function resize() {
  const { clientWidth: w, clientHeight: h } = container;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(container);
```

`ResizeObserver` rather than the `resize` event — it also fires on fullscreen
toggle, devtools open, and window snapping, which the plain event misses.

### Framing the mask

The mask must never crop, and must never float in a sea of empty space. Fit it
to the **smaller** viewport dimension:

```js
// dolly the camera so the mask's bounding sphere fits with margin
const fitDistance = (radius, fovDeg, aspect) => {
  const vFov = (fovDeg * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  return (radius * 1.35) / Math.sin(Math.min(vFov, hFov) / 2);
};
```

The `1.35` is breathing room. On a wide monitor the vertical FOV binds; on a
narrow or portrait one the horizontal does. Taking the minimum handles both
without a branch.

### Captions

- Font size in `clamp()`, not fixed px: `clamp(1.75rem, 4.5vw, 5rem)`.
- Caption block max-width `min(90vw, 60ch)` so the refusal sentence wraps
  cleanly instead of running off the edge on a 16:9 display.
- Anchor to a safe area inset — `padding: max(4vh, 2rem) max(6vw, 2rem)` — so
  nothing sits against a bezel or gets clipped by projector overscan.
- Never position captions by absolute px offsets from a shard. Use
  `shardlabel.js` to project the 3D shard position to screen space each frame,
  then clamp the resulting position inside the safe area.

### Point scale

Point size must scale with viewport height or the mask looks sparse on a large
display and clogged on a small one:

```js
material.size = baseSize * (container.clientHeight / 900);
```

Do this in the resize handler, not per frame.

### Sanity check

Before presentation day, load the deck and drag the window from very narrow to
full width, and toggle fullscreen mid-beat. Nothing should crop, overflow, or
jump. That single test catches essentially every sizing bug this deck can have.

---

## 9. Q&A hold

Q&A follows the presentation, so the deck needs somewhere to live that isn't the
final frame frozen on screen.

`Q` toggles into **the ember field** and `Q` again returns to `close-02`. It is
a mode, not a beat — Q&A length is unknown, and you may want to return to the
close for a final line.

**The ember field.** The lantern has dispersed. The same points, now loose warm
embers in slow independent orbit, drifting upward and re-seeding at the bottom,
brightness breathing gently out of phase with each other. All four festival hues
present but low. No caption, no mask, no structure.

Why it works: it is unmistakably *after* the piece rather than a screensaver,
it carries the ending's warmth without re-asserting the argument, and it holds
attention loosely enough that the room looks at the person answering the
question instead of the screen.

Keep it slow. Anything energetic competes with the answer being given. Target
something you could watch for ten minutes without noticing a loop.

---

## 10. Live operation

A dedicated operator drives the deck. Both speakers keep their hands free and
their eyes on the room.

**The operator's job is the handoff column.** Seven speaker changes, flagged
`handoff: true` in the manifest. The cue field on each beat says where in the
sentence to click — most are on a specific word or a dash, not at the end of a
line.

**Nothing is on a timer,** so a late click is invisible and an early one is not.
When unsure, wait. The scenes all drift at rest, so a held beat never looks
broken.

**The two deliberate pauses:**

- After `cold-01` — three beats of silence before the second line.
- After `eff-02` — FOUR full seconds of black before Prevention. Use `B`, not a
  black slide, so the length is decided in the moment. (This rule said two
  seconds in one place and four in another for a while; four is correct, and the
  beat's own `cue` is the authority.)

### Failsafes

1. **Run locally, not from GitHub Pages.** Venue wifi will fail. Build, then
   serve `dist/` from the operator's machine. The Pages deploy is the backup
   that works from any machine.
2. **Screen-record a full clean run.** If everything dies, play the video and
   keep speaking.
3. Hide the cursor after ~2s idle; disable right-click and scroll; fullscreen on
   keypress only — browsers block programmatic fullscreen without user
   interaction.

### Rehearsal

Run it once with slides but no voice, clicking at speaking pace. You will
immediately feel which beats sit too long with nothing happening. Those need a
subtle drift or a staggered reveal to stay alive.

Then run it once with the operator and both speakers together. The seven
handoffs are the only thing in this production that can't be fixed in code.

---

## 11. Build order

1. **`beats.js`** — full script and captions, no visuals. Read it aloud. Time it.
2. **`deck.js`** — click through 26 empty beats. Get resize and fit correct here,
   before any geometry exists to hide the bug.
3. **`mask.js`** — sampled point states.
4. **Roots + Prevention together** — they're mirrors; build them as a pair.
5. **Effects shatter** — the one genuinely expensive scene.
6. **Cold open, title, refusal, close.**
7. **`qna.js`** — the ember field.
8. **Polish pass** — easing, stagger, caption timing.

Getting the manifest and navigation working *before* any 3D means there is a
presentable deck from day one that only gets prettier. Build visuals first and
you end up a week out with four gorgeous scenes and no way to navigate them.

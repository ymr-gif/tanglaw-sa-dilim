# Tanglaw sa Dilim

*Illuminating Campus Extremism and Aggression*

A live-presented advocacy deck. One MassKara mask of 12,000 points, morphing
through 22 beats, driven by an operator's keyboard.

**Live:** <https://ymr-gif.github.io/tanglaw-sa-dilim/>

The Pages deploy is the **backup**, not the plan. On presentation day, run the
built deck from the operator's own machine — see "Running it" below.

- **[`docs/RUNSHEET.md`](docs/RUNSHEET.md)** — every beat: what is said, where to
  click, what the deck does, what the audience reads. Start here to review the
  deck or point at a beat that needs changes.
- **`CONTEXT.md`** — why every decision is what it is. Read this first.
- **`src/beats.js`** — the script, the captions, the staging cues. The manifest.
  Rewriting the speech means editing this file and nothing else.
- **`docs/superpowers/specs/`** — the implementation spec.

---

## Running it

```bash
npm install
npm run dev            # http://localhost:5173
```

For the presentation itself:

```bash
npm run build
npm run preview        # serves dist/ locally
```

**Run it locally on presentation day, not from a hosted URL.** Venue wifi will
fail. The build has no runtime network dependency at all — fonts are self-hosted
and there are no CDN links — so `dist/` works from a laptop with the wifi off.

---

## Controls

| Key | Action |
|---|---|
| `→` / `Space` / click | Next beat |
| `←` | Previous beat |
| `1`–`8` | Jump to section |
| `Q` | Toggle the Q&A ember field |
| `B` | Black the screen (toggle) |
| `F` | Fullscreen |
| `H` | Show/hide the tracker (review chrome) |

Sections for the number keys: `1` cold open, `2` threshold, `3` title,
`4` roots, `5` effects, `6` prevention, `7` refusal, `8` close.

**Nothing is on a timer.** A late click is invisible; an early one is not. When
unsure, wait — every scene drifts at rest, so a held beat never looks broken.

**A click during an animation finishes it instantly and then advances.** One
click is always one beat. Nothing queues, and the deck can never end up running
behind the speaker.

---

## Pointing at a beat that needs changes

The tracker in the bottom corners shows where you are:

```
← → Space · 1-8 jump · Q qna · B black · H hide        07 / 22   roots-02   BR
```

- **`07 / 22`** — position, and the bar along the bottom fills as you go.
- **`roots-02`** — the beat's id. **Quote this, not the number.** `beats.js` says
  ids are stable and are never renumbered, so `roots-02` still means the same
  beat after something gets inserted, and "slide 7" does not.
- **`BR`** — who is speaking. The box is drawn around it on handoff beats, so
  the operator can see a speaker change coming.

**It hides itself in fullscreen**, which is the only state the deck is ever
presented in, and comes back when you exit. `H` overrides either way. So
reviewing shows it, presenting never does, and nobody has to remember.

Feedback that lands directly: *"`roots-02` — the shard lights too fast"* or
*"`eff-01` — hold the empty seat longer."*

**[`docs/RUNSHEET.md`](docs/RUNSHEET.md)** has every beat written out — speaker,
script, click cue, on-screen text, and what the deck does — with an anchor per
id, so `docs/RUNSHEET.md#roots-02` links straight to the one you mean.

### After rewriting the speech

The run sheet is **generated**, never hand-edited. Edit `src/beats.js`, then:

```bash
npm run runsheet     # regenerates docs/RUNSHEET.md
```

CI fails if you forget. That is deliberate: a run sheet that quietly disagrees
with the deck is worse than no run sheet, because people trust it.

---

## The operator's job: the handoff column

Six speaker changes. These are the only moments that cannot be fixed in code.

| Beat | Handoff | Click cue |
|---|---|---|
| `thresh-01` | BR → **CH** | on "morning bell" |
| `title-01` | CH → **BR** | with the title, not before it |
| `eff-00` | BR → **CH** | on "Effects" — then let the break finish |
| `prev-00` | CH → **BR** | on "Prevention" |
| `ref-01` | BR → **CH** | read the caption aloud, in sync with the room |
| `close-01` | CH → **BR** | final shard seats on "bringing the light" |

Each beat's `cue` field in `beats.js` says where in the sentence to click — most
are on a specific word or a dash, not at the end of a line. Print the manifest
for the run sheet.

### The two deliberate pauses

1. **After `cold-01`** — three full beats of silence before the second line.
2. **After `eff-03`** — two full seconds of black before Prevention. Use `B`, so
   the length is decided in the moment rather than baked into a slide.

---

## What the deck does, structurally

One object in five states. The same mask assembles, cracks, shatters, relights,
and lifts — that repetition is what carries the narrative.

| Section | Mask state |
|---|---|
| Cold open | Scattered dim points, drifting, no face yet |
| Roots | Points pull into a face — fractured, the smile cracked |
| Effects | The mask shatters outward |
| Prevention | Points converge and warm, one shard at a time |
| Close | The whole mask lifts and becomes a lantern |

Three rules the code enforces, and any change has to keep:

1. **Festival colour appears only in Prevention onward.** Cold open, Threshold,
   Title, Roots and Effects are near-monochrome. Only `prevention.js`,
   `refusal.js`, `close.js` and `qna.js` may write a festival hue.
2. **Caption case is load-bearing.** Lowercase in the darkness, uppercase in the
   light. Text renders verbatim from `beats.js`; there is no `text-transform`
   anywhere in the project.
3. **Roots and Prevention are structural mirrors.** Four shards, same four
   positions, same order. What broke it is what fixes it — never said aloud,
   because the geometry says it.

---

## Before presentation day

1. **Sizing check.** Load the deck, drag the window from very narrow to full
   width, and toggle fullscreen mid-beat. Nothing should crop, overflow, or
   jump. This catches essentially every sizing bug the deck can have.
2. **Rehearse once with slides but no voice**, clicking at speaking pace. You
   will feel which beats sit too long with nothing happening.
3. **Rehearse once with the operator and both speakers.** The six handoffs are
   the only thing in this production that cannot be fixed in code.
4. **Screen-record a full clean run.** If everything dies, play the video and
   keep speaking.

---

## The mask art

`assets/mask-art.png` is the actual MassKara mask for the curriculum. It is
sampled directly as a bitmap rather than traced into vectors, so the crown, the
pink swirl and the painted face are the real artwork — and every point carries
the colour it was sampled from, which is what the Close lights the mask with.

To replace it:

- Keep it roughly square with the face centred, or update `ANCHORS_ART` in
  `src/mask.js` so the four shard anchors still land on the left cheek, the
  right eye, the mouth, and the crown's crest.
- **The background must be pure white** (255,255,255) and the mask must not be.
  That is how the sampler separates them — and it is why the eye holes come out
  hollow for free, since they are white in the artwork too.
- Colourful areas attract more points than flat ones by design. If a replacement
  reads too sparse, the weights are one line in `samplePoints`.

Nothing else changes — `mask.js` samples whatever is in the file.

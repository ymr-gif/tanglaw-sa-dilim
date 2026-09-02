/**
 * mask.js — the mask, sampled once into points, and every state it can be in.
 *
 * "Sample the mask mesh into a fixed point count so every state is the
 *  same-length array. Then all transitions are a lerp." (CONTEXT.md §7)
 *
 * That single constraint is what makes this deck work. There is one object with
 * POINTS points; a "state" is just another POINTS-long Float32Array of target
 * positions. Cold open, mask, shatter, classroom grid, lantern, embers — all
 * the same points, so any state can become any other state without a special
 * case anywhere in the codebase.
 *
 * THE ART IS SAMPLED FROM THE REAL MASK
 *
 * `assets/mask-art.png` is the actual MassKara mask for the curriculum. Rather
 * than trace it into vectors and lose its identity, we sample the bitmap
 * directly: pixels are weighted by edge strength and saturation, so the points
 * land on the crown's petals, the pink swirl, the lips and the face's outline
 * instead of spreading evenly over a large flat fill. The hollow eyes come free
 * — they are pure white in the artwork, which reads as background.
 *
 * Every point also remembers the colour it was sampled from (`artColor`). That
 * is what lets the Close light the mask in its OWN pink and gold rather than in
 * colours someone picked to approximate it.
 *
 * Colour *choice* still belongs to the scenes, and to the rule in §3 that says
 * when festival hues may appear at all.
 */

import { Color, SRGBColorSpace, Vector3 } from 'three';

import artUrl from '../assets/mask-art.png?url';
import { POINTS } from './theme.js';
import { seededRandom } from './noise.js';

/**
 * The four shard anchors, in the artwork's own pixel coordinates (1170x1170).
 * They are transformed with the art, so replacing the image only requires
 * moving these to wherever the features ended up.
 *
 * Order is load-bearing and identical in Roots and Prevention — same four
 * positions, same order. What broke it is what fixes it, and the geometry says
 * so without anyone having to (§3).
 */
const ANCHORS_ART = [
  [395, 600], // 0 left cheek + left crown   — bullying      -> CAPACITATE
  [775, 600], // 1 right eye + right crown   — untreated     -> TRAIN
  [590, 830], // 2 mouth and chin            — to be seen    -> REDESIGN
  [590, 210], // 3 the crown's crest         — weaponized    -> EMPOWER
];

/**
 * Where the mask breaks from, in the artwork's pixel coordinates. Sits on the
 * face between the eyes — cracks radiate from here.
 */
const CRACK_ORIGIN_ART = [590, 690];

/**
 * The mask's face, in the artwork's pixel coordinates — the region that gets
 * sampled harder than its area deserves, so the headpiece cannot drown it.
 */
const FACE_CENTER_ART = [592, 715];
const FACE_SIGMA_ART = 205;

/** Resolution the artwork is rasterised at before sampling. */
const RASTER = 620;

/** Anything this close to white is the artwork's background, not the mask. */
const WHITE_CUT = 247;

/**
 * How far each shard travels when the mask breaks, and how wrong it goes.
 *
 * Deliberately small. These were three times larger when the mask was a simple
 * line-art outline, where big gaps still read as "a cracked face". The real
 * artwork carries a crown, a swirl and a painted face, and at that scale the
 * same displacement stops reading as damage and starts reading as four
 * unrelated shapes — the mask has to stay recognisable while it is broken, or
 * the Prevention mirror has nothing to put back together.
 */
const FRACTURE = [
  { mag: 0.135, rot: 0.085, sx: 1.0, sy: 1.0 },
  { mag: 0.135, rot: -0.085, sx: 1.0, sy: 1.0 },
  { mag: 0.120, rot: 0.070, sx: 1.0, sy: 1.0 },
  // Shard 3 is the intruder. It travels further, turns much further, and is
  // scaled non-uniformly, so it visibly does not belong to the same face
  // before a word is said about it (§6).
  { mag: 0.290, rot: 0.260, sx: 1.08, sy: 0.93 },
];

/** Classroom grid used by Effects. 30 desks, ~233 points each. */
const GRID_COLS = 6;
const GRID_ROWS = 5;
export const DESKS = GRID_COLS * GRID_ROWS;

export async function loadMask() {
  const art = await rasterise();
  const sampled = samplePoints(art);

  const { positions, radius, halfW, halfH } = normalize(sampled.positions, sampled.bounds);
  const anchors = ANCHORS_ART.map(([x, y]) =>
    new Vector3(
      (x - sampled.bounds.cx) / sampled.bounds.scale,
      -(y - sampled.bounds.cy) / sampled.bounds.scale,
      0
    )
  );

  // The break starts on the face, not at the image's centre — the crown sits
  // high, so the bounding-box centre is above the face and cracks radiating
  // from it would miss the features they are supposed to split.
  const crackOrigin = new Vector3(
    (CRACK_ORIGIN_ART[0] - sampled.bounds.cx) / sampled.bounds.scale,
    -(CRACK_ORIGIN_ART[1] - sampled.bounds.cy) / sampled.bounds.scale,
    0
  );

  const shardOf = assignShards(positions, crackOrigin);
  const deskOf = new Uint8Array(POINTS);
  for (let i = 0; i < POINTS; i++) deskOf[i] = i % DESKS;

  const states = buildStates(positions, shardOf, crackOrigin);

  return {
    shardState: states.shardState,
    base: positions,
    artColor: sampled.artColor,
    artLuma: sampled.artLuma,
    radius,
    halfW,
    halfH,
    anchors,
    shardOf,
    deskOf,
    states,
  };
}

/* ── Artwork -> weighted pixel field ────────────────────────────────────── */

async function rasterise() {
  const img = new Image();
  img.src = artUrl;
  await img.decode();

  const w = RASTER;
  const h = Math.max(1, Math.round((RASTER * img.height) / img.width));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, w, h);

  return { data: g.getImageData(0, 0, w, h).data, w, h };
}

/**
 * Weight every pixel, then draw POINTS samples from that distribution.
 *
 * The weighting is the whole trick. A flat "every non-white pixel" sample would
 * spread 7000 points thinly over a very large shape and read as noise. Weighting
 * by edge and saturation instead puts them where the drawing actually is: the
 * outlines, the petals, the swirl, the lips.
 */
function samplePoints({ data, w, h }) {
  const weight = new Float32Array(w * h);

  // The face, in raster pixels. Everything about this artwork is dominated by
  // the headpiece; this is the counterweight.
  const toRaster = w / 1170;
  const FACE_C = [FACE_CENTER_ART[0] * toRaster, FACE_CENTER_ART[1] * toRaster];
  const faceSigma = FACE_SIGMA_ART * toRaster;
  const FACE_DENOM = 2 * faceSigma * faceSigma;
  const FACE_GAIN = 2.6;

  /** How far the headpiece falls back in tone relative to the face. */
  const CROWN_FLOOR = 0.52;

  const lumaAt = (x, y) => {
    const i = (y * w + x) * 4;
    return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  };

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);

      // Background. The mask's white face survives this because it is faintly
      // blue (241,243,255) while the page behind it is a true 255 white — and
      // the eye holes are true white too, which is exactly why they stay hollow.
      if (mn >= WHITE_CUT && mx >= WHITE_CUT) continue;

      const sat = (mx - mn) / 255;

      // Sobel-lite: enough to find the drawing's edges without the cost.
      const gx = Math.abs(lumaAt(x + 1, y) - lumaAt(x - 1, y));
      const gy = Math.abs(lumaAt(x, y + 1) - lumaAt(x, y - 1));
      const edge = Math.min(1, Math.hypot(gx, gy) / 140);

      /*
       * EDGE-DOMINANT, ON PURPOSE — this is what stops the crown eating the deck.
       *
       * The headpiece is roughly 70% of the artwork's area. Weighting by area
       * (or by colour, which is spread over the same area) hands it ~70% of the
       * points, and it renders as a large bright mass beside a small face. No
       * amount of tuning colour fixes that, because the problem is mass.
       *
       * Weighting by edge converts the crown from a filled shape into its own
       * outline: the petals, the lotus motifs and the banding all become lines.
       * That collapses its visual weight and turns it into a frame AROUND the
       * face instead of a competitor to it — and it is denser along every line,
       * which is what carries on a projector.
       *
       * The face then gets an explicit boost on top, because it is the subject
       * of a piece about children behind masks and it should not have to win an
       * argument about surface area to be seen.
       */
      const fdx = x - FACE_C[0];
      const fdy = y - FACE_C[1];
      const faceBoost = 1 + FACE_GAIN * Math.exp(-(fdx * fdx + fdy * fdy) / FACE_DENOM);

      weight[y * w + x] = (0.05 + sat * 0.85 + edge * 3.4) * faceBoost;
    }
  }

  // Cumulative distribution, then one binary search per point.
  const cdf = new Float64Array(w * h);
  let total = 0;
  for (let i = 0; i < weight.length; i++) {
    total += weight[i];
    cdf[i] = total;
  }
  if (total <= 0) throw new Error('mask-art.png produced no sampleable pixels.');

  const rand = seededRandom(0x7ab1e2026);
  const positions = new Float32Array(POINTS * 3);
  const artColor = new Float32Array(POINTS * 3);
  const artLuma = new Float32Array(POINTS);
  const color = new Color();

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let n = 0; n < POINTS; n++) {
    const target = rand() * total;

    let lo = 0;
    let hi = cdf.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cdf[mid] < target) lo = mid + 1;
      else hi = mid;
    }

    const px = lo % w;
    const py = (lo / w) | 0;

    // Sub-pixel jitter, or the field visibly sits on a raster grid.
    const x = px + rand();
    const y = py + rand();

    const n3 = n * 3;
    positions[n3] = x;
    positions[n3 + 1] = y;
    positions[n3 + 2] = 0;

    const i = lo * 4;
    color.setRGB(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255, SRGBColorSpace);
    artColor[n3] = color.r;
    artColor[n3 + 1] = color.g;
    artColor[n3 + 2] = color.b;

    // Per-point tone, taken from how bright that pixel is in the artwork.
    // This is what stops the mask reading as a flat silhouette in the sections
    // that are deliberately monochrome: the face, the swirl and the crown's
    // petals still differ from each other in value even when they share a hue.
    const luma = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;

    /*
     * ...and then the headpiece is held back.
     *
     * Sampling density alone does not decide what a viewer looks at —
     * brightness does. Even outlined, a crown covering most of the frame at the
     * same luminance as the face still reads as the subject. Falling the tone
     * off with distance from the face makes the crown a frame around it, which
     * is the job it should have been doing all along.
     */
    const fdx = x - FACE_C[0];
    const fdy = y - FACE_C[1];
    const near = Math.exp(-(fdx * fdx + fdy * fdy) / FACE_DENOM);

    artLuma[n] = (0.58 + luma * 0.55) * (CROWN_FLOOR + (1 - CROWN_FLOOR) * near);

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  // Anchors are authored against the full-resolution artwork, so report bounds
  // in those coordinates rather than the raster's.
  const toArt = 1170 / w;
  return {
    positions,
    artColor,
    artLuma,
    bounds: {
      cx: ((minX + maxX) / 2) * toArt,
      cy: ((minY + maxY) / 2) * toArt,
      scale: (Math.max(maxX - minX, maxY - minY) / 2) * toArt,
      toArt,
    },
  };
}

/**
 * Centre on the art, flip Y (images count downward, Three counts up), scale to a
 * bounding radius of ~1, and give z a whisper of depth so the field has volume
 * when it drifts.
 */
function normalize(positions, bounds) {
  const rand = seededRandom(0xa11c2026);
  let radius = 0;
  let halfW = 0;
  let halfH = 0;

  for (let i = 0; i < POINTS; i++) {
    const i3 = i * 3;
    const x = (positions[i3] * bounds.toArt - bounds.cx) / bounds.scale;
    const y = -(positions[i3 + 1] * bounds.toArt - bounds.cy) / bounds.scale;
    const z = (rand() * 2 - 1) * 0.02;

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    const d = Math.hypot(x, y, z);
    if (d > radius) radius = d;
    if (Math.abs(x) > halfW) halfW = Math.abs(x);
    if (Math.abs(y) > halfH) halfH = Math.abs(y);
  }

  return { positions, radius, halfW, halfH };
}

/**
 * Split the mask into four shards along CRACKS, not along a Voronoi diagram.
 *
 * Nearest-anchor assignment is the obvious way to do this and it is the reason
 * the break used to read as four parallel bands: the boundary between two
 * nearest-anchor regions is a perpendicular bisector, which is perfectly
 * straight, and four sites laid out top/left/right/bottom produce four straight
 * cuts. That is a sliced image, not a cracked one.
 *
 * Real breakage radiates from a point and wanders. So: sectors by ANGLE around
 * a single origin sitting on the face, with the sector boundaries perturbed by
 * radius so each crack zig-zags outward instead of running true. The four
 * sectors still land on the four meanings — left cheek, right eye, mouth,
 * crown — because those features sit in those directions from the face.
 */
function assignShards(positions, origin) {
  const shardOf = new Uint8Array(POINTS);
  const QUARTER = Math.PI / 2;

  for (let i = 0; i < POINTS; i++) {
    const i3 = i * 3;
    const dx = positions[i3] - origin.x;
    const dy = positions[i3 + 1] - origin.y;

    const r = Math.hypot(dx, dy);

    // Two frequencies so the crack has both a long wander and a finer jag, plus
    // a positional term so the four cracks are not mirror images of each other.
    // Mostly ONE low frequency. The earlier version stacked a strong high
    // frequency on top, which does not draw a jagged line — it dithers the
    // boundary, so points of two shards interleave in a speckled band and the
    // crack reads as noise. A crack has to stay a line while it wanders.
    const wobble =
      0.26 * Math.sin(r * 6.0 + 2.1) +
      0.06 * Math.sin(r * 15.0 + 0.6) +
      0.05 * Math.sin(positions[i3] * 7.0 + positions[i3 + 1] * 5.0);

    let a = Math.atan2(dy, dx) + wobble;

    // Fold to 0..2pi.
    a = ((a % TAU) + TAU) % TAU;

    // Deliberately UNEQUAL sectors. Equal quarters look right on paper and are
    // wrong here: the crown occupies an enormous area straight up from the
    // face, so an even "up" quarter hands half the artwork to shard 3 — and
    // shard 3 is meant to be a foreign *fragment*, not the largest piece on
    // screen. A narrow wedge for the crest, and the crown's wings fall to the
    // left and right shards instead, so every crack runs through both the
    // crown and the face like a break through one object.
    if (a >= SECTOR[3] || a < SECTOR[0]) shardOf[i] = 1; // right — eye
    else if (a < SECTOR[1]) shardOf[i] = 3; // narrow wedge up — crest
    else if (a < SECTOR[2]) shardOf[i] = 0; // left — cheek
    else shardOf[i] = 2; // down — mouth
  }

  return shardOf;
}

/**
 * How much of the break Prevention is still holding when it begins. High on
 * purpose: the section's whole job is to put the mask back together, and there
 * is nothing to watch if the pieces started nearly home.
 */
export const BROKEN = 0.82;

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

/** Sector boundaries, CCW from +x. See the note in assignShards. */
const SECTOR = [65 * DEG, 115 * DEG, 205 * DEG, 335 * DEG];

/** Unit direction each shard drifts along when the mask breaks. */
const SHARD_DIR = [
  [-1, 0], // 0 left cheek
  [1, 0], // 1 right eye
  [0, -1], // 2 mouth
  [0, 1], // 3 crown crest
];

/* ── States ─────────────────────────────────────────────────────────────── */

function buildStates(base, shardOf, origin) {
  const rand = seededRandom(0x7a9f2026);
  const buf = () => new Float32Array(POINTS * 3);

  /** Shared shard displacement, scaled — 1 is fully broken, 0 is seated. */
  function shardState(kByShard) {
    const out = buf();

    for (let i = 0; i < POINTS; i++) {
      const i3 = i * 3;
      const shard = shardOf[i];
      const f = FRACTURE[shard];
      const dir = SHARD_DIR[shard];

      // How much of the break THIS shard is still holding: 1 is fully broken
      // away, 0 is seated. Per-shard, so Prevention can bring one home at a
      // time while the rest stay where they broke to.
      const k = kByShard[shard];

      // Everything pivots about the ONE point the mask broke from, not about
      // each piece's own middle. Pieces that rotate about a shared origin stay
      // hinged to each other and open into wedges — the gap is hairline at the
      // centre and widest at the rim, which is what a crack looks like. Pieces
      // that rotate about their own centroids just slide past one another.
      const px = base[i3] - origin.x;
      const py = base[i3 + 1] - origin.y;

      const a = f.rot * k;
      const cos = Math.cos(a);
      const sin = Math.sin(a);

      const sx = 1 + (f.sx - 1) * k;
      const sy = 1 + (f.sy - 1) * k;

      out[i3] = origin.x + (px * sx * cos - py * sy * sin) + dir[0] * f.mag * k;
      out[i3 + 1] = origin.y + (px * sx * sin + py * sy * cos) + dir[1] * f.mag * k;
      out[i3 + 2] = base[i3 + 2] + (Math.abs(k) > 0.001 ? (rand() - 0.5) * 0.04 * k : 0);
    }
    return out;
  }

  /** Cold open: no structure, no face. Just a field. */
  function scatter(spreadX, spreadY, spreadZ, centreBias = 0) {
    const out = buf();
    for (let i = 0; i < POINTS; i++) {
      const i3 = i * 3;
      let rx = rand() * 2 - 1;
      let ry = rand() * 2 - 1;
      if (centreBias) {
        // Averaging two rolls pulls the field gently toward the middle without
        // ever forming an edge the eye can read as a shape.
        rx = (rx + (rand() * 2 - 1)) / 2;
        ry = (ry + (rand() * 2 - 1)) / 2;
      }
      out[i3] = rx * spreadX;
      out[i3 + 1] = ry * spreadY;
      out[i3 + 2] = (rand() * 2 - 1) * spreadZ;
    }
    return out;
  }

  /**
   * Threshold: two clouds, identical silhouette, one per side. Index parity
   * splits the points, so each side is the same full shape at half density
   * rather than half a mask each.
   */
  function split() {
    const out = buf();
    const s = 0.46;
    for (let i = 0; i < POINTS; i++) {
      const i3 = i * 3;
      const side = i % 2 === 0 ? -0.53 : 0.53;
      out[i3] = base[i3] * s + side;
      out[i3 + 1] = base[i3 + 1] * s + 0.02;
      out[i3 + 2] = base[i3 + 2] * s;
    }
    return out;
  }

  /** Effects: outward velocity plus curl, or it looks like a balloon (§7). */
  function shattered() {
    const out = buf();
    for (let i = 0; i < POINTS; i++) {
      const i3 = i * 3;
      const x = base[i3];
      const y = base[i3 + 1];
      const len = Math.hypot(x, y) || 1;
      const throwOut = 0.5 + rand() * 0.85;

      out[i3] = x + (x / len) * throwOut + (rand() - 0.5) * 0.5;
      out[i3 + 1] = y + (y / len) * throwOut + (rand() - 0.5) * 0.5;
      out[i3 + 2] = base[i3 + 2] + (rand() - 0.5) * 0.55;
    }
    return out;
  }

  /**
   * "families lose their loved ones" — the absence has a shape. Points fill a
   * dim field and are excluded from a chair silhouette, so what the audience
   * reads is the empty seat, not a drawing of a chair.
   */
  function seat() {
    // Large relative to the field on purpose. An absence only reads as a shape
    // if it is big enough and the field around it is dense enough — a small
    // hole in a sparse scatter reads as nothing at all.
    const chair = [
      [-0.30, 0.33, 0.03, 0.66], // backrest
      [-0.38, 0.38, -0.11, 0.05], // seat slab
      [-0.35, -0.25, -0.70, -0.09], // left legs
      [0.25, 0.35, -0.70, -0.09], // right legs
    ];
    const inside = (x, y) =>
      chair.some(([x0, x1, y0, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);

    const out = buf();
    for (let i = 0; i < POINTS; i++) {
      const i3 = i * 3;
      let x = 0;
      let y = 0;
      // Rejection sampling. Twelve tries is plenty for a hole this size; the
      // fallback only exists so a bad edit to `chair` can never hang the deck.
      for (let attempt = 0; attempt < 12; attempt++) {
        x = (rand() * 2 - 1) * 1.12;
        y = (rand() * 2 - 1) * 0.82;
        if (!inside(x, y)) break;
        if (attempt === 11) x = x < 0 ? x - 0.5 : x + 0.5;
      }
      out[i3] = x;
      out[i3 + 1] = y;
      out[i3 + 2] = (rand() * 2 - 1) * 0.24;
    }
    return out;
  }

  /** Effects: a classroom seating chart, abstract. Never depict the act. */
  function grid() {
    const out = buf();
    const spanX = 2.3;
    const spanY = 1.25;

    for (let i = 0; i < POINTS; i++) {
      const i3 = i * 3;
      const desk = i % DESKS;
      const col = desk % GRID_COLS;
      const row = Math.floor(desk / GRID_COLS);

      const cx = (col / (GRID_COLS - 1) - 0.5) * spanX;
      const cy = (0.5 - row / (GRID_ROWS - 1)) * spanY;

      // A small flat cluster per desk — wider than tall, so a grid of them
      // reads as furniture rather than as dots.
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand());
      out[i3] = cx + Math.cos(a) * r * 0.085;
      out[i3 + 1] = cy + Math.sin(a) * r * 0.05;
      out[i3 + 2] = (rand() * 2 - 1) * 0.05;
    }
    return out;
  }

  /** Close: the whole mask lifts. The per-frame stream is close.js's job. */
  function lantern() {
    const out = buf();
    for (let i = 0; i < POINTS; i++) {
      const i3 = i * 3;
        out[i3] = base[i3] * 0.78;
      out[i3 + 1] = base[i3 + 1] * 0.78 + 0.10;
      out[i3 + 2] = base[i3 + 2];
    }
    return out;
  }

  /** Q&A: no mask, no structure. Seed positions; qna.js does the orbiting. */
  function embers() {
    const out = buf();
    for (let i = 0; i < POINTS; i++) {
      const i3 = i * 3;
      out[i3] = (rand() * 2 - 1) * 1.5;
      out[i3 + 1] = (rand() * 2 - 1) * 0.95;
      out[i3 + 2] = (rand() * 2 - 1) * 0.45;
    }
    return out;
  }

  const assembled = Float32Array.from(base);

  return {
    void: scatter(1.7, 1.0, 0.7),
    drift: scatter(1.55, 0.9, 0.6, 1),
    split: split(),
    assembled,
    complete: assembled, // identical geometry; the difference at close-01 is light
    fractured: shardState([1, 1, 1, 1]),
    converged: shardState([BROKEN, BROKEN, BROKEN, BROKEN]),
    shattered: shattered(),
    seat: seat(),
    grid: grid(),
    lantern: lantern(),
    embers: embers(),

    /** Build a geometry with an arbitrary per-shard break amount. */
    shardState,
  };
}

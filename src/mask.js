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
  { mag: 0.085, rot: 0.05, sx: 1.0, sy: 1.0 },
  { mag: 0.085, rot: -0.05, sx: 1.0, sy: 1.0 },
  { mag: 0.075, rot: 0.04, sx: 1.0, sy: 1.0 },
  // Shard 3 is the intruder. It travels further, turns much further, and is
  // scaled non-uniformly, so it visibly does not belong to the same face
  // before a word is said about it (§6).
  { mag: 0.165, rot: 0.20, sx: 1.10, sy: 0.90 },
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

  const shardOf = assignShards(positions, anchors);
  const deskOf = new Uint8Array(POINTS);
  for (let i = 0; i < POINTS; i++) deskOf[i] = i % DESKS;

  const states = buildStates(positions, shardOf, anchors);

  return {
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

      // Balanced by eye against the render, not derived. The base term keeps
      // the near-white face present at all; the saturation term has to
      // outweigh it, because a point count spread evenly over this artwork puts
      // most of itself on neutral pixels and the whole mask comes out grey.
      weight[y * w + x] = 0.22 + sat * 2.3 + edge * 1.7;
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
    artLuma[n] = 0.58 + luma * 0.55;

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

/** Nearest anchor wins, so all POINTS belong to exactly one of four shards. */
function assignShards(positions, anchors) {
  const shardOf = new Uint8Array(POINTS);

  for (let i = 0; i < POINTS; i++) {
    const i3 = i * 3;
    const x = positions[i3];
    const y = positions[i3 + 1];

    let best = 0;
    let bestD = Infinity;
    for (let s = 0; s < anchors.length; s++) {
      const dx = x - anchors[s].x;
      const dy = y - anchors[s].y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    shardOf[i] = best;
  }

  return shardOf;
}

/* ── States ─────────────────────────────────────────────────────────────── */

function buildStates(base, shardOf, anchors) {
  const rand = seededRandom(0x7a9f2026);
  const buf = () => new Float32Array(POINTS * 3);

  // Per-shard centroid — the pivot a shard rotates about when it breaks away.
  const centroids = anchors.map(() => ({ x: 0, y: 0, n: 0 }));
  for (let i = 0; i < POINTS; i++) {
    const c = centroids[shardOf[i]];
    c.x += base[i * 3];
    c.y += base[i * 3 + 1];
    c.n++;
  }
  for (const c of centroids) {
    if (c.n) {
      c.x /= c.n;
      c.y /= c.n;
    }
  }

  /** Shared shard displacement, scaled — 1 is fully broken, 0 is seated. */
  function shardState(amount, only3 = null) {
    const out = buf();
    for (let i = 0; i < POINTS; i++) {
      const i3 = i * 3;
      const s = shardOf[i];
      const f = FRACTURE[s];
      const c = centroids[s];

      // How much of the break this particular shard keeps. Prevention pulls
      // shards 0-2 nearly home while the intruder stays out of place.
      const k = only3 !== null && s === 3 ? only3 : amount;

      const len = Math.hypot(c.x, c.y) || 1;
      const dx = (c.x / len) * f.mag * k;
      const dy = (c.y / len) * f.mag * k;

      const a = f.rot * k;
      const cos = Math.cos(a);
      const sin = Math.sin(a);

      // Rotate and scale about the shard's own centroid, then displace.
      const px = (base[i3] - c.x) * (1 + (f.sx - 1) * k);
      const py = (base[i3 + 1] - c.y) * (1 + (f.sy - 1) * k);

      out[i3] = c.x + (px * cos - py * sin) + dx;
      out[i3 + 1] = c.y + (px * sin + py * cos) + dy;
      out[i3 + 2] = base[i3 + 2] + (Math.abs(k) > 0.001 ? (rand() - 0.5) * 0.05 * k : 0);
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
    fractured: shardState(1),
    converged: shardState(0.22, 0.72), // shards 0-2 nearly home, intruder still out
    shattered: shattered(),
    seat: seat(),
    grid: grid(),
    lantern: lantern(),
    embers: embers(),
  };
}

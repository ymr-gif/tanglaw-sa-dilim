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
 * Nothing here knows about colour. Colour is narrative, and it belongs to the
 * scenes (and to the rule in §3 that guards when festival hues may appear).
 */

import { BufferGeometry, Mesh, MeshBasicMaterial, ShapeGeometry, Vector3 } from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

import maskUrl from '../assets/mask.svg?url';
import { POINTS } from './theme.js';
import { seededRandom } from './noise.js';

/**
 * The four shard anchors, in mask.svg's own coordinates. They are transformed
 * with the art, so editing the SVG only requires updating these if the features
 * move.
 *
 * Order is load-bearing and identical in Roots and Prevention — same four
 * positions, same order. What broke it is what fixes it, and the geometry says
 * so without anyone having to (§3).
 */
const ANCHORS_SVG = [
  [222, 648], // 0 cracked cheek, left      — bullying      -> CAPACITATE
  [645, 487], // 1 hollow eye, upper right  — untreated     -> TRAIN
  [500, 890], // 2 mouth, too wide          — to be seen    -> REDESIGN
  [300, 250], // 3 foreign fragment, upper left — weaponized -> EMPOWER
];

/** How far each shard travels when the mask breaks, and how wrong it goes. */
const FRACTURE = [
  { mag: 0.17, rot: 0.06, sx: 1.0, sy: 1.0 },
  { mag: 0.17, rot: -0.07, sx: 1.0, sy: 1.0 },
  { mag: 0.16, rot: 0.05, sx: 1.0, sy: 1.0 },
  // Shard 3 is the intruder. It travels further, turns much further, and is
  // scaled non-uniformly, so it visibly does not belong to the same face
  // before a word is said about it (§6).
  { mag: 0.30, rot: 0.34, sx: 1.15, sy: 0.86 },
];

/** Classroom grid used by Effects. 30 desks, ~233 points each. */
const GRID_COLS = 6;
const GRID_ROWS = 5;
export const DESKS = GRID_COLS * GRID_ROWS;

export async function loadMask() {
  const geometry = await buildGeometry();
  const base = sampleToPoints(geometry, POINTS);

  const { positions, radius } = normalize(base.positions, base.bounds);
  const anchors = ANCHORS_SVG.map(([x, y]) =>
    new Vector3(
      (x - base.bounds.cx) / base.bounds.scale,
      -(y - base.bounds.cy) / base.bounds.scale,
      0
    )
  );

  const shardOf = assignShards(positions, anchors);
  const deskOf = new Uint8Array(POINTS);
  for (let i = 0; i < POINTS; i++) deskOf[i] = i % DESKS;

  const states = buildStates(positions, shardOf, anchors);

  return { base: positions, radius, anchors, shardOf, deskOf, states };
}

/* ── SVG -> geometry ────────────────────────────────────────────────────── */

/**
 * Fills become shape geometry; strokes become ribbon geometry. Line art is
 * mostly strokes, so a fills-only reader would sample an almost empty mask —
 * this is why both paths exist.
 */
async function buildGeometry() {
  const loader = new SVGLoader();
  const data = await loader.loadAsync(maskUrl);
  const parts = [];

  for (const path of data.paths) {
    const style = path.userData?.style ?? {};

    if (style.fill && style.fill !== 'none') {
      for (const shape of path.toShapes()) {
        parts.push(new ShapeGeometry(shape).toNonIndexed());
      }
    }

    if (style.stroke && style.stroke !== 'none') {
      for (const subPath of path.subPaths) {
        const geom = SVGLoader.pointsToStroke(subPath.getPoints(24), style);
        if (geom) parts.push(geom.index ? geom.toNonIndexed() : geom);
      }
    }
  }

  if (!parts.length) {
    throw new Error('mask.svg produced no geometry — check fill/stroke attributes.');
  }

  // Strip everything but position so the merge cannot fail on mismatched
  // attribute sets between shape geometry and stroke ribbons.
  const stripped = parts.map((g) => {
    const out = new BufferGeometry();
    out.setAttribute('position', g.getAttribute('position'));
    return out;
  });

  const merged = mergeGeometries(stripped, false);
  if (!merged) throw new Error('mask.svg geometry merge failed.');
  return merged;
}

/** Area-weighted surface sampling, so thin strokes read as even line art. */
function sampleToPoints(geometry, count) {
  const mesh = new Mesh(geometry, new MeshBasicMaterial());
  const sampler = new MeshSurfaceSampler(mesh).build();

  const positions = new Float32Array(count * 3);
  const p = new Vector3();

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < count; i++) {
    sampler.sample(p);
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = 0;

    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const scale = Math.max(maxX - minX, maxY - minY) / 2;

  return { positions, bounds: { cx, cy, scale } };
}

/**
 * Centre on the art, flip Y (SVG counts downward, Three counts up), scale to a
 * bounding radius of ~1, and give z a whisper of depth so the field has volume
 * when it drifts.
 */
function normalize(positions, bounds) {
  const rand = seededRandom(0xa11c2026);
  let radius = 0;

  for (let i = 0; i < POINTS; i++) {
    const i3 = i * 3;
    const x = (positions[i3] - bounds.cx) / bounds.scale;
    const y = -(positions[i3 + 1] - bounds.cy) / bounds.scale;
    const z = (rand() * 2 - 1) * 0.02;

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    const d = Math.hypot(x, y, z);
    if (d > radius) radius = d;
  }

  return { positions, radius };
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
      out[i3] = base[i3] * 0.84;
      out[i3 + 1] = base[i3 + 1] * 0.84 + 0.28;
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
    converged: shardState(0.28, 0.8), // shards 0-2 nearly home, intruder still out
    shattered: shattered(),
    seat: seat(),
    grid: grid(),
    lantern: lantern(),
    embers: embers(),
  };
}

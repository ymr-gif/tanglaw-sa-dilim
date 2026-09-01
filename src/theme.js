/**
 * theme.js — palette, timing, and the handful of numbers the whole deck agrees on.
 *
 * THE COLOUR RULE (CONTEXT.md §3), restated because breaking it costs the piece:
 *
 *   Darkness sections are near-monochrome. Festival colour appears only as
 *   light, and only in Prevention onward.
 *
 * Cold open, Threshold, Title, Roots and Effects may use `void`, `ash`, the
 * three DIM tints, and `intruder`. Nothing else. The four festival hues are
 * first allowed at prev-01 and are always emissive light, never flat fill.
 */

import { Color } from 'three';

export const COLOR = {
  void: 0x0b0d1a, // background. deep indigo-charcoal, NOT pure black
  ash: 0x2a2d3d, // unlit mask points
  magenta: 0xd4256b, // Prevention: guidance counselors
  marigold: 0xe8a020, // Prevention: teacher training
  cyan: 0x2bb8c9, // Prevention: classroom redesign
  jade: 0x2e9e6b, // Prevention: peer networks / CPCs
  intruder: 0x6b8f3a, // NVE shard. deliberately off-palette, sickly
};

/**
 * The Roots tints. Near-monochrome by construction — these are greys carrying
 * just enough hue to be told apart, never festival colour arriving early.
 *
 * The fourth is `intruder` itself: the one colour in the deck that does not
 * belong to the festival palette, for the one external force in the section.
 */
export const DIM = {
  violet: 0x4a3f56, // cracked cheek — bullying / discrimination
  blue: 0x39465c, // hollow eye — untreated mental health
  gold: 0x5a5140, // mouth, too wide — craving to be seen
  intruder: COLOR.intruder, // foreign fragment — NVE online
};

/** A weak lamp, for the warm half of the Threshold. Not a festival hue. */
export const LAMP = 0x6b5a48;

/** Timing constants (§7). */
export const TIME = {
  shardLight: 700,
  shatter: 1400,
  converge: 1100,
  captionIn: 400,

  /* Derived timings, kept here so pacing is tunable from one place. */
  assemble: 2200,
  fracture: 1200,
  settle: 1600,
  stagger: 200, // "~200ms apart reads as choreographed instead of clunky"
  thresholdDim: 30000, // the warm side is still dimming whenever the click lands
  lantern: 3200,
  seat: 2400,
};

/** Easing. Ease out on entry, ease in on exit (§7). anime.js v4 naming. */
export const EASE = {
  in: 'outExpo',
  out: 'inQuad',
  soft: 'inOutQuad',
};

/**
 * Fixed for the life of the deck. Every state is a POINTS-long buffer, which is
 * what makes every transition a plain lerp (§7).
 */
export const POINTS = 7000;

/** Camera breathing room around the mask's bounding sphere (§8). */
export const FIT_MARGIN = 1.35;

/** Point size at a 900px-tall container; scaled with height in the resizer. */
export const BASE_POINT_SIZE = 0.0145;

/** Reusable Color scratch — avoids allocating in the render loop. */
export const scratchColor = new Color();

/** Hex int -> [r,g,b] in linear-ish 0..1, for writing straight into buffers. */
export function rgb(hex) {
  scratchColor.setHex(hex);
  return [scratchColor.r, scratchColor.g, scratchColor.b];
}

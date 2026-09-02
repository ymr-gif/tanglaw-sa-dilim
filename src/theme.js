/**
 * theme.js — palette, timing, and the handful of numbers the whole deck agrees on.
 *
 * THE COLOUR RULE (CONTEXT.md §3), restated because breaking it costs the piece:
 *
 *   The deck's colour argument is TEMPERATURE, not saturation. Festival colour
 *   — the mask's own WARM hues — appears only as light, and only in Prevention
 *   onward.
 *
 * Cold open, Title, Roots and Effects may use `void`, `ash`, the three DIM
 * tints, and `intruder`. Two documented exceptions sit before prev-01, both
 * COLD and both earned by what they depict:
 *
 *   THRESHOLD (slides 2-3) — vivid by decision. That beat is symbolic and has
 *   to read across a lit room, so it uses the `THRESHOLD` block below: yellow
 *   student, electric-violet shadows, and `blood` for the knife.
 *
 *   EFFECTS — `blood` again, on the splat at eff-02.
 *
 * The four festival hues (`rose`, `ember`, `gold`, `fuchsia`) plus `radiance`
 * are first allowed at prev-01 and are always emissive light, never flat fill.
 * That half of the rule is unchanged and is the half Prevention depends on.
 */

import { Color } from 'three';

export const COLOR = {
  void: 0x0b0d1a, // background. deep indigo-charcoal, NOT pure black
  ash: 0x2a2d3d, // unlit mask points

  /*
   * The festival palette is taken from assets/mask-art.png itself — these are
   * the artwork's own dominant hues, pulled out and punched up for emission:
   *
   *   #f05aa5 hot pink   #f164c7 fuchsia
   *   #f3ad67 orange     #f8e85d yellow-gold
   *
   * Warm all the way through. `Tanglaw` means illumination, and the light half
   * of this deck should look like it — the colours the mask is actually painted
   * in, not an approximation of them.
   */
  rose: 0xff3d94, // Prevention: guidance counselors
  ember: 0xff7a3d, // Prevention: teacher training
  gold: 0xffc93c, // Prevention: classroom redesign
  // Pushed violet, away from `rose`. At the original #f45ad0 it sat too close
  // to the hot pink beside it, and the un-seated crest blended into the shard
  // already home — which kills the one thing prev-04 has to show, that a single
  // piece is still out of place.
  fuchsia: 0xc94ae8, // Prevention: peer networks / CPCs

  /** The close blooms past the four hues into plain light. */
  radiance: 0xfff0c2,

  intruder: 0x6b8f3a, // NVE shard. deliberately off-palette, sickly

  /**
   * Used TWICE, and deliberately not duplicated into two near-identical reds.
   *
   * It is the knife on `thresh-02` — "stabbings shatter our peace" — and the
   * splat on `eff-02`. Same red, because it is the same thing: the threat named
   * on slide 3, realised in Effects. A second, slightly different red would
   * quietly break that link and nobody would be able to say why the sections
   * stopped rhyming.
   *
   * The storyboard specifies "vibrant red", which overrides an earlier
   * recommendation for a dark desaturated stain. Vibrant it is. Note for
   * tuning: this is emissive against near-black under additive blending, so it
   * will read brighter on screen than the hex suggests, and brighter again on a
   * projector that is crushing its blacks.
   */
  blood: 0xe8142a,
};

/**
 * Threshold palette (slides 2-3). Vivid by decision — this beat is symbolic and
 * has to carry across a lit room. See the amended §3 rule in the header.
 *
 * Kept COLD against the festival palette's warmth, so the two never read as one
 * colour system: electric violet rather than `fuchsia`'s warm pink-violet, and
 * a hard red. The student is the single warm thing in frame, which is the
 * deck's existing language for the one living thing in a scene — and it is why
 * the image works at all.
 */
export const THRESHOLD = {
  student: 0xffe23d, // yellow. purer and brighter than `gold`'s amber
  shadow: 0x8f3dff, // neon violet — electric, cold, nothing like `fuchsia`
  shadowEye: 0xd9b3ff, // near-white violet, so the eyes read at distance
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
  lantern: 3200,
  seat: 2400,

  /* The Threshold sequence (slides 2-3). See
     docs/superpowers/plans/2026-09-02-threshold-sequence.md */
  gather: 2400, // the drifting field resolves into the student
  slither: 2600, // the three shadows arrive out of the child's own back
  shadowStagger: 700, // between shadows, and between their three labels
  pierce: 260, // the knife falls and embeds
  crack: 180, // the wedges separate. fast — a slow crack reads as melting
  wreck: 900, // the pieces drift out and stop

  /* The Effects sequence (beats 10-13). See
     docs/superpowers/plans/2026-09-02-effects-sequence.md
     Sped up ~20-25% across the board 2026-09-03 — keep the same ratios if
     retuning any one of these again. */
  gunForm: 1400, // shards converge into the weapon
  fire: 115, // muzzle flash duration
  recoil: 160, // muzzle kicks up after the shot
  splatForm: 360, // "dramatic, sudden" — this is deliberately fast
  advance: 1300, // camera pushes FORWARD through frame 5
};

/**
 * Camera parallax.
 *
 * A fixed camera in front of a point field reads as a photograph of one. A very
 * slow sway gives the field parallax and the audience depth, and it costs
 * nothing — it is a pure function of elapsed time, so it never has to be
 * reproduced by apply().
 *
 * Keep it small. Anything the audience can consciously see is too much.
 */
export const SWAY = {
  amount: 0.035,
  rateX: 0.11,
  rateY: 0.17,
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
 *
 * Raised from 7000 when the placeholder line-art was replaced by the real
 * MassKara artwork — the crown's petals and the face's swirl carry far more
 * detail than an outline did, and at 7000 the mask read as a sparse smudge.
 */
export const POINTS = 17000;

/** Camera breathing room around the mask's bounding sphere (§8). */
export const FIT_MARGIN = 1.35;

/**
 * Point size in world units.
 *
 * Sized for a PROJECTOR, not for this monitor. Projectors have poor black
 * levels and low contrast, and they lose fine detail in a room that is never as
 * dark as promised — so the deck runs deliberately denser and thicker than it
 * needs to be on a laptop screen.
 */
export const BASE_POINT_SIZE = 0.0195;

/** Reusable Color scratch — avoids allocating in the render loop. */
export const scratchColor = new Color();

/** Hex int -> [r,g,b] in linear-ish 0..1, for writing straight into buffers. */
export function rgb(hex) {
  scratchColor.setHex(hex);
  return [scratchColor.r, scratchColor.g, scratchColor.b];
}

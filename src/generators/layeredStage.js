/**
 * @fileoverview Layered stage pop-up ("층층이 무대 / 성벽 무대") mechanism generator.
 *
 * A multi-tier generalization of parallelFold.js's staircase: one continuous
 * pleated strip, cut in place and hinged on the card spine, that rises into a
 * flight of tiers of INCREASING depth and height as the card opens — the tallest
 * ridge sits at the spine (the "back", furthest into the opened card) and the
 * tiers step down and forward toward the reader (a castle keep with lower outer
 * ramparts in front of it). It reduces EXACTLY to boxPopup.js at N = 1.
 *
 * ── Why NOT "N independent full-height walls" (the old, broken model) ─────────
 *   The previous design tried to make every band [a_{i-1}, a_i] an independent
 *   box-riser with its NEAR edge a mountain and its FAR edge BOTH a full cut AND
 *   a valley. That is physically impossible three ways at once (a full cut severs
 *   the paper so it cannot also fold there; and because widths narrow outward,
 *   layer i's far edge (width w_i) coincided with layer i+1's narrower near
 *   mountain (width w_{i+1}), stacking cut + valley + mountain on one line). It
 *   also could never self-actuate: a band that lives entirely on ONE card face
 *   (every band except the spine-straddling one) is not coupled across the spine,
 *   so opening the card just rotates it rigidly with its page — it never pops.
 *   Only a crease that CROSSES the spine is driven by the card opening. Hence the
 *   corrected mechanism is ONE spine-crossing pleated strip, not N loose walls.
 *
 * ── Per-band flex (straight from boxPopup.js) ─────────────────────────────────
 *   Each band folds by the SAME local angle γ = α/2 relative to the band before
 *   it (the box-popup / parallel-fold result h = d·sin(α/2) ⇒ γ = α/2). Band 1
 *   is the box-popup base (its NEAR crease is the spine MOUNTAIN); every later
 *   band rides on the moving far edge of the band before it, exactly like
 *   parallelFold's nested staircase levels.
 *
 * ── Crease pattern: alternate mountain/valley (true flat-foldability) ─────────
 *   With a_0 = 0 the creases parallel to the spine sit at depths a_0, a_1, …, a_N
 *   and MUST alternate to collapse flat (and to keep the running staircase frame
 *   from spiralling — same reason Preview3D alternates the staircase's ±γ):
 *
 *       a_0 (spine)  MOUNTAIN
 *       a_i          VALLEY  if i is odd,  MOUNTAIN if i is even   (1 ≤ i ≤ N−1)
 *       a_N (outer)  FREE CUT — the exposed top edge of the tallest tier
 *
 *   This is the same rule accordionPopup.js uses (alternating pleats collapse in
 *   the card's own fold direction), specialised so the ridges read as tiers.
 *
 * ── The shoulder-cut (from parallelFold.js) — the fix for the width step ──────
 *   Consecutive bands share their crease line, but the outer band is NARROWER
 *   (w_{i+1} < w_i). Only the CENTRAL w_{i+1}-wide strip of the crease at a_i is a
 *   real hinge (mountain/valley per the parity above), drawn ONCE. The two
 *   "shoulders" of the wider inner band's far edge, x ∈ [w_{i+1}/2 .. w_i/2] on
 *   each side, have no next band to hinge to, so they are CUT (free). No line is
 *   ever both a cut and a fold — the shoulder is cut, the centre is a fold, they
 *   share no x. Each band's two vertical SIDE edges are cut so the strip is free
 *   to lift laterally; the strip stays attached to the card along the spine.
 *
 * ── Accumulated depth + the hard containment constraint ───────────────────────
 *       a_0 = 0,   a_i = a_{i-1} + d_i = Σ_{j≤i} d_j
 *   Depths are non-decreasing outward (d_1 ≤ … ≤ d_N) so tiers get taller toward
 *   the back; widths are non-increasing (w_1 ≥ … ≥ w_N) so a front tier never
 *   hides the silhouette of the tier behind it. When the card shuts, the whole
 *   pleated strip collapses flat over [0, a_N] on each face, so nothing pokes past
 *   the card's own cut edge iff:
 *
 *       a_N = Σ d_j ≤ S_max ,   S_max = CARD_SIZES[paper].height/2 − PRINT.MARGIN
 *
 *   Clamped exactly like parallelFold: each band's depth is capped to the
 *   remaining budget (DEPTH_SAFETY·S_max − a_{i-1}); once the remainder drops
 *   below DEPTH_MIN we stop adding bands. Garbage / oversized requests therefore
 *   yield fewer, shorter tiers rather than a wall off the sheet.
 *
 * ── Default sizes (fit A4 AND Letter; Letter governs) ─────────────────────────
 *   S_max: A4 = 148.5/2 − 5 = 69.25 mm; Letter = 139.7/2 − 5 = 64.85 mm (tighter).
 *   Budget = 0.92·S_max ⇒ Letter 59.66 mm. Ascending default depths (= heights):
 *       N=2: [22, 30]  Σ 52    N=3: [14, 19, 24]  Σ 57    N=4: [10, 13, 16, 19]  Σ 58
 *   all < 59.66, so every default stack clears the Letter edge with ≥ 1.6 mm slack
 *   (A4 slack ≥ 5.7 mm). Descending default widths 100/84/68/52 mm keep every band
 *   well inside the ~188 mm printable width with room to spare.
 *
 * ── Assembly note ─────────────────────────────────────────────────────────────
 *   Because the strip is cut in place and hinged on the spine, there is NO glue
 *   tab on the structure itself (like parallelFold.js — the tiers are part of the
 *   card). Glue is only used to stick the decoration pictures onto the tier faces.
 *
 * @module generators/layeredStage
 */

import { CARD_SIZES, PRINT } from './constants.js';
import { clamp, round } from '../utils/math.js';
import {
  addPath,
  addRect,
  addText,
  addGroup,
  getLineStyle,
  createTemplate,
} from './svgBuilder.js';

/** Fixed design limits (see file header for the derivations). */
export const LAYERED_STAGE_LIMITS = {
  LAYERS_MIN: 2,
  LAYERS_MAX: 4,
  DEPTH_MIN: 8,        // min per-layer depth = height (mm)
  WIDTH_MIN: 30,       // min wall width along the spine (mm)
  WIDTH_FRONT: 100,    // default front (layer 1) width (mm)
  WIDTH_STEP: 16,      // default width decrement per layer outward (mm)
  TAB_W: 6,            // side glue-tab width (mm) — above the 5 mm grip floor
  DEPTH_SAFETY: 0.92,  // usable fraction of S_max spent on cumulative depth
};

/** Ascending default depths (= heights) per layer count. See header for fit. */
const DEFAULT_DEPTHS = {
  2: [22, 30],
  3: [14, 19, 24],
  4: [10, 13, 16, 19],
};

/** NaN/garbage-safe numeric intake (?? only guards null/undefined). */
const numOr = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

/**
 * Build the default (depth, width) spec for N layers: ascending depths from the
 * per-N table, descending widths from WIDTH_FRONT.
 * @param {number} n
 * @returns {Array<{depth:number, width:number}>}
 */
function defaultSpec(n) {
  const L = LAYERED_STAGE_LIMITS;
  const depths = (DEFAULT_DEPTHS[n] || DEFAULT_DEPTHS[3]).slice(0, n);
  return depths.map((depth, i) => ({
    depth,
    width: L.WIDTH_FRONT - i * L.WIDTH_STEP,
  }));
}

/**
 * @typedef {Object} StageLayer
 * @property {number} index  - 1-based layer number (1 = front, nearest spine)
 * @property {number} depth  - Depth footprint d_i (mm)
 * @property {number} height - Standing wall height h_i = d_i (mm)
 * @property {number} width  - Wall width w_i along the spine (mm)
 * @property {number} near   - Accumulated depth a_{i-1} at the near crease (mm)
 * @property {number} far    - Accumulated depth a_i at the far crease (mm)
 */

/**
 * @typedef {Object} StageGeometry
 * @property {StageLayer[]} layers
 * @property {number} count           - Number of layers actually placed
 * @property {number} sMax            - CARD.height/2 − MARGIN, the hard edge (mm)
 * @property {number} budget          - DEPTH_SAFETY·sMax, the depth budget (mm)
 * @property {number} cumulativeDepth - a_N of the deepest layer (mm)
 * @property {number} maxWidth        - Max printable wall width incl. tabs (mm)
 * @property {number} tabW            - Side glue-tab width (mm)
 */

/**
 * Resolve + clamp layered-stage parameters against the printable card face.
 * Pure numbers — testable headlessly. Guarantees a_i ≤ sMax for every layer.
 *
 * @param {Object} [opts]
 * @param {number} [opts.layers=3] - Layer count (clamped 2–4)
 * @param {Array<{depth:number,width:number}>} [opts.layerSpec] - Explicit per-layer sizes
 * @param {'A4'|'LETTER'} [opts.paperSize='A4']
 * @returns {StageGeometry}
 */
export function resolveLayeredStageGeometry(opts = {}) {
  const L = LAYERED_STAGE_LIMITS;
  const card = CARD_SIZES[opts.paperSize] || CARD_SIZES.A4;

  const sMax = card.height / 2 - PRINT.MARGIN;        // hard edge (task inequality)
  const budget = L.DEPTH_SAFETY * sMax;               // usable cumulative depth
  const maxWidth = card.width - 2 * PRINT.MARGIN - 2 * L.TAB_W;

  let n = clamp(Math.round(numOr(opts.layers, 3)), L.LAYERS_MIN, L.LAYERS_MAX);

  let spec;
  if (Array.isArray(opts.layerSpec) && opts.layerSpec.length > 0) {
    spec = opts.layerSpec
      .slice(0, L.LAYERS_MAX)
      .map((s) => ({
        depth: numOr(s && s.depth, L.DEPTH_MIN),
        width: numOr(s && s.width, L.WIDTH_FRONT),
      }));
  } else {
    spec = defaultSpec(n);
  }

  const layers = [];
  let acc = 0;
  for (let i = 0; i < spec.length; i++) {
    const avail = budget - acc;
    if (avail < L.DEPTH_MIN) break;                   // no room → drop rest (stays contained)
    const depth = clamp(numOr(spec[i].depth, L.DEPTH_MIN), L.DEPTH_MIN, avail);
    const width = clamp(numOr(spec[i].width, L.WIDTH_FRONT), L.WIDTH_MIN, maxWidth);
    const near = acc;
    const far = acc + depth;
    layers.push({
      index: i + 1,
      depth: round(depth),
      height: round(depth),
      width: round(width),
      near: round(near),
      far: round(far),
    });
    acc = far;
  }

  return {
    layers,
    count: layers.length,
    sMax: round(sMax),
    budget: round(budget),
    cumulativeDepth: round(acc),
    maxWidth: round(maxWidth),
    tabW: L.TAB_W,
  };
}

/**
 * Draw a light decorative building facade (door + two windows + roofline) onto a
 * wall face, as SCORE-style guides only — these never cut through the wall or
 * touch a fold crease, so they don't affect foldability. Drawn between the base
 * crease (baseY, nearer the spine) and the roof crease (roofY, further out).
 *
 * @param {SVGElement} g
 * @param {number} cx
 * @param {number} baseY - y of the wall's base (near crease side)
 * @param {number} roofY - y of the wall's top (far crease side)
 * @param {number} w
 * @param {object} style - SCORE line style
 */
function drawFacade(g, cx, baseY, roofY, w, style) {
  const dir = roofY < baseY ? -1 : 1;          // +1 = wall grows downward (lower face)
  const span = Math.abs(roofY - baseY);
  if (span < 6 || w < 12) return;              // too small to decorate cleanly

  // Door: centred rectangle rising ~45% of the wall from the base.
  const doorW = Math.min(round(w * 0.22), 12);
  const doorH = round(span * 0.45);
  const doorX = round(cx - doorW / 2);
  const doorY = dir < 0 ? round(baseY - doorH) : round(baseY);
  addRect(g, doorX, doorY, doorW, doorH, style);

  // Two windows flanking the door, up near the roof.
  const winW = Math.min(round(w * 0.14), 8);
  const winH = round(span * 0.22);
  const winY = dir < 0 ? round(roofY + span * 0.2) : round(roofY - span * 0.2 - winH);
  const offset = round(w * 0.28);
  addRect(g, round(cx - offset - winW / 2), winY, winW, winH, style);
  addRect(g, round(cx + offset - winW / 2), winY, winW, winH, style);

  // Roofline: a shallow gable score just inside the roof crease.
  const gableY = round(roofY + dir * -span * 0.12); // slightly toward the base from the crease
  const apexY = round(roofY + dir * span * 0.06);   // apex nudged past the crease side
  const hw = round(w / 2);
  addPath(
    g,
    `M ${round(cx - hw)} ${gableY} L ${round(cx)} ${apexY} L ${round(cx + hw)} ${gableY}`,
    style,
  );
}

/**
 * Draw the layered-stage flat pattern into a passed-in SVG/group.
 *
 * One pleated strip, mirrored above and below the spine (each band draws an upper
 * and a lower half), exactly like parallelFold's upper/lower staircase. Cut/fold
 * assignment per band i (1-based, far crease at accumulated depth a_i):
 *   - two vertical SIDE edges (at ±w_i/2, over depth band [a_{i-1}, a_i]): CUT
 *   - the far crease at a_i:
 *       · i < N: central w_{i+1}-wide strip = FOLD (mountain if i even else valley,
 *                since the spine a_0 is a mountain and creases alternate); the two
 *                shoulders out to ±w_i/2 = CUT  (parallelFold's shoulder-cut).
 *       · i = N: the whole far edge = CUT (the free top of the tallest tier).
 * The spine crease a_0 (width w_1) is a single MOUNTAIN, drawn once (box-popup's
 * spine). No line is ever both a cut and a fold; every fold alternates so the
 * strip collapses flat when the card shuts.
 *
 * @param {SVGElement} svg - Target element (a content group from createTemplate)
 * @param {Object} [options]
 * @param {number} [options.cx=105] - Spine centre X (mm)
 * @param {number} [options.cy=148.5] - Spine centre Y (mm)
 * @param {number} [options.layers=3] - Layer count (2–4)
 * @param {Array<{depth:number,width:number}>} [options.layerSpec]
 * @param {'A4'|'LETTER'} [options.paperSize='A4']
 * @param {boolean} [options.isColor=true]
 * @returns {SVGGElement}
 */
export const generateLayeredStage = (svg, options = {}) => {
  const {
    cx = 105,
    cy = 148.5,
    isColor = true,
    paperSize = 'A4',
  } = options;

  const geo = resolveLayeredStageGeometry({
    layers: options.layers,
    layerSpec: options.layerSpec,
    paperSize,
  });

  const g = addGroup(svg, 'layered-stage-group');

  const cutStyle = getLineStyle('CUT', isColor);
  const mountainStyle = getLineStyle('MOUNTAIN_FOLD', isColor);
  const valleyStyle = getLineStyle('VALLEY_FOLD', isColor);
  const scoreStyle = getLineStyle('SCORE', isColor);

  const layers = geo.layers;
  const N = layers.length;
  if (N === 0) return g;

  // ── One card face at a time (sign = -1 upper, +1 lower) ───────────────────
  for (const sign of [-1, 1]) {
    for (let idx = 0; idx < N; idx++) {
      const layer = layers[idx];             // 1-based band index i = idx + 1
      const i = idx + 1;
      const hw = round(layer.width / 2);
      const xL = round(cx - hw);
      const xR = round(cx + hw);
      const nearY = round(cy + sign * layer.near);
      const farY = round(cy + sign * layer.far);

      // Side edges: cut, so the band is free to lift laterally out of the card.
      addPath(g, `M ${xL} ${nearY} L ${xL} ${farY}`, cutStyle);
      addPath(g, `M ${xR} ${nearY} L ${xR} ${farY}`, cutStyle);

      if (i === N) {
        // Outermost tier: its far edge is the exposed free top → full cut.
        addPath(g, `M ${xL} ${farY} L ${xR} ${farY}`, cutStyle);
      } else {
        // Shared crease with the NARROWER next band: centre = fold, shoulders cut.
        const nhw = round(layers[idx + 1].width / 2);
        const nxL = round(cx - nhw);
        const nxR = round(cx + nhw);
        // Shoulders (this wider band's exposed far corners) → cut.
        addPath(g, `M ${xL} ${farY} L ${nxL} ${farY}`, cutStyle);
        addPath(g, `M ${nxR} ${farY} L ${xR} ${farY}`, cutStyle);
        // Central hinge → fold, alternating (a_i mountain if i even, else valley).
        const foldStyle = i % 2 === 0 ? mountainStyle : valleyStyle;
        addPath(g, `M ${nxL} ${farY} L ${nxR} ${farY}`, foldStyle);
      }

      // Decorative facade (score guides only — never on a cut or a crease).
      drawFacade(g, cx, nearY, farY, layer.width, scoreStyle);
    }
  }

  // Spine crease a_0: a single mountain (band 1's near hinge, box-popup's spine),
  // drawn once across the widest band. (The card's own valley spine already runs
  // full width from createTemplate; the pop-up creases mountain here, as in
  // boxPopup.js.)
  const hw1 = round(layers[0].width / 2);
  addPath(g, `M ${round(cx - hw1)} ${round(cy)} L ${round(cx + hw1)} ${round(cy)}`, mountainStyle);

  // Per-tier labels on the upper face, inside each band.
  for (const layer of layers) {
    const labelY = Math.max(round(cy - (layer.near + layer.far) / 2 + 1), PRINT.MARGIN + 4);
    const role = layer.index === N ? '뒤·제일높음' : layer.index === 1 ? '앞·제일낮음' : '중간';
    addText(g, cx, labelY, `무대 ${layer.index}층 (${role})`, 2.4, 'middle');
  }

  // Title above the deepest upper far crease, clamped inside the page.
  const titleY = Math.max(round(cy - geo.cumulativeDepth - 3), PRINT.MARGIN + 3);
  addText(g, cx, titleY, '층층이 무대 (Layered Stage)', 3, 'middle');

  return g;
};

/**
 * Render the layered stage onto a complete printable SVG template (page + spine).
 * @param {Object} [params={}]
 * @param {'A4'|'LETTER'} [params.paperSize='A4']
 * @param {'color'|'bw'} [params.colorMode='color']
 * @param {number} [params.layers=3]
 * @param {Array<{depth:number,width:number}>} [params.layerSpec]
 * @returns {{ svg: SVGSVGElement }}
 */
export function renderLayeredStage(params = {}) {
  const { paperSize = 'A4', colorMode = 'color', ...opts } = params;
  const { svg, contentGroup, paper, spineY } = createTemplate(paperSize, colorMode);
  generateLayeredStage(contentGroup, {
    cx: paper.width / 2,
    cy: spineY,
    paperSize,
    ...opts,
    isColor: colorMode !== 'bw',
  });
  return { svg };
}

/**
 * @fileoverview Layered stage pop-up ("층층이 무대 / 성벽 무대") mechanism generator.
 *
 * A multi-tier generalization of the single box-riser (`boxPopup.js`). Instead of
 * ONE standing wall, N wall "flats" (building/tower silhouettes) stand at
 * increasing depth from the spine, so opening the card raises a layered
 * theatrical scene with front-to-back depth (a castle keep rising behind its
 * lower outer wall, etc.).
 *
 * ── Per-layer unit (box-riser, straight from boxPopup.js) ─────────────────────
 *   Layer i is a standing wall of height h_i attached to the card along its NEAR
 *   crease and cut free on its far edge + two side edges. Box-popup's flat-fold
 *   rule is applied PER LAYER:
 *
 *       d_i = h_i                                   (flat-foldability, per layer)
 *
 *   where d_i is the layer's depth footprint (its band on the card face) and h_i
 *   its standing wall height. With d_i = h_i, when the card shuts the wall folds
 *   flat exactly back over its own depth band [a_{i-1}, a_i] — its far edge lands
 *   on its near crease, never overshooting into the neighbour band. NEAR crease is
 *   a MOUNTAIN (wall pops toward the viewer, exactly like box-popup's spine
 *   mountain); FAR crease is a VALLEY (the wall's top nosing folds down). Every
 *   mountain is thus paired with a valley in the same layer → each layer
 *   collapses flat independently.
 *
 * ── Nesting / accumulated depth (from parallelFold.js's staircase) ────────────
 *   Layers stack outward from the spine, each starting where the previous ended
 *   (parallelFold's `accumulatedDepth` bookkeeping, generalized to full-height
 *   walls):
 *
 *       a_0 = 0,   a_i = a_{i-1} + d_i = Σ_{j≤i} d_j          (accumulated depth)
 *
 *   near crease of layer i at depth a_{i-1}, far crease at a_i. Layer 1's near
 *   crease is the spine itself. Depths are non-decreasing outward
 *   (d_1 ≤ d_2 ≤ … ≤ d_N) so deeper = taller = further back (castle keep).
 *   Widths are non-increasing outward (w_1 ≥ w_2 ≥ … ≥ w_N) so a near wall never
 *   hides the silhouette read of a further one.
 *
 * ── THE hard constraint: nothing protrudes past the card edge when CLOSED ─────
 *   When the card folds shut, each layer's wall folds flat into its own band
 *   [a_{i-1}, a_i] on the card face. These bands are disjoint consecutive
 *   intervals that TILE outward from the spine, so the whole collapsed stack
 *   occupies exactly [0, a_N]. Layer i's folded footprint sits inside the region
 *   bounded by layer i-1's far crease (a_{i-1}) and the card edge — trivially,
 *   since the bands abut. The deepest (background) layer N reaches furthest out,
 *   so IT is the one at risk of poking past the card's own outer cut edge. The
 *   containment inequality every layer must satisfy is therefore:
 *
 *       a_i = Σ_{j≤i} d_j ≤ S_max                     (per layer; binds at i = N)
 *       S_max = CARD_SIZES[paper].height / 2 − PRINT.MARGIN
 *
 *   Because d_j > 0 the a_i are strictly increasing, so a_N ≤ S_max implies all.
 *   We clamp against it exactly like parallelFold's buildLevels clamps each depth
 *   against maxDepth — but on the ACCUMULATED sum: each layer's depth is clamped
 *   to the remaining budget (S_max·SAFETY − a_{i-1}), and once the remaining
 *   budget drops below DEPTH_MIN we stop adding layers. An over-large or garbage
 *   request can therefore never push a wall off the sheet; it just yields fewer /
 *   shorter layers. We spend only DEPTH_SAFETY (0.92) of S_max so the deepest far
 *   crease lands strictly inside the edge with a visible slack strip.
 *
 * ── Glue tabs (from boxPopup.js's side trapezoids) ────────────────────────────
 *   Each wall gets its own trapezoid glue tab on each vertical side edge (TAB_W =
 *   6 mm > the 5 mm child-grip floor), folding OUTWARD in x to glue flat beside
 *   the wall. Tab i lives in x ∈ [cx ± (w_i/2 .. w_i/2 + TAB_W)] and depth band
 *   [a_{i-1}, a_i]. A nearer (larger) layer's wall folds into [a_{i-2}, a_{i-1}],
 *   a further (smaller) layer's tab into [a_{i-1}, a_i] — DISJOINT depth bands, so
 *   a further layer's tab can never collide with a nearer layer's wall. Tabs
 *   extend only in x (never deeper in s), and w_i/2 + TAB_W is clamped so the tab
 *   stays inside the printable card width on both A4 and Letter.
 *
 * ── Default sizes (fit A4 AND Letter; Letter governs) ─────────────────────────
 *   S_max: A4 = 148.5/2 − 5 = 69.25 mm; Letter = 139.7/2 − 5 = 64.85 mm (tighter).
 *   Budget = 0.92·S_max ⇒ Letter 59.66 mm. Ascending default depths (= heights):
 *       N=2: [22, 30]  Σ 52    N=3: [14, 19, 24]  Σ 57    N=4: [10, 13, 16, 19]  Σ 58
 *   all < 59.66, so every default stack clears the Letter edge with ≥ 1.6 mm slack
 *   (A4 slack ≥ 5.7 mm). Descending default widths 100/84/68/52 mm keep every
 *   wall + both 6 mm tabs (≤ 112 mm) well inside the ~188 mm printable width.
 *   N is clamped to 2–4, per-layer depth ≥ 8 mm, width ∈ [30, card.width−2·MARGIN
 *   −2·TAB_W].
 *
 * ── Flat-foldability summary ──────────────────────────────────────────────────
 *   (1) Each layer independently satisfies d_i = h_i → its wall folds flat into
 *   its own band with a matched near-mountain / far-valley crease pair.
 *   (2) The bands tile [0, a_N] disjointly and outward, so layers collapse in
 *   depth order without interfering, and the whole scene lies flat inside the
 *   card silhouette iff a_N ≤ S_max — which the clamp guarantees.
 *
 * @module generators/layeredStage
 */

import { CARD_SIZES, PRINT } from './constants.js';
import { clamp, round } from '../utils/math.js';
import {
  addPath,
  addRect,
  addPolygon,
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
 * The pattern is mirrored above and below the spine (each layer draws an upper
 * and a lower half), exactly like parallelFold's upper/lower staircase.
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
  const glueStyle = getLineStyle('GLUE_TAB', isColor);
  const scoreStyle = getLineStyle('SCORE', isColor);

  const tabW = geo.tabW;

  // Draw furthest (deepest) layer first so nearer/larger walls overlay it in the
  // preview, matching the front-to-back read.
  const ordered = [...geo.layers].sort((a, b) => b.index - a.index);

  for (const layer of ordered) {
    const { width, near, far, index } = layer;
    const hw = round(width / 2);
    const xL = round(cx - hw);
    const xR = round(cx + hw);

    // ── One card face at a time (sign = -1 upper, +1 lower) ─────────────────
    for (const sign of [-1, 1]) {
      const nearY = round(cy + sign * near);   // near crease (attached / mountain)
      const farY = round(cy + sign * far);     // far crease (free edge / valley)

      // Cuts: two side verticals + the far horizontal (near edge stays attached).
      addPath(g, `M ${xL} ${nearY} L ${xL} ${farY}`, cutStyle);
      addPath(g, `M ${xR} ${nearY} L ${xR} ${farY}`, cutStyle);
      addPath(g, `M ${xL} ${farY} L ${xR} ${farY}`, cutStyle);

      // Folds: near = mountain (pops toward viewer), far = valley (matched pair).
      addPath(g, `M ${xL} ${nearY} L ${xR} ${nearY}`, mountainStyle);
      addPath(g, `M ${xL} ${farY} L ${xR} ${farY}`, valleyStyle);

      // Side glue tabs — trapezoids folding OUTWARD in x, spanning the depth band.
      const yA = Math.min(nearY, farY);
      const yB = Math.max(nearY, farY);
      addPolygon(g, [
        [xL, yA],
        [round(xL - tabW), round(yA + tabW / 2)],
        [round(xL - tabW), round(yB - tabW / 2)],
        [xL, yB],
      ], glueStyle);
      addPolygon(g, [
        [xR, yA],
        [round(xR + tabW), round(yA + tabW / 2)],
        [round(xR + tabW), round(yB - tabW / 2)],
        [xR, yB],
      ], glueStyle);

      // Decorative facade (score guides only).
      drawFacade(g, cx, nearY, farY, width, scoreStyle);
    }

    // Layer label on the upper face, inside the band.
    const labelY = Math.max(round(cy - (near + far) / 2 + 1), PRINT.MARGIN + 4);
    addText(g, cx, labelY, `무대 ${index} (뒤←${index})`, 2.4, 'middle');
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

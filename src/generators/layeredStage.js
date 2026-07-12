/**
 * @fileoverview Layered stage pop-up ("층층이 무대 / 케이크 무대") mechanism generator.
 *
 * A multi-tier BOX-STACK popup (think: tiered birthday cake, castle keep):
 * N separate paper strips bridge the card's two faces, so the card-opening
 * motion itself erects the stack and closing the card lays everything flat.
 * This is the classic commercial "cake card" construction.
 *
 * ── Naming ─────────────────────────────────────────────────────────────────
 *   The two card faces are the FLOOR (holds the stack's base) and the
 *   BACKDROP (the stack leans against it). Card opening angle α: 0 = closed,
 *   180 = fully flat. The stack is fully 3D at α = 90° and flattens at BOTH
 *   extremes (a parallel-fold-family mechanism).
 *
 * ── Per-tier strip (tier i = 1..N, bottom → top) ───────────────────────────
 *   Each tier is one rectangular strip of width w_i (along the spine):
 *
 *       [rear glue flap g] –valley– [TOP panel, depth t_i]
 *                          –mountain(crest)– [FRONT panel, height v_i]
 *                          –valley– [bottom glue flap g]
 *
 *   Attachment:
 *   - rear flap  → BACKDROP face, valley crease at height h_i = Σ_{j≤i} v_j
 *     from the spine (flap points up/outward, hidden behind the stack).
 *   - bottom flap of tier 1 → FLOOR face, valley crease at distance t_1 from
 *     the spine (flap points inward toward the spine, hidden inside the box).
 *   - bottom flap of tier i ≥ 2 → the TOP panel of tier i−1, at distance t_i
 *     from that panel's rear (backdrop-side) crease (flap points toward the
 *     backdrop, hidden inside the box). So assembly is BOTTOM-UP: tier 1
 *     first, each next tier stands on the one below.
 *
 * ── The parallelogram property (why it works at every α) ───────────────────
 *   With unit vectors u_f (floor) and u_b (backdrop) at angle α, tier 1's
 *   linkage spine→(floor attach t_1)→crest→(backdrop attach h_1)→spine is a
 *   parallelogram (opposite sides t_1 and v_1 = h_1). Hence its TOP panel
 *   stays parallel to the floor and its FRONT panel parallel to the backdrop
 *   at EVERY opening angle. Tier i ≥ 2 repeats the same parallelogram between
 *   the backdrop and tier i−1's (floor-parallel) top panel, so by induction:
 *
 *       crest_i = t_i·u_f + h_i·u_b        (tier i's mountain ridge, all α)
 *
 *   All top panels ∥ floor, all front panels ∥ backdrop. At α = 0 and α = 180
 *   every parallelogram degenerates → the whole stack lies flat; at α = 90°
 *   the boxes are perfectly square (fronts vertical, tops horizontal).
 *
 * ── Containment (nothing pokes past the card edge when closed) ─────────────
 *   Closed (α=0), tier i's material spans from its rear-flap tip down to its
 *   crest fold: the crest lands at h_i + t_i from the spine — the tier's
 *   furthest reach (the rear flap reaches only h_i + FLAP and FLAP < TOP_MIN
 *   ≤ t_i). h_i increases and t_i decreases with i, so the maximum over ALL
 *   tiers is checked (it is not monotonic in general). Every tier must obey
 *
 *       reach_i = h_i + t_i ≤ budget = DEPTH_SAFETY · (card.height/2 − MARGIN)
 *
 *   The resolver clamps t_i and v_i against the REMAINING budget while
 *   accumulating h, and drops tiers that no longer fit — garbage input yields
 *   fewer/shorter tiers, never an over-edge wall. Letter is the tight paper
 *   (card.height 139.7 → budget 59.66 mm); all default stacks clear it.
 *
 * ── No inter-tier collision ────────────────────────────────────────────────
 *   In (u_f, u_b) coordinates every panel's footprint is α-independent and
 *   the mapping to space is injective for α ∈ (0°, 180°), so tiers can only
 *   ever touch where their footprints touch: the single designed glue point
 *   (t_{i+1}, h_i) where tier i+1's front foot lands on tier i's top panel.
 *   t_i strictly decreasing (gap T_GAP) keeps that point strictly inside the
 *   lower top panel. Bottom flaps point INWARD (toward the backdrop) and
 *   FLAP < TOP_MIN ≤ t_i keeps them inside their own box footprint; rear
 *   flaps stack on the backdrop without overlap because FLAP < FRONT_MIN ≤
 *   v_{i+1} (tier i's flap [h_i, h_i+FLAP] ends below tier i+1's crease).
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
  TOP_MIN: 9,          // min top-panel depth t_i (mm) — must stay > FLAP
  FRONT_MIN: 8,        // min front-panel height v_i (mm) — must stay > FLAP
                       // (keeps consecutive rear flaps from overlapping on
                       // the backdrop: flap [h_i, h_i+FLAP] vs crease h_i+v)
  WIDTH_MIN: 30,       // min strip width along the spine (mm)
  WIDTH_FRONT: 100,    // default bottom-tier width (mm)
  FLAP: 7,             // glue flap depth (mm) — above the 5 mm child-grip floor
  T_GAP: 2,            // min strict decrease between consecutive t_i (mm)
  DEPTH_SAFETY: 0.92,  // usable fraction of S_max spent on closed reach
};

/**
 * Default (frontHeight v, topDepth t, width w) tables per tier count.
 * Bottom → top: v and t descend, w descends. Letter budget check (59.66 mm):
 *   N=2: reaches 50, 56   N=3: 44, 50, 55   N=4: 38, 43, 48, 53   — all clear.
 */
const DEFAULT_TIERS = {
  2: [
    { frontHeight: 24, topDepth: 26, width: 100 },
    { frontHeight: 18, topDepth: 14, width: 72 },
  ],
  3: [
    { frontHeight: 18, topDepth: 26, width: 100 },
    { frontHeight: 14, topDepth: 18, width: 78 },
    { frontHeight: 12, topDepth: 11, width: 56 },
  ],
  4: [
    { frontHeight: 14, topDepth: 24, width: 100 },
    { frontHeight: 11, topDepth: 18, width: 80 },
    { frontHeight: 10, topDepth: 13, width: 60 },
    { frontHeight: 9, topDepth: 9, width: 42 },
  ],
};

/** NaN/garbage-safe numeric intake (?? only guards null/undefined). */
const numOr = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

/**
 * @typedef {Object} StageTier
 * @property {number} index       - 1-based tier number (1 = bottom, biggest)
 * @property {number} topDepth    - Top panel depth t_i (mm)
 * @property {number} frontHeight - Front panel (visible band) height v_i (mm)
 * @property {number} width       - Strip width w_i along the spine (mm)
 * @property {number} attach      - Backdrop height of the tier BELOW, h_{i-1} (mm)
 * @property {number} crest       - This tier's backdrop attach height h_i (mm)
 * @property {number} reach       - Closed-state reach h_i + t_i from the spine (mm)
 * @property {number} height      - Alias of frontHeight (decoration-slot sizing)
 */

/**
 * @typedef {Object} StageGeometry
 * @property {StageTier[]} layers
 * @property {number} count           - Number of tiers actually placed
 * @property {number} sMax            - CARD.height/2 − MARGIN, the hard edge (mm)
 * @property {number} budget          - DEPTH_SAFETY·sMax, the reach budget (mm)
 * @property {number} cumulativeDepth - max_i(reach_i): worst closed reach (mm)
 * @property {number} maxWidth        - Max printable strip width (mm)
 * @property {number} flap            - Glue flap depth (mm)
 */

/**
 * Resolve + clamp layered-stage parameters against the printable card face.
 * Pure numbers — testable headlessly. Guarantees reach_i ≤ budget per tier.
 *
 * @param {Object} [opts]
 * @param {number} [opts.layers=3] - Tier count (clamped 2–4)
 * @param {Array<{frontHeight?:number, topDepth?:number, depth?:number, height?:number, width?:number}>} [opts.layerSpec]
 *   Explicit per-tier sizes. Legacy keys are accepted: depth → topDepth,
 *   height → frontHeight.
 * @param {'A4'|'LETTER'} [opts.paperSize='A4']
 * @returns {StageGeometry}
 */
export function resolveLayeredStageGeometry(opts = {}) {
  const L = LAYERED_STAGE_LIMITS;
  const card = CARD_SIZES[opts.paperSize] || CARD_SIZES.A4;

  const sMax = card.height / 2 - PRINT.MARGIN;        // hard edge
  const budget = L.DEPTH_SAFETY * sMax;               // usable closed reach
  const maxWidth = card.width - 2 * PRINT.MARGIN;

  const n = clamp(Math.round(numOr(opts.layers, 3)), L.LAYERS_MIN, L.LAYERS_MAX);

  let spec;
  if (Array.isArray(opts.layerSpec) && opts.layerSpec.length > 0) {
    const defaults = DEFAULT_TIERS[Math.min(opts.layerSpec.length, L.LAYERS_MAX)] || DEFAULT_TIERS[3];
    spec = opts.layerSpec.slice(0, L.LAYERS_MAX).map((s, i) => ({
      topDepth: numOr(s && (s.topDepth ?? s.depth), (defaults[i] || defaults[defaults.length - 1]).topDepth),
      frontHeight: numOr(s && (s.frontHeight ?? s.height), (defaults[i] || defaults[defaults.length - 1]).frontHeight),
      width: numOr(s && s.width, L.WIDTH_FRONT),
    }));
  } else {
    spec = DEFAULT_TIERS[n] || DEFAULT_TIERS[3];
  }

  const layers = [];
  let h = 0;              // accumulated backdrop attach height h_{i-1}
  let prevT = Infinity;   // previous tier's top depth (strict decrease)
  let prevW = Infinity;
  for (let i = 0; i < spec.length; i++) {
    // Top depth: strictly below the tier underneath AND leaving room for a
    // minimal front band inside the remaining reach budget.
    const tCap = Math.min(prevT - L.T_GAP, budget - h - L.FRONT_MIN);
    if (tCap < L.TOP_MIN) break;                      // no room → drop the rest
    const topDepth = clamp(numOr(spec[i].topDepth, L.TOP_MIN), L.TOP_MIN, tCap);

    const vCap = budget - h - topDepth;               // reach_i = h + v + t ≤ budget
    if (vCap < L.FRONT_MIN) break;
    const frontHeight = clamp(numOr(spec[i].frontHeight, L.FRONT_MIN), L.FRONT_MIN, vCap);

    const width = clamp(
      Math.min(numOr(spec[i].width, L.WIDTH_FRONT), prevW - 4),
      L.WIDTH_MIN,
      maxWidth,
    );

    const attach = h;
    const crest = h + frontHeight;
    layers.push({
      index: i + 1,
      topDepth: round(topDepth),
      frontHeight: round(frontHeight),
      height: round(frontHeight),
      width: round(width),
      attach: round(attach),
      crest: round(crest),
      reach: round(crest + topDepth),
    });
    h = crest;
    prevT = topDepth;
    prevW = width;
  }

  return {
    layers,
    count: layers.length,
    sMax: round(sMax),
    budget: round(budget),
    cumulativeDepth: round(layers.reduce((m, l) => Math.max(m, l.reach), 0)),
    maxWidth: round(maxWidth),
    flap: L.FLAP,
  };
}

/**
 * Draw one tier strip (a self-contained cut-out piece) with its creases, glue
 * flaps and, when a tier sits on top of this one, the glue-position guide
 * line on the top panel.
 *
 * The front panel is left intentionally blank: decoration art arrives on its
 * own pages (see registry decorationSlots) and is pasted over the full face,
 * and every gray SCORE line on this pattern must mean exactly one thing —
 * "glue here" — so no decorative score guides are drawn.
 *
 * Printed top → bottom: rear flap / top panel / front panel / bottom flap.
 * As assembled (decorated side toward the viewer): rear-flap crease and
 * bottom-flap crease are VALLEYS, the crest is a MOUNTAIN.
 *
 * @returns {number} the strip's total drawn height (mm)
 */
function drawTierStrip(g, x, yTop, layer, nextLayer, styles, flap) {
  const { cutStyle, mountainStyle, valleyStyle, glueStyle, scoreStyle } = styles;
  const w = layer.width;
  const xL = round(x);
  const xR = round(x + w);
  const cxS = round(x + w / 2);

  const y0 = round(yTop);                       // top of rear flap
  const y1 = round(y0 + flap);                  // valley: rear flap | top panel
  const y2 = round(y1 + layer.topDepth);        // mountain: crest
  const y3 = round(y2 + layer.frontHeight);     // valley: front | bottom flap
  const y4 = round(y3 + flap);                  // bottom of bottom flap

  // Outer rectangle: cut on all 4 sides (a fully separate piece).
  addPath(g, `M ${xL} ${y0} L ${xR} ${y0} L ${xR} ${y4} L ${xL} ${y4} Z`, cutStyle);

  // Creases.
  addPath(g, `M ${xL} ${y1} L ${xR} ${y1}`, valleyStyle);
  addPath(g, `M ${xL} ${y2} L ${xR} ${y2}`, mountainStyle);
  addPath(g, `M ${xL} ${y3} L ${xR} ${y3}`, valleyStyle);

  // Glue flaps (highlighted like every other mechanism's 풀칠 자리). All text
  // on this strip lives on glue faces only — the flaps (glued face-down) and
  // the next tier's landing band — so nothing prints on a visible surface.
  // The tier number rides on the rear-flap label (no separate panel label).
  addRect(g, xL, y0, w, flap, glueStyle);
  addRect(g, xL, y3, w, flap, glueStyle);
  addText(g, cxS, round(y0 + flap - 1.6), `${layer.index}층 · 뒤 날개 → 뒷면 ${'①②③④'[layer.index - 1]}`, 2.4, 'middle');
  addText(
    g,
    cxS,
    round(y3 + flap - 1.6),
    layer.index === 1 ? '아래 날개 → 바닥 ㉠' : `아래 날개 → ${layer.index - 1}층 윗면 ㉡`,
    2.6,
    'middle',
  );

  // Next tier's glue-position guide, drawn ON this top panel: a score line at
  // distance t_{i+1} from the rear (y1) crease, as wide as the next strip.
  // The next tier's bottom flap points toward the backdrop (toward y1), so it
  // covers the band [gy − flap, gy] — mark that band as an explicit glue face
  // and keep the ㉡ label INSIDE it, where the flap will hide it.
  if (nextLayer) {
    const gy = round(y1 + nextLayer.topDepth);
    const ghw = round(nextLayer.width / 2);
    addRect(g, round(cxS - ghw), round(gy - flap), round(nextLayer.width), flap, glueStyle);
    addPath(g, `M ${round(cxS - ghw)} ${gy} L ${round(cxS + ghw)} ${gy}`, scoreStyle);
    addText(g, cxS, round(gy - 2), `㉡ ${nextLayer.index}층 아래 날개 자리`, 2.2, 'middle');
  }

  return y4 - y0;
}

/**
 * Draw the layered-stage flat pattern into a passed-in SVG/group.
 *
 * Page layout (spine at cy): the UPPER half is the BACKDROP face and carries
 * the numbered rear-flap glue lines ①..Ⓝ plus tier 1's strip in its outer
 * region; the LOWER half is the FLOOR face and carries tier 1's bottom-flap
 * glue line ㉠ plus the remaining strips flowed side-by-side below it.
 *
 * @param {SVGElement} svg - Target element (a content group from createTemplate)
 * @param {Object} [options]
 * @param {number} [options.cx=105] - Spine centre X (mm)
 * @param {number} [options.cy=148.5] - Spine centre Y (mm)
 * @param {number} [options.layers=3] - Tier count (2–4)
 * @param {Array} [options.layerSpec]
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

  const styles = {
    cutStyle: getLineStyle('CUT', isColor),
    mountainStyle: getLineStyle('MOUNTAIN_FOLD', isColor),
    valleyStyle: getLineStyle('VALLEY_FOLD', isColor),
    glueStyle: getLineStyle('GLUE_TAB', isColor),
    scoreStyle: getLineStyle('SCORE', isColor),
  };
  const flap = geo.flap;
  const circled = '①②③④';

  // ── Backdrop face (upper half): rear-flap glue lines ①..Ⓝ ────────────────
  // Tier i's rear flap glues with its crease ON this line, flap pointing up —
  // it covers the band [gy − flap, gy]. That band is drawn as an explicit glue
  // face with its number label INSIDE, so once the flap is glued the label is
  // hidden and nothing stray prints on the visible card face.
  for (const layer of geo.layers) {
    const gy = round(cy - layer.crest);
    const hw = round(layer.width / 2);
    addRect(g, round(cx - hw), round(gy - flap), round(layer.width), flap, styles.glueStyle);
    addPath(g, `M ${round(cx - hw)} ${gy} L ${round(cx + hw)} ${gy}`, styles.scoreStyle);
    addText(g, cx, round(gy - 2), `${circled[layer.index - 1]} ${layer.index}층 뒤 날개 자리`, 2.2, 'middle');
  }

  // ── Floor face (lower half): tier 1's bottom-flap glue line ㉠ ────────────
  // The flap points toward the spine, covering [gy − flap, gy] — same
  // glue-face treatment as the backdrop lines.
  const floorLine = geo.layers[0];
  {
    const gy = round(cy + floorLine.topDepth);
    const hw = round(floorLine.width / 2);
    addRect(g, round(cx - hw), round(gy - flap), round(floorLine.width), flap, styles.glueStyle);
    addPath(g, `M ${round(cx - hw)} ${gy} L ${round(cx + hw)} ${gy}`, styles.scoreStyle);
    addText(g, cx, round(gy - 2), '㉠ 1층 아래 날개 자리', 2.2, 'middle');
  }

  // ── Tier strips (fully cut-out pieces) ────────────────────────────────────
  // Tier 1 in the backdrop face's outer region, above the glue lines.
  const strip1H = 2 * flap + geo.layers[0].topDepth + geo.layers[0].frontHeight;
  const strip1Top = Math.max(PRINT.MARGIN + 8, cy - geo.layers[geo.layers.length - 1].crest - flap - strip1H - 12);
  drawTierStrip(g, cx - geo.layers[0].width / 2, strip1Top, geo.layers[0], geo.layers[1] || null, styles, flap);

  // Tiers 2..N flowed side-by-side (max 2 per row) on the floor face, below ㉠.
  let rowY = cy + floorLine.topDepth + 10;
  for (let i = 1; i < geo.layers.length; i += 2) {
    const row = geo.layers.slice(i, i + 2);
    const rowW = row.reduce((s, l) => s + l.width, 0) + (row.length - 1) * 8;
    let x = cx - rowW / 2;
    let rowH = 0;
    for (const layer of row) {
      const idx = geo.layers.indexOf(layer);
      const hDrawn = drawTierStrip(g, x, rowY, layer, geo.layers[idx + 1] || null, styles, flap);
      rowH = Math.max(rowH, hDrawn);
      x += layer.width + 8;
    }
    rowY += rowH + 8;
  }

  // Title in the outer waste margin (above the trim line) — the whole page is
  // the card, so no free-floating text may sit inside the trim rect.
  addText(g, cx, PRINT.MARGIN - 1.5, '층층이 무대 (Layered Stage)', 3, 'middle');

  return g;
};

/**
 * Render the layered stage onto a complete printable SVG template (page + spine).
 * @param {Object} [params={}]
 * @param {'A4'|'LETTER'} [params.paperSize='A4']
 * @param {'color'|'bw'} [params.colorMode='color']
 * @param {number} [params.layers=3]
 * @param {Array} [params.layerSpec]
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

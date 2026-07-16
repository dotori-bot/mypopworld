/**
 * @fileoverview Spiral-spring pop-up ("달팽이 스프링") mechanism generator.
 *
 * A flat paper disc is cut as ONE continuous Archimedean spiral from the outer
 * rim inward to a small centre hub, leaving a constant-width strip that behaves
 * like a paper coil spring. The centre hub is glued to one card face; the outer
 * rim tip is glued to the OTHER face. Closing the card recoils the strip into
 * its flat disc; opening the card pulls the two anchors apart and the strip
 * pays out into a standing 3-D helix. Flat decorations (planets, etc.) glued at
 * marked points along the strip float at different heights as it rises.
 *
 * ── Spiral cut geometry ──────────────────────────────────────────────────────
 *   Archimedean spiral r(θ) = r0 + b·θ, with radial pitch (strip width) w.
 *   One full turn (Δθ = 2π) grows r by w, so b = w / 2π.
 *   With N turns from the hub edge r0 out to the rim:
 *       R_outer = r0 + N·w              (rim radius)
 *       strip centre-line length  L_strip ≈ π·(r0 + R_outer)·N
 *   Tradeoff: more turns / thinner strip ⇒ more extension but a floppier strip
 *   that buckles under a glued decoration. We fix w in the 4–10 mm band (default
 *   8 mm — stiff enough even in plain copier paper to cantilever a ~14 mm planet
 *   over the ~32 mm disc span) and N in 3–7 (default 4), giving
 *   R_outer = 7 + 4·8 = 39 mm.
 *
 * ── Extension model ──────────────────────────────────────────────────────────
 *   Pulling the hub up out of the plane tilts the (radially stacked) turns into
 *   a helix. In the fully-taut, vertical-walled cylinder limit each turn's
 *   radial width w becomes vertical rise, so the max end-to-end extension is
 *       E_max ≈ N·w = R_outer − r0.
 *   (The strip's true arc length L_strip is far larger, but reaching it would
 *   pull the coil dead straight and tear it — E_max is the usable ceiling.)
 *   We only spend a safe fraction EXT_SAFETY (0.9) of E_max on the demanded
 *   stretch so tension stays low and the anchor tabs never peel.
 *
 * ── Anchors & card-opening coupling ─────────────────────────────────────────
 *   Hub glued to face A at distance a below the spine; rim tip glued to face B
 *   at distance b above the spine, positioned so that when the card is shut the
 *   tip lands back on the disc rim (the coil is relaxed flat, |a−b| = R_outer).
 *   Two arms of length a and b about the spine hinge give, at opening angle α:
 *       D(α) = √(a² + b² − 2·a·b·cosα)          (law of cosines)
 *   D grows monotonically from R_outer (shut) to a+b (flat), so the EXTRA
 *   stretch the coil must absorb is ΔD = (a+b) − |a−b| = 2·min(a,b) = 2b
 *   (we keep b < a, tip near the spine). Design rule:
 *       2b ≤ EXT_SAFETY · (R_outer − r0)   ⇒   b ≤ 0.45·(R_outer − r0)
 *       a  = R_outer + b
 *   The estimated standing height (for decoration placement) is H_stand ≈ 2b.
 *
 * ── THE hard constraint: decorations never overflow the page ─────────────────
 *   With the card stood open, a decoration at height h up the coil with radius ρ
 *   reaches h+ρ; it must stay below the standing back face's top edge:
 *       h_i + ρ_i ≤ CARD.height − PRINT.MARGIN            (per paper size)
 *   The tighter card (US Letter, 139.7 mm) governs the default. Each of the
 *   `decorations` markers gets max ρ_i = (CARD.height − MARGIN) − h_i, clamped,
 *   and additionally a visual cap so the drawn suggestion stays proportional.
 *
 * ── Fit to the page ──────────────────────────────────────────────────────────
 *   Disc + tip offset must sit on one face below the spine:
 *       2·R_outer + b ≤ CARD.height − PRINT.MARGIN
 *   R_outer (via effective turns) and b are clamped down until this holds on the
 *   requested paper size, so an over-large request can never run off the sheet.
 *
 * ── Flat-foldability ─────────────────────────────────────────────────────────
 *   N/A — the spiral spring has NO mountain/valley folds, so there is nothing to
 *   pair. It lies flat when the card shuts because the coil elastically RECOILS
 *   into its printed flat disc (it recoils, it does not fold).
 *
 * @module generators/spiralSpring
 */

import { CARD_SIZES, PRINT } from './constants.js';
import { clamp, round, radToDeg, polarToCartesian } from '../utils/math.js';
import {
  addPath,
  addRect,
  addText,
  addGroup,
  getLineStyle,
  createTemplate,
} from './svgBuilder.js';

/** Fixed design limits (see file header for the derivations). */
export const SPIRAL_LIMITS = {
  HUB_R: 7,            // r0: centre hub radius (mm) → 14 mm glue disc, > 5 mm floor
  PITCH_MIN: 4,
  PITCH_MAX: 10,       // w: strip width / radial pitch (mm)
  TURNS_MIN: 3,
  TURNS_MAX: 7,        // N
  DECOS_MIN: 3,
  DECOS_MAX: 5,        // decoration attachment markers
  TAB: 6,              // outer-rim glue tab (mm) — above the 5 mm grip floor
  EXT_SAFETY: 0.9,     // usable fraction of (R_outer − r0) spent on stretch
  DECO_VISUAL_MAX: 14, // drawn "suggested max radius" cap (mm), for proportion
  DECO_VISUAL_MIN: 3,
  SEG_PER_TURN: 48,    // spiral polyline sampling density
};

/**
 * Full-circle SVG path (matches volvelle's helper style).
 * @param {number} cx @param {number} cy @param {number} r
 * @returns {string}
 */
function circlePath(cx, cy, r) {
  const x0 = round(cx - r);
  const x1 = round(cx + r);
  const cyR = round(cy);
  return `M ${x0} ${cyR} A ${round(r)} ${round(r)} 0 1 0 ${x1} ${cyR} ` +
         `A ${round(r)} ${round(r)} 0 1 0 ${x0} ${cyR} Z`;
}

/**
 * Build the continuous Archimedean-spiral cut as a sampled polyline path.
 * Parameterised by t ∈ [0,1]: t=0 at the hub edge (r=r0), t=1 at the rim
 * (r=R_outer). The rim end is placed at the TOP (0° = up, toward the spine).
 *
 * @param {number} cx @param {number} cy
 * @param {number} r0 @param {number} w @param {number} turns
 * @returns {string} SVG path "d"
 */
function spiralPath(cx, cy, r0, w, turns) {
  const segs = Math.max(8, Math.ceil(turns * SPIRAL_LIMITS.SEG_PER_TURN));
  const span = w * turns; // = R_outer − r0
  let d = '';
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const r = r0 + span * t;
    const angleDeg = (t - 1) * 360 * turns; // t=1 → 0° (up)
    const p = polarToCartesian(cx, cy, r, angleDeg);
    d += `${i === 0 ? 'M' : 'L'} ${round(p.x)} ${round(p.y)} `;
  }
  return d.trim();
}

/**
 * @typedef {Object} SpiralGeometry
 * @property {number} r0        - Hub radius (mm)
 * @property {number} w         - Strip width / radial pitch (mm)
 * @property {number} turns     - Effective turns N (may be fractional after fit clamp)
 * @property {number} rOuter    - Rim radius R_outer = r0 + N·w (mm)
 * @property {number} a         - Hub distance below spine (mm)
 * @property {number} b         - Rim-tip distance above spine (mm)
 * @property {number} hStand    - Estimated standing coil height ≈ 2b (mm)
 * @property {number} tab       - Outer glue-tab size (mm)
 * @property {number} overflowBound - CARD.height − MARGIN, the hard ceiling (mm)
 * @property {Array<{n:number,f:number,height:number,maxRadius:number,drawR:number}>} decos
 */

/**
 * Resolve + clamp spiral-spring parameters against the printable card face.
 * @param {{ turns?: number, pitch?: number, decorations?: number, paperSize?: 'A4'|'LETTER' }} opts
 * @returns {SpiralGeometry}
 */
export function resolveSpiralGeometry(opts = {}) {
  const L = SPIRAL_LIMITS;
  const card = CARD_SIZES[opts.paperSize] || CARD_SIZES.A4;
  const faceH = card.height - PRINT.MARGIN;   // printable depth spine → free edge
  const overflowBound = card.height - PRINT.MARGIN; // hard decoration ceiling

  // NaN-safe numeric intake (?? only guards null/undefined, not NaN/garbage).
  const numOr = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

  const r0 = L.HUB_R;
  const w = clamp(round(numOr(opts.pitch, 8)), L.PITCH_MIN, L.PITCH_MAX);
  let turns = clamp(Math.round(numOr(opts.turns, 4)), L.TURNS_MIN, L.TURNS_MAX);

  // Fit: 2·R_outer + b ≤ faceH with b = 0.45·(R_outer − r0) ⇒ 2.45·R_outer ≤ faceH + 0.45·r0.
  const rOuterFit = (faceH + 0.45 * r0) / 2.45;
  // Reduce turns (keep strip width w intact for rigidity) until the disc fits.
  const turnsFit = (rOuterFit - r0) / w;
  turns = clamp(Math.min(turns, turnsFit), L.TURNS_MIN, turnsFit > 0 ? turnsFit : L.TURNS_MIN);

  const rOuter = r0 + turns * w;

  // Tip offset b: safe stretch AND (redundantly) fit; floor at the 5 mm grip.
  const bSafe = 0.45 * (rOuter - r0);            // 2b ≤ 0.9·(R_outer − r0)
  const bFit = faceH - 2 * rOuter;               // 2·R_outer + b ≤ faceH
  const b = clamp(Math.min(bSafe, bFit), 5, Math.max(5, Math.min(bSafe, bFit)));
  const a = rOuter + b;

  const hStand = 2 * b;                            // estimated standing height

  const decos = clamp(Math.round(numOr(opts.decorations, 4)), L.DECOS_MIN, L.DECOS_MAX);
  const decoList = [];
  for (let i = 1; i <= decos; i++) {
    const f = i / decos;                           // fraction along strip from hub
    const height = round(hStand * f);
    const maxRadius = round(overflowBound - height); // HARD cap (may be large)
    const drawR = round(clamp(maxRadius, L.DECO_VISUAL_MIN, L.DECO_VISUAL_MAX));
    decoList.push({ n: i, f: round(f, 3), height, maxRadius, drawR });
  }

  return {
    r0: round(r0),
    w: round(w),
    turns: round(turns, 3),
    rOuter: round(rOuter),
    a: round(a),
    b: round(b),
    hStand: round(hStand),
    tab: L.TAB,
    overflowBound: round(overflowBound),
    decos: decoList,
  };
}

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦'];

/**
 * Draw the spiral-spring flat pattern into a passed-in SVG/group.
 *
 * Layout: the disc (hub anchor) is centred on face A at (cx, cy + a); the rim
 * tip's glue tab sits at the top of the disc; the tip's glue TARGET is marked on
 * face B at (cx, cy − b). Numbered dots along the coil mark decoration points.
 *
 * @param {SVGElement} svg - Target element (a content group from createTemplate)
 * @param {Object} [options]
 * @param {number} [options.cx=105] - Spine centre X (mm)
 * @param {number} [options.cy=148.5] - Spine centre Y (mm)
 * @param {number} [options.turns=4] - Spiral turns N (3–7)
 * @param {number} [options.pitch=8] - Strip width w (mm, 4–10)
 * @param {number} [options.decorations=4] - Attachment markers (3–5)
 * @param {'A4'|'LETTER'} [options.paperSize='A4'] - For clamping vs the card face
 * @param {boolean} [options.isColor=true]
 * @returns {SVGGElement}
 */
export const generateSpiralSpring = (svg, options = {}) => {
  const {
    cx = 105,
    cy = 148.5,
    isColor = true,
    paperSize = 'A4',
  } = options;

  const geo = resolveSpiralGeometry({
    turns: options.turns,
    pitch: options.pitch,
    decorations: options.decorations,
    paperSize,
  });
  const { r0, w, turns, rOuter, a, b, tab, decos } = geo;

  const g = addGroup(svg, 'spiral-spring-group');
  const cutStyle = getLineStyle('CUT', isColor);
  const glueStyle = getLineStyle('GLUE_TAB', isColor);
  const scoreStyle = getLineStyle('SCORE', isColor);

  const hubX = round(cx);
  const hubY = round(cy + a);           // disc centre, below the spine (face A)

  // 0. Strip-width guide: a light fill across the whole annulus (hub edge →
  //    rim) so the coiled strip's real width (pitch w) reads visually on the
  //    flat pattern instead of looking like a bare hairline thread. This is
  //    purely a visual aid — the only actual CUT is the single spiral line
  //    below; the guide sits underneath it and every other mark.
  const bandFill = addPath(
    g,
    `${circlePath(hubX, hubY, rOuter)} ${circlePath(hubX, hubY, r0)}`,
    { fill: isColor ? 'rgba(120,90,40,0.08)' : 'rgba(0,0,0,0.06)' },
  );
  bandFill.setAttribute('fill-rule', 'evenodd');

  // 1. Disc outer boundary (cut).
  addPath(g, circlePath(hubX, hubY, rOuter), cutStyle);

  // 2. The continuous spiral cut (rim → hub). This is what turns the disc into
  //    a coil strip; the rim end is at the top of the disc (toward the spine).
  addPath(g, spiralPath(hubX, hubY, r0, w, turns), cutStyle);

  // 3. Centre hub anchor — glued to face A (①). Its disc is the glue area.
  addPath(g, circlePath(hubX, hubY, r0), glueStyle);
  addText(g, hubX, round(hubY + 1), '①풀칠', 2.4, 'middle');

  // 4. Outer rim tip glue tab (②) — small tab above the rim, glued to face B.
  const rimTopY = round(hubY - rOuter);          // top of disc = b below spine
  const tabHalf = round(Math.max(w, 6) / 2 + 1);
  addRect(g, round(hubX - tabHalf), round(rimTopY - tab), round(tabHalf * 2), tab, glueStyle);
  addText(g, hubX, round(rimTopY - tab / 2 + 1), '②', 2.6, 'middle');

  // 5. Tip glue TARGET on face B, above the spine at (cx, cy − b).
  const tgtY = round(cy - b);
  addRect(g, round(hubX - tabHalf), round(tgtY - tab / 2), round(tabHalf * 2), tab, scoreStyle);
  addText(g, hubX, round(tgtY + 1), '②붙이기', 2.2, 'middle');

  // 6. Decoration attachment markers along the coil (numbered dots). The
  //    circled number sits right at its dot, where the glued-on decoration
  //    will cover it — the only text allowed on the coil itself.
  const span = w * turns;
  for (const d of decos) {
    const r = r0 + span * d.f;
    const angleDeg = (d.f - 1) * 360 * turns;
    const p = polarToCartesian(hubX, hubY, r, angleDeg);
    addPath(g, circlePath(round(p.x), round(p.y), 1.8), cutStyle);
    addText(g, round(p.x), round(p.y - 3), CIRCLED[d.n - 1], 3, 'middle');
  }

  // 7. Title + decoration size legend, on one line in the outer waste margin —
  //    the page is the card, so free text may not sit inside the trim rect.
  const legendLine = decos
    .map((d) => `${CIRCLED[d.n - 1]} R≤${d.maxRadius}mm`)
    .join(' · ');
  addText(
    g,
    hubX,
    PRINT.MARGIN - 1.5,
    `달팽이 스프링 팝업 (Spiral Spring) — 장식 붙이는 곳 최대 반지름: ${legendLine}`,
    2.4,
    'middle',
  );

  return g;
};

/**
 * Render the spiral spring onto a complete printable SVG template (page + spine).
 * @param {Object} [params={}]
 * @param {'A4'|'LETTER'} [params.paperSize='A4']
 * @param {'color'|'bw'} [params.colorMode='color']
 * @param {number} [params.turns=4]
 * @param {number} [params.pitch=8]
 * @param {number} [params.decorations=4]
 * @returns {{ svg: SVGSVGElement }}
 */
export function renderSpiralSpring(params = {}) {
  const { paperSize = 'A4', colorMode = 'color', ...opts } = params;
  const { svg, contentGroup, paper, spineY } = createTemplate(paperSize, colorMode);
  generateSpiralSpring(contentGroup, {
    cx: paper.width / 2,
    cy: spineY,
    paperSize,
    ...opts,
    isColor: colorMode !== 'bw',
  });
  return { svg };
}

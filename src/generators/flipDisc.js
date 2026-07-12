/**
 * @fileoverview Flip-disc ("반쪽 넘김판") mechanism generator.
 *
 * A circular picture is split down its VERTICAL DIAMETER. The LEFT half is a
 * fixed background half-disc glued flat to the card. The RIGHT half is a stack
 * of N half-disc "flip pages", all hinged on that same diameter line and
 * flipped one at a time like the leaves of a book — each page, laid flat over
 * the fixed left half, completes a different full circle ("dish"). This is a
 * distinct mechanism from the volvelle (which ROTATES one full disc behind a
 * window); here nothing rotates — half-disc leaves are TURNED past a fixed
 * half.
 *
 * Parts printed on the sheet (all loose cut-outs, assembled onto a background):
 *   1. Fixed half-disc (LEFT semicircle, radius R) — the background half.
 *   2. N flip pages (RIGHT semicircle, radius R) — each with a hinge tab of
 *      width `t` on its straight (diameter) edge and a small grip nub on its
 *      arc, the nub angle staggered per page so the leaves fan (see image ref).
 *
 * ── Hinge / binding geometry ────────────────────────────────────────────────
 *   Hinge line = the circle's vertical diameter (local x = dcx). Each flip
 *   page = [tab | fold-score | half-disc]. In assembly the tabs are folded
 *   back on the score, STACKED and glued to each other (that is the binding
 *   "spine"), then the spine's base is glued to the background ON the diameter
 *   line; finally the fixed half-disc is glued on top, covering the tab spine.
 *   Each disc therefore pivots about the diameter and emerges from beneath the
 *   fixed half — the flex point is protected under a large glued anchor.
 *
 *   Tab width  t = 8 mm (≥ 5 mm grip/glue floor). Anchor area per page is
 *   t · 2R = 8·2R mm² — a wide line hinge, not a point, so repeated flipping
 *   spreads the stress instead of tearing one fibre. The score is pre-creased
 *   both ways (see instructions) so the fold does not crack.
 *
 * ── Alignment vs. stagger (the key insight) ─────────────────────────────────
 *   Every leaf must land its diameter EXACTLY on the fixed half's diameter or
 *   the circle won't line up when a page is closed. So the DISCS are all
 *   geometrically identical and share the one fold line — nothing about the
 *   swap moves a disc. The fanned "stagger" seen in the reference is therefore
 *   applied ONLY to a small grip NUB on the arc (angle α_k = NUB_START + k·Δ,
 *   Δ = 10°), which sticks out past radius R and never affects where the clean
 *   circle edge lands. N leaves fan over (N−1)·10° ≤ 50° of arc — each nub is
 *   individually catchable by a fingertip, matching image 1.
 *
 * ── Flat-foldability ────────────────────────────────────────────────────────
 *   N/A in the pop-up (mountain/valley card-action) sense — this mechanism has
 *   no spine-driven fold. It is a bound stack of leaves that simply lies flat
 *   like a book; the only crease is the book-style hinge at each leaf's
 *   diameter. So there is no mountain/valley pairing to verify.
 *
 * ── Print fit ───────────────────────────────────────────────────────────────
 *   The N+1 parts are packed into a rows×cols grid on the printable sheet
 *   (PAPER_SIZES − 2·MARGIN). For each candidate row count we solve the largest
 *   R that fits both width (cols·(R+tab+nub+gap) ≤ usableW) and height
 *   (rows·(2R+label+gap) ≤ usableH) and keep the best; R is then clamped to
 *   [R_MIN, min(R_MAX, R_fit)]. This is evaluated against the actual paperSize,
 *   so the defaults fit on BOTH A4 and Letter. The assembled circle (2R wide,
 *   2R tall) also fits inside one card face for all clamped R.
 *
 * @module generators/flipDisc
 */

import { PAPER_SIZES, PRINT } from './constants.js';
import { clamp, round, polarToCartesian } from '../utils/math.js';
import {
  addPath,
  addRect,
  addText,
  addGroup,
  getLineStyle,
  createTemplate,
} from './svgBuilder.js';

/** Fixed design constants (see file header). */
export const FLIPDISC_CONST = {
  R_MAX: 48,
  R_MIN: 22,
  R_DEFAULT: 42,
  PAGES_MIN: 3,
  PAGES_MAX: 6,
  PAGES_DEFAULT: 4,
  TAB: 8,            // hinge tab width (mm) — ≥ 5 mm grip/glue floor
  NUB_DEPTH: 5,      // grip nub radial depth (mm)
  NUB_HALF_DEG: 6,   // grip nub angular half-width (deg)
  STAGGER_DEG: 10,   // Δ: nub angle offset per page (deg)
  NUB_START_DEG: 100, // first nub angle (lower-right arc; 90=right, 180=down)
  GAP: 7,            // gap between grid cells (mm)
  LABEL_GAP: 6,      // vertical space reserved under each part for its label (mm)
  TITLE_BAND: 7,     // reserved strip at the top for the title (mm)
  ROWS_MAX: 3,       // max grid rows to consider when packing
};

/** Coerce to a finite number, else fall back. */
function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];

/**
 * @typedef {Object} FlipDiscGeometry
 * @property {number} R      - Clamped disc radius (mm)
 * @property {number} pages  - Clamped flip-page count N
 * @property {number} rows   - Grid rows chosen
 * @property {number} cols   - Grid cols chosen
 * @property {number} tab    - Hinge tab width (mm)
 * @property {number} cellW  - Grid cell width (mm)
 * @property {number} cellH  - Grid cell height (mm)
 * @property {number} usableW
 * @property {number} usableH
 */

/**
 * Resolve + clamp flip-disc parameters against the printable sheet.
 * @param {{ R?: number, pages?: number, paperSize?: 'A4'|'LETTER' }} opts
 * @returns {FlipDiscGeometry}
 */
export function resolveFlipDiscGeometry(opts = {}) {
  const C = FLIPDISC_CONST;
  const paper = PAPER_SIZES[opts.paperSize] || PAPER_SIZES.A4;
  const usableW = paper.width - 2 * PRINT.MARGIN;
  // Reserve a strip at the top for the title; the grid packs into the rest.
  const usableH = paper.height - 2 * PRINT.MARGIN - C.TITLE_BAND;

  const pages = clamp(Math.round(num(opts.pages, C.PAGES_DEFAULT)), C.PAGES_MIN, C.PAGES_MAX);
  const cells = pages + 1; // + the fixed background half

  // Width/height a part needs beyond its bare disc radius.
  const extraW = C.TAB + C.NUB_DEPTH + C.GAP; // tab (left) + nub (right) + gap
  const extraH = C.LABEL_GAP + C.GAP;

  // Pick the grid (row count) that admits the largest fitting R.
  let best = { Rfit: 0, rows: 1, cols: cells };
  for (let rows = 1; rows <= C.ROWS_MAX; rows++) {
    const cols = Math.ceil(cells / rows);
    const Rw = usableW / cols - extraW;
    const Rh = (usableH / rows - extraH) / 2;
    const Rfit = Math.min(Rw, Rh);
    if (Rfit > best.Rfit) best = { Rfit, rows, cols };
  }

  const Rcap = Math.max(C.R_MIN, Math.min(C.R_MAX, best.Rfit));
  const R = clamp(num(opts.R, C.R_DEFAULT), C.R_MIN, Rcap);

  const cellW = usableW / best.cols;
  const cellH = usableH / best.rows;

  return {
    R: round(R),
    pages,
    rows: best.rows,
    cols: best.cols,
    tab: C.TAB,
    cellW: round(cellW),
    cellH: round(cellH),
    usableW: round(usableW),
    usableH: round(usableH),
  };
}

/**
 * Build the cut outline for one flip page: a right-hand half-disc (straight
 * edge on the left at x=dcx, bulging right), a rectangular hinge tab of width
 * `t` on the left, and a grip nub poking out of the arc at angle `nubA`.
 * @returns {string} SVG path "d"
 */
function flipPageOutline(dcx, dcy, R, t, nubA, nubHalf, nubDepth) {
  const top = { x: dcx, y: dcy - R };              // 0° (up)
  const bot = { x: dcx, y: dcy + R };              // 180° (down)
  const p1 = polarToCartesian(dcx, dcy, R, nubA - nubHalf);
  const p2 = polarToCartesian(dcx, dcy, R, nubA + nubHalf);
  const o1 = polarToCartesian(dcx, dcy, R + nubDepth, nubA - nubHalf);
  const o2 = polarToCartesian(dcx, dcy, R + nubDepth, nubA + nubHalf);
  const atl = { x: dcx - t, y: dcy - R };          // tab top-left
  const bbl = { x: dcx - t, y: dcy + R };          // tab bottom-left
  return (
    `M ${round(atl.x)} ${round(atl.y)} ` +
    `L ${round(top.x)} ${round(top.y)} ` +
    `A ${round(R)} ${round(R)} 0 0 1 ${round(p1.x)} ${round(p1.y)} ` +
    `L ${round(o1.x)} ${round(o1.y)} L ${round(o2.x)} ${round(o2.y)} L ${round(p2.x)} ${round(p2.y)} ` +
    `A ${round(R)} ${round(R)} 0 0 1 ${round(bot.x)} ${round(bot.y)} ` +
    `L ${round(bbl.x)} ${round(bbl.y)} Z`
  );
}

/**
 * Build the cut outline for the fixed LEFT half-disc (straight edge on the
 * right at x=dcx, bulging left).
 * @returns {string} SVG path "d"
 */
function fixedHalfOutline(dcx, dcy, R) {
  const top = { x: round(dcx), y: round(dcy - R) };
  const bot = { x: round(dcx), y: round(dcy + R) };
  // From bottom, sweep through the LEFT (270°) up to top, then the straight
  // diameter edge closes it (Z).
  return `M ${bot.x} ${bot.y} A ${round(R)} ${round(R)} 0 0 1 ${top.x} ${top.y} Z`;
}

/**
 * Draw the flip-disc parts (fixed half + N flip pages) into a passed-in group.
 *
 * @param {SVGElement} svg - Target element (a content group from createTemplate)
 * @param {Object} [options]
 * @param {number} [options.R=42] - Disc radius (mm, ≤48)
 * @param {number} [options.pages=4] - Flip-page count N (3–6)
 * @param {'A4'|'LETTER'} [options.paperSize='A4'] - For clamping vs the sheet
 * @param {boolean} [options.isColor=true]
 * @returns {SVGGElement}
 */
export const generateFlipDisc = (svg, options = {}) => {
  const { isColor = true, paperSize = 'A4' } = options;
  const C = FLIPDISC_CONST;

  const geo = resolveFlipDiscGeometry({ R: options.R, pages: options.pages, paperSize });
  const { R, pages, rows, cols, tab, cellW, cellH } = geo;

  const g = addGroup(svg, 'flipdisc-group');
  const cutStyle = getLineStyle('CUT', isColor);
  const glueStyle = getLineStyle('GLUE_TAB', isColor);
  const valleyStyle = getLineStyle('VALLEY_FOLD', isColor);

  // Grid origin: left margin, and below the reserved title band.
  const ox = PRINT.MARGIN;
  const oy = PRINT.MARGIN + C.TITLE_BAND;

  // Half-content offsets so tab (left) + disc + nub (right) sit centred in cell.
  const contentW = tab + R + C.NUB_DEPTH;

  /** Cell centre → disc-centre (straight edge x). */
  const cellDisc = (cellIdx, bulge) => {
    const r = Math.floor(cellIdx / cols);
    const c = cellIdx % cols;
    const cx = ox + c * cellW + cellW / 2;
    const cyTop = oy + r * cellH;
    const dcy = cyTop + C.GAP / 2 + R;
    // For a right-bulging flip page: tab on the left, so straight edge sits at
    //   cx - contentW/2 + tab. For the left-bulging fixed half: straight edge
    //   sits at cx + contentW/2 - tab (mirror), keeping equal side margins.
    const dcx = bulge === 'right'
      ? cx - contentW / 2 + tab
      : cx + contentW / 2 - tab;
    return { dcx: round(dcx), dcy: round(dcy), labelY: round(dcy + R + C.LABEL_GAP - 1) };
  };

  // ── Cell 0: fixed background half-disc (LEFT semicircle) ──────────────────
  {
    const { dcx, dcy, labelY } = cellDisc(0, 'left');
    addPath(g, fixedHalfOutline(dcx, dcy, R), cutStyle);
    // Hinge / glue strip along the straight (right) edge — where the flip-page
    // tab spine is bound. Drawn just INSIDE the diameter so it stays on paper.
    // The glue strip's right boundary IS the piece's straight cut edge — no
    // extra score line there (it would double-register on the cut line).
    addRect(g, round(dcx - tab), round(dcy - R), tab, round(2 * R), glueStyle);
    addText(g, round(dcx - tab / 2), round(dcy + 1), '경첩', 2.5, 'middle');
    addText(g, round(dcx - R / 2), labelY, '고정 반쪽 (배경)', 3, 'middle');
  }

  // ── Cells 1..N: flip pages (RIGHT semicircle, staggered grip nubs) ────────
  for (let k = 0; k < pages; k++) {
    const { dcx, dcy, labelY } = cellDisc(k + 1, 'right');
    const nubA = C.NUB_START_DEG + k * C.STAGGER_DEG;
    addPath(g, flipPageOutline(dcx, dcy, R, tab, nubA, C.NUB_HALF_DEG, C.NUB_DEPTH), cutStyle);
    // Fold score between tab and disc (the book hinge).
    addPath(g, `M ${dcx} ${round(dcy - R)} L ${dcx} ${round(dcy + R)}`, valleyStyle);
    // Glue only the tab (this is the binding). Never the disc face.
    addRect(g, round(dcx - tab), round(dcy - R), tab, round(2 * R), glueStyle);
    addText(g, round(dcx - tab / 2), round(dcy + 1), '풀칠', 2.2, 'middle');
    // Page label at the disc centre (kid draws art here).
    const label = CIRCLED[k] || String(k + 1);
    addText(g, round(dcx + R * 0.45), round(dcy + 1), `${label} 그림`, 3, 'middle');
  }

  // Title (inside the reserved top band)
  addText(g, round(PRINT.MARGIN + geo.usableW / 2), round(PRINT.MARGIN + C.TITLE_BAND - 2.5),
    '반쪽 넘김판 (Flip Disc) — 왼쪽 반쪽은 고정, 오른쪽 반쪽을 넘겨요', 3, 'middle');

  return g;
};

/**
 * Render the flip-disc onto a complete printable SVG template (page + spine).
 * @param {Object} [params={}]
 * @param {'A4'|'LETTER'} [params.paperSize='A4']
 * @param {'color'|'bw'} [params.colorMode='color']
 * @param {number} [params.R=42]
 * @param {number} [params.pages=4]
 * @returns {{ svg: SVGSVGElement }}
 */
export function renderFlipDisc(params = {}) {
  const { paperSize = 'A4', colorMode = 'color', ...opts } = params;
  const { svg, contentGroup } = createTemplate(paperSize, colorMode);
  generateFlipDisc(contentGroup, {
    paperSize,
    ...opts,
    isColor: colorMode !== 'bw',
  });
  return { svg };
}

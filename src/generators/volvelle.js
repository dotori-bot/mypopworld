/**
 * @fileoverview Volvelle spinner ("돌림판") mechanism generator.
 *
 * A rotating disc is captured behind a window with paper only — no brad or
 * fastener. Four loose parts are printed two-up on the sheet and cut out:
 *
 *   1. Cover disc   (Ø 2·R+16) — window arc + thumb notch cut into its rim
 *   2. Rotating disc (Ø 2·R)   — N radial dividers so each sector holds art
 *   3. Spacer ring  (Ø 2·R+16 outer, Ø 2·R+2c inner) — glue annulus rim
 *   4. Back disc    (Ø 2·R+16)
 *
 * Assembly: back disc + spacer ring + cover are rim-glued into a sandwich;
 * the rotating disc is dropped into the pocket UNGLUED and spins freely,
 * retained by the spacer-ring rim.
 *
 * Geometry:
 *   - N sectors of angular width σ = 360° / N
 *   - Window angular width θ_w = σ − 2δ (guard δ = 6°) so neighbouring sectors
 *     never bleed into the window
 *   - Pocket clearance c = 1.0 mm: spacer inner radius R_in = R + c, so the
 *     disc (radius R) spins without binding
 *   - Window outer radius r_out = R − 1.5 mm, so up to 1 mm of disc drift can
 *     never uncover the window edge
 *
 * Hard cap: R ≤ 40 mm. Two Ø96 circles side by side (2·(2·40+16) = 192 mm)
 * fit the A4 printable width (200 mm); the 2×2 grid fits the height on both
 * A4 and Letter. Bigger discs run off the sheet.
 *
 * Flat-foldability: N/A — the volvelle has no folds, so no mountain/valley
 * pairing is required; capture is purely by the rim-glued sandwich.
 *
 * @module generators/volvelle
 */

import { PRINT } from './constants.js';
import { clamp, round, polarToCartesian } from '../utils/math.js';
import {
  addPath,
  addText,
  addGroup,
  getLineStyle,
  createTemplate,
} from './svgBuilder.js';

/** Fixed design constants (see file header). */
export const VOLVELLE_CONST = {
  R_MAX: 40,
  R_MIN: 20,
  SECTORS_MIN: 3,
  SECTORS_MAX: 10,
  CLEARANCE: 1.0,   // c: disc↔pocket clearance (mm)
  RIM: 8,           // glue-annulus / cover-overhang width (mm) → outer = R + RIM
  GUARD_DEG: 6,     // δ: window angular guard on each side
  WINDOW_MARGIN: 1.5, // r_out = R − this
  GRID_OFFSET: 52,  // half-spacing of the 2×2 parts grid (> outerR)
};

/**
 * Full-circle SVG path.
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
 * Closed annular-sector (pie-with-hole) path, angles in degrees (0 = up).
 * @returns {string}
 */
function sectorPath(cx, cy, rIn, rOut, startDeg, endDeg) {
  const oL = polarToCartesian(cx, cy, rOut, startDeg);
  const oR = polarToCartesian(cx, cy, rOut, endDeg);
  const iL = polarToCartesian(cx, cy, rIn, startDeg);
  const iR = polarToCartesian(cx, cy, rIn, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${round(iL.x)} ${round(iL.y)} ` +
         `L ${round(oL.x)} ${round(oL.y)} ` +
         `A ${round(rOut)} ${round(rOut)} 0 ${large} 1 ${round(oR.x)} ${round(oR.y)} ` +
         `L ${round(iR.x)} ${round(iR.y)} ` +
         `A ${round(rIn)} ${round(rIn)} 0 ${large} 0 ${round(iL.x)} ${round(iL.y)} Z`;
}

/**
 * @typedef {Object} VolvelleGeometry
 * @property {number} R      - Clamped disc radius (mm)
 * @property {number} sectors
 * @property {number} outerR - Cover/spacer/back outer radius = R + RIM
 * @property {number} innerR - Spacer inner radius = R + CLEARANCE
 * @property {number} rOut   - Window outer radius
 * @property {number} sigma  - Sector angle (deg)
 * @property {number} thetaW - Window angular width (deg)
 */

/**
 * Resolve + clamp volvelle parameters.
 * @param {{ R?: number, sectors?: number }} opts
 * @returns {VolvelleGeometry}
 */
export function resolveVolvelleGeometry(opts = {}) {
  const C = VOLVELLE_CONST;
  const R = clamp(opts.R ?? 40, C.R_MIN, C.R_MAX);
  const sectors = clamp(Math.round(opts.sectors ?? 6), C.SECTORS_MIN, C.SECTORS_MAX);
  const sigma = 360 / sectors;
  const thetaW = Math.max(sigma - 2 * C.GUARD_DEG, 10);
  return {
    R: round(R),
    sectors,
    outerR: round(R + C.RIM),
    innerR: round(R + C.CLEARANCE),
    rOut: round(R - C.WINDOW_MARGIN),
    sigma: round(sigma),
    thetaW: round(thetaW),
  };
}

/**
 * Draw the four volvelle parts (two-up, 2×2 grid) into a passed-in SVG/group.
 *
 * @param {SVGElement} svg - Target element (a content group from createTemplate)
 * @param {Object} [options]
 * @param {number} [options.cx=105] - Grid centre X (mm)
 * @param {number} [options.cy=148.5] - Grid centre Y (mm)
 * @param {number} [options.R=40] - Disc radius (mm, ≤40)
 * @param {number} [options.sectors=6] - Image sector count N (3–10)
 * @param {boolean} [options.isColor=true]
 * @returns {SVGGElement}
 */
export const generateVolvelle = (svg, options = {}) => {
  const {
    cx = 105,
    cy = 148.5,
    isColor = true,
  } = options;

  const geo = resolveVolvelleGeometry({ R: options.R, sectors: options.sectors });
  const { R, sectors, outerR, innerR, rOut, sigma, thetaW } = geo;

  const g = addGroup(svg, 'volvelle-group');
  const cutStyle = getLineStyle('CUT', isColor);
  const glueStyle = getLineStyle('GLUE_TAB', isColor);
  const scoreStyle = getLineStyle('SCORE', isColor);

  const off = VOLVELLE_CONST.GRID_OFFSET;
  const P = {
    cover:  { x: round(cx - off), y: round(cy - off) },
    rotor:  { x: round(cx + off), y: round(cy - off) },
    spacer: { x: round(cx - off), y: round(cy + off) },
    back:   { x: round(cx + off), y: round(cy + off) },
  };

  const glueRingR = round((outerR + innerR) / 2);

  // ── 1. Cover disc: outer circle + window (annular sector) + rim thumb notch ──
  addPath(g, circlePath(P.cover.x, P.cover.y, outerR), cutStyle);
  const winInner = clamp(round(R * 0.18), 5, R - 8); // small hub kept for capture
  addPath(
    g,
    sectorPath(P.cover.x, P.cover.y, winInner, rOut, -thetaW / 2, thetaW / 2),
    cutStyle,
  );
  // Thumb notch cut into the rim at the bottom (180°), open to the disc edge so
  // the exposed rotor rim (radius R < outerR) can be spun by a fingertip.
  const notchHalf = 15;
  const notchInner = round(R - 4); // reaches inside the rotor rim to expose it
  const nL = polarToCartesian(P.cover.x, P.cover.y, notchInner, 180 - notchHalf);
  const nLo = polarToCartesian(P.cover.x, P.cover.y, outerR, 180 - notchHalf);
  const nR = polarToCartesian(P.cover.x, P.cover.y, notchInner, 180 + notchHalf);
  const nRo = polarToCartesian(P.cover.x, P.cover.y, outerR, 180 + notchHalf);
  addPath(g, `M ${round(nLo.x)} ${round(nLo.y)} L ${round(nL.x)} ${round(nL.y)} ` +
             `A ${notchInner} ${notchInner} 0 0 1 ${round(nR.x)} ${round(nR.y)} ` +
             `L ${round(nRo.x)} ${round(nRo.y)}`, cutStyle);
  addText(g, P.cover.x, round(P.cover.y + outerR + 4), '① 덮개(창문)', 3, 'middle');

  // ── 2. Rotating disc: outer circle + N radial dividers + centre mark ──
  addPath(g, circlePath(P.rotor.x, P.rotor.y, R), cutStyle);
  for (let k = 0; k < sectors; k++) {
    const edge = polarToCartesian(P.rotor.x, P.rotor.y, R, k * sigma);
    addPath(g, `M ${round(P.rotor.x)} ${round(P.rotor.y)} L ${round(edge.x)} ${round(edge.y)}`, cutStyle);
    // sector number, kid-friendly, at mid radius of the sector centre
    const mid = polarToCartesian(P.rotor.x, P.rotor.y, R * 0.6, k * sigma + sigma / 2);
    addText(g, round(mid.x), round(mid.y + 1), String(k + 1), 3, 'middle');
  }
  // centre reference mark (no fastener hole — capture is by rim only)
  addPath(g, `M ${round(P.rotor.x - 2)} ${round(P.rotor.y)} L ${round(P.rotor.x + 2)} ${round(P.rotor.y)}`, scoreStyle);
  addPath(g, `M ${round(P.rotor.x)} ${round(P.rotor.y - 2)} L ${round(P.rotor.x)} ${round(P.rotor.y + 2)}`, scoreStyle);
  addText(g, P.rotor.x, round(P.rotor.y + R + 4), '② 돌림판(끼우기)', 3, 'middle');

  // ── 3. Spacer ring: outer + inner cut circles + glue-annulus indicator ──
  // The glue fill must be a true annulus (outerR..innerR), not a filled disc —
  // the ring's own hole (< innerR) is cut away entirely and never glued.
  addPath(g, circlePath(P.spacer.x, P.spacer.y, outerR), cutStyle);
  addPath(g, circlePath(P.spacer.x, P.spacer.y, innerR), cutStyle);
  const spacerGlue = addPath(
    g,
    `${circlePath(P.spacer.x, P.spacer.y, outerR)} ${circlePath(P.spacer.x, P.spacer.y, innerR)}`,
    glueStyle,
  );
  spacerGlue.setAttribute('fill-rule', 'evenodd');
  const spacerLabelPos = polarToCartesian(P.spacer.x, P.spacer.y, glueRingR, 0);
  addText(g, round(spacerLabelPos.x), round(spacerLabelPos.y + 1), '풀칠', 2.5, 'middle');
  addText(g, P.spacer.x, round(P.spacer.y + outerR + 4), '③ 간격 링(풀칠)', 3, 'middle');

  // ── 4. Back disc: outer cut circle + glue-annulus indicator ──
  // Glue is confined to the rim (outerR..innerR) where the spacer ring's
  // footprint actually lands — the center must stay bare so the rotor disc
  // can spin freely in the pocket; filling it would glue the rotor to the floor.
  addPath(g, circlePath(P.back.x, P.back.y, outerR), cutStyle);
  const backGlue = addPath(
    g,
    `${circlePath(P.back.x, P.back.y, outerR)} ${circlePath(P.back.x, P.back.y, innerR)}`,
    glueStyle,
  );
  backGlue.setAttribute('fill-rule', 'evenodd');
  const backLabelPos = polarToCartesian(P.back.x, P.back.y, glueRingR, 0);
  addText(g, round(backLabelPos.x), round(backLabelPos.y + 1), '풀칠', 2.5, 'middle');
  addText(g, P.back.x, round(P.back.y + outerR + 4), '④ 뒷판(풀칠)', 3, 'middle');

  return g;
};

/**
 * Render the volvelle onto a complete printable SVG template (page + spine).
 * @param {Object} [params={}]
 * @param {'A4'|'LETTER'} [params.paperSize='A4']
 * @param {'color'|'bw'} [params.colorMode='color']
 * @param {number} [params.R=40]
 * @param {number} [params.sectors=6]
 * @returns {{ svg: SVGSVGElement }}
 */
export function renderVolvelle(params = {}) {
  const { paperSize = 'A4', colorMode = 'color', ...opts } = params;
  const { svg, contentGroup, paper, spineY } = createTemplate(paperSize, colorMode);
  generateVolvelle(contentGroup, {
    cx: paper.width / 2,
    cy: spineY,
    ...opts,
    isColor: colorMode !== 'bw',
  });
  return { svg };
}

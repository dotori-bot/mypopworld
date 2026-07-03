/**
 * @fileoverview Accordion pop-up scene ("병풍 팝업") mechanism generator.
 *
 * A zigzag (concertina) strip spans the spine. Its two end panels are glued
 * flat onto the two card faces at distance `a` from the spine; the pleated
 * middle floats free and rises into a standing folding-screen ("병풍") as the
 * card opens.
 *
 * Geometry (card opening angle α, 0 = closed, 180 = flat/open):
 *   - Anchor separation (chord):   D(α) = 2·a·sin(α/2)
 *   - Standing half-angle:         cos ρ(α) = D(α) / L = 2·a·sin(α/2) / (M·w)
 *   - Zigzag projection per pleat:  H(α) = w·sin ρ(α)
 *
 * Design rule: the strip must never go fully taut before the card is flat,
 * or the opening card tears the glued end panels off. D(180°) = 2a, so we
 * require L > 2a; using the D(90°)/L ≈ 0.65 target gives L ≈ 2.18a and we
 * take the safety floor L = 2.2·a. With M pleat panels, w = L / M.
 *
 * Flat-foldability: the M-1 internal creases alternate mountain/valley
 * (a true accordion), and the pleat creases run PARALLEL to the spine, so
 * they collapse in the same fold direction as the card's own spine fold —
 * the whole scene lies flat when the card closes.
 *
 * NOTE on the prior spec wording ("fold lines perpendicular to the spine"):
 * for the D(α)=2a·sin(α/2) chord math to hold, the strip's *long axis* runs
 * perpendicular to the spine while the pleat creases themselves are parallel
 * to it. Implemented per the physics (parallel creases) so it actually
 * collapses flat; see the accompanying report note.
 *
 * @module generators/accordionPopup
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

/** Hard caps (keep the strip inside the printable card face on A4 and Letter). */
export const ACCORDION_LIMITS = {
  A_MIN: 20,
  A_MAX: 45,          // anchor distance cap
  WALL_MIN: 20,
  WALL_MAX: 70,       // screen (wall) height cap
  PANELS_MIN: 3,
  PANELS_MAX: 10,
  TAB_DEPTH: 10,      // end glue-panel depth (mm) — well above the 5mm grip floor
  SAFETY: 2.2,        // L = SAFETY · a
};

/**
 * @typedef {Object} AccordionGeometry
 * @property {number} a        - Clamped anchor distance from spine (mm)
 * @property {number} panels   - Clamped pleat-panel count M
 * @property {number} wallHeight - Clamped screen height h_wall (mm)
 * @property {number} L        - Flat pleated length = SAFETY·a (mm)
 * @property {number} w        - Panel width L/M (mm)
 * @property {number} tabDepth - End glue-panel depth (mm)
 * @property {number} totalLength - L + 2·tabDepth (mm)
 */

/**
 * Resolve + clamp accordion parameters against the printable card face.
 * @param {{ a?: number, panels?: number, wallHeight?: number, paperSize?: 'A4'|'LETTER' }} opts
 * @returns {AccordionGeometry}
 */
export function resolveAccordionGeometry(opts = {}) {
  const card = CARD_SIZES[opts.paperSize] || CARD_SIZES.A4;
  const L_LIM = ACCORDION_LIMITS;

  const panels = clamp(Math.round(opts.panels ?? 6), L_LIM.PANELS_MIN, L_LIM.PANELS_MAX);

  // Wall height runs parallel to the spine (horizontal on the sheet): cap by the
  // printable card width as well as the hard cap.
  const maxWall = Math.min(L_LIM.WALL_MAX, card.width - 2 * PRINT.MARGIN);
  const wallHeight = clamp(opts.wallHeight ?? 60, L_LIM.WALL_MIN, maxWall);

  // Anchor distance: cap by the hard cap AND by the space available along the
  // strip's long axis (perpendicular to spine). Half the total flat length,
  // (SAFETY·a + 2·tab)/2, must sit within one card half minus the margin.
  const tabDepth = L_LIM.TAB_DEPTH;
  const halfFace = card.height / 2 - PRINT.MARGIN; // spine → face edge, printable
  // (SAFETY·a)/2 + tab ≤ halfFace  →  a ≤ 2(halfFace - tab)/SAFETY
  const aFit = (2 * (halfFace - tabDepth)) / L_LIM.SAFETY;
  const maxA = Math.min(L_LIM.A_MAX, aFit);
  const a = clamp(opts.a ?? 40, L_LIM.A_MIN, maxA);

  const L = L_LIM.SAFETY * a;
  const w = L / panels;

  return {
    a: round(a),
    panels,
    wallHeight: round(wallHeight),
    L: round(L),
    w: round(w),
    tabDepth,
    totalLength: round(L + 2 * tabDepth),
  };
}

/**
 * Draw the accordion pop-up flat pattern into a passed-in SVG/group.
 *
 * The strip is drawn as one self-contained cut rectangle centred on the spine,
 * long axis vertical (perpendicular to spine). Horizontal fold lines divide it
 * into two end glue panels + M pleat panels (alternating mountain/valley).
 *
 * @param {SVGElement} svg - Target element (a content group from createTemplate)
 * @param {Object} [options]
 * @param {number} [options.cx=105] - Spine centre X (mm)
 * @param {number} [options.cy=148.5] - Spine centre Y (mm)
 * @param {number} [options.a=40] - Anchor distance from spine (mm, ≤45)
 * @param {number} [options.panels=6] - Pleat-panel count M
 * @param {number} [options.wallHeight=60] - Screen height h_wall (mm, ≤70)
 * @param {'A4'|'LETTER'} [options.paperSize='A4'] - For clamping vs card face
 * @param {boolean} [options.isColor=true]
 * @returns {SVGGElement}
 */
export const generateAccordion = (svg, options = {}) => {
  const {
    cx = 105,
    cy = 148.5,
    isColor = true,
    paperSize = 'A4',
  } = options;

  const geo = resolveAccordionGeometry({
    a: options.a,
    panels: options.panels,
    wallHeight: options.wallHeight,
    paperSize,
  });

  const g = addGroup(svg, 'accordion-group');

  const cutStyle = getLineStyle('CUT', isColor);
  const mountainStyle = getLineStyle('MOUNTAIN_FOLD', isColor);
  const valleyStyle = getLineStyle('VALLEY_FOLD', isColor);
  const glueStyle = getLineStyle('GLUE_TAB', isColor);

  const { wallHeight: hWall, panels: M, w, tabDepth, totalLength } = geo;

  const xL = round(cx - hWall / 2);
  const xR = round(cx + hWall / 2);
  const yTop = round(cy - totalLength / 2);
  const yBot = round(cy + totalLength / 2);
  const pleatTop = round(yTop + tabDepth); // first pleat crease / top glue boundary
  const pleatBot = round(yBot - tabDepth); // last pleat crease / bottom glue boundary

  // 1. Outer cut outline of the whole strip
  addRect(g, xL, yTop, round(hWall), totalLength, cutStyle);

  // 2. End glue panels (glued flat onto the two card faces at distance a).
  //    Depth = tabDepth (well above the 5mm grip floor).
  addRect(g, xL, yTop, round(hWall), tabDepth, glueStyle);
  addRect(g, xL, pleatBot, round(hWall), tabDepth, glueStyle);

  // 3. End-panel fold lines: valley, so each glue panel folds down flat onto its face.
  addPath(g, `M ${xL} ${pleatTop} L ${xR} ${pleatTop}`, valleyStyle);
  addPath(g, `M ${xL} ${pleatBot} L ${xR} ${pleatBot}`, valleyStyle);

  // 4. Internal pleat creases, alternating mountain / valley (true accordion).
  for (let i = 1; i < M; i++) {
    const y = round(pleatTop + i * w);
    const style = i % 2 === 1 ? mountainStyle : valleyStyle;
    addPath(g, `M ${xL} ${y} L ${xR} ${y}`, style);
  }

  // 5. Labels
  const labelY = Math.max(round(yTop - 3), PRINT.MARGIN + 3);
  addText(g, cx, labelY, '병풍 팝업 (Accordion)', 3, 'middle');
  addText(g, cx, round(yTop + tabDepth / 2 + 1), '풀칠', 2.5, 'middle');
  addText(g, cx, round(yBot - tabDepth / 2 + 1), '풀칠', 2.5, 'middle');

  return g;
};

/**
 * Render the accordion onto a complete printable SVG template (page + spine).
 * @param {Object} [params={}]
 * @param {'A4'|'LETTER'} [params.paperSize='A4']
 * @param {'color'|'bw'} [params.colorMode='color']
 * @param {number} [params.a=40]
 * @param {number} [params.panels=6]
 * @param {number} [params.wallHeight=60]
 * @returns {{ svg: SVGSVGElement }}
 */
export function renderAccordion(params = {}) {
  const { paperSize = 'A4', colorMode = 'color', ...opts } = params;
  const { svg, contentGroup, paper, spineY } = createTemplate(paperSize, colorMode);
  generateAccordion(contentGroup, {
    cx: paper.width / 2,
    cy: spineY,
    paperSize,
    ...opts,
    isColor: colorMode !== 'bw',
  });
  return { svg };
}

/**
 * @fileoverview Pull tab / slider mechanism generator ("슬롯 통과형").
 * Produces SVG template data for a sliding mechanism: a separate slider piece
 * moves through a horizontal track slot cut into the card; a knob on the FRONT
 * is dragged sideways to drive it.
 *
 * ── Slot / mount interface (the fix — was physically impossible before) ───────
 *   slotWidth = paperThickness + clearance = 0.3 + 0.8 = 1.1 mm. The OLD design
 *   folded a full sliderHeight-tall (≈15 mm) trapezoid handle off the slider's
 *   edge and asked it to pass through this 1.1 mm slit — it never could, so the
 *   grip could never reach the front. FIX (same interface as risingSlide.js):
 *   a small MOUNT flap is carved from the slider centre, hinged on a horizontal
 *   fold that lands exactly on the slot line, and folds FORWARD through the slit
 *   flat-wise — only the paper's 0.3 mm thickness crosses the 1.1 mm gap
 *   (0.4 mm/side clearance). A separate rounded KNOB (18×14 mm, "PULL ↔") glues
 *   onto the flap's front face. Knob (14 mm in Y) ≫ slot (1.1 mm in Y) and the
 *   slider body (≥5 mm in Y) both dwarf the slit, so the assembly is captured
 *   front-to-back and cannot fall off the card.
 *
 * ── Travel ───────────────────────────────────────────────────────────────────
 *   travel = trackLength − sliderWidth − 2·buffer (unchanged). The slider body
 *   is the element that travels in the guide channel; the mount flap is centred
 *   in X on the slider (width mountW ≤ sliderWidth), so it always sits inside the
 *   slider's X-span and reaches the slot ends only after the body stops — travel
 *   is set by the body, not the mount. The knob rides at the slider centre; at
 *   both extremes it stays inside the printable card face (the trackLength clamp
 *   leaves ≥10 mm to the margin, > knob half-width 9 mm) on A4 AND Letter.
 *
 * ── Flat-foldability ─────────────────────────────────────────────────────────
 *   N/A (flat mechanism, sceneType 'flat'): the whole stack is <1 mm thick and
 *   never leaves the plane, so there is no closing card to collapse flat. The
 *   only fold is the forward mount flap; it needs no mountain/valley pair.
 *
 * @module generators/pullTab
 */

import {
  PAPER_SIZES,
  CARD_SIZES,
  PRINT,
  getLineStyles,
} from './constants.js';
import { clamp, round } from '../utils/math.js';
import {
  addLine,
  addPath,
  addRect,
  addText,
  addGroup,
  createTemplate,
} from './svgBuilder.js';

/** Fixed design limits / clamps (see file header for the derivations). */
export const PULL_TAB = {
  PAPER_THICKNESS: 0.3,
  CLEARANCE_MIN: 0.5,
  CLEARANCE_MAX: 1.5,     // slotWidth = thickness + clearance
  BUFFER_MIN: 1,
  BUFFER_MAX: 5,
  SLIDER_W_MIN: 8,
  SLIDER_W_MAX: 60,
  SLIDER_H_MIN: 5,
  SLIDER_H_MAX: 40,
  MOUNT_W_FRAC: 0.45,     // mount flap width = frac · sliderWidth (X, along slot)
  MOUNT_W_MIN: 4,
  MOUNT_W_MAX: 16,
  MOUNT_LEN_MIN: 2.5,     // front glue-flap length (mm)
  MOUNT_LEN_MAX: 10,      // capped so the flap fits the slider's upper half
  KNOB_W: 18,             // knob width along slot (mm) — child-grippable, > slot
  KNOB_H: 14,             // knob height across slot (mm) — > slot
  KNOB_R: 4,              // knob corner radius (mm)
  GUIDE_W: 4,             // guide strip width (mm)
  GUIDE_GLUE_END: 5,      // guide glue grip each side (≥5 mm floor)
  STOP_W: 3,              // stop nub width (mm)
  STOP_H: 1.5,            // stop nub height (mm)
};

/**
 * @typedef {Object} PullTabParams
 * @property {'A4'|'LETTER'} paperSize
 * @property {{ x: number, y: number }} [position] - Centre of track slot on card (mm)
 * @property {number} sliderWidth    - Width of slider piece (mm)
 * @property {number} sliderHeight   - Height of slider piece (mm)
 * @property {number} trackLength    - Length of the track slot (mm)
 * @property {number} [paperThickness=0.3] - Paper thickness in mm
 * @property {number} [clearance=0.8]      - Extra clearance for slot width (mm)
 * @property {number} [buffer=2]           - Stop buffer at each end (mm)
 * @property {'color'|'bw'} [colorMode='color']
 */

/**
 * @typedef {Object} PullTabGeometry
 * @property {'A4'|'LETTER'} paperSize
 * @property {number} spineY
 * @property {number} sliderWidth
 * @property {number} sliderHeight
 * @property {number} trackLength
 * @property {number} slotWidth      - Slot narrow dimension = thickness + clearance (mm)
 * @property {number} buffer
 * @property {number} travel         - Slider travel distance (mm)
 * @property {number} mountW         - Mount flap width along slot (mm)
 * @property {number} mountLen       - Mount flap forward-fold length (mm)
 * @property {number} knobW          - Knob width along slot (mm)
 * @property {number} knobH          - Knob height across slot (mm)
 * @property {number} trackCenterX
 * @property {number} trackCenterY
 * @property {number} trackLeft
 * @property {number} trackRight
 * @property {number} trackTop
 * @property {number} trackBot
 */

/**
 * Resolve + clamp pull-tab geometry. Pure numbers only (no DOM) so both the
 * generator and the 3D scene builder consume ONE source of truth.
 *
 * @param {PullTabParams} [opts]
 * @returns {PullTabGeometry}
 */
export function resolvePullTab(opts = {}) {
  const P = PULL_TAB;
  const paper = PAPER_SIZES[opts.paperSize] || PAPER_SIZES.A4;
  const card = CARD_SIZES[opts.paperSize] || CARD_SIZES.A4;
  const paperSize = CARD_SIZES[opts.paperSize] ? opts.paperSize : 'A4';

  // NaN-safe numeric intake (?? only guards null/undefined, not NaN/garbage).
  const numOr = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

  const sliderWidth = clamp(numOr(opts.sliderWidth, 30), P.SLIDER_W_MIN, P.SLIDER_W_MAX);
  const sliderHeight = clamp(numOr(opts.sliderHeight, 15), P.SLIDER_H_MIN, P.SLIDER_H_MAX);
  const maxTrack = card.width - 2 * PRINT.MARGIN - 20;
  const trackLength = clamp(numOr(opts.trackLength, 80), 20, maxTrack);
  const paperThickness = numOr(opts.paperThickness, P.PAPER_THICKNESS);
  const clearance = clamp(numOr(opts.clearance, 0.8), P.CLEARANCE_MIN, P.CLEARANCE_MAX);
  const buffer = clamp(numOr(opts.buffer, 2), P.BUFFER_MIN, P.BUFFER_MAX);

  const slotWidth = round(paperThickness + clearance, 1);
  const travel = round(trackLength - sliderWidth - 2 * buffer, 1);

  // Mount flap: centred in X on the slider, ≤ sliderWidth − 2 so a rim remains
  // on each side for the stop nubs; length = half the slider height, capped.
  const mountW = clamp(
    Math.min(round(sliderWidth * P.MOUNT_W_FRAC), round(sliderWidth - 2)),
    P.MOUNT_W_MIN, P.MOUNT_W_MAX,
  );
  const mountLen = round(clamp(sliderHeight / 2, P.MOUNT_LEN_MIN, P.MOUNT_LEN_MAX), 1);

  const spineY = paper.height / 2;
  const trackCenterX = round(opts.position?.x ?? paper.width / 2, 1);
  const trackCenterY = round(opts.position?.y ?? (spineY - card.height / 4), 1);

  const trackLeft = round(trackCenterX - trackLength / 2);
  const trackRight = round(trackCenterX + trackLength / 2);
  const trackTop = round(trackCenterY - slotWidth / 2);
  const trackBot = round(trackCenterY + slotWidth / 2);

  return {
    paperSize,
    spineY: round(spineY, 1),
    sliderWidth: round(sliderWidth, 1),
    sliderHeight: round(sliderHeight, 1),
    trackLength: round(trackLength, 1),
    slotWidth,
    buffer,
    travel,
    mountW: round(mountW, 1),
    mountLen,
    knobW: P.KNOB_W,
    knobH: P.KNOB_H,
    trackCenterX,
    trackCenterY,
    trackLeft,
    trackRight,
    trackTop,
    trackBot,
  };
}

/**
 * Rounded-rectangle helper as an SVG path "d" (all corners same radius).
 * @param {number} x @param {number} y @param {number} w @param {number} h @param {number} r
 * @returns {string}
 */
function roundRectPath(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  return (
    `M ${round(x + rr)} ${round(y)} ` +
    `L ${round(x + w - rr)} ${round(y)} Q ${round(x + w)} ${round(y)} ${round(x + w)} ${round(y + rr)} ` +
    `L ${round(x + w)} ${round(y + h - rr)} Q ${round(x + w)} ${round(y + h)} ${round(x + w - rr)} ${round(y + h)} ` +
    `L ${round(x + rr)} ${round(y + h)} Q ${round(x)} ${round(y + h)} ${round(x)} ${round(y + h - rr)} ` +
    `L ${round(x)} ${round(y + rr)} Q ${round(x)} ${round(y)} ${round(x + rr)} ${round(y)} Z`
  );
}

/**
 * Generate pull tab mechanism data.
 *
 * Components:
 * 1. **Track slot** – A narrow horizontal cut in the card front.
 * 2. **Slider piece** – A separate piece behind the card, carrying a MOUNT flap
 *    that folds forward through the slot flat-wise.
 * 3. **Knob** – A separate front grip glued onto the mount flap (the part a
 *    child holds and drags sideways).
 * 4. **Guide strips** – Folded strips glued to the back of the card that trap
 *    the slider's top/bottom edges into a channel.
 * 5. **Stops** – Small nubs on the slider corners that catch on the guides.
 *
 * The loose pieces are placed in whitespace below the card outline.
 *
 * @param {PullTabParams} rawParams
 * @returns {Object}
 */
export function generatePullTab(rawParams) {
  const geo = resolvePullTab(rawParams);
  const P = PULL_TAB;
  const {
    paperSize, spineY, sliderWidth: sw, sliderHeight: sh, trackLength,
    slotWidth, travel, mountW, mountLen,
    trackCenterX, trackCenterY, trackLeft, trackRight, trackTop, trackBot,
  } = geo;

  const paper = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;
  const card = CARD_SIZES[paperSize] || CARD_SIZES.A4;

  // ── Track slot cuts (card front) ─────────────────────────────────
  /** @type {string[]} */
  const trackCuts = [
    `M ${trackLeft} ${trackTop} L ${trackRight} ${trackTop}`,
    `M ${trackRight} ${trackTop} L ${trackRight} ${trackBot}`,
    `M ${trackRight} ${trackBot} L ${trackLeft} ${trackBot}`,
    `M ${trackLeft} ${trackBot} L ${trackLeft} ${trackTop}`,
  ];

  // ── Guide strips (glued behind the card, flanking the slot) ──────
  const guideWidth = P.GUIDE_W;
  const guideTopY = round(trackTop - guideWidth - 1);
  const guideBotY = round(trackBot + 1);
  const gL = round(trackLeft - 3);
  const gR = round(trackRight + 3);

  /** @type {string[]} */
  const guideCuts = [
    `M ${gL} ${guideTopY} L ${gR} ${guideTopY} L ${gR} ${round(guideTopY + guideWidth)} L ${gL} ${round(guideTopY + guideWidth)} Z`,
    `M ${gL} ${guideBotY} L ${gR} ${guideBotY} L ${gR} ${round(guideBotY + guideWidth)} L ${gL} ${round(guideBotY + guideWidth)} Z`,
  ];
  /** @type {string[]} */
  const guideFolds = [
    `M ${gL} ${round(guideTopY + guideWidth / 2)} L ${gR} ${round(guideTopY + guideWidth / 2)}`,
    `M ${gL} ${round(guideBotY + guideWidth / 2)} L ${gR} ${round(guideBotY + guideWidth / 2)}`,
  ];
  // Guide glue ends (grip zones ≥5mm at each end; centre stays un-glued so the
  // slider can pass beneath).
  /** @type {Array<{x:number,y:number,w:number,h:number}>} */
  const guideGlue = [
    { x: gL, y: guideTopY, w: P.GUIDE_GLUE_END, h: guideWidth },
    { x: round(gR - P.GUIDE_GLUE_END), y: guideTopY, w: P.GUIDE_GLUE_END, h: guideWidth },
    { x: gL, y: guideBotY, w: P.GUIDE_GLUE_END, h: guideWidth },
    { x: round(gR - P.GUIDE_GLUE_END), y: guideBotY, w: P.GUIDE_GLUE_END, h: guideWidth },
  ];

  // ── Slider piece (loose, in whitespace below the card) ───────────
  const sliderAreaX = PRINT.MARGIN + 10;
  const sliderAreaY = round(spineY + card.height / 2 + 15);

  // Slider body outline.
  /** @type {string[]} */
  const sliderCuts = [
    `M ${sliderAreaX} ${sliderAreaY} ` +
    `L ${round(sliderAreaX + sw)} ${sliderAreaY} ` +
    `L ${round(sliderAreaX + sw)} ${round(sliderAreaY + sh)} ` +
    `L ${sliderAreaX} ${round(sliderAreaY + sh)} Z`,
  ];

  // Mount flap carved from the slider centre: hinged on the slider's horizontal
  // Y-centre (this line lands on the slot when assembled), cut free on left/top/
  // right, extends UP by mountLen. Fold it forward → it passes through the slit.
  const cxF = round(sliderAreaX + sw / 2);
  const cyF = round(sliderAreaY + sh / 2);       // fold line = slider Y-centre
  const flapTop = round(cyF - mountLen);
  const flapL = round(cxF - mountW / 2);
  const flapR = round(cxF + mountW / 2);
  // U-slit (cut) around the flap; the base (at cyF) stays attached = the hinge.
  const mountSlit =
    `M ${flapL} ${cyF} L ${flapL} ${flapTop} L ${flapR} ${flapTop} L ${flapR} ${cyF}`;
  sliderCuts.push(mountSlit);

  // Forward fold at the flap base.
  /** @type {string[]} */
  const sliderMountFolds = [
    `M ${flapL} ${cyF} L ${flapR} ${cyF}`,
  ];

  // Glue zone on the flap front face (where the knob attaches).
  /** @type {Array<{x:number,y:number,w:number,h:number}>} */
  const sliderGlue = [
    { x: round(flapL + 0.5), y: round(flapTop + 0.5), w: round(mountW - 1), h: round(mountLen - 1) },
  ];

  // Stop nubs at the four slider corners (unchanged).
  const stopW = P.STOP_W;
  const stopH = P.STOP_H;
  /** @type {string[]} */
  const stopCuts = [
    `M ${sliderAreaX} ${round(sliderAreaY - stopH)} L ${round(sliderAreaX + stopW)} ${round(sliderAreaY - stopH)} L ${round(sliderAreaX + stopW)} ${sliderAreaY} L ${sliderAreaX} ${sliderAreaY}`,
    `M ${sliderAreaX} ${round(sliderAreaY + sh)} L ${round(sliderAreaX + stopW)} ${round(sliderAreaY + sh)} L ${round(sliderAreaX + stopW)} ${round(sliderAreaY + sh + stopH)} L ${sliderAreaX} ${round(sliderAreaY + sh + stopH)}`,
    `M ${round(sliderAreaX + sw - stopW)} ${round(sliderAreaY - stopH)} L ${round(sliderAreaX + sw)} ${round(sliderAreaY - stopH)} L ${round(sliderAreaX + sw)} ${sliderAreaY} L ${round(sliderAreaX + sw - stopW)} ${sliderAreaY}`,
    `M ${round(sliderAreaX + sw - stopW)} ${round(sliderAreaY + sh)} L ${round(sliderAreaX + sw)} ${round(sliderAreaY + sh)} L ${round(sliderAreaX + sw)} ${round(sliderAreaY + sh + stopH)} L ${round(sliderAreaX + sw - stopW)} ${round(sliderAreaY + sh + stopH)}`,
  ];

  // ── Knob (loose, front grip) ─────────────────────────────────────
  const knobW = P.KNOB_W;
  const knobH = P.KNOB_H;
  const knobX = round(sliderAreaX + sw + 12);
  const knobY = round(sliderAreaY + (sh - knobH) / 2);
  const knobCuts = [roundRectPath(knobX, knobY, knobW, knobH, P.KNOB_R)];
  // Glue zone on the knob back = the flap footprint (mountW × mountLen), centred.
  const knobGlue = [
    { x: round(knobX + (knobW - mountW) / 2), y: round(knobY + (knobH - mountLen) / 2), w: round(mountW), h: round(mountLen) },
  ];
  const knobTexts = [
    { x: round(knobX + knobW / 2), y: round(knobY + knobH / 2 + 1), text: 'PULL ↔', size: 3, align: 'middle' },
  ];

  // ── Markers ──────────────────────────────────────────────────────
  /** @type {Array<{x:number,y:number,text:string}>} */
  const markers = [
    { x: trackCenterX, y: round(trackTop - 2), text: `슬롯 (Slot) ${trackLength}×${slotWidth}mm` },
    { x: trackCenterX, y: round(trackBot + 4), text: `이동 거리: ${travel}mm` },
    { x: cxF, y: round(sliderAreaY - 6), text: `슬라이더 (Slider) ${sw}×${sh}mm` },
    { x: cxF, y: round(flapTop - 2.5), text: '① 앞으로 접기 (슬롯 통과)' },
    { x: cxF, y: round(cyF + 2.5), text: '② 여기에 손잡이 붙이기' },
    { x: round(knobX + knobW / 2), y: round(knobY - 2), text: '손잡이 (Knob) — 마운트에 붙이기' },
  ];

  return {
    sliderPiece: {
      cuts: sliderCuts,
      mountFolds: sliderMountFolds,
      glue: sliderGlue,
      bounds: { x: sliderAreaX, y: round(sliderAreaY - stopH), w: sw, h: round(sh + 2 * stopH) },
    },
    knobPiece: {
      cuts: knobCuts,
      glue: knobGlue,
      texts: knobTexts,
      bounds: { x: knobX, y: knobY, w: knobW, h: knobH },
    },
    trackSlot: { cuts: trackCuts },
    guides: { cuts: guideCuts, folds: guideFolds, glue: guideGlue },
    stops: { cuts: stopCuts },
    markers,
    computed: { travel, slotWidth, mountW, mountLen, knobW, knobH },
  };
}

/**
 * Render pull tab mechanism onto a full SVG template.
 * @param {PullTabParams} params
 * @returns {{ svg: SVGSVGElement, result: Object }}
 */
export function renderPullTab(params) {
  const colorMode = params.colorMode ?? 'color';
  const styles = getLineStyles(colorMode);
  const { svg, contentGroup } = createTemplate(params.paperSize, colorMode);
  const result = generatePullTab(params);

  // ── Track slot ───────────────────────────────────────────────────
  const trackG = addGroup(contentGroup, 'track-slot', 'track-slot');
  for (const d of result.trackSlot.cuts) addPath(trackG, d, styles.CUT);

  // ── Guide strips ─────────────────────────────────────────────────
  const guideG = addGroup(contentGroup, 'guides', 'guides');
  for (const d of result.guides.cuts)  addPath(guideG, d, styles.CUT);
  for (const d of result.guides.folds) addPath(guideG, d, styles.MOUNTAIN_FOLD);
  for (const z of result.guides.glue)  addRect(guideG, z.x, z.y, z.w, z.h, styles.GLUE_TAB);

  // ── Slider piece (body + carved mount flap) ──────────────────────
  const sliderG = addGroup(contentGroup, 'slider-piece', 'slider-piece');
  for (const d of result.sliderPiece.cuts)       addPath(sliderG, d, styles.CUT);
  for (const d of result.sliderPiece.mountFolds) addPath(sliderG, d, styles.MOUNTAIN_FOLD);
  for (const z of result.sliderPiece.glue)       addRect(sliderG, z.x, z.y, z.w, z.h, styles.GLUE_TAB);

  // ── Knob (front grip) ────────────────────────────────────────────
  const knobG = addGroup(contentGroup, 'knob-piece', 'knob-piece');
  for (const d of result.knobPiece.cuts) addPath(knobG, d, styles.CUT);
  for (const z of result.knobPiece.glue) addRect(knobG, z.x, z.y, z.w, z.h, styles.GLUE_TAB);
  for (const t of result.knobPiece.texts) addText(knobG, t.x, t.y, t.text, t.size, t.align);

  // ── Stops ────────────────────────────────────────────────────────
  const stopG = addGroup(contentGroup, 'stops', 'stops');
  for (const d of result.stops.cuts) addPath(stopG, d, styles.CUT);

  // ── Labels ───────────────────────────────────────────────────────
  for (const m of result.markers) addText(contentGroup, m.x, m.y, m.text, 2);

  return { svg, result };
}

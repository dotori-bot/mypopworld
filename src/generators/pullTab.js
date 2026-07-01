/**
 * @fileoverview Pull tab / slider mechanism generator.
 * Produces SVG template data for a sliding mechanism: a separate slider
 * piece moves through a track slot cut into the card.
 *
 * Key formulas:
 *   travel = trackLength - sliderLength - 2 × buffer
 *   slotWidth = paperThickness + clearance (0.5–1.0 mm)
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
 * @typedef {Object} PullTabResult
 * @property {Object} sliderPiece  - Slider piece SVG data (separate piece)
 * @property {string[]} sliderPiece.cuts      - Cut paths for the slider
 * @property {string[]} sliderPiece.folds     - Fold paths on the slider
 * @property {{ x: number, y: number, w: number, h: number }} sliderPiece.bounds
 * @property {Object} trackSlot    - Track slot cut into the card
 * @property {string[]} trackSlot.cuts
 * @property {Object} guides       - Guide strip data
 * @property {string[]} guides.cuts
 * @property {string[]} guides.folds
 * @property {Object} stops        - Stop tab data
 * @property {string[]} stops.cuts
 * @property {Array<{x:number,y:number,text:string}>} markers
 * @property {{ travel: number, slotWidth: number }} computed
 */

/**
 * Validate pull tab parameters.
 * @param {PullTabParams} params
 * @returns {PullTabParams}
 */
function validatePullTabParams(params) {
  const card = CARD_SIZES[params.paperSize] || CARD_SIZES.A4;
  const maxTrack = card.width - 2 * PRINT.MARGIN - 20;

  return {
    ...params,
    sliderWidth: clamp(params.sliderWidth, 8, 60),
    sliderHeight: clamp(params.sliderHeight, 5, 40),
    trackLength: clamp(params.trackLength, 20, maxTrack),
    paperThickness: params.paperThickness ?? 0.3,
    clearance: clamp(params.clearance ?? 0.8, 0.5, 1.5),
    buffer: clamp(params.buffer ?? 2, 1, 5),
    colorMode: params.colorMode ?? 'color',
  };
}

/**
 * Generate pull tab mechanism data.
 *
 * Components:
 * 1. **Track slot** – A narrow rectangular cut in the card
 * 2. **Slider piece** – A separate piece that slides through the slot
 * 3. **Guide strips** – Folded strips on the back of the card to keep the slider aligned
 * 4. **Stops** – Small tabs on the slider that prevent it from sliding out
 *
 * The slider piece is placed in available whitespace on the template page
 * (typically below the card outline).
 *
 * @param {PullTabParams} rawParams
 * @returns {PullTabResult}
 */
export function generatePullTab(rawParams) {
  const params = validatePullTabParams(rawParams);
  const {
    paperSize, sliderWidth, sliderHeight, trackLength,
    paperThickness, clearance, buffer, colorMode,
  } = params;

  const paper = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;
  const styles = getLineStyles(colorMode);

  // ── Computed values ──────────────────────────────────────────────
  const slotWidth = round(paperThickness + clearance, 1);
  const sliderLength = sliderWidth; // slider moves along its width axis
  const travel = round(trackLength - sliderLength - 2 * buffer, 1);

  // ── Track slot position ──────────────────────────────────────────
  const spineY = paper.height / 2;
  const trackCenterX = params.position?.x ?? paper.width / 2;
  // Place track on the upper half of the card (above spine)
  const trackCenterY = params.position?.y ?? (spineY - (CARD_SIZES[paperSize]?.height ?? 148.5) / 4);

  const trackLeft  = round(trackCenterX - trackLength / 2);
  const trackRight = round(trackCenterX + trackLength / 2);
  const trackTop   = round(trackCenterY - slotWidth / 2);
  const trackBot   = round(trackCenterY + slotWidth / 2);

  // ── Track slot cuts ──────────────────────────────────────────────
  /** @type {string[]} */
  const trackCuts = [
    `M ${trackLeft} ${trackTop} L ${trackRight} ${trackTop}`,
    `M ${trackRight} ${trackTop} L ${trackRight} ${trackBot}`,
    `M ${trackRight} ${trackBot} L ${trackLeft} ${trackBot}`,
    `M ${trackLeft} ${trackBot} L ${trackLeft} ${trackTop}`,
  ];

  // ── Guide strips ─────────────────────────────────────────────────
  // Two narrow strips glued to the back of the card, flanking the slot
  const guideWidth = 4; // mm
  const guideLen = trackLength + 6; // slightly longer than track

  const guideTopY = trackTop - guideWidth - 1;
  const guideBotY = trackBot + 1;

  /** @type {string[]} */
  const guideCuts = [
    // Top guide strip (separate piece)
    `M ${round(trackLeft - 3)} ${round(guideTopY)} ` +
    `L ${round(trackRight + 3)} ${round(guideTopY)} ` +
    `L ${round(trackRight + 3)} ${round(guideTopY + guideWidth)} ` +
    `L ${round(trackLeft - 3)} ${round(guideTopY + guideWidth)} Z`,
    // Bottom guide strip (separate piece)
    `M ${round(trackLeft - 3)} ${round(guideBotY)} ` +
    `L ${round(trackRight + 3)} ${round(guideBotY)} ` +
    `L ${round(trackRight + 3)} ${round(guideBotY + guideWidth)} ` +
    `L ${round(trackLeft - 3)} ${round(guideBotY + guideWidth)} Z`,
  ];

  /** @type {string[]} */
  const guideFolds = [
    // Fold line down the centre of each guide (for folding over the slider)
    `M ${round(trackLeft - 3)} ${round(guideTopY + guideWidth / 2)} ` +
    `L ${round(trackRight + 3)} ${round(guideTopY + guideWidth / 2)}`,
    `M ${round(trackLeft - 3)} ${round(guideBotY + guideWidth / 2)} ` +
    `L ${round(trackRight + 3)} ${round(guideBotY + guideWidth / 2)}`,
  ];

  // ── Slider piece ─────────────────────────────────────────────────
  // Place the slider piece below the card area in the page whitespace
  const sliderAreaX = PRINT.MARGIN + 10;
  const sliderAreaY = spineY + (CARD_SIZES[paperSize]?.height ?? 148.5) / 2 + 15;

  const sw = sliderWidth;
  const sh = sliderHeight;

  // Slider body
  /** @type {string[]} */
  const sliderCuts = [
    `M ${sliderAreaX} ${sliderAreaY} ` +
    `L ${round(sliderAreaX + sw)} ${sliderAreaY} ` +
    `L ${round(sliderAreaX + sw)} ${round(sliderAreaY + sh)} ` +
    `L ${sliderAreaX} ${round(sliderAreaY + sh)} Z`,
  ];

  // Pull handle: a tab extending from one end of the slider
  const handleW = 8;
  const handleH = sh;
  sliderCuts.push(
    `M ${round(sliderAreaX + sw)} ${sliderAreaY} ` +
    `L ${round(sliderAreaX + sw + handleW)} ${round(sliderAreaY + 2)} ` +
    `L ${round(sliderAreaX + sw + handleW)} ${round(sliderAreaY + handleH - 2)} ` +
    `L ${round(sliderAreaX + sw)} ${round(sliderAreaY + handleH)} Z`
  );

  /** @type {string[]} */
  const sliderFolds = [
    // Fold line between body and handle
    `M ${round(sliderAreaX + sw)} ${sliderAreaY} ` +
    `L ${round(sliderAreaX + sw)} ${round(sliderAreaY + sh)}`,
  ];

  // Stop tabs: small protrusions on the slider top/bottom that catch on guides
  const stopW = 3;
  const stopH = 1.5;
  /** @type {string[]} */
  const stopCuts = [
    // Top stop (left end)
    `M ${sliderAreaX} ${round(sliderAreaY - stopH)} ` +
    `L ${round(sliderAreaX + stopW)} ${round(sliderAreaY - stopH)} ` +
    `L ${round(sliderAreaX + stopW)} ${sliderAreaY} ` +
    `L ${sliderAreaX} ${sliderAreaY}`,
    // Bottom stop (left end)
    `M ${sliderAreaX} ${round(sliderAreaY + sh)} ` +
    `L ${round(sliderAreaX + stopW)} ${round(sliderAreaY + sh)} ` +
    `L ${round(sliderAreaX + stopW)} ${round(sliderAreaY + sh + stopH)} ` +
    `L ${sliderAreaX} ${round(sliderAreaY + sh + stopH)}`,
    // Top stop (right end)
    `M ${round(sliderAreaX + sw - stopW)} ${round(sliderAreaY - stopH)} ` +
    `L ${round(sliderAreaX + sw)} ${round(sliderAreaY - stopH)} ` +
    `L ${round(sliderAreaX + sw)} ${sliderAreaY} ` +
    `L ${round(sliderAreaX + sw - stopW)} ${sliderAreaY}`,
    // Bottom stop (right end)
    `M ${round(sliderAreaX + sw - stopW)} ${round(sliderAreaY + sh)} ` +
    `L ${round(sliderAreaX + sw)} ${round(sliderAreaY + sh)} ` +
    `L ${round(sliderAreaX + sw)} ${round(sliderAreaY + sh + stopH)} ` +
    `L ${round(sliderAreaX + sw - stopW)} ${round(sliderAreaY + sh + stopH)}`,
  ];

  // ── Markers ──────────────────────────────────────────────────────
  /** @type {Array<{x:number,y:number,text:string}>} */
  const markers = [
    { x: trackCenterX, y: trackTop - 2, text: `슬롯 (Slot) ${round(trackLength)}×${slotWidth}mm` },
    { x: trackCenterX, y: trackBot + 4, text: `이동 거리: ${travel}mm` },
    { x: sliderAreaX + sw / 2, y: sliderAreaY - 3, text: `슬라이더 (Slider) ${sw}×${sh}mm` },
    { x: round(sliderAreaX + sw + handleW / 2), y: sliderAreaY + sh + 4, text: '손잡이 (Handle)' },
  ];

  return {
    sliderPiece: {
      cuts: sliderCuts,
      folds: sliderFolds,
      bounds: { x: sliderAreaX, y: sliderAreaY, w: sw + handleW, h: sh },
    },
    trackSlot: { cuts: trackCuts },
    guides: { cuts: guideCuts, folds: guideFolds },
    stops: { cuts: stopCuts },
    markers,
    computed: { travel, slotWidth },
  };
}

/**
 * Render pull tab mechanism onto a full SVG template.
 * @param {PullTabParams} params
 * @returns {{ svg: SVGSVGElement, result: PullTabResult }}
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

  // ── Slider piece ─────────────────────────────────────────────────
  const sliderG = addGroup(contentGroup, 'slider-piece', 'slider-piece');
  for (const d of result.sliderPiece.cuts)  addPath(sliderG, d, styles.CUT);
  for (const d of result.sliderPiece.folds) addPath(sliderG, d, styles.VALLEY_FOLD);

  // ── Stops ────────────────────────────────────────────────────────
  const stopG = addGroup(contentGroup, 'stops', 'stops');
  for (const d of result.stops.cuts) addPath(stopG, d, styles.CUT);

  // ── Labels ───────────────────────────────────────────────────────
  for (const m of result.markers) addText(contentGroup, m.x, m.y, m.text, 2);

  return { svg, result };
}

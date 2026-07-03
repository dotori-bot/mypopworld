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

  // Pull handle geometry (a tab off the right end of the slider body).
  const handleW = 8;
  const handleH = sh;

  // Stop tabs: small protrusions at the slider's four corners that catch on the
  // guide strips so the slider can't pull out of the track.
  const stopW = 3;
  const stopH = 1.5;

  // ── Single continuous slider outline ─────────────────────────────────────
  // The body, the four corner stops and the pull handle are ONE piece: they
  // must NOT be cut apart from each other. Earlier this drew the body as a
  // closed rect and the stops/handle as separate overlapping shapes, so the
  // body's top/bottom/right edges were cut straight through where the stops and
  // handle attach (and the handle edge was also marked as a fold) — cutting
  // every solid line would have detached them. Tracing one perimeter keeps
  // every protrusion joined and leaves the body↔handle line as a fold only.
  const X = sliderAreaX;
  const Y = sliderAreaY;
  const RX = round(X + sw);          // body right edge x
  const hTop = round(Y + 2);         // handle attaches along the right edge
  const hBot = round(Y + handleH - 2); // between hTop and hBot
  const botY = round(Y + sh);

  /** @type {string[]} */
  const sliderCuts = [
    `M ${X} ${round(Y - stopH)} ` +                       // top-left stop, outer corner
    `L ${round(X + stopW)} ${round(Y - stopH)} ` +
    `L ${round(X + stopW)} ${Y} ` +                       // step down to body top edge
    `L ${round(RX - stopW)} ${Y} ` +                      // across body top
    `L ${round(RX - stopW)} ${round(Y - stopH)} ` +       // up into top-right stop
    `L ${RX} ${round(Y - stopH)} ` +
    `L ${RX} ${hTop} ` +                                  // down right edge to handle
    `L ${round(RX + handleW)} ${hTop} ` +                 // out along handle top
    `L ${round(RX + handleW)} ${hBot} ` +                 // down handle outer edge
    `L ${RX} ${hBot} ` +                                  // back to body right edge
    `L ${RX} ${botY} ` +                                  // down to body bottom-right
    `L ${RX} ${round(botY + stopH)} ` +                   // into bottom-right stop
    `L ${round(RX - stopW)} ${round(botY + stopH)} ` +
    `L ${round(RX - stopW)} ${botY} ` +                   // up to body bottom edge
    `L ${round(X + stopW)} ${botY} ` +                    // across body bottom
    `L ${round(X + stopW)} ${round(botY + stopH)} ` +     // into bottom-left stop
    `L ${X} ${round(botY + stopH)} ` +
    `L ${X} ${botY} ` +                                   // up to body bottom-left
    `L ${X} ${Y} Z`,                                      // up left edge (Z closes TL stop)
  ];

  /** @type {string[]} */
  const sliderFolds = [
    // Valley fold where the pull handle hinges off the slider body. Interior to
    // the outline (the perimeter detours around the handle) so it is a fold
    // ONLY — never coincident with a cut.
    `M ${RX} ${hTop} L ${RX} ${hBot}`,
  ];

  // Stops are now part of the slider outline, so there is no separate stop cut.
  /** @type {string[]} */
  const stopCuts = [];

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
